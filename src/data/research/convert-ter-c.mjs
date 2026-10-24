/**
 * convert-ter-c.mjs
 *
 * Source-to-dataset converter for RES-TER-C, the Barro Colorado Island
 * insect seed-predator food web.
 *
 * Source archive: doi_10_5061_dryad_230j5ch__v20190911.zip
 *   Insect+data.csv   "List of all observed seed predator x plant species
 *                      interactions" (471 rows, one row per observed pair)
 *   TidyTrait.csv     plant traits keyed by the 4-letter plant code (Codigo),
 *                      including the current valid species name and family
 *   FW.csv            "Data set used for construction of quantitative food web"
 *                      (the authors' own filtered web; used only as a check)
 *
 * Documented semantics:
 *   - Insect+data.csv `InsectSpCode` is the insect species code,
 *     `Codigo` is the 4-letter code of the host plant species, and
 *     `TOTAL` is the number of times the predator-prey interaction was observed.
 *   - `IncludeInFoodWeb` marks the rows that belong to the quantitative web,
 *     and `ReasonNotIncluded` gives the reason for every excluded row.
 *
 * Direction: the plant is the food (seed/fruit) and the insect is the consumer,
 * so every accepted row becomes plant -> insect.
 *
 * Run: node src/data/research/convert-ter-c.mjs
 *      (add --check-fw <path to the authors' FW.csv> to cross-check the filter)
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTable, report, writeDatasetModule } from './sourceUtils.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const sourceDir = join(here, 'source-ter-c')

const raw = readTable(join(sourceDir, 'Insect+data.csv'))
const traits = readTable(join(sourceDir, 'TidyTrait.csv'))

for (const column of ['InsectSpCode', 'FullSpeciesNameValid', 'Codigo', 'TOTAL', 'IncludeInFoodWeb']) {
  if (!raw.header.includes(column)) {
    throw new Error(`Insect+data.csv is missing the documented "${column}" column`)
  }
}
for (const column of ['Codigo', 'Plant_species19', 'Family']) {
  if (!traits.header.includes(column)) {
    throw new Error(`TidyTrait.csv is missing the documented "${column}" column`)
  }
}

/* ---- 1. Apply the source's own inclusion flag ---------------------------- */

const included = []
const rejected = []
const blankFlag = []
for (const row of raw.rows) {
  const flag = String(row.IncludeInFoodWeb ?? '').trim()
  if (flag.toLowerCase() === 'yes') included.push(row)
  else if (flag === '') blankFlag.push(row)
  else rejected.push(row)
}

const rejectionReasons = new Map()
for (const row of rejected) {
  const reason = String(row.ReasonNotIncluded ?? '').trim() || 'no reason recorded'
  rejectionReasons.set(reason, (rejectionReasons.get(reason) ?? 0) + 1)
}

/* ---- 2. Normalise links as plant -> insect ------------------------------- */

const pairKey = (plant, insect) => `${plant}->${insect}`
const links = new Map()
for (const row of included) {
  const plant = String(row.Codigo).trim()
  const insect = String(row.InsectSpCode).trim()
  if (!plant || !insect) throw new Error(`row has an empty endpoint: ${JSON.stringify(row)}`)
  const key = pairKey(plant, insect)
  if (links.has(key)) {
    throw new Error(`duplicate plant->insect record in the included rows: ${key}`)
  }
  links.set(key, {
    plant,
    insect,
    observations: Number(row.TOTAL),
    killedPerM2: Number(row.KilledPerM2),
  })
}

/* ---- 3. Node identity ---------------------------------------------------- */

const traitByCode = new Map(traits.rows.map((row) => [String(row.Codigo).trim(), row]))
const plantCodes = [...new Set([...links.values()].map((link) => link.plant))].sort()
const insectCodes = [...new Set([...links.values()].map((link) => link.insect))].sort(
  (a, b) => Number(a) - Number(b),
)

const missingTraits = plantCodes.filter((code) => !traitByCode.has(code))
if (missingTraits.length > 0) {
  throw new Error(`plant codes without a TidyTrait row: ${missingTraits.join(', ')}`)
}

const plantIdFor = new Map(plantCodes.map((code, index) => [code, `C-PLANT-${String(index).padStart(3, '0')}`]))
const insectIdFor = new Map(
  insectCodes.map((code, index) => [code, `C-INSECT-${String(index).padStart(3, '0')}`]),
)

const insectRows = new Map()
for (const row of included) {
  const code = String(row.InsectSpCode).trim()
  if (!insectRows.has(code)) insectRows.set(code, row)
}

const nodes = [
  ...plantCodes.map((code) => {
    const trait = traitByCode.get(code)
    const scientificName = String(trait.Plant_species19 ?? '').trim().replace(/_/g, ' ')
    return {
      id: plantIdFor.get(code),
      name: scientificName || code,
      scientificName: scientificName || null,
      nodeType: 'species',
      trophicRole: 'producer',
      roleEvidence: 'documented',
      description: `Host plant whose seeds are eaten by the recorded seed-predator insects. Family: ${trait.Family || 'not reported'}.`,
      iconKey: 'tree',
      habitat: 'tropical forest (Barro Colorado Island, Panama)',
      sourceNote: `TidyTrait.csv: Codigo=${code}; Plant_species19=${trait.Plant_species19}; Family=${trait.Family}; Lifeform=${trait.Lifeform || 'not reported'}.`,
      originalId: code,
    }
  }),
  ...insectCodes.map((code) => {
    const row = insectRows.get(code)
    const hostCount = [...links.values()].filter((link) => link.insect === code).length
    return {
      id: insectIdFor.get(code),
      name: String(row.FullSpeciesNameValid).trim(),
      scientificName: null,
      nodeType: 'species',
      trophicRole: 'primary-consumer',
      roleEvidence: 'documented',
      description: `Insect seed predator (Order: ${row.Order || 'not reported'}; Family: ${row.Family || 'not reported'}) recorded on ${hostCount} host-plant species.`,
      iconKey: 'insect',
      habitat: 'tropical forest (Barro Colorado Island, Panama)',
      sourceNote: `Insect+data.csv: InsectSpCode=${code}; FullSpeciesNameValid=${row.FullSpeciesNameValid}; Order=${row.Order || 'not reported'}; Family=${row.Family || 'not reported'}.`,
      originalId: code,
    }
  }),
]

