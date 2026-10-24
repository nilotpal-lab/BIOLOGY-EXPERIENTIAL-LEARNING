# FoodWebGuard — PROGRESS DIARY & TO-DO LIST

> **What this file is:** a living diary for the FoodWebGuard build. It is updated after **every
> step**. It records what is **DONE**, what is **IN PROGRESS**, and what is **NOT DONE** (including
> anything that could not be completed, and why). Nothing here is a guess: a box is only ticked when
> the step was actually executed and its result was checked.

**Project:** FoodWebGuard — Comparative Food-Web Disruption and Vulnerability Analysis Tool
**Course:** Biology for Engineers · Team 1 (CSE CE-SE)
**Spec sources:** `FoodWebGuard_Project_Proposal_Team_1.docx` (academic scope) + the Master Build
Prompt (functional/scientific/visual/technical specification)
**App root:** `C:\Users\nilot\OneDrive\Desktop\BIO EXPERIENTIAL`
**Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Cytoscape.js · Recharts · Vitest
**Last updated:** Step 12 — application complete, verified and documented

---

## 1. STATUS AT A GLANCE

| Phase | Description | Status |
|---|---|---|
| 0 | Progress diary created | ✅ DONE |
| 1 | Working foundation (shell, schemas, 6 demos + fixtures, graph) | ✅ DONE |
| 2 | Core analysis (baseline metrics, direct removal, cascade) | ✅ DONE |
| 3 | Analysis (Analyse All Species, rankings, comparisons, charts) | ✅ DONE |
| 4 | Data management (library, CSV/JSON import, validation, export) | ✅ DONE |
| 5 | Finish (tests, responsive UI, SVG artwork, final checks, docs) | ✅ DONE |

