/**
 * convert-mar-ythan.mjs
 *
 * Source-to-dataset converter for MAR-YTHAN-1, the second marine research
 * network (registry slot RES-MAR-2).
 *
 * Source archive: doi_10_5061_dryad_1mv20r6__v20200831.zip
 *   ythan_spnames.csv   the Ythan Estuary food web, a square named matrix
 *   full_data.csv       species traits for the same six webs; the rows with
 *                       Network = ythanjacob carry FeedingMode / TrophicLevel /
 *                       Group / BodyWeight / Environment for the 87 taxa.
 *
 * Documented matrix semantics (Dryad usage notes for doi:10.5061/dryad.1mv20r6):
 *   "Food web for the Ythan Estuary with predator names given in the first row
 *    and prey names given in the first column. Values of 1 indicate feeding
 *    links."
 *   → rows are prey, columns are predators, so a 1 at (prey, predator) is the
 *     directed link prey → predator.
 *
 * Normalisation decisions (all counted in the report):
 *   - duplicate labels in the matrix are collapsed to one node,
 *   - the label "na" is a placeholder, not a taxon; it has no row in the
 *     archive's own trait table, and its 19 links are excluded,
 *   - the 3 self-links are excluded (the app excludes self-links from analysis).
 *
 * The committed trait extract (ythan_feeding_modes.csv) is generated from
 * full_data.csv; pass --full-data <path> to regenerate it from the archive.
 *
 * Run: node src/data/research/convert-mar-ythan.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMatrix, readTable, report, slug, writeDatasetModule } from './sourceUtils.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const sourceDir = join(here, 'source-mar-ythan')

const fullDataFlag = process.argv.indexOf('--full-data')
if (fullDataFlag !== -1) {
  const fullDataPath = process.argv[fullDataFlag + 1]
  if (!fullDataPath) throw new Error('--full-data requires a path to full_data.csv')
  const full = readTable(fullDataPath, { delimiter: ';' })
  const rows = full.rows.filter((row) => row.Network === 'ythanjacob')
  if (rows.length === 0) throw new Error('full_data.csv contains no ythanjacob rows')
  const header = ['Species', 'FeedingMode', 'TrophicLevel', 'Group', 'BodyWeight', 'Environment']
  const csv = [header.join(','), ...rows.map((row) => header.map((key) => row[key]).join(','))].join('\n')
  writeFileSync(join(sourceDir, 'ythan_feeding_modes.csv'), `${csv}\n`)
  console.log(`regenerated ythan_feeding_modes.csv from ${fullDataPath} (${rows.length} rows)`)
}

const matrix = readMatrix(join(sourceDir, 'ythan_spnames.csv'))
const traits = readTable(join(sourceDir, 'ythan_feeding_modes.csv'))

const predatorLabels = matrix[0].slice(1)
const rowLabels = matrix.slice(1).map((row) => row[0])

if (predatorLabels.length !== rowLabels.length) {
  throw new Error('ythan_spnames.csv is not square: column and row counts differ')
}
const sortedPredators = [...predatorLabels].sort()
const sortedPrey = [...rowLabels].sort()
if (sortedPredators.join('\u0000') !== sortedPrey.join('\u0000')) {
  throw new Error('ythan_spnames.csv row and column labels are not the same set')
}

/* ---- 1. Read every marked cell as prey -> predator ---------------------- */

const rawCells = []
matrix.slice(1).forEach((row) => {
  const prey = row[0]
  predatorLabels.forEach((predator, index) => {
    const value = row[index + 1]
    if (value === '1') rawCells.push({ prey, predator })
    else if (value !== '0' && value !== '') {
      throw new Error(`unexpected matrix cell value "${value}" at ${prey} x ${predator}`)
    }
  })
})

const uniqueCells = [...new Map(rawCells.map((cell) => [`${cell.prey}->${cell.predator}`, cell])).values()]

/* ---- 2. Documented exclusions ------------------------------------------ */

const PLACEHOLDER = 'na'
const placeholderCells = uniqueCells.filter((cell) => cell.prey === PLACEHOLDER || cell.predator === PLACEHOLDER)
const nonPlaceholder = uniqueCells.filter((cell) => cell.prey !== PLACEHOLDER && cell.predator !== PLACEHOLDER)
const selfCells = nonPlaceholder.filter((cell) => cell.prey === cell.predator)
const accepted = nonPlaceholder.filter((cell) => cell.prey !== cell.predator)