/* ---- 4. Edges in document order ----------------------------------------- */

const edges = [...links.values()]
  .map((link) => ({ link, source: plantIdFor.get(link.plant), target: insectIdFor.get(link.insect) }))
  .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
  .map(({ link, source, target }) => ({
    id: `e:${source}->${target}`,
    source,
    target,
    relationship: 'seed predation (insect consumes plant seed)',
    sourceNote: `Insect+data.csv: Codigo=${link.plant}; InsectSpCode=${link.insect}; TOTAL observations=${link.observations}; KilledPerM2=${link.killedPerM2}.`,
  }))

const dataset = {
  id: 'RES-TER-C',
  name: 'RES-TER-C · BCI insect seed-predator web (Barro Colorado Island)',
  ecosystem: 'terrestrial',
  summary:
    'Plant-insect seed-predation network from the 50-ha forest dynamics plot on Barro Colorado Island, Panama: 141 host-plant species and 254 insect seed-predator species, linked by recorded feeding observations.',
  isDemo: false,
  sourceStatus: 'research-verified',
  provenance: {
    origin:
      'Gripenberg S, Basset Y, Lewis O, Terry J, Wright SJ, Simon I, Fernandez D, Cedeno-Sanchez M, Rivera M, Barrios H, Brown J, Calderon O, Cognato A, Kim J, Miller S, Morse G, Pinzon Navarro S, Quicke D, Robbins R, Salminen J-P, Vesterinen E. "A highly-resolved food web for insect seed predators in a species-rich tropical forest." Dryad dataset doi:10.5061/dryad.230j5ch (v1, published 2019-09-11).',
    citation:
      'Gripenberg S et al. (2019). Data from: A highly-resolved food web for insect seed predators in a species-rich tropical forest. Dryad dataset doi:10.5061/dryad.230j5ch. Related article: doi:10.1111/ele.13359.',
    sourceUrl: 'https://doi.org/10.5061/dryad.230j5ch',
    license:
      'CC0 1.0 Universal (public-domain dedication), as recorded on the Dryad record for doi:10.5061/dryad.230j5ch. Redistribution of the derived network is permitted under those terms.',
    version: 'v20190911 (Dryad dataset version 1)',
    nodeUnit: 'Species: host plants are species-level taxa, insects are species or documented morphospecies.',
    cleaningNotes: [
      `Source rows: ${raw.rows.length} observed insect-plant records in Insect+data.csv. ${included.length} rows carry IncludeInFoodWeb=Yes and form the accepted network.`,
      `Excluded ${rejected.length} rows with an explicit source reason: ${[...rejectionReasons.entries()]
        .map(([reason, count]) => `${reason} (${count})`)
        .join('; ')}.`,
      `Excluded ${blankFlag.length} rows whose IncludeInFoodWeb field is empty (insect codes ${[
        ...new Set(blankFlag.map((row) => String(row.InsectSpCode).trim())),
      ].join(', ')}). These rows are also absent from the authors' FW.csv, so they are not part of the quantitative web; they are listed here rather than silently dropped.`,
      'The accepted pair set equals the authors\' FW.csv exactly (checked by --check-fw and by the test suite): 322 unique plant->insect records, no duplicate pair, no self-link, no endpoint missing from the node tables.',
      'Plants are identified by the source 4-letter code (Codigo); names and families come from TidyTrait.csv (Plant_species19 / Family). Insect names come from FullSpeciesNameValid (binomial where known, otherwise the source morphospecies code).',
      'Direction: the host plant is the food (seeds) and the insect is the consumer, so every edge is plant -> insect. The source README describes the table as "predator x prey" observations and names Codigo as the host plant species.',
      'Trophic roles: host plants are producers (documented host-plant column); insects are primary consumers documented as seed predators. No trophic role is invented beyond the source columns.',
      'TOTAL observation counts and KilledPerM2 are kept in each edge sourceNote; they are not used as weights because the app model is an unweighted directed graph.',
    ],
    validationStatus: 'research-verified',
    retrievedOn: '2026-10-18',
  },
  nodes,
  edges,
}

writeDatasetModule({
  outPath: join(here, 'TER-C.ts'),
  exportName: 'RES_TER_C',
  title: 'RES-TER-C — BCI insect seed-predator web',
  headerLines: [
    'Generated by convert-ter-c.mjs from source-ter-c/{Insect+data.csv,TidyTrait.csv},',
    'which are the verbatim contents of Dryad doi:10.5061/dryad.230j5ch.',
  ],
  dataset,
})

report('RES-TER-C', [
  `raw rows:   ${raw.rows.length}`,
  `included:   ${included.length} rows -> ${links.size} unique plant->insect links`,
  `rejected:   ${rejected.length} rows with a source reason`,
  ...[...rejectionReasons.entries()].map(([reason, count]) => `              ${count} x ${reason}`),
  `blank flag: ${blankFlag.length} rows (not in the authors' FW.csv)`,
  `accepted:   ${nodes.length} nodes (${plantCodes.length} plants, ${insectCodes.length} insects), ${edges.length} links`,
])
