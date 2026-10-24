# Research data pipeline

Every bundled research network is produced by a committed converter from committed
source files. Nothing in `datasetRegistry.ts` is hand-written from a report: the
converters read the source tables, refuse to run on an unexpected shape, and write
one `FoodWebDataset` module.

```
source-<dataset>/            verbatim files from the repository record
        │
        ├── convert-*.mjs    documented transformation, prints raw/accepted/rejected counts
        │
        └── FW-A.ts …        generated modules imported by src/data/datasetRegistry.ts
```

## Networks

| Dataset | Slot | Ecosystem | Nodes | Links | Source | Licence |
|---|---|---|---:|---:|---|---|
| `RES-FW-A` | RES-FW-1 | freshwater | 11 | 18 | Dryad `10.5061/dryad.866t1g1zj`, Pond1 (WI1) | CC0 1.0 |
| `RES-FW-B` | RES-FW-2 | freshwater | 14 | 39 | Dryad `10.5061/dryad.866t1g1zj`, Pond47 (C6) | CC0 1.0 |
| `RES-TER-C` | RES-TER-1 | terrestrial | 395 | 322 | Dryad `10.5061/dryad.230j5ch` | CC0 1.0 |
| `RES-TER-D` | RES-TER-2 | terrestrial | 57 | 98 | Dryad `10.25349/D9M038` | CC0 1.0 |
| `MAR-TATOOSH-1` | RES-MAR-1 | marine | 110 | 869 | Dryad `10.5061/dryad.39jv1` | CC0 1.0 |
| `MAR-YTHAN-1` | RES-MAR-2 | marine | 87 | 373 | Dryad `10.5061/dryad.1mv20r6`, Ythan Estuary | CC0 1.0 |

The two freshwater networks are **replicate pond communities from the same
48-pond mesocosm experiment**. They are distinct sampled networks, but they are
not independent ecosystems, and the application says so wherever they appear.

## Running the converters

```bash
node src/data/research/convert-fw-pond1.mjs
node src/data/research/convert-fw-pond47.mjs
node src/data/research/convert-ter-c.mjs
node src/data/research/convert-ter-d.mjs
node src/data/research/convert-mar-ythan.mjs
```

`convert-mar-ythan.mjs --full-data <path to full_data.csv>` regenerates
`source-mar-ythan/ythan_feeding_modes.csv`, the verbatim trait extract
(`Network = ythanjacob`, six columns) used for trophic roles.

`MAR-TATOOSH-1.ts` is the one module that predates this pipeline; its links are
re-derived from `TatooshTrophic.txt` by the test suite.

## Documented cleaning decisions

| Dataset | Raw | Accepted | Rejected and why |
|---|---|---|---|
| `RES-TER-C` | 471 observed records | 322 unique plant→insect links | 131 rows with a source exclusion reason (`Does not occur in 50ha plot` 45, `Hymenoptera` 40, `Small-seeded host` 39, `unknown number of individuals per seed` 6, `No information on seed numbers` 1); 18 rows with an empty `IncludeInFoodWeb` flag that are absent from the authors' own `FW.csv` |
| `RES-TER-D` | 305 individual interaction records from 173 predators | 98 unique prey-family→predator-species links | none dropped; records aggregated to species level. The rarefied ASV table is **not** a link source: it adds 495 zero-read pairs and 16 non-prey pairs (Hominidae, Muridae, Salmonidae, Sulidae, Oxyuridae, Thripidae, Buthidae, Coccidae) that the authors' final table excludes — an earlier 609-link conversion counted them |
| `MAR-YTHAN-1` | 417 marked matrix cells | 373 unique prey→predator links | 22 duplicate-label collapses (395 unique pairs); 19 links involving the non-taxon label `na`; 3 self-links |

## Verification

`src/test/researchDatasets.test.ts` re-derives every node and link set from these
committed files, independently of the converters, and asserts exact set equality.
`node src/data/research/verify-archives.mjs --a … --b … --c … --d …` additionally
hashes the committed source files against the extracted originals; see the script
header for the extraction commands. That archive check needs the large downloads,
so it is run on demand rather than in the test suite.

## Status vocabulary

- **Schema-valid** — parses and passes structural validation.
- **Source-validated** — node identities, link meaning, direction and counts compared with the archive.
- **Reuse-checked** — the repository record's licence is documented.
- **Research-verified** — all of the above plus a recorded citation; this is the status of all six networks here.
- **Validation pending** — a required check is still open (no bundled network is in this state).
