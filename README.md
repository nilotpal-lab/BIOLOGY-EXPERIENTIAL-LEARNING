# FoodWebGuard

**Comparative Food-Web Disruption and Vulnerability Analysis Tool**

Course: *Biology for Engineers* · Project type: software-only analysis tool · Team 1 (CSE CE-SE)

FoodWebGuard is a browser-based analytical application that represents documented food webs as
directed networks and measures how **simulated species removal** changes their structure.

> **Scope note.** Every output is a **structural** result computed from a recorded network under a
> deterministic rule. It is not a prediction of extinction, not a population model, and the cascade
> is not a dynamic simulation. There is no machine learning in this project, by design.

---

## Running the application

```bash
npm install
npm run dev        # development server, prints a local URL
```

Other scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check (`tsc -b`) and build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the full test suite once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Run oxlint |

The build is a static site with no backend, accounts or paid APIs. `dist/` can be served by any
static host or even opened from disk:

* `vite.config.ts` sets `base: './'`, so asset URLs are relative and the build works at a domain
  root, in a sub-directory, or from `file://`;
* navigation uses hash routes (`#/overview`, `#/explore`, …), so **no SPA rewrite/fallback rule is
  required** — a host only needs to serve the files as they are;
* there are no environment variables, server routes or build-time secrets.

A live deployment still needs a hosting target and credentials, neither of which exists in this
repository; see *Deployment* below.

---

## Information Architecture & Redesigned Interface

1. **Workspace (`#/explore`, `#/workspace`)** — dominant Cytoscape.js network canvas with collapsible
   side panels (`xl:col-span-12` full width on demand), original vector illustrations, directed arrows,
   species search with instant role filters, species inspector, direct-removal and structural-cascade
   controls, and compact scenario metric chips. Arrow direction is always **food source → consumer**.
2. **Analytics (`#/scenario`, `#/analytics`)** — species vulnerability rankings table with instant search,
   sorting across five distinct metrics (link loss %, directly affected consumers, food-depleted consumers,
   secondary removals, cascade depth), competition ranking with alphabetical tie-breaks, and "Open in graph"
   row actions. Deliberately no unsupported composite vulnerability score.
3. **Benchmark (`#/compare`, `#/benchmark`)** — multi-network comparative analysis powered by Recharts with
   a research-backed categorical palette, metric distribution statistics (min, median, max), ecosystem ranges,
   and explicit scientific caveat disclosures regarding network sizes and replicate pond instances.
4. **Datasets (`#/library`, `#/datasets`)** — clear visual separation between the six verified empirical research
   network instances, six illustrative demo networks, and browser-stored user imports. Sourced vs. pending status,
   provenance citations, node/link counts, and CSV/JSON export actions.
5. **Methodology & Validation (`#/methodology`)** — formal metric definitions, structural cascade rules,
   disclosed specification inconsistencies (Part 10.3 Small fish link loss), and an in-browser live validation
   suite running 70 automated verification checks live with 0 failures.
6. **Overview (`#/overview`)** — executive summary with real-time dataset counts, verification breakdown,
   and direct navigation shortcuts into the analytical workflows.

---

## Project structure

```
src/
  art/
    speciesIcons.ts        original SVG artwork registry for every organism
    roleColours.ts         role colour tokens and legend content
  core/                    pure, testable analysis logic (no React)
    types.ts               dataset / node / edge / scenario / ranking schemas
    graphModel.ts          shared graph representation + integrity checks
    rules.ts               the documented structural cascade-eligibility rule
    metrics.ts             every metric definition and its guards
    scenarios.ts           direct removal + rule-based cascade
    rankingEngine.ts       "analyse all species" + metric-wise ranking
    comparisonEngine.ts    cross-network summaries
    dataValidation.ts      CSV / JSON import and validation
    exportUtils.ts         CSV / JSON exports
    validationSuite.ts     the checks the Methodology screen runs live
    layout.ts              deterministic trophic-level graph layout
  data/                    the six illustrative networks, test fixtures, and the
                           research library (datasetRegistry.ts + research/:
                           committed source files, converters, generated datasets,
                           README.md and FINAL_REPORT.md)
  components/              UI: shell, graph, results, datasets, import, ui primitives
  pages/                   the six application sections
  state/AppState.tsx       one source of truth for graph data and results
  test/                    unit, edge-case, ranking, import and UI tests
TODO.md                    progress diary: what is done, in progress and not done
```

All calculations live in `src/core` and are shared: no component recomputes a value differently.

---

## The manual validation fixture

`VALIDATION-FOODWEB-6` (6 nodes, 6 links, connectance `6 / (6 × 5) = 0.200`) is used to verify the
program against hand-calculated results.

| Removal | Mode | Nodes | Links | Link loss | Affected | Depleted | Secondary | Depth |
|---|---|---|---|---|---|---|---|---|
| Small fish | direct | 5 | 3 | 50.0% | 1 (Heron) | 1 (Heron) | 0 | 0 |
| Small fish | cascade | 4 | 3 | 50.0% | 1 (Heron) | 1 (Heron) | 1 | 1 |
| Algae | direct | 5 | 4 | 33.3% | 2 | 1 | 0 | 0 |
| Algae | cascade | 4 | 3 | 50.0% | 2 | 1 | 1 | 1 |
| Chain `P → A → B → C`, remove P | cascade | 0 | 0 | 100% | 1 | 1 | 3 | 3 |

A second fixture, `VALIDATION-CHAIN-4`, proves that the cascade continues across several
simultaneous rounds and then terminates.

### Known inconsistency in the source specification

