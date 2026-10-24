import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_DATASETS,
  BUILT_IN_RESEARCH_DATASETS,
  DEMO_LAB_DATASETS,
  RESEARCH_SLOTS,
  RESEARCH_SLOT_SUMMARY,
  getBuiltInDataset,
  loadImportedDatasets,
} from '../data/datasetRegistry'
import { buildGraph, validateGraphIntegrity } from '../core/graphModel'
import { structuralLossEligibility } from '../core/rules'
import type { FoodWebDataset } from '../core/types'

/* ============================================================================
 * Research-dataset integration checks.
 *
 * Every expected node and link set below is re-derived from the committed
 * verbatim source files, not copied from the datasets themselves: the tests
 * parse the archive tables with their documented column semantics and compare
 * the resulting sets with the bundled networks. If a converter drifts, these
 * tests fail.
 * ========================================================================== */

const RESEARCH_DIR = join(process.cwd(), 'src', 'data', 'research')

function edgeKey(source: string, target: string): string {
  return `${source}->${target}`
}

function readText(...parts: string[]): string {
  return readFileSync(join(RESEARCH_DIR, ...parts), 'utf8').replace(/^\uFEFF/, '')
}

function readCsv(...parts: string[]): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(readText(...parts).trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  })
  expect(parsed.errors, `${parts.join('/')} parse errors`).toEqual([])
  return parsed.data
}

function readMatrix(...parts: string[]): string[][] {
  const parsed = Papa.parse<string[]>(readText(...parts).trim(), { skipEmptyLines: 'greedy' })
  expect(parsed.errors, `${parts.join('/')} parse errors`).toEqual([])
  return parsed.data
}

function datasetEdgeSet(dataset: FoodWebDataset): Set<string> {
  return new Set(dataset.edges.map((edge) => edgeKey(edge.source, edge.target)))
}

function idByOriginalId(dataset: FoodWebDataset): Map<string, string> {
  return new Map(dataset.nodes.map((node) => [String(node.originalId), node.id]))
}

function assertStructuralIntegrity(dataset: FoodWebDataset) {
  const ids = dataset.nodes.map((node) => node.id)
  expect(new Set(ids).size, `${dataset.id}: duplicate node ids`).toBe(ids.length)

  const idSet = new Set(ids)
  const seen = new Set<string>()
  for (const edge of dataset.edges) {
    expect(idSet.has(edge.source), `${dataset.id}: edge ${edge.id} has unknown source`).toBe(true)
    expect(idSet.has(edge.target), `${dataset.id}: edge ${edge.id} has unknown target`).toBe(true)
    expect(edge.source, `${dataset.id}: self-link ${edge.id}`).not.toBe(edge.target)
    const key = edgeKey(edge.source, edge.target)
    expect(seen.has(key), `${dataset.id}: duplicate link ${key}`).toBe(false)
    seen.add(key)
  }

  const errors = validateGraphIntegrity(dataset).filter((issue) => issue.severity === 'error')
  expect(errors, `${dataset.id} structural errors`).toEqual([])
}

