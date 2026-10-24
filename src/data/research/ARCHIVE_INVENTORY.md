# Archive inventory and audit

Audited 2026-10-18 against the four archives in the project root. Filenames use a
double underscore before the version suffix, e.g.
`doi_10_5061_dryad_866t1g1zj__v20240507.zip` (the single-underscore spelling does
not exist in this workspace).

| # | Archive in the project root | DOI | Size | Licence (repository record) | Published |
|---|---|---|---:|---|---|
| A | `doi_10_5061_dryad_866t1g1zj__v20240507.zip` | 10.5061/dryad.866t1g1zj | 6.28 MB | CC0 1.0 | v5, 2024-05-07 |
| B | `doi_10_5061_dryad_1mv20r6__v20200831.zip` | 10.5061/dryad.1mv20r6 | 3.98 MB | CC0 1.0 | v3, 2020-08-31 |
| C | `doi_10_5061_dryad_230j5ch__v20190911.zip` | 10.5061/dryad.230j5ch | 0.24 MB | CC0 1.0 | v1, 2019-09-11 |
| D | `doi_10_25349_D9M038__v20221003.zip` | 10.25349/D9M038 | 15.46 MB | CC0 1.0 | 2021-10-20, updated 2022-10-03 |

Licences and publication dates were read from the Dryad API records for each DOI on
2026-10-18; none of them is inferred from the presence of a public download.

There are also three zero-byte files in the project root (`kongsfjorden_spnames.csv`,
`loughhyne_spnames.csv`, `ythan_spnames.csv`). They are leftovers from earlier download
attempts, contain no data, and are **not** used by anything. The real Ythan matrix is the
2 MB file committed under `source-mar-ythan/`.

---

## A — Multiple stressors simplify freshwater food webs

`doi_10_5061_dryad_866t1g1zj__v20240507.zip` → 8 entries:

| Entry | Use |
|---|---|
| `README.md` | Documentation: experimental design, per-pond metadata, food-web component columns |
| `FoodwebMetadata.zip` | **Used.** 226 entries: `FoodwebMetadata/communities/Pond1…Pond48/` (each with `nodes.csv`, `properties.csv`, `trophic.links.csv`) and eight treatment-summed folders `Ponds_C`, `Ponds_E`, `Ponds_I`, `Ponds_N`, `Ponds_W`, `Ponds_WE`, `Ponds_WI`, `Ponds_WN`, `Ponds_WNI` |
| `Food_web_components.xlsx` | Biomass/abundance of food-web components per pond (not needed for the network) |
| `Parameters_over_time.xlsx`, `MeososmFinal.r`, `FoodwebProperties.R`, `TimeSeries.r`, `Interaction-null-models.r` | Analysis inputs/scripts (not needed) |

Documented semantics used:

* `nodes.csv › node` — "a group of organisms in the food web" (not a species);
* `trophic.links.csv › resource` — "the food for the consumer"; `› consumer` — "the consumer of the food", i.e. **resource → consumer**;
* `properties.csv` — `title`, `Pondcode`, `Temp` (`W`/`0`), `Eutroph` (`N`/`0`), `Pesticide` (`I`/`0`).

Treatment codes in the archive: control `C`, warming `W`, nutrient loading `E`/`N`, insecticide `I`,
and their combinations, six replicate ponds each.

**Used:** `communities/Pond1` (Pondcode `WI1`, heated + insecticide) → `RES-FW-A`; and
`communities/Pond47` (Pondcode `C6`, unheated untreated control) → `RES-FW-B`.
**Not used:** the eight treatment-summed folders, because a summed web aggregates the ponds that
are already counted individually and would double-count them.

The three CSVs for both ponds are committed verbatim under `source-fw-pond1/` and
`source-fw-pond47/`, and `verify-archives.mjs` hashes them against this archive.

## B — Feeding environment and other traits shape species' roles in marine food webs

`doi_10_5061_dryad_1mv20r6__v20200831.zip` → 13 entries: `full_data.csv` plus an `.xls` and a
`.csv` copy of each of six webs.

| Entry | Shape | Use |
|---|---|---|
| `ythan_spnames.csv` | 92 × 92 named matrix | **Used** → `MAR-YTHAN-1` |
| `kongsfjorden_spames.csv` (sic) | 270 × 270 | Not used (available for a future slot) |
| `loughhyne_spnames.csv` | 349 × 349 | Not used |
| `reef_spnames.csv` | 249 × 249 | Not used |
| `stmarks_spnames.csv` | 143 × 143 | Not used |
| `weddell_spnames.csv` | 488 × 488 | Not used |
| `full_data.csv` | 1553 rows, `;`-separated, `Network` column, `R1…R30` motif-position columns | **Used** for traits: `Network=ythanjacob` rows → `source-mar-ythan/ythan_feeding_modes.csv` |

Documented semantics (Dryad usage notes, quoted):

> "Food web for the Ythan Estuary with predator names given in the first row and prey names given in
> the first column. Values of 1 indicate feeding links."

So a `1` at row *prey*, column *predator* is the directed link **prey → predator**. This is the
orientation evidence — it was not inferred from the pattern of ones. The same note warns that the
`.xls` copies are missing columns; only the `.csv` copies were read.

