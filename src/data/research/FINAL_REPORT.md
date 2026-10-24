# FoodWebGuard — final research, data and release report

Date: 2026-10-18. Every number below was produced by a command in this repository, not copied
from an earlier report. Where a claim could not be verified, it is listed as a limitation.

---

## A. Current verification

| Check | Actual result | Evidence |
|---|---|---|
| Full automated suite | **130 passed / 130, 0 failed** (8 files) | `npm test`, exit 0 |
| TypeScript | **0 errors** | `npx tsc -b`, exit 0 |
| Production build | **pass**; `dist/assets/index-*.js` 1.91 MB (456.9 kB gzip), CSS 33.8 kB (7.0 kB gzip) | `npm run build`, exit 0; advisory chunk-size notice for the single JS chunk |
| Lint | **0 errors, 2 warnings** (`only-export-components` in `ui/primitives.tsx`, `state/AppState.tsx`, both pre-existing) | `npm run lint`, exit 0 |
| Archive→source integrity | **11 / 11 committed source files hash-match the archives** | `node src/data/research/verify-archives.mjs --a … --b … --c … --d …`, exit 0 |
| Research integration | **6 of 6 slots**, 2 freshwater / 2 terrestrial / 2 marine, all `research-verified` | `src/test/researchDatasets.test.ts` |
| Source→output comparison | node and link sets re-derived from the committed source tables for all six networks; exact set equality asserted | `src/test/researchDatasets.test.ts` |
| Demo datasets | preserved: nodes 12, 13, 14, 15, 13, 12; links 17, 20, 29, 29, 22, 22; ids and order unchanged | `researchDatasets.test.ts` |
| Production preview | page, JS, CSS and favicon all HTTP 200 | `vite preview` on port 4179, then stopped |
| Built-bundle browser check | `/library` renders all six networks with their counts; `/overview` renders “6 verified”; `/methodology` runs the in-browser suite and reports **70 passed · 0 failed · 70 total**; 390 × 844 viewport renders without error | headless Chrome `--dump-dom`, `--screenshot` against `vite preview` |
| Deployment | **not deployed** — build-ready only | no hosting target, workflow or credentials in the repository |

---

## B. Research coverage

| Ecosystem | Required | Integrated | Source-validated | Remaining gap |
|---|---:|---:|---:|---|
| Freshwater | 2 | 2 | 2 | Both are replicate ponds from **one** mesocosm experiment. They are distinct sampled networks, but there is still no second *independent* freshwater study. |
| Terrestrial | 2 | 2 | 2 | none |
| Marine | 2 | 2 | 2 | The Ythan is a tidal estuary; the source paper classes its six webs as marine, which is recorded as a caveat rather than hidden. |
| **Total** | **6** | **6** | **6** | Freshwater study-independence caveat only. |

“Source-validated” here means: node identities, link meaning, direction, and counts were compared
with the original archive, not merely schema-checked.

---

## C. Dataset audit