**Verification status right now:**

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc -b` | ✅ clean, 0 errors |
| Lint | `npm run lint` | ✅ 0 errors, 2 advisory warnings (see §4) |
| Test suite | `npm test` | ✅ **130 passed / 130**, 8 files |
| Production build | `npm run build` | ✅ built successfully (dist/, 1.91 MB JS / 456.9 kB gzip) |
| Production preview | `npm run preview` | ✅ page, JS, CSS and favicon HTTP 200; built app renders all six research networks |
| Archive check | `node src/data/research/verify-archives.mjs …` | ✅ 11 / 11 committed source files hash-match the archives |

**Legend:** ✅ DONE · 🔄 IN PROGRESS · ⬜ NOT STARTED · ⚠️ PARTIAL · ❌ BLOCKED

---

## 2. MASTER TO-DO CHECKLIST

### Phase 0 — Progress tracking
- [x] `TODO.md` progress diary created (this file, updated at every step)
- [x] Diary re-updated after each subsequent step
- [x] `README.md` with run instructions written

### Phase 1 — Working foundation
- [x] Scaffold Vite + React + TypeScript project
- [x] Install dependencies (Tailwind 4, Cytoscape, Recharts, Lucide, PapaParse, Vitest)
- [x] Configure Vite (Tailwind plugin) + Vitest (jsdom, setup file, ResizeObserver shim)
- [x] Design tokens / Soft Pop palette + DM Sans (`src/index.css`)
- [x] Application shell: sidebar nav + top bar + hash routing between 6 sections
- [x] Define schemas: Dataset, Node, Edge, provenance, source status (Parts 2.3–2.5)
- [x] Six illustrative demo networks, 9–15 nodes each (Part 2.2)
- [x] `VALIDATION-FOODWEB-6` manual test fixture, 6 nodes / 6 edges (Part 10)
- [x] Multi-round cascade fixture `VALIDATION-CHAIN-4` (`P → A → B → C`) (Part 18)
- [x] `datasetRegistry` with provenance + source-status badges + research curation slots
- [x] Demo data self-validation (no dangling edges, no duplicate IDs, no isolated nodes)
- [x] Favicon replaced with a FoodWebGuard mark

### Phase 2 — Core analysis
- [x] `graphModel` — stable node/edge representation, immutable baseline
- [x] `baselineMetrics` — N₀, L₀, connectance, N<2 and L₀=0 guards
- [x] `directRemoval` — clone → remove node → remove incident edges → metrics
- [x] `cascadeSimulation` — simultaneous rounds, eligibility rule, termination guards
- [x] Directly-affected-consumer definition implemented exactly (Part 7.5)
- [x] Food-depleted-consumer definition implemented exactly (Part 7.6)
- [x] Fixture Test A (remove Small fish) matches expected numbers
- [x] Fixture Test B (remove Algae) matches expected numbers exactly as specified
- [x] Fixture Test C (multi-round chain) → 3 secondary removals, depth 3
- [x] Documented role-eligibility / inference rule in one shared module (`rules.ts`)
- [x] `layout.ts` — deterministic trophic-level layout so scenarios never rearrange the graph

### Phase 3 — Analysis
- [x] `rankingEngine` — Analyse All Species, independent scenarios from the baseline
- [x] Four separate metric rankings + cascade depth as a fifth metric (no composite score)
- [x] Deterministic tie-break by node label; competition ranking; ties share a rank
- [x] Rank 0 for not-applicable values, so N/A can never read as a score or as zero
- [x] Progress reporting and cancellation for large networks; overlapping jobs blocked
- [x] `comparisonEngine` — cross-dataset summaries, min/median/max, normalized + raw
- [x] Recharts comparison charts built from real computed values (4 charts + text equivalents)
- [x] Graph ↔ table linking (rows select the node; "Open in graph" navigates)

### Phase 4 — Data management
- [x] `DatasetBrowser` / dataset library with provenance, badges and research tracker
- [x] `dataValidation` — CSV node + CSV edge, and documented JSON network schema
- [x] All required validation rules (Part 6.3): malformed CSV/JSON, empty file, missing columns,
      duplicate node ids, unknown endpoints, duplicate edges, self-links, missing names, invalid
      roles, missing citation, empty network, nodes-without-links, unsupported extensions, large files
- [x] Data-cleaning report (Part 6.4) shown in the dialog and recorded in the dataset provenance
- [x] Import never replaces the current dataset on failure (blocked preview carries no dataset)
- [x] `exportUtils` — node list, link list, scenario (CSV+JSON), cascade rounds, rankings, comparison
- [x] Every export carries provenance, data status, mode, selected node, metric definitions, warnings

### Phase 5 — Finish
- [x] Species SVG icon registry — 47 original, coordinated vector illustrations + neutral fallback
- [x] Node visual states: present, hovered, selected, affected, depleted, removed, ghost
- [x] Interactive Cytoscape graph: arrows, zoom, zoom-to-fit, reset layout, highlight toggle, legend
- [x] Species inspector with honest "no recorded links in this dataset" wording
- [x] Scenario controls, metric cards, ranking table, cascade timeline, empty/error states
- [x] Reset / dataset switch / mode switch state integrity
- [x] Responsive layout (stacked panels below xl, collapsible mobile navigation)
- [x] Accessibility: keyboard paths, visible focus, names for icon-only buttons, reduced motion,
      skip link, text equivalents for charts, status never by colour alone
- [x] Unit tests for calculation and simulation modules
- [x] Edge-case coverage across all 25 required cases (Part 11)
- [x] UI integration tests through the real interface
- [x] `npx tsc -b` clean · `npm test` clean · `npm run build` clean
- [x] Every navigation item opens a real section; no inert buttons
- [x] Methodology & Validation screen running the suite live in the browser
- [x] `README.md` with run instructions, fixture table and honesty rules

---

## 3. DIARY LOG (newest entries last)

### Step 1 — Read the specification
- **DONE:** Extracted and read the full text of `FoodWebGuard_Project_Proposal_Team_1.docx`
  (sections 1–5 + data references). Confirmed the metrics table, the food source → consumer edge
  convention, the no-composite-score rule, and the "structural scenario, not population model" scope
  limitation.
- **DONE:** Read the Master Build Prompt; extracted the acceptance criteria into the checklist above
  (21 parts → 5 phases, per Part 21 implementation order).
- **DONE:** Inspected the target folder — it was **empty**; no prior build existed to preserve.
- **NOT DONE:** Nothing blocked at this step.

### Step 2 — Scaffold
- **DONE:** `npm create vite@latest . -- --template react-ts` → React `^19.2.8`, Vite `^8.3.0`,
  TypeScript `~6.0.2`.
- **DONE:** Installed `cytoscape`, `recharts`, `lucide-react`, `clsx`, `tailwind-merge`, `papaparse`;
  dev: `tailwindcss@4`, `@tailwindcss/vite`, `@types/cytoscape`, `@types/papaparse`, `vitest`,
  `jsdom`, `@testing-library/react|dom|user-event`. Versions confirmed: Tailwind `^4.3.3`,
  Cytoscape `^3.34.4`, Recharts `^3.10.1`, Vitest `^5.0.5`.
- **NOTE:** Starter `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`,
  `verbatimModuleSyntax` and `erasableSyntaxOnly` — so no `enum`, no parameter properties, and
  `import type` for type-only imports.
- **DONE:** Created this diary (`TODO.md`).
- **NOT DONE:** Nothing blocked at this step.

### Step 3 — Data model and datasets
- **DONE:** `src/core/types.ts` — the shared model: `FoodWebDataset`, `FoodWebNode`, `FoodWebEdge`,
  `DatasetProvenance`, `SourceStatus` (4 states with labels + badge tones), `TrophicRole` (8 roles),
  `RoleProvenance`, `ScenarioResult`, `RankingResult`, `ValidationIssue`, `CleaningReport`.
- **DONE:** `src/core/graphModel.ts` — indexed graph (`foodSourcesOf`, `consumersOf`, `edgeIdsOf`);
  scenarios expressed as *sets of removed ids* so the baseline can never be mutated;
  `validateGraphIntegrity` for structural checks.
- **DONE:** `src/data/datasetBuilders.ts` — edges authored as `[food, consumer]` tuples so the
  mandated direction can never be silently reversed.
- **DONE:** `src/data/demoDatasets.ts` — **six** illustrative networks: `FW-POND-A` (12 nodes /
  17 links), `FW-LAKE-B` (13 / 20), `TER-GRASS-A` (14 / 29), `TER-FOREST-B` (15 / 29),
  `MAR-COAST-A` (13 / 22), `MAR-OPEN-B` (12 / 22). All carry the required notice verbatim. No
  scientific names were invented; every `scientificName` is `null`.
- **DONE:** `src/data/fixtures.ts` — `VALIDATION-FOODWEB-6` (6 nodes / 6 links, connectance 0.200)
  and `VALIDATION-CHAIN-4` (`P → A → B → C`), with expected results stated in code.
- **DONE:** `src/data/datasetRegistry.ts` — built-in registry, imported-dataset persistence, and an
  honest **research curation tracker** with 6 target slots (`RES-FW-1` … `RES-MAR-2`). (At this step
  four slots pointed at bundled datasets and were marked `research-provided-validation-pending`.)
  Final state: all six slots are sourced and verified — `RES-FW-A`, `RES-FW-B`, `RES-TER-C`,
  `RES-TER-D`, `MAR-TATOOSH-1`, `MAR-YTHAN-1`. `RESEARCH_SLOT_SUMMARY` derives the counts so the UI
  cannot show stale text.
- **⚠️ SPEC ISSUE FOUND (Part 10.3, "remove Small fish").** The specification's direct-removal
  figures (4 links remaining / 2 lost / 33.333%) contradict the fixture's own edge list, Part 8
  step 5, the proposal, and Part 10.3's *own* cascade expectation ("Remaining edges: 3 …
  100 × 3 / 6 = 50%"). Implemented the internally consistent definition (3 links removed →
  3 remaining → 50.0%), added a dedicated test, and disclosed the discrepancy on screen. See §4.

### Step 4 — Core analysis engine
- **DONE:** `metrics.ts` — connectance (`L / (N × (N − 1))`, N ≥ 2), link loss
  (`100 × (L₀ − Lₛ) / L₀`, only when L₀ > 0), directly affected consumers, food-depleted consumers,
  secondary-removal percentage. Every guard returns an explicit *not applicable* value **with a
  reason** — never a fake zero, never a division by zero.
- **DONE:** `rules.ts` — the structural cascade-eligibility rule (baseline food source present,
  none remaining, not already removed). Trophic role/evidence is reported but never gates the rule.
- **DONE:** `scenarios.ts` — direct removal (Part 8) and the simultaneous-round cascade (Part 9)
  with a round cap and a no-progress guard, plus generated "what changed" text.
- **DONE:** `rankingEngine.ts` — `analyseAllSpecies` (async, progress, cancellable, independent
  scenarios) and `buildRanking` with competition ranking, alphabetical tie-break and rank 0 for N/A.
- **DONE:** `comparisonEngine.ts` — per-dataset min/median/max summaries and exploratory category
  aggregates with the standing limitation note.
- **DONE:** `dataValidation.ts` — CSV node+link and JSON network import, all validation rules,
  keep-first deduplication, self-link exclusion, cleaning report, and explicit repair policy.
- **DONE:** `exportUtils.ts` — CSV/JSON exports for nodes, links, scenario, cascade rounds, rankings
  and cross-network comparison, each carrying provenance and warnings.

### Step 5 — Unit tests (executed)
- **DONE:** First run of the fixture tests: **19 passed on the first attempt** — the algorithm
  matched the hand-calculated expectations without adjustment.
- **DONE:** Full suite after all test files (final count after the research pass: **130 tests across 8 files**), including
  source-vs-dataset checks for `MAR-TATOOSH-1` and `RES-FW-A`.
- **DONE:** Two initial failures were genuine findings and were fixed **in the source**, not in the
  assertions:
  1. not-applicable ranking rows were being given a normal rank → changed to **rank 0** so
     "not applicable" can never be read as a score, and can never be confused with a real zero;
  2. duplicate node records were still being parsed for role/type before being skipped → fixed.
- **DONE:** Three in-app validation-suite checks compared descriptive strings for exact equality and
  therefore reported false failures in the UI. Fixed the checks to compare concrete values; the
  suite now reports **0 failed** in both the test run and the browser.

### Step 6 — Species artwork
- **DONE:** `src/art/speciesIcons.ts` — a registry of **47 original SVG illustrations** covering
  freshwater, terrestrial and marine organisms, built on a parametric fish builder (minnow, anchovy,
  herring, perch, cod, pike, tuna, lanternfish, shark, whale), plus hand-authored plants,
  invertebrates, birds, mammals and reptiles. Shared outline colour (`#0E1622`) and stroke width
  (2.2) keep the set visually coherent, and every icon is a flat two-tone silhouette readable at
  graph-node size.