describe('MAR-TATOOSH-1 against its source matrix', () => {
  const dataset = getBuiltInDataset('MAR-TATOOSH-1')

  it('is bundled and available without any browser storage', () => {
    expect(dataset).toBeDefined()
    expect(BUILT_IN_DATASETS.map((entry) => entry.id)).toContain('MAR-TATOOSH-1')
    expect(loadImportedDatasets()).toEqual([])
    expect(dataset?.sourceStatus).toBe('research-verified')
    expect(dataset?.ecosystem).toBe('marine')
  })

  it('has exactly the feeding links encoded in TatooshTrophic.txt', () => {
    const matrixText = readText('TatooshTrophic.txt')
    const rows = matrixText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim().split(/\s+/).map(Number))

    expect(rows).toHaveLength(110)
    expect(rows.every((row) => row.length === 110)).toBe(true)

    const fromMatrix = new Set<string>()
    rows.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        // +1 means "row eats column": the column is the food source, the row the consumer.
        if (value > 0) fromMatrix.add(edgeKey(`sp-${columnIndex}`, `sp-${rowIndex}`))
      })
    })

    const fromDataset = datasetEdgeSet(dataset!)
    expect(fromMatrix.size).toBe(869)
    expect(fromDataset.size).toBe(869)
    expect([...fromDataset].sort()).toEqual([...fromMatrix].sort())
    expect(dataset!.edges).toHaveLength(869)
  })

  it('keeps 110 unique nodes and honest role evidence', () => {
    expect(dataset!.nodes).toHaveLength(110)
    expect(new Set(dataset!.nodes.map((node) => node.id)).size).toBe(110)
    // The source matrix does not annotate trophic roles.
    expect(dataset!.nodes.every((node) => node.roleEvidence === 'unknown')).toBe(true)
    assertStructuralIntegrity(dataset!)
  })

  it('records the Dryad deposition separately from the related article, with CC0 reuse terms', () => {
    expect(dataset!.provenance.sourceUrl).toContain('10.5061/dryad.39jv1')
    expect(dataset!.provenance.citation).toContain('10.1371/journal.pcbi.1004330')
    expect(dataset!.provenance.license).toContain('CC0 1.0')
    expect(dataset!.provenance.cleaningNotes.length).toBeGreaterThanOrEqual(4)
  })

  it('cascades on edge structure even though every role is inferred', () => {
    const graph = buildGraph(dataset!)
    // A node with a recorded food source is eligible once it loses it, regardless of role evidence.
    const withFood = graph.nodes.find((node) => (graph.foodSourcesOf.get(node.id) ?? []).length > 0)
    expect(withFood).toBeDefined()
    const eligibility = structuralLossEligibility(
      withFood!,
      (graph.foodSourcesOf.get(withFood!.id) ?? []).length,
      0,
    )
    expect(eligibility.eligible).toBe(true)
  })
})

describe('freshwater networks against their committed source tables', () => {
  const cases = [
    {
      id: 'RES-FW-A',
      folder: 'source-fw-pond1',
      pond: 'Pond1',
      code: 'WI1',
      nodes: 11,
      links: 18,
    },
    {
      id: 'RES-FW-B',
      folder: 'source-fw-pond47',
      pond: 'Pond47',
      code: 'C6',
      nodes: 14,
      links: 39,
    },
  ] as const

  it('are bundled as separate freshwater networks with their own provenance', () => {
    for (const entry of cases) {
      const dataset = getBuiltInDataset(entry.id)
      expect(dataset, `${entry.id} is registered`).toBeDefined()
      expect(dataset!.ecosystem).toBe('freshwater')
      expect(dataset!.isDemo).toBe(false)
      expect(dataset!.sourceStatus).toBe('research-verified')
      expect(dataset!.provenance.sourceUrl).toContain('10.5061/dryad.866t1g1zj')
      expect(dataset!.provenance.license).toContain('CC0 1.0')
    }
    // The second freshwater network states that it is a replicate, not an
    // independent ecosystem.
    expect(getBuiltInDataset('RES-FW-B')!.provenance.cleaningNotes.join(' ')).toMatch(/replicate/i)
  })

  it.each(cases)('$id reproduces $pond node and link sets from the source CSVs', (entry) => {
    const dataset = getBuiltInDataset(entry.id)!
    const nodeRows = readCsv(entry.folder, 'nodes.csv')
    const linkRows = readCsv(entry.folder, 'trophic.links.csv')
    const properties = readCsv(entry.folder, 'properties.csv')[0]

    expect(properties.title).toBe(entry.pond)
    expect(properties.Pondcode).toBe(entry.code)

    // Node identity: one node per documented source node, same count.
    const sourceNodeNames = nodeRows.map((row) => row.node).sort()
    expect(sourceNodeNames).toHaveLength(entry.nodes)
    expect([...dataset.nodes.map((node) => String(node.originalId))].sort()).toEqual(sourceNodeNames)
    expect(dataset.nodes.every((node) => node.nodeType === 'trophic-group')).toBe(true)

    // Link set: resource -> consumer, as documented in the archive README.
    const idFor = idByOriginalId(dataset)
    const expected = new Set(
      linkRows.map((row) => {
        const source = idFor.get(row.resource)
        const target = idFor.get(row.consumer)
        expect(source, `resource ${row.resource} exists`).toBeDefined()
        expect(target, `consumer ${row.consumer} exists`).toBeDefined()
        return edgeKey(source!, target!)
      }),
    )
    expect(expected.size).toBe(entry.links)
    expect([...datasetEdgeSet(dataset)].sort()).toEqual([...expected].sort())
    assertStructuralIntegrity(dataset)
  })

  it('keeps documented roles and gives every consumer a recorded food source', () => {
    for (const entry of cases) {
      const dataset = getBuiltInDataset(entry.id)!
      expect(dataset.nodes.every((node) => node.roleEvidence === 'documented')).toBe(true)
      const graph = buildGraph(dataset)
      for (const node of graph.nodes) {
        if (node.trophicRole === 'producer' || node.trophicRole === 'basal-group') continue
        expect(
          (graph.foodSourcesOf.get(node.id) ?? []).length,
          `${dataset.id}: ${node.id} has no recorded food source`,
        ).toBeGreaterThan(0)
      }
    }
  })
})