| Dataset | Ecosystem | Source files used | DOI | Citation recorded | Reuse | Nodes | Links | Direction evidence | Verification |
|---|---|---|---|---:|---|---|---|---:|---:|---|---|
| `RES-FW-A` | freshwater | `FoodwebMetadata/communities/Pond1/{nodes,properties,trophic.links}.csv` | 10.5061/dryad.866t1g1zj | Zhang, Zhang & Xu (2024) + article 10.1111/gcb.70114 | CC0 1.0 | 11 | 18 | archive README: `resource` = food, `consumer` = consumer | node/link sets re-derived in tests; files hash-verified |
| `RES-FW-B` | freshwater | `communities/Pond47/*` (control, C6) | 10.5061/dryad.866t1g1zj | as above | CC0 1.0 | 14 | 39 | as above | as above; replicate relationship stated in provenance |
| `RES-TER-C` | terrestrial | `Insect+data.csv`, `TidyTrait.csv`, `FW.csv` | 10.5061/dryad.230j5ch | Gripenberg et al. (2019) + article 10.1111/ele.13359 | CC0 1.0 | 395 | 322 | plant is food (seeds), insect is seed predator | 471 raw → 322 accepted (131 reason-excluded, 18 blank-flag); accepted set equals the authors' `FW.csv` |
| `RES-TER-D` | terrestrial | `outputs/2i_final_dataset/pred_prey_sizes_DNAinteractions.csv`, `raw_data/2_sample_data/Predator_IDs.csv` | 10.25349/D9M038 | Miller-ter Kuile et al. (2022) + article 10.1002/ecy.3634 | CC0 1.0 | 57 | 98 | prey DNA in predator gut ⇒ prey → predator | 305 records / 173 predators / 9 species match the deposit abstract; 98 unique prey-family→predator links |
| `MAR-TATOOSH-1` | marine | `TatooshTrophic.txt`, `Tatoosh-Taxonomy.csv` | 10.5061/dryad.39jv1 | Wootton, Sander & Allesina (2016) + article 10.1371/journal.pcbi.1004330 | CC0 1.0 | 110 | 869 | `+1` at row *i*, column *j* means *j* is eaten by *i* | all 869 links re-derived from the matrix in tests |
| `MAR-YTHAN-1` | marine | `ythan_spnames.csv`, `full_data.csv` (traits) | 10.5061/dryad.1mv20r6 | Cirtwill & Eklöf (2019) + article 10.1111/ele.12955; web first published by Cohen et al. (2009) | CC0 1.0 | 87 | 373 | Dryad usage note: "predator names … first row … prey names … first column … values of 1 indicate feeding links" | 417 cells → 395 unique pairs → 373 accepted (19 `na`, 3 self-links) |

The six illustrative demo networks remain `illustrative-demo` and are never counted as research
data.

### Corrections made to earlier claims

1. **`MAR-TATOOSH-1` had 13 links.** It now has the 869 links encoded in the deposited matrix, and a
   test re-derives them from `TatooshTrophic.txt` on every run.
2. **`RES-TER-D` claimed 79 nodes / 609 links.** 609 is the number of distinct pairs in the
   *unfiltered* rarefied ASV table: 495 of those pairs exist only in rows with `reads = 0`, and 16
   more are non-prey families (Hominidae, Muridae, Salmonidae, Sulidae, Oxyuridae, Thripidae,
   Buthidae, Coccidae) that the authors removed from their final table. The verified network is
   57 nodes / 98 links, taken from the authors' `2i_final_dataset` interaction table.
3. **`RES-TER-C` counts were previously unverified.** 395 / 322 now reproduce exactly from
   `Insect+data.csv` + `TidyTrait.csv`, with the 322 accepted rows shown to equal the authors' own
   `FW.csv`.
4. **“Licence unknown” for all four datasets.** Each Dryad record states CC0 1.0; that is now
   recorded per dataset together with the dataset DOI and, separately, the article DOI.
5. **“Two slots unsourced”.** Both slots are now filled, and the second marine slot uses a documented
   matrix orientation instead of guessing (`RES-MAR-2`).

---

## D. Changes made in this pass

**Source data committed** (`src/data/research/`)

* `source-ter-c/{Insect+data.csv,TidyTrait.csv}`, `source-ter-d/{pred_prey_sizes_DNAinteractions.csv,Predator_IDs.csv}`,
  `source-mar-ythan/{ythan_spnames.csv,ythan_feeding_modes.csv}`, `source-fw-pond47/{nodes,properties,trophic.links}.csv`.

**Converters** (deterministic, fail loudly, print raw/accepted/rejected counts)

* `convert-ter-c.mjs`, `convert-ter-d.mjs`, `convert-mar-ythan.mjs`, `convert-fw-pond47.mjs`;
  `convert-fw-pond1.mjs` refactored onto the shared `pondConversion.mjs`; shared helpers in
  `sourceUtils.mjs`; archive hash check `verify-archives.mjs`.