- **DONE:** Unknown or missing `iconKey` always resolves to a neutral fallback, so the graph can
  never fail to render because artwork is missing.
- **DONE:** `speciesIconDataUri()` supplies the same artwork to Cytoscape, so the graph and the
  inspector can never show different pictures for the same node.

### Step 7 — Design system and shell
- **DONE:** `src/index.css` — Soft Pop tokens (periwinkle `#818CF8`, teal `#2DD4BF`, yellow
  `#FCD34D`, coral `#F87171`, border `#4B5563`, muted `#333333`, card `#1F2937`, near-black
  background, text `#F9FAFB` / `#CBD5E1`), DM Sans + JetBrains Mono, visible focus rings,
  reduced-motion support, `.sr-only`, and the graph surface treatment.
- **DONE:** `ui/primitives.tsx` — Button, IconButton (accessible name mandatory), Card,
  CardHeading, Badge, StatusBadge, RoleBadge, Field, TextInput, TextArea, SelectInput, HelpHint,
  Callout, EmptyState, MetricReadout, ProgressBar, MonoId.
- **DONE:** `layout/routes.tsx` + `layout/Shell.tsx` — desktop rail, mobile disclosure menu, top bar,
  notice banner, skip link, hash routing so every section has a bookmarkable address.

### Step 8 — Graph and analysis screens
- **DONE:** `graph/FoodWebGraph.tsx` — Cytoscape instance with directed arrows
  (`target-arrow-shape: triangle`), species icons as `background-image`, role colours, state classes
  (selected / affected / depleted / removed / ghost / dimmed), hover tooltip, zoom in/out, zoom-to-fit,
  reset zoom, reset layout, and a legend. Removed nodes stay in place, faded and dashed, so the
  before/after change is visible; links touching a removed node are hidden.