describe('RES-TER-C against the BCI seed-predation archive', () => {
  const dataset = getBuiltInDataset('RES-TER-C')!

  it('applies the source inclusion flag and accounts for every rejected row', () => {
    const raw = readCsv('source-ter-c', 'Insect+data.csv')
    const included = raw.filter((row) => row.IncludeInFoodWeb.trim().toLowerCase() === 'yes')
    const excluded = raw.filter((row) => {
      const flag = row.IncludeInFoodWeb.trim()
      return flag !== '' && flag.toLowerCase() !== 'yes'
    })
    const blankFlag = raw.filter((row) => row.IncludeInFoodWeb.trim() === '')

    // 471 observed records = 322 accepted + 131 with a stated reason + 18 blank-flag rows.
    expect(raw).toHaveLength(471)
    expect(included).toHaveLength(322)
    expect(excluded).toHaveLength(131)
    expect(blankFlag).toHaveLength(18)
    expect(included.length + excluded.length + blankFlag.length).toBe(raw.length)

    // Every excluded row carries a source reason; the blank-flag rows are the
    // ones missing from the authors' own FW.csv (checked in the converter).
    expect(excluded.every((row) => row.ReasonNotIncluded.trim().length > 0)).toBe(true)
    expect(blankFlag.every((row) => row.ReasonNotIncluded.trim() === '')).toBe(true)
  })

  it('reproduces the exact 322 plant -> insect links from the raw table', () => {
    const raw = readCsv('source-ter-c', 'Insect+data.csv')
    const included = raw.filter((row) => row.IncludeInFoodWeb.trim().toLowerCase() === 'yes')
    const idFor = idByOriginalId(dataset)
    const expected = new Set(
      included.map((row) => {
        const plant = idFor.get(row.Codigo.trim())
        const insect = idFor.get(row.InsectSpCode.trim())
        expect(plant, `plant ${row.Codigo} exists`).toBeDefined()
        expect(insect, `insect ${row.InsectSpCode} exists`).toBeDefined()
        return edgeKey(plant!, insect!)
      }),
    )

    expect(expected.size).toBe(322)
    expect(dataset.edges).toHaveLength(322)
    expect([...datasetEdgeSet(dataset)].sort()).toEqual([...expected].sort())
    assertStructuralIntegrity(dataset)
  })

  it('uses only documented node identities: 141 plants and 254 insects', () => {
    const raw = readCsv('source-ter-c', 'Insect+data.csv')
    const included = raw.filter((row) => row.IncludeInFoodWeb.trim().toLowerCase() === 'yes')
    const plantCodes = new Set(included.map((row) => row.Codigo.trim()))
    const insectCodes = new Set(included.map((row) => row.InsectSpCode.trim()))

    expect(dataset.nodes).toHaveLength(395)
    expect(plantCodes.size).toBe(141)
    expect(insectCodes.size).toBe(254)
    expect(dataset.nodes.filter((node) => node.trophicRole === 'producer')).toHaveLength(141)

    // Plant names and families come from TidyTrait.csv, not from invention.
    const traits = new Map(readCsv('source-ter-c', 'TidyTrait.csv').map((row) => [row.Codigo.trim(), row]))
    for (const node of dataset.nodes.filter((entry) => entry.id.startsWith('C-PLANT'))) {
      const trait = traits.get(String(node.originalId))
      expect(trait, `TidyTrait row for ${node.originalId}`).toBeDefined()
      expect(node.name).toBe(trait!.Plant_species19.replace(/_/g, ' '))
      expect(node.scientificName).toBe(trait!.Plant_species19.replace(/_/g, ' '))
    }

    // Insect names come from the source species column.
    const insectNames = new Map(included.map((row) => [row.InsectSpCode.trim(), row.FullSpeciesNameValid.trim()]))
    for (const node of dataset.nodes.filter((entry) => entry.id.startsWith('C-INSECT'))) {
      expect(node.name).toBe(insectNames.get(String(node.originalId)))
    }
  })

  it('records the dataset and article citations separately, with CC0 reuse terms', () => {
    expect(dataset.sourceStatus).toBe('research-verified')
    expect(dataset.provenance.sourceUrl).toContain('10.5061/dryad.230j5ch')
    expect(dataset.provenance.citation).toContain('10.5061/dryad.230j5ch')
    expect(dataset.provenance.citation).toContain('10.1111/ele.13359')
    expect(dataset.provenance.license).toContain('CC0 1.0')
  })
})