**Generated datasets**

* `TER-C.ts` and `TER-D.ts` regenerated (TER-D corrected from 79/609 to 57/98); `FW-A.ts` regenerated;
  new `FW-B.ts`, `MAR-YTHAN-1.ts`; `MAR-TATOOSH-1.ts` provenance updated to the verified state.

**Registry and UI**

* `src/data/datasetRegistry.ts`: six bundled research datasets (ordered freshwater → terrestrial →
  marine), six verified slots with per-slot verification records, `ResearchSlot.verifiedChecks`.
* `DatasetBrowser.tsx`, `DatasetLibraryPage.tsx`, `Overview.tsx`: copy now derived from the registry
  (no “all slots pending”, no “research library empty”); verified slots show what was checked.

**Tests**

* `src/test/researchDatasets.test.ts` rewritten: every research network is re-derived from its
  committed source table (including rejection accounting for TER-C, zero-read/contaminant exclusion
  for TER-D, duplicate/`na`/self-link accounting for Ythan), plus registry and demo-preservation
  checks. Test count 122 → **130**.
* `src/test/ui.test.tsx`: Overview verified count, a six-network library check, and dataset switching
  across freshwater → terrestrial → marine in the built application.

**Documentation**

* `README.md` (dataset table, test count, deployment section), `TODO.md`,
  `src/data/research/README.md` (pipeline, cleaning decisions, status vocabulary),
  `src/data/research/ARCHIVE_INVENTORY.md` (archive-by-archive audit), this report.

---

## E. Remaining blockers and limitations

1. **Deployment** — no hosting account, platform configuration or credentials exist in the repository.
   Exact build command (`npm ci && npm run build`) and output directory (`dist/`) are documented;
   hash routing removes the need for SPA rewrite rules. A live URL and live-URL acceptance test
   therefore could not be produced.
2. **Freshwater study independence** — the only supplied freshwater archive is a single mesocosm
   experiment (48 ponds, 8 treatments × 6 replicates). Two of its ponds are bundled and labelled as
   replicates. An independent freshwater source was searched for and not adopted: the Zenodo
   “Database of trophic interactions” (doi:10.5281/zenodo.13751, CC0) bundles 20 823 links from 51
   studies rather than bounded per-web node sets, so a “network” built from it would be an aggregation
   of a study, not a documented local web; the iDiv GATEWAy download endpoint could not be reached.
   A strict “six independent studies” reading would therefore still want another freshwater dataset
   from a second repository.
3. **Bundle size** — one 1.91 MB JS chunk (456.9 kB gzip) triggers Vite's 500 kB advisory. Research
   datasets are imported synchronously by the registry; removing the warning needs lazy loading of
   dataset modules, which would change the synchronous `getBuiltInDataset` contract. Not attempted;
   the warning is advisory and reported above rather than suppressed.
4. **Google Fonts** is the only external runtime request; the app works without it (fonts fall back).
5. **Archive hash check is on demand** — the four ZIPs (26 MB) are not committed, so
   `verify-archives.mjs` needs them extracted locally. The in-repo tests cover everything that does
   not require the archives themselves.
6. Three zero-byte `*_spnames.csv` files in the project root are leftovers from earlier failed
   downloads. They are unused; left in place rather than deleted without being asked.

---

## F. Final verdict

**READY FOR DEPLOYMENT** — the six-network target is met with source-validated, citation- and
licence-checked data; the test suite, type-check, build and lint pass; the built application was
exercised in a headless browser. What is missing is an actual deployment, because there is no hosting
target or credential in the repository.

The one substantive caveat is scientific, not technical: the two freshwater networks are replicate
ponds from the same experiment, so “two freshwater networks” is true at the level of network
instances, not independent studies.
