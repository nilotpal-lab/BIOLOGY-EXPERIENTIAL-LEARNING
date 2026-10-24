/**
 * pondConversion.mjs — shared conversion logic for the shallow-lake mesocosm
 * food webs in Dryad doi:10.5061/dryad.866t1g1zj.
 *
 * The archive ships one folder per mesocosm pond
 * (FoodwebMetadata/communities/PondN/{nodes,properties,trophic.links}.csv) plus
 * eight treatment-summed webs (Ponds_C, Ponds_W, ...). Only individual pond
 * folders are converted here: a summed web aggregates the same ponds and is not
 * another network.
 *
 * Documented source semantics (archive README + Dryad usage notes):
 *   - nodes.csv `node` = a group of organisms in the food web, not a species
 *   - trophic.links.csv `resource` = "the food for the consumer",
 *     `consumer` = "the consumer of the food"  → direction resource → consumer
 *   - properties.csv carries the pond code and the three treatment flags
 */
import { join } from 'node:path'
import { readTable, slug } from './sourceUtils.mjs'

/** App role vocabulary, mapped from the source's documented columns. */
function mapRole(row) {
  const functional = String(row['functional.group'] ?? '').toLowerCase()
  const category = String(row.category ?? '').toLowerCase()
  if (functional === 'producer' || category === 'producer') return 'producer'
  if (functional === 'herbivore') return 'primary-consumer'
  if (functional === 'omnivore') return 'omnivore'
  if (functional === 'carnivore' || functional === 'predator') return 'secondary-consumer'
  if (functional === 'detritivore' || functional === 'decomposer') return 'decomposer'
  return 'other'
}

function iconKeyFor(row, role) {
  if (role === 'producer') return 'algae'
  if (String(row.node).toLowerCase().includes('carp')) return 'fish'
  return 'invertebrate'
}

/**
 * Build a FoodWebDataset from one pond folder.
 *
 * @param {object} options
 * @param {string} options.sourceDir  folder holding the three committed CSVs
 * @param {string} options.idPrefix   node id prefix, e.g. 'fw-a'
 * @param {string} options.pondFolder documented community folder, e.g. 'Pond1'
 */
export function buildPondDataset({ sourceDir, idPrefix, pondFolder }) {
  const nodesSource = readTable(join(sourceDir, 'nodes.csv'))
  const linksSource = readTable(join(sourceDir, 'trophic.links.csv'))
  const propertiesSource = readTable(join(sourceDir, 'properties.csv'))

  for (const column of ['node', 'functional.group', 'category']) {
    if (!nodesSource.header.includes(column)) {
      throw new Error(`nodes.csv is missing the documented "${column}" column`)
    }
  }
  for (const column of ['resource', 'consumer']) {
    if (!linksSource.header.includes(column)) {
      throw new Error(`trophic.links.csv is missing the documented "${column}" column`)
    }
  }

  const nodeIds = new Map()
  for (const row of nodesSource.rows) {
    if (!row.node) throw new Error('nodes.csv contains an empty node name')
    if (nodeIds.has(row.node)) throw new Error(`duplicate node name in source: ${row.node}`)
    nodeIds.set(row.node, `${idPrefix}-${slug(row.node)}`)
  }

  const properties = propertiesSource.rows[0] ?? {}
  const pondLabel = properties.title || pondFolder
  const treatment = [
    properties.Temp === 'W' ? 'heated' : 'ambient temperature',
    properties.Eutroph === 'N' || properties.Eutroph === 'E'
      ? 'nutrient-enriched'
      : 'no nutrient addition',
    properties.Pesticide === 'I' ? 'insecticide-treated' : 'no insecticide',
  ].join(', ')

  const nodes = nodesSource.rows.map((row) => {
    const role = mapRole(row)
    const mass = row.M ? `mean body mass ${row.M} g` : 'mean body mass not reported'
    const abundance = row.N ? `abundance ${row.N} per mesocosm` : 'abundance not reported'
    return {
      id: nodeIds.get(row.node),
      name: row.node.replace(/_/g, ' '),
      scientificName: null,
      nodeType: 'trophic-group',
      trophicRole: role,
      roleEvidence: 'documented',
      description: `${row['functional.group']} (${row.category}) in the ${pondLabel} shallow-lake mesocosm.`,
      iconKey: iconKeyFor(row, role),
      habitat: 'shallow-lake mesocosm',
      sourceNote: `Source row: node=${row.node}; category=${row.category}; functional.group=${row['functional.group']}; ${mass}; ${abundance}; total biomass ${row.Totalbiomass || 'not reported'}.`,
      originalId: row.node,
    }
  })

  const seen = new Set()
  const edges = []
  for (const row of linksSource.rows) {
    if (!row.resource || !row.consumer) {
      throw new Error(`trophic.links.csv row is missing an endpoint: ${JSON.stringify(row)}`)
    }
    if (!nodeIds.has(row.resource)) throw new Error(`link resource not in nodes.csv: ${row.resource}`)
    if (!nodeIds.has(row.consumer)) throw new Error(`link consumer not in nodes.csv: ${row.consumer}`)
    const source = nodeIds.get(row.resource)
    const target = nodeIds.get(row.consumer)
    if (source === target) throw new Error(`self-link in source: ${row.resource}`)
    const key = `${source}->${target}`
    if (seen.has(key)) throw new Error(`duplicate link in source: ${key}`)
    seen.add(key)
    edges.push({ id: `e:${source}->${target}`, source, target, relationship: 'feeding' })
  }

  return {
    dataset: { pondLabel, pondCode: properties.Pondcode ?? 'unknown code', treatment, nodes, edges },
    counts: {
      rawNodeRows: nodesSource.rows.length,
      acceptedNodes: nodes.length,
      rawLinkRows: linksSource.rows.length,
      acceptedLinks: edges.length,
    },
  }
}