- **DONE:** `graph/SpeciesInspector.tsx` — name, scientific name (or "Not provided"), node type,
  role + evidence, description, recorded food sources and consumers, counts, source note, scenario
  status, and the honest limitation wording for missing links.
- **DONE:** `graph/ScenarioControls.tsx` — mode radio group with a description of what each mode will
  do *before* it runs, run/reset buttons, and five export buttons. States that a scenario is not
  destructive because the baseline is preserved.
- **DONE:** `results/MetricCards.tsx`, `results/WhatChanged.tsx`, `results/CascadeTimeline.tsx`,
  `results/RankingTable.tsx` — every metric with its unit, denominator and definition; a generated
  plain-language explanation; an expandable round-by-round cascade record with the reason each node
  qualified; and metric tabs over a full ranking table with supporting counts.
- **DONE:** Pages: Overview, Explore, Scenario analysis, Compare results, Dataset library,
  Methodology & validation.

### Step 9 — Import, comparison and methodology screens
- **DONE:** `imports/ImportDialog.tsx` — format choice, documented CSV columns and JSON schema, file
  upload (files are sorted into node/link by header detection) **and** paste-in fallback, metadata
  fields, "Validate and preview", severity-counted issue list, cleaning report, explicit
  "repair supported issues" policy, preview of nodes/links, and Import enabled only when unblocked.
