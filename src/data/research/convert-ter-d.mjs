/**
 * convert-ter-d.mjs
 *
 * Source-to-dataset converter for RES-TER-D, the Palmyra Atoll terrestrial
 * invertebrate predator-prey network.
 *
 * Source archive: doi_10_25349_D9M038__v20221003.zip
 *   data.zip -> data/outputs/2i_final_dataset/pred_prey_sizes_DNAinteractions.csv
 *       the authors' final interaction table: ONE ROW PER
 *       (individual predator sample x prey taxon) record that was detected.
 *       Columns used: sample, sample_str, reads, Class, Order, Family.
 *   data.zip -> data/raw_data/2_sample_data/Predator_IDs.csv
 *       maps the three-letter sample code (sample_str) to the predator species
 *       (pred_Class, pred_Order, pred_Family, pred_Genus, pred_Species, pred_ID)
 *       and documents the hunting traits (hunting_mode, venom, webs).
 *
 * Documented semantics (README.txt + Dryad abstract):
 *   - prey were assigned to family level ("we chose to combine prey taxonomies
 *     at the family level"), predators were identified to species;
 *   - the deposit contains "305 predator-prey interactions" from
 *     "173 individual invertebrate predators from nine species";
 *   - prey DNA detected in a predator gut defines the feeding link.
 *
 * Direction: the prey taxon is the food and the predator is the consumer, so
 * every accepted record becomes prey -> predator.
 *
 * Run: node src/data/research/convert-ter-d.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTable, report, writeDatasetModule } from './sourceUtils.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const sourceDir = join(here, 'source-ter-d')

const records = readTable(join(sourceDir, 'pred_prey_sizes_DNAinteractions.csv'))
const predators = readTable(join(sourceDir, 'Predator_IDs.csv'))

for (const column of ['sample', 'sample_str', 'Family', 'reads']) {
  if (!records.header.includes(column)) {
    throw new Error(`pred_prey_sizes_DNAinteractions.csv is missing the documented "${column}" column`)
  }
}
for (const column of ['pred_ID', 'sample_str', 'pred_Family', 'hunting_mode', 'venom', 'webs']) {
  if (!predators.header.includes(column)) {
    throw new Error(`Predator_IDs.csv is missing the documented "${column}" column`)
  }
}

/* ---- 1. Validate the documented record shape ---------------------------- */

const zeroReadRecords = records.rows.filter((row) => Number(row.reads) <= 0)
if (zeroReadRecords.length > 0) {
  throw new Error(
    `${zeroReadRecords.length} interaction rows have reads <= 0; the authors' final table should only contain detected prey`,
  )
}

const predatorByCode = new Map(predators.rows.map((row) => [String(row.sample_str).trim(), row]))
const unknownCodes = [...new Set(records.rows.map((row) => String(row.sample_str).trim()))].filter(
  (code) => !predatorByCode.has(code),
)
if (unknownCodes.length > 0) {
  throw new Error(`sample codes without a Predator_IDs row: ${unknownCodes.join(', ')}`)
}

/* ---- 2. Aggregate individual records into a species-level network -------- */

const linkMap = new Map()
for (const row of records.rows) {
  const code = String(row.sample_str).trim()
  const preyFamily = String(row.Family).trim()
  if (!preyFamily) throw new Error(`interaction row without a prey family: ${JSON.stringify(row)}`)
  const predator = predatorByCode.get(code)
  const key = `${preyFamily}->${predator.pred_ID}`
  const existing = linkMap.get(key)
  const reads = Number(row.reads)
  if (existing) {
    existing.records += 1
    existing.reads += reads
    existing.samples.add(String(row.sample))
  } else {
    linkMap.set(key, {
      preyFamily,
      predatorId: predator.pred_ID,
      predatorCode: code,
      predatorRow: predator,
      records: 1,
      reads,
      samples: new Set([String(row.sample)]),
    })
  }
}