const labels = [...new Set(accepted.flatMap((cell) => [cell.prey, cell.predator]))].sort()
const duplicateLabels = [...new Set(rowLabels.filter((label, index) => rowLabels.indexOf(label) !== index))]

/* ---- 3. Traits and node identity --------------------------------------- */

const traitByLabel = new Map(traits.rows.map((row) => [String(row.Species).trim(), row]))

function roleFor(label) {
  const row = traitByLabel.get(label)
  const mode = String(row?.FeedingMode ?? '').trim().toLowerCase()
  if (mode === 'primaryproducer') return { role: 'producer', evidence: 'documented' }
  if (mode === 'grazer') return { role: 'primary-consumer', evidence: 'documented' }
  if (mode === 'suspension-feeder') return { role: 'primary-consumer', evidence: 'inferred' }
  if (mode === 'predator') return { role: 'secondary-consumer', evidence: 'inferred' }
  if (mode === 'predator/scavenger') return { role: 'secondary-consumer', evidence: 'inferred' }
  return { role: 'other', evidence: 'unknown' }
}

const usedIds = new Set()
const idFor = new Map()
for (const label of labels) {
  let id = `y-${slug(label)}`
  let suffix = 2
  while (usedIds.has(id)) id = `y-${slug(label)}-${suffix++}`
  usedIds.add(id)
  idFor.set(label, id)
}

const nodes = labels.map((label) => {
  const trait = traitByLabel.get(label)
  const { role, evidence } = roleFor(label)
  const binomial = /^[A-Z][a-zA-Z]+ [a-z][a-zA-Z]+$/.test(label)
  return {
    id: idFor.get(label),
    name: label,
    scientificName: binomial ? label : null,
    nodeType: binomial ? 'species' : 'trophic-group',
    trophicRole: role,
    roleEvidence: evidence,
    description: trait
      ? `Ythan Estuary food-web node. Feeding mode: ${trait.FeedingMode}; trophic level: ${trait.TrophicLevel}; environment: ${trait.Environment}.`
      : 'Ythan Estuary food-web node. No trait row in full_data.csv for this label.',
    iconKey: role === 'producer' ? 'algae' : binomial ? 'fish' : 'invertebrate',
    habitat: 'estuary (Ythan Estuary, Scotland)',
    sourceNote: trait
      ? `full_data.csv (Network=ythanjacob): FeedingMode=${trait.FeedingMode}; TrophicLevel=${trait.TrophicLevel}; Group=${trait.Group}; BodyWeight=${trait.BodyWeight}; Environment=${trait.Environment}.`
      : 'No full_data.csv trait row.',
    originalId: label,
  }
})

/* ---- 4. Edges ----------------------------------------------------------- */

const edges = accepted
  .map((cell) => ({ ...cell, source: idFor.get(cell.prey), target: idFor.get(cell.predator) }))
  .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
  .map((cell) => ({
    id: `e:${cell.source}->${cell.target}`,
    source: cell.source,
    target: cell.target,
    relationship: 'feeding',
    sourceNote: `ythan_spnames.csv: 1 at row "${cell.prey}" (prey), column "${cell.predator}" (predator).`,
  }))