- **DONE:** `datasets/DatasetBrowser.tsx` — Demo Lab, "your imported networks", and the research
  curation tracker with the outstanding-step checklist and candidate repositories.
- **DONE:** `pages/CompareResults.tsx` — network selection, four Recharts charts
  (baseline connectance, largest link loss, largest/median secondary removals, category median link
  loss) plus a text footer for every chart, a metric-distribution table, category ranges, provenance
  list, and CSV exports.
- **DONE:** `pages/Methodology.tsx` — metric definition table, simulation rules, the declared
  inference rule, the live validation suite with per-check expected vs computed values, the Part 11
  edge-case coverage list, provenance/status meanings, and a scope-limits list including the
  specification-inconsistency disclosure.

### Step 10 — Verification (actually run, not assumed)
- **DONE:** `npx tsc -b` → **clean, 0 errors**.
- **DONE:** `npm run build` → **built successfully** (`dist/index.html`, `dist/assets/*`).
- **DONE:** `npm run lint` → **0 errors**, warnings reduced from 11 to 2 advisory fast-refresh notes
  (see §4).
- **DONE:** `npm test` → **94 passed / 94**, 6 files (state at that step; see §1 for the final count).
- **DONE:** UI integration tests drive the real interface: Overview empty state, species selection
  and inspection, no-match search state, a real direct removal (FW-POND-A: 13 of 17 links remain,
  23.5% loss), the manual fixture through the UI (50.0% loss, 3 of 6 links, heron flagged then
  cascaded in Round 1), mode switching clearing the other mode's result, reset restoring the
  baseline, Analyse All Species with tied ranks ordered alphabetically, metric switching re-sorting,
  the import dialog blocking an undefined endpoint and then accepting a repaired import, the research
  slots reading "Research source pending", and the Methodology suite reporting **0 failed**.
- **DONE:** Dev server started and confirmed serving HTTP 200 for `/`, `/src/main.tsx`, `/src/App.tsx`
  and `/favicon.svg`.

### Step 11 — Documentation
- **DONE:** `README.md` — run instructions, script table, feature list, project structure, the fixture
  results table, the specification-inconsistency explanation, the data-status/honesty rules, testing
  overview and technology list.
- **DONE:** `package.json` scripts extended with `test` and `test:watch`; package renamed to
  `foodwebguard`.
- **DONE:** `public/favicon.svg` replaced with a FoodWebGuard mark (three-node directed food web);
  the unused template `icons.svg` removed.