describe('RES-TER-D against the Palmyra Atoll archive', () => {
  const dataset = getBuiltInDataset('RES-TER-D')!

  function sourceRecords() {
    return readCsv('source-ter-d', 'pred_prey_sizes_DNAinteractions.csv')
  }

  it('matches the deposit record counts stated in the archive abstract', () => {
    const records = sourceRecords()
    expect(records).toHaveLength(305)
    expect(new Set(records.map((row) => row.sample)).size).toBe(173)
    expect(new Set(records.map((row) => row.sample_str)).size).toBe(9)
    // Every row is a detected prey; zero-read rows from the rarefied taxonomic
    // table must never be treated as links.
    expect(records.every((row) => Number(row.reads) >= 1)).toBe(true)
  })

  it('reproduces the 98 prey-family -> predator-species links', () => {
    const records = sourceRecords()
    const predatorIds = new Map(readCsv('source-ter-d', 'Predator_IDs.csv').map((row) => [row.sample_str.trim(), row.pred_ID.trim()]))
    const idFor = idByOriginalId(dataset)

    const expected = new Set(
      records.map((row) => {
        const prey = idFor.get(row.Family.trim())
        const predator = idFor.get(predatorIds.get(row.sample_str.trim())!)
        expect(prey, `prey family ${row.Family} exists`).toBeDefined()
        expect(predator, `predator ${predatorIds.get(row.sample_str.trim())} exists`).toBeDefined()
        return edgeKey(prey!, predator!)
      }),
    )

    expect(expected.size).toBe(98)
    expect(dataset.edges).toHaveLength(98)
    expect([...datasetEdgeSet(dataset)].sort()).toEqual([...expected].sort())
    assertStructuralIntegrity(dataset)
  })

  it('has 9 predator species and 48 prey families, and no zero-read contamination', () => {
    expect(dataset.nodes).toHaveLength(57)
    expect(dataset.nodes.filter((node) => node.id.startsWith('DW-PRED'))).toHaveLength(9)
    expect(dataset.nodes.filter((node) => node.id.startsWith('DW-PREY'))).toHaveLength(48)

    const names = new Set(dataset.nodes.map((node) => node.name))
    // These families are rejected by the authors' own final interaction table
    // (they are mammal, bird, fish and parasite taxa). A converter that read the
    // rarefied ASV table instead would add them as prey.
    for (const contaminant of ['Hominidae', 'Muridae', 'Salmonidae', 'Sulidae', 'Oxyuridae']) {
      expect(names.has(contaminant), `${contaminant} must not be a prey node`).toBe(false)
    }
  })

  it('states the correction it applied and keeps an honest citation and licence', () => {
    expect(dataset.sourceStatus).toBe('research-verified')
    expect(dataset.provenance.sourceUrl).toContain('10.25349/D9M038')
    expect(dataset.provenance.citation).toContain('10.1002/ecy.3634')
    expect(dataset.provenance.license).toContain('CC0 1.0')
    expect(dataset.provenance.cleaningNotes.join(' ')).toMatch(/609/)
    expect(dataset.nodes.filter((node) => node.id.startsWith('DW-PREY')).every((node) => node.roleEvidence === 'unknown')).toBe(true)
  })
})