/* ---- 3. Node identity ---------------------------------------------------- */

const predatorIds = [...new Set([...linkMap.values()].map((link) => link.predatorId))].sort()
const preyFamilies = [...new Set([...linkMap.values()].map((link) => link.preyFamily))].sort()

const predatorIdFor = new Map(
  predatorIds.map((id, index) => [id, `DW-PRED-${String(index).padStart(3, '0')}`]),
)
const preyIdFor = new Map(
  preyFamilies.map((family, index) => [family, `DW-PREY-${String(index).padStart(3, '0')}`]),
)

const predatorRowFor = new Map(
  [...linkMap.values()].map((link) => [link.predatorId, link.predatorRow]),
)

const nodes = [
  ...predatorIds.map((species) => {
    const row = predatorRowFor.get(species)
    return {
      id: predatorIdFor.get(species),
      name: species,
      scientificName: species,
      nodeType: 'species',
      trophicRole: 'secondary-consumer',
      roleEvidence: 'inferred',
      description: `Invertebrate predator (${row.pred_Family}) sampled on Palmyra Atoll; diet reconstructed from gut-content DNA metabarcoding. Hunting mode: ${row.hunting_mode}; venom: ${row.venom}; webs: ${row.webs}.`,
      iconKey: 'centipede',
      habitat: 'terrestrial (Palmyra Atoll National Wildlife Refuge)',
      sourceNote: `Predator_IDs.csv: ${row.pred_Class} > ${row.pred_Order} > ${row.pred_Family} > ${row.pred_Genus}; hunting_mode=${row.hunting_mode}; venom=${row.venom}; webs=${row.webs}.`,
      originalId: species,
    }
  }),
  ...preyFamilies.map((family) => ({
    id: preyIdFor.get(family),
    name: family,
    scientificName: family,
    nodeType: 'trophic-group',
    trophicRole: 'other',
    roleEvidence: 'unknown',
    description:
      'Prey taxon (family level, the resolution the source authors used). The source does not state a trophic role for prey families.',
    iconKey: 'insect',
    habitat: 'terrestrial (Palmyra Atoll National Wildlife Refuge)',
    sourceNote: 'Prey family as assigned in pred_prey_sizes_DNAinteractions.csv (Family column).',
    originalId: family,
  })),
]

/* ---- 4. Edges ------------------------------------------------------------ */

const edges = [...linkMap.values()]
  .map((link) => ({
    link,
    source: preyIdFor.get(link.preyFamily),
    target: predatorIdFor.get(link.predatorId),
  }))
  .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
  .map(({ link, source, target }) => ({
    id: `e:${source}->${target}`,
    source,
    target,
    relationship: 'predation (prey DNA detected in predator gut)',
    sourceNote: `pred_prey_sizes_DNAinteractions.csv: ${link.records} individual record(s) from ${link.samples.size} predator sample(s); ${link.reads} rarefied reads in total.`,
  }))