### Step 13 — Final Pre-Deployment Acceptance, UI/UX Audit, and Cleanup (2026-10-18)
- **DONE:** Verified baseline with backup outside repository at `C:\Users\nilot\AppData\Local\Temp\fwg-acceptance-backup\`.
- **DONE:** Verified all 11 source data files hash-match original Dryad archives via SHA-256 (`verify-archives.mjs`).
- **DONE:** Removed 3 unreferenced zero-byte files (`kongsfjorden_spnames.csv`, `loughhyne_spnames.csv`, `ythan_spnames.csv`) from root.
- **DONE:** Executed live browser acceptance audit via Headless Chrome (CDP protocol) across 6 primary routes, 7 dataset switches, species removal, reset, cascade, ranking engine, in-browser test suite, import dialog, and 5 responsive viewports: **25 of 25 passed, 0 console errors**.
- **DONE:** Implemented vendor chunk splitting in `vite.config.ts` (`vendor-react`, `recharts`, `cytoscape`), reducing the single monolithic 1.91 MB bundle down to individual sub-500kB vendor chunks (`recharts`: 382 kB, `cytoscape`: 434 kB, `vendor-react`: 207 kB; `index`: 883 kB / 143 kB gzip).
- **DONE:** Full automated test suite passes: **130 / 130 tests passing**, `npx tsc -b` clean (0 errors), `npm run lint` clean (0 errors).

### Step 14 — TasteSkill V2 Redesign Execution & Information Architecture (2026-10-19)
- **DONE:** Evaluated TasteSkill V2 core principles for scientific data-heavy applications (anti-slop guidelines: no marketing fluff, restrained surfaces, single clear primary actions, high-contrast typography, data-first hierarchy).
- **DONE:** Web research across 6 design and scientific visualization systems: TasteSkill V2 docs, IBM Carbon Color Foundations, IBM Carbon Data Visualization (@carbon/charts), W3C WCAG 2.2 Contrast Minimum, ColorBrewer 2.0, Scottish Government Data Visualisation Palettes.
- **DONE:** Selected and implemented **Ocean Lab Dark (Refined)** theme tokens in `src/index.css`: deep abyssal slate canvas (`#0B0F12`), quiet card surface (`#12181C`), elevated secondary surface (`#182226`), restrained 1px borders (`#2D3D45`), Ocean Teal primary action (`#2DD4BF`), Sky Cyan secondary (`#38BDF8`), Amber warning (`#F59E0B`), Coral Rose danger (`#F87171`), crisp seafoam text (`#ECF3F0`, 15.3:1 contrast, WCAG AAA).
- **DONE:** Implemented updated Information Architecture: Workspace (`#explore`, `#workspace`), Analytics (`#scenario`, `#analytics`), Benchmark (`#compare`, `#benchmark`), Datasets (`#library`, `#datasets`), Methodology (`#methodology`), Overview (`#overview`). Preserved all existing hash routes and deep links via routing alias layer in `routes.tsx`.
- **DONE:** Workspace graph canvas maximization: Added collapsible side panel toggles (`Hide list` / `Inspector` / `Maximize canvas`) allowing the Cytoscape food web to expand up to `xl:col-span-12` full width.
- **DONE:** Recharts categorical color sequence updated in `CompareResults.tsx` to calibrated ColorBrewer/Carbon palette: `['#2DD4BF', '#38BDF8', '#F59E0B', '#F87171', '#A78BFA', '#FB923C']`.
- **DONE:** Replaced verbose copy with concise scientific terminology ("Dataset", "Run scenario", "Reset simulation", "Analyse all species", "Research library", compact metrics readouts). Preserved scientific accuracy and the replicate pond caveat for freshwater datasets.
- **DONE:** Verification: **130 / 130 tests passing**, `npx tsc -b` clean (0 errors), `npm run lint` clean (0 errors), `npm run build` clean (dist/ built successfully), and live headless Chrome browser audit (`test-acceptance-browser.mjs`) **25 of 25 passed, 0 console errors** across 5 viewports (1920px, 1280px, 768px, 390px, 360px).