describe('MAR-YTHAN-1 against the Ythan Estuary matrix', () => {
  const dataset = getBuiltInDataset('MAR-YTHAN-1')!

  it('reproduces the network using the documented matrix orientation', () => {
    const matrix = readMatrix('source-mar-ythan', 'ythan_spnames.csv')
    const predators = matrix[0].slice(1)
    const preyRows = matrix.slice(1)

    // Square, same label set on both axes.
    expect(predators).toHaveLength(92)
    expect(preyRows).toHaveLength(92)
    expect([...predators].sort()).toEqual(preyRows.map((row) => row[0]).sort())

    const marked: { prey: string; predator: string }[] = []
    preyRows.forEach((row) => {
      predators.forEach((predator, index) => {
        const value = row[index + 1]
        expect(['0', '1']).toContain(value)
        // Dryad usage notes: first row = predators, first column = prey, 1 = link.
        if (value === '1') marked.push({ prey: row[0], predator })
      })
    })

    const unique = new Map(marked.map((cell) => [edgeKey(cell.prey, cell.predator), cell]))
    expect(marked).toHaveLength(417)
    expect(unique.size).toBe(395)

    const placeholder = [...unique.keys()].filter((key) => key.split('->').includes('na'))
    expect(placeholder).toHaveLength(19)

    const selfLinks = [...unique.values()].filter((cell) => cell.prey === cell.predator)
    expect(selfLinks).toHaveLength(3)

    const idFor = idByOriginalId(dataset)
    const expected = new Set(
      [...unique.values()]
        .filter((cell) => cell.prey !== 'na' && cell.predator !== 'na' && cell.prey !== cell.predator)
        .map((cell) => {
          const source = idFor.get(cell.prey)
          const target = idFor.get(cell.predator)
          expect(source, `prey ${cell.prey} exists`).toBeDefined()
          expect(target, `predator ${cell.predator} exists`).toBeDefined()
          return edgeKey(source!, target!)
        }),
    )

    expect(expected.size).toBe(373)
    expect(dataset.nodes).toHaveLength(87)
    expect(dataset.edges).toHaveLength(373)
    expect([...datasetEdgeSet(dataset)].sort()).toEqual([...expected].sort())
    assertStructuralIntegrity(dataset)
  })

  it('derives roles from the archive trait table and leaves unknown modes unknown', () => {
    const traits = new Map(
      readCsv('source-mar-ythan', 'ythan_feeding_modes.csv').map((row) => [row.Species.trim(), row]),
    )
    expect(traits.size).toBe(87)

    for (const node of dataset.nodes) {
      const trait = traits.get(String(node.originalId))
      expect(trait, `trait row for ${node.originalId}`).toBeDefined()
      const mode = trait!.FeedingMode.trim().toLowerCase()
      if (mode === 'primaryproducer') expect(node.trophicRole).toBe('producer')
      else if (mode === 'grazer') expect(node.trophicRole).toBe('primary-consumer')
      else if (mode === 'predator' || mode === 'predator/scavenger') {
        expect(node.trophicRole).toBe('secondary-consumer')
      }
      if (mode === 'null' || mode === '') {
        expect(node.roleEvidence).toBe('unknown')
        expect(node.trophicRole).toBe('other')
      }
    }
  })

  it('records the marine classification caveat, citation and CC0 reuse terms', () => {
    expect(dataset.ecosystem).toBe('marine')
    expect(dataset.sourceStatus).toBe('research-verified')
    expect(dataset.provenance.sourceUrl).toContain('10.5061/dryad.1mv20r6')
    expect(dataset.provenance.citation).toContain('10.1111/ele.12955')
    expect(dataset.provenance.cleaningNotes.join(' ')).toMatch(/estuarine/i)
    expect(dataset.provenance.license).toContain('CC0 1.0')
  })
})