The `R1…R30` columns are motif-position frequencies ("position columns are labelled R1 through R30,
with position numbers as in Fig. 1 of the main text"), **not** interaction data, and are not used.

Normalisation of the Ythan matrix (re-derived by `src/test/researchDatasets.test.ts`):

| Step | Count |
|---|---:|
| Rows/columns | 92 × 92, identical label sets |
| Marked cells (`1`) | 417 |
| Unique pairs after collapsing repeated labels (`na` ×3, `Somateria mollissima` ×2, `Platichthys flesus` ×2) | 395 |
| Links involving the placeholder label `na` (no trait row in `full_data.csv`) | 19 |
| Self-links (`Pomatoschistus microps`, `Platichthys flesus`, `Carcinus maenas`) | 3 |
| **Accepted network** | **87 nodes / 373 links** |

## C — A highly-resolved food web for insect seed predators in a species-rich tropical forest

`doi_10_5061_dryad_230j5ch__v20190911.zip` → 7 entries:

| Entry | Shape | Use |
|---|---|---|
| `Insect+data.csv` | 471 rows | **Used** — "List of all observed seed predator × plant species interactions" |
| `TidyTrait.csv` | 479 rows | **Used** — plant names, families and life form keyed by `Codigo` |
| `FW.csv` | 322 rows | **Used as a check** — "Data set used for construction of quantitative food web" |
| `README_for_FW.txt`, `README_for_Insect+data.txt`, `README_for_TidyTrait.txt` | Documentation | Column meanings quoted below |
| `PhyloExtraSpec.tree` | Plant phylogeny | Not used; the README warns it contains grafted taxa |

Documented semantics: `InsectSpCode` = numeric insect species code, `FullSpeciesNameValid` = binomial
or morphospecies code, `Codigo` = "4-letter species code of host plant species", `TOTAL` = "number of
times the predator-prey interaction was observed", `IncludeInFoodWeb` / `ReasonNotIncluded` = the
authors' own inclusion flag and exclusion reason.

Filter audit:

| Group | Rows |
|---|---:|
| Raw observed records | 471 |
| `IncludeInFoodWeb = Yes` (accepted) | 322 |
| `Does not occur in 50ha plot` | 45 |
| `Hymenoptera` | 40 |
| `Small-seeded host` | 39 |
| `unknown number of individuals per seed` | 6 |
| `No information on seed numbers` | 1 |
| Empty `IncludeInFoodWeb` flag (all with an empty reason field) | 18 |

The accepted pair set is **identical** to `FW.csv` (322 unique pairs), which is the decisive check:
the 18 blank-flag rows are rows the authors themselves left out of the quantitative web, and they
are excluded and listed rather than silently dropped.

Node identity: 141 unique plant codes → names and families from `TidyTrait.csv`
(`Plant_species19`, `Family`); 254 unique insect codes → `FullSpeciesNameValid`, `Order`, `Family`.
Total 395 nodes, 322 links, direction plant → insect (plant seeds are the food).

## D — Palmyra Atoll terrestrial invertebrate predator-prey interactions

`doi_10_25349_D9M038__v20221003.zip` → 2 entries: `README.txt` (44 KB) and `data.zip` (15.4 MB).

`README.txt` gives the article reference (10.1002/ecy.3634), the creators, the site
(Palmyra Atoll, 5.88°N 162.08°W), the field/lab methods and a column dictionary for the raw tables.
The abstract recorded on the Dryad page states the study contains **305 predator-prey interactions
from 173 individual invertebrate predators from nine species**.

Inside `data.zip` (used entries only):

| Entry | Shape | Use |
|---|---|---|
| `data/outputs/2i_final_dataset/pred_prey_sizes_DNAinteractions.csv` | 305 rows × 19 columns | **Used** — the final detected-interaction table (one row per predator individual × prey family, `reads ≥ 1`) |
| `data/raw_data/2_sample_data/Predator_IDs.csv` | 10 rows | **Used** — maps the three-letter `sample_str` code to predator species and hunting traits |
| `data/outputs/2e_rarefied_taxonomic_sort/fam_prey_DNA_conservative.csv` | 89 717 rows | **Rejected as a link source** — one row per ASV × sample, including `reads = 0`. Only 557 rows have reads > 0 (114 distinct predator–family pairs); 495 of its 609 distinct pairs exist only as zero-read rows. It also retains 16 pairs with non-zero reads that the authors dropped from their final table (Hominidae, Muridae, Salmonidae, Sulidae, Oxyuridae, Thripidae, Buthidae, Coccidae) |
| `data/raw_data/0_raw_sequences/`, `1_denoised_data/`, `3_taxonomies/`, `4_body_size_data/`, other `outputs/` | Raw reads, ASVs, body sizes | Not needed |

The data set that this audit replaces had 79 nodes / 609 links. 609 is exactly the number of distinct
`(pred_ID, Family)` pairs in the **unfiltered** rarefied ASV table, i.e. undetected taxa were counted
as feeding links. The verified network is 9 predators + 48 prey families = **57 nodes / 98 links**,
every link backed by at least one detected record in the authors' final interaction table.

## Files committed from each archive

| Archive | Committed under | Files |
|---|---|---|
| A | `source-fw-pond1/`, `source-fw-pond47/` | `nodes.csv`, `properties.csv`, `trophic.links.csv` (3 + 3) |
| B | `source-mar-ythan/` | `ythan_spnames.csv` (verbatim), `ythan_feeding_modes.csv` (verbatim extract of `full_data.csv`, `Network=ythanjacob`) |
| C | `source-ter-c/` | `Insect+data.csv`, `TidyTrait.csv` |
| D | `source-ter-d/` | `pred_prey_sizes_DNAinteractions.csv`, `Predator_IDs.csv` |

`node src/data/research/verify-archives.mjs --a … --b … --c … --d …` hashes all 11 verbatim files
against the extracted archives. Latest run: **11 verified, 0 skipped, 0 failures**.