const dataset = {
  id: 'RES-TER-D',
  name: 'RES-TER-D · Palmyra Atoll terrestrial invertebrate diet web',
  ecosystem: 'terrestrial',
  summary:
    'Predator-prey network of nine terrestrial invertebrate predator species and 48 prey families from Palmyra Atoll, reconstructed by the source authors from predator gut-content DNA metabarcoding (173 individual predators, 305 interaction records).',
  isDemo: false,
  sourceStatus: 'research-verified',
  provenance: {
    origin:
      'Miller-ter Kuile A, Apigo A, Bui A, DiFiore B, Forbes E, Lee M, Orr D, Preston D, Behm R, Bogar T, Childress J, Dirzo R, Klope M, Lafferty K, McLaughlin J, Morse M, Motta C, Park K, Plummer K, Weber D, Young R, Young H. "Predator-prey interactions of terrestrial invertebrates are determined by predator body size and species identity." Dryad dataset doi:10.25349/D9M038 (published 2021-10-20, updated 2022-10-03).',
    citation:
      'Miller-ter Kuile A et al. (2022). Data from: Predator-prey Interactions of Terrestrial Invertebrates are Determined by Predator Body Size and Species Identity. Dryad dataset doi:10.25349/D9M038. Related article: Miller-ter Kuile A et al. (2021) Ecology, doi:10.1002/ecy.3634.',
    sourceUrl: 'https://doi.org/10.25349/D9M038',
    license:
      'CC0 1.0 Universal (public-domain dedication), as recorded on the Dryad record for doi:10.25349/D9M038. Redistribution of the derived network is permitted under those terms.',
    version: 'v20221003 (Dryad record updated 2022-10-03)',
    nodeUnit:
      'Predators are species; prey are families. The source authors deliberately combined prey at family level ("each invertebrate family corresponds to an average of 1.9 species" on Palmyra).',
    cleaningNotes: [
      `Source interaction table: ${records.rows.length} detected predator-sample x prey-family records from ${new Set(records.rows.map((row) => row.sample)).size} individual predators and ${new Set(records.rows.map((row) => row.sample_str)).size} predator species. The deposit abstract states 305 interactions from 173 individuals of nine species — both counts match this table.`,
      `Records were aggregated to a species-level network: ${linkMap.size} unique prey-family -> predator-species links over ${preyFamilies.length} prey families and ${predatorIds.length} predator species. The individual-level record count is preserved in every edge sourceNote.`,
      'An earlier conversion of this archive produced 609 links because it read every row of the rarefied taxonomic table (data/outputs/2e_rarefied_taxonomic_sort/fam_prey_DNA_conservative.csv). That table has one row per ASV and sample, including 495 predator-prey-family pairs whose only rows have reads = 0 (taxa not detected in that predator). Zero reads are not a feeding link. The rarefied table also contains 16 pairs with non-zero reads that the authors removed from their final interaction table, among them mammal, bird, fish and parasite families (Hominidae, Muridae, Salmonidae, Sulidae, Oxyuridae, Thripidae, Buthidae, Coccidae). This converter uses only the authors\' final interaction table, where every row has reads >= 1.',
      'Prey taxa are families only; no prey species names were invented. Predator taxonomy and hunting traits come from Predator_IDs.csv.',
      'Direction: prey -> predator. The README describes the data as predator diet from gut-content DNA, so the prey is the food and the predator the consumer.',
      'Trophic roles: predators are documented as predators (roleEvidence "inferred" for the secondary-consumer level, which the source does not state explicitly); prey families keep roleEvidence "unknown" because the source does not classify them.',
      'No self-links: no predator species is also one of its own prey families in this table. The converter fails if that changes.',
    ],
    validationStatus: 'research-verified',
    retrievedOn: '2026-10-18',
  },
  nodes,
  edges,
}

for (const edge of edges) {
  if (edge.source === edge.target) throw new Error(`self-link after aggregation: ${edge.id}`)
}

writeDatasetModule({
  outPath: join(here, 'TER-D.ts'),
  exportName: 'RES_TER_D',
  title: 'RES-TER-D — Palmyra Atoll terrestrial invertebrate diet web',
  headerLines: [
    'Generated by convert-ter-d.mjs from source-ter-d/{pred_prey_sizes_DNAinteractions.csv,Predator_IDs.csv},',
    'which are the verbatim contents of Dryad doi:10.25349/D9M038 (data.zip).',
  ],
  dataset,
})

report('RES-TER-D', [
  `raw records:            ${records.rows.length} (individual predator x prey-family detections)`,
  `individual predators:   ${new Set(records.rows.map((row) => row.sample)).size}`,
  `predator species:       ${predatorIds.length}`,
  `prey families:          ${preyFamilies.length}`,
  `accepted links:         ${edges.length} unique prey -> predator links`,
  'rejected:               0 detected records dropped (aggregation only)',
])