describe('research slot tracker', () => {
  it('links every bundled slot to a real bundled dataset', () => {
    const bundled = RESEARCH_SLOTS.filter((slot) => slot.bundledDatasetId)
    expect(bundled.map((slot) => slot.slotId).sort()).toEqual([
      'RES-FW-1',
      'RES-FW-2',
      'RES-MAR-1',
      'RES-MAR-2',
      'RES-TER-1',
      'RES-TER-2',
    ])
    for (const slot of bundled) {
      const dataset = getBuiltInDataset(slot.bundledDatasetId!)
      expect(dataset, `${slot.slotId} -> ${slot.bundledDatasetId}`).toBeDefined()
      expect(dataset!.sourceStatus).toBe('research-verified')
      expect(dataset!.ecosystem).toBe(slot.ecosystem)
    }
  })

  it('reports progress from the slot list rather than a hard-coded claim', () => {
    expect(RESEARCH_SLOT_SUMMARY.total).toBe(RESEARCH_SLOTS.length)
    expect(RESEARCH_SLOT_SUMMARY.total).toBe(6)
    expect(RESEARCH_SLOT_SUMMARY.bundled).toBe(6)
    expect(RESEARCH_SLOT_SUMMARY.pending).toBe(0)
    expect(RESEARCH_SLOT_SUMMARY.verified).toBe(6)
    expect(RESEARCH_SLOT_SUMMARY.bundled + RESEARCH_SLOT_SUMMARY.pending).toBe(
      RESEARCH_SLOT_SUMMARY.total,
    )
  })

  it('only marks a dataset verified when its provenance evidence is present', () => {
    for (const dataset of BUILT_IN_RESEARCH_DATASETS) {
      expect(dataset.sourceStatus).toBe('research-verified')
      expect(dataset.provenance.citation.length).toBeGreaterThan(40)
      expect(dataset.provenance.sourceUrl).toMatch(/^https:\/\/doi\.org\//)
      expect(dataset.provenance.license).toBeTruthy()
      expect(dataset.provenance.retrievedOn).toBeTruthy()
      expect(dataset.provenance.cleaningNotes.length).toBeGreaterThanOrEqual(4)
    }
    // Two per ecosystem category, and no duplicates.
    const byEcosystem = { freshwater: 0, terrestrial: 0, marine: 0 }
    for (const dataset of BUILT_IN_RESEARCH_DATASETS) byEcosystem[dataset.ecosystem] += 1
    expect(byEcosystem).toEqual({ freshwater: 2, terrestrial: 2, marine: 2 })
    const ids = BUILT_IN_RESEARCH_DATASETS.map((dataset) => dataset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('illustrative demo datasets are preserved', () => {
  it('still contains exactly the six authored networks, in order', () => {
    expect(DEMO_LAB_DATASETS.map((dataset) => dataset.id)).toEqual([
      'FW-POND-A',
      'FW-LAKE-B',
      'TER-GRASS-A',
      'TER-FOREST-B',
      'MAR-COAST-A',
      'MAR-OPEN-B',
    ])
  })

  it('keeps the authored node and link counts', () => {
    expect(DEMO_LAB_DATASETS.map((dataset) => dataset.nodes.length)).toEqual([12, 13, 14, 15, 13, 12])
    expect(DEMO_LAB_DATASETS.map((dataset) => dataset.edges.length)).toEqual([17, 20, 29, 29, 22, 22])
  })

  it('stays illustrative and separate from the research library', () => {
    for (const dataset of DEMO_LAB_DATASETS) {
      expect(dataset.isDemo).toBe(true)
      expect(dataset.sourceStatus).toBe('illustrative-demo')
      expect(BUILT_IN_RESEARCH_DATASETS.map((entry) => entry.id)).not.toContain(dataset.id)
      assertStructuralIntegrity(dataset)
    }
  })

  it('is not mutated by reading research datasets', () => {
    const before = JSON.stringify(DEMO_LAB_DATASETS)
    for (const dataset of BUILT_IN_RESEARCH_DATASETS) buildGraph(dataset)
    expect(JSON.stringify(DEMO_LAB_DATASETS)).toBe(before)
  })
})