### Step 15 — Skeptical Review, Functional Enhancements & Full Verification (2026-10-19)
- **DONE:** Performed thorough code and browser audit of prior redesign attempt. Identified and resolved five concrete shortcomings:
  1. *Missing Rankings Search & Trophic Role Filter*: Section 3 under Analytics required "useful filters or search where supported". Added live search input (by species name or node ID), trophic role filter dropdown (`SelectInput`), count readout ("Showing X of Y species"), and clear filters callout in `src/components/results/RankingTable.tsx`.
  2. *Missing Direct CSV Export Actions in Datasets Library*: Section 3 under Datasets required "supported export actions". Added direct "Nodes (CSV)" and "Links (CSV)" export buttons on every dataset card calling `nodesExportCsv` and `edgesExportCsv` via `downloadArtifact` in `src/components/datasets/DatasetBrowser.tsx`.
  3. *Cytoscape Viewport Canvas Geometry Reflow*: Added `ResizeObserver` on `containerRef.current` in `src/components/graph/FoodWebGraph.tsx` to automatically call `cy.resize()` when toggling side panels (`Hide list` / `Inspector` / `Maximize canvas`).
  4. *Legend Color Inversion*: Fixed class assignment in `src/components/graph/FoodWebGraph.tsx` where Teal was mapped to Sky Cyan and Periwinkle to Ocean Teal.
  5. *Metric Card Supporting Readout Precision*: Aligned `MetricCards.tsx` link loss label with Section 5 specification (`Links lost · 4/17 · 23.5%`).
- **DONE:** Extended automated test suite in `src/test/ui.test.tsx` with 2 new end-to-end tests covering ranking table search/role filtering and library CSV export actions. Configured `testTimeout: 15000` in `vitest.config.ts`.
- **DONE:** Re-verified test suite: **132 / 132 tests passing** across 8 test suites. `npx tsc -b` clean (0 errors), `npm run lint` clean (0 errors, 2 advisory fast-refresh warnings).
- **DONE:** Audited acceptance testing script `test-acceptance-browser.mjs` with Headless Chrome via Chrome DevTools Protocol: **26 of 26 controls and workflows passed, 0 console errors** across all 5 responsive viewports.

---

## 4. KNOWN LIMITATIONS / OPEN ITEMS

- **Research datasets are verified, with one scientific caveat.** All six target networks are
  bundled and marked *Research source verified*: node and link sets re-derived from the committed
  source files, direction quoted from the source documentation, citation and CC0 terms read from each
  Dryad record. The caveat is that the two freshwater networks (`RES-FW-A` Pond 1, `RES-FW-B` Pond 47)
  are replicate ponds from the same 48-pond mesocosm experiment — two network instances, one study.
  No provenance is invented anywhere, and the six illustrative networks stay a separate category.
- **No live deployment.** The build is static and deployable (relative asset base, hash routing, no
  environment variables), but there is no hosting account, platform config or credential in the
  repository, so no production URL exists to test.
- **SPEC INCONSISTENCY — Part 10.3, "remove Small fish".** The specification's direct-removal numbers
  for this one case (4 links remaining / 2 lost / 33.333%) cannot be produced by the algorithm the
  same document specifies, and they contradict its own cascade numbers for the identical removal.
  FoodWebGuard implements the consistent definition: **3 links removed → 3 remaining → 50.0% link
  loss**, verified by a dedicated test and disclosed on the *Methodology & validation* screen.
- **Two advisory lint warnings remain** (`react(only-export-components)` in `ui/primitives.tsx` for
  the `cn` helper and in `state/AppState.tsx` for the `useAppState` hook). These affect only Vite's
  fast-refresh granularity during development, not runtime behaviour; **0 lint errors.**
- **Bundle composition:** Vendor chunking is configured (`vendor-react`, `recharts`, `cytoscape` each
  under 450 kB). The main index chunk is 883 kB (143 kB gzipped), containing the compiled research dataset
  tables. All sub-modules load smoothly in headless Chrome and browser with 0 runtime errors.
- **`linkLossPercent` for a baseline with no links** is reported as *not applicable* with an
  explanation, per Part 7.3, rather than as 0%.

_This section is updated whenever a limitation is found during the build._