const dataset = {
  id: 'MAR-YTHAN-1',
  name: 'MAR-YTHAN-1 · Ythan Estuary food web (Scotland)',
  ecosystem: 'marine',
  summary:
    'Estuarine food web of the Ythan Estuary, Scotland (87 taxa, feeding links among birds, fish, invertebrates, plants and detritus). Compiled by Ute Jacob and distributed with the six-well-resolved marine webs in Cirtwill & Eklöf\'s Dryad deposit, where it is classified as marine.',
  isDemo: false,
  sourceStatus: 'research-verified',
  provenance: {
    origin:
      'Cirtwill AR, Eklöf A. "Data from: Feeding environment and other traits shape species\' roles in marine food webs." Dryad dataset doi:10.5061/dryad.1mv20r6 (v3, published 2020-08-31). Matrix file: ythan_spnames.csv; traits: full_data.csv (Network=ythanjacob). The web itself was first published by Cohen JE et al. (2009) PNAS doi:10.1073/pnas.0910582106.',
    citation:
      'Cirtwill AR, Eklöf A (2019). Data from: Feeding environment and other traits shape species\' roles in marine food webs. Dryad dataset doi:10.5061/dryad.1mv20r6. Related article: doi:10.1111/ele.12955. Underlying Ythan Estuary web: Cohen JE et al. (2009) PNAS 106:22335-22340, doi:10.1073/pnas.0910582106.',
    sourceUrl: 'https://doi.org/10.5061/dryad.1mv20r6',
    license:
      'CC0 1.0 Universal (public-domain dedication), as recorded on the Dryad record for doi:10.5061/dryad.1mv20r6. Redistribution of the derived network is permitted under those terms.',
    version: 'v20200831 (Dryad dataset version 3)',
    nodeUnit:
      'Mixed, exactly as the source reports it: species, genera and functional/aggregate groups (for example Acarina, POM, Detritus, Fish). It is not a single taxonomic level.',
    cleaningNotes: [
      `Matrix: ${rowLabels.length} rows x ${predatorLabels.length} columns, square and with identical row/column label sets. The Dryad usage notes document "predator names in the first row and prey names in the first column", so a 1 at (prey, predator) is a directed link prey -> predator.`,
      `Raw marked cells: ${rawCells.length}; unique prey -> predator pairs after collapsing the labels the matrix repeats ("na" appears three times, Somateria mollissima and Platichthys flesus twice each): ${uniqueCells.length}.`,
      `Excluded ${placeholderCells.length} links that involve the label "na", which is a placeholder rather than a taxon: it has no row in the archive's own trait table (full_data.csv covers the other ${labels.length} labels) and cannot be given an identity without inventing one.`,
      `Excluded ${selfCells.length} self-links (${selfCells
        .map((cell) => cell.prey)
        .join(', ')}). They cannot be represented as a food-web link between two nodes and the app excludes self-links from analysis.`,
      `Accepted network: ${labels.length} nodes and ${accepted.length} unique feeding links. The converter throws if the matrix is no longer square, if a cell is neither 0 nor 1, or if a link endpoint is missing.`,
      'Node names are the source labels verbatim (originalId); ids are slugged from the label. Trophic roles come from the archive\'s own FeedingMode column: primaryproducer -> producer (documented), grazer -> primary-consumer (documented), suspension-feeder -> primary-consumer (inferred), predator and predator/scavenger -> secondary-consumer (inferred). Labels without a FeedingMode keep roleEvidence "unknown".',
      'ythan_feeding_modes.csv is a verbatim extract of the full_data.csv rows with Network=ythanjacob, restricted to the columns this converter uses; regenerate it with --full-data <path to full_data.csv>.',
      'Ecosystem category: the source paper and Dryad record present the six webs as marine food webs; the Ythan is tidal estuarine. The app therefore files it under marine and says so here rather than describing it as open-coast marine.',
    ],
    validationStatus: 'research-verified',
    retrievedOn: '2026-10-18',
  },
  nodes,
  edges,
}

writeDatasetModule({
  outPath: join(here, 'MAR-YTHAN-1.ts'),
  exportName: 'MAR_YTHAN_1',
  title: 'MAR-YTHAN-1 — Ythan Estuary food web',
  headerLines: [
    'Generated by convert-mar-ythan.mjs from source-mar-ythan/{ythan_spnames.csv,ythan_feeding_modes.csv},',
    'which come from Dryad doi:10.5061/dryad.1mv20r6 (ythan_spnames.csv verbatim;',
    'ythan_feeding_modes.csv extracted from full_data.csv rows with Network=ythanjacob).',
  ],
  dataset,
})

report('MAR-YTHAN-1', [
  `matrix:            ${rowLabels.length} prey rows x ${predatorLabels.length} predator columns`,
  `raw marked cells:  ${rawCells.length}`,
  `unique pairs:      ${uniqueCells.length} (duplicate labels collapsed: ${duplicateLabels.length})`,
  `excluded:          ${placeholderCells.length} links involving "na"; ${selfCells.length} self-links`,
  `accepted:          ${labels.length} nodes, ${edges.length} links`,
  `trait rows used:   ${traits.rows.length}`,
  `no trait row:      ${labels.filter((label) => !traitByLabel.has(label)).length}`,
])