The build specification's Part 10.3 states that removing *Small fish* leaves 4 links (2 lost,
33.333%). That figure cannot be produced by the algorithm the same document defines, and it
contradicts:

* the fixture's own edge list — **three** links touch Small fish;
* Part 8 step 5 and the project proposal — *"remove every edge whose source or target is the
  selected node"*;
* Part 10.3's **own** cascade expectation for the identical removal — *"Remaining edges: 3 …
  100 × 3 / 6 = 50%"*, which is only reachable when all three links are removed (removing the heron
  afterwards deletes no further link).

FoodWebGuard implements the internally consistent definition — **3 links removed, 3 remaining,
50.0% link loss** — and discloses the discrepancy on the *Methodology & validation* screen. Leaving
the 33.3% figure would require keeping a dangling link attached to a removed node, which is not a
valid network. If the 33.3% figure is required, the change is a one-line edit to the link-removal
rule.

---

## Data status and honesty rules

* **Demo Lab** — six illustrative networks (`FW-POND-A`, `FW-LAKE-B`, `TER-GRASS-A`,
  `TER-FOREST-B`, `MAR-COAST-A`, `MAR-OPEN-B`), two per ecosystem category, 12–15 nodes each. They
  are labelled verbatim:
  *"Illustrative demo data — simplified for software demonstration; not a verified empirical
  food-web dataset."* Their results must not be presented as scientific evidence.
* **Research dataset library** — the project targets six documented research networks, two per
  ecosystem category. **All six are bundled** as built-in research datasets and are available on a
  fresh start without importing anything:

  | Dataset | Ecosystem | Nodes | Links | Source | Licence |
  |---|---|---|---|---|---|
  | `RES-FW-A` | freshwater | 11 | 18 | Dryad doi:10.5061/dryad.866t1g1zj (Pond 1) | CC0 1.0 |
  | `RES-FW-B` | freshwater | 14 | 39 | Dryad doi:10.5061/dryad.866t1g1zj (Pond 47) | CC0 1.0 |
  | `RES-TER-C` | terrestrial | 395 | 322 | Dryad doi:10.5061/dryad.230j5ch | CC0 1.0 |
  | `RES-TER-D` | terrestrial | 57 | 98 | Dryad doi:10.25349/D9M038 | CC0 1.0 |
  | `MAR-TATOOSH-1` | marine | 110 | 869 | Dryad doi:10.5061/dryad.39jv1 | CC0 1.0 |
  | `MAR-YTHAN-1` | marine | 87 | 373 | Dryad doi:10.5061/dryad.1mv20r6 (Ythan Estuary) | CC0 1.0 |

  All six are marked *Research source verified*: node and link sets are re-derived from committed
  verbatim source files by `researchDatasets.test.ts`, link direction is quoted from the source's
  own documentation, and the citation, DOI and CC0 reuse terms were read from the repository record
  (not assumed). The two freshwater networks are replicate ponds from one mesocosm experiment and
  are described as such. `src/data/research/README.md` documents the converters and every cleaning
  decision; `src/data/research/FINAL_REPORT.md` is the audit trail.
* Imported datasets are stored **in this browser only**, are never uploaded anywhere, and are never
  promoted to *Research source verified* automatically.
* If a source does not contain a field, the interface displays “Not provided”.

Reference points used while preparing the data model: the
[GlobalWeb archive](https://github.com/globalbioticinteractions/globalwebdb),
[EcoBase](https://ecobase.ecopath.org/) and [Zenodo](https://zenodo.org/). These are starting
points for the data-research stage, not proof that any particular file is suitable.

---

## Testing

```bash
npm test          # 132 tests across 8 files
```

| File | Covers |
|---|---|
| `fixtureValidation.test.ts` | the manual fixture against hand-calculated expectations |
| `edgeCases.test.ts` | the required normal and edge-case behaviours |
| `dataValidation.test.ts` | every import and validation rule |
| `rankingEngine.test.ts` | analyse-all-species, metric-wise ranking, ties, determinism |
| `researchDatasets.test.ts` | every research dataset re-derived from its committed source tables (nodes, links, direction, rejections), registry/slot consistency, demo preservation |
| `validationSuite.test.ts` | the in-app validation suite must pass with zero failures |
| `graphStyles.test.ts` | graph visual state and legend behaviour |
| `ui.test.tsx` | the real application driven through its interface (search & role filters, direct CSV exports, simulation lifecycle) |

The *Methodology & validation* screen also runs the same expectations **live in the browser**, so a
reviewer can watch them pass instead of taking a test result on trust.

---

## Deployment

Prepared but **not executed**: the repository contains no hosting configuration, workflow or
credentials, so no live URL exists yet.

| Item | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Output directory | `dist/` (configured in `vite.config.ts`, not assumed) |
| Asset base | relative (`base: './'`) |
| Routing | hash routes only — no rewrite/fallback rule needed |
| Environment variables | none |
| Runtime services | none (the only external request is the Google Fonts stylesheet) |

To publish, point any static host (Netlify, Vercel, GitHub Pages, S3/CloudFront, nginx) at the repo
with the build command and output directory above. The exact missing pieces are a hosting account
and its credentials; nothing in the code blocks deployment.

Production preview used for acceptance testing:

```bash
npm run build && npm run preview   # serves dist/ locally
```

---

## Technology

React 19 · TypeScript · Vite · Tailwind CSS 4 · Cytoscape.js (network visualization) ·
Recharts (comparison charts) · Lucide (interface icons) · PapaParse (CSV parsing) · Vitest +
Testing Library (tests).

`TODO.md` is the project's progress diary and records what is done, what was found, and what is
still outstanding.
