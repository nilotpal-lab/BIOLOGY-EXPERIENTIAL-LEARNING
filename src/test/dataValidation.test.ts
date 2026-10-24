import { describe, expect, it } from 'vitest'
import { buildGraph } from '../core/graphModel'
import { countIssues, importFromCsv, importFromJson, importNetwork } from '../core/dataValidation'
import { validateGraphIntegrity } from '../core/graphModel'

/* ============================================================================
 * Import validation (Master Build Prompt §6.3, §11 Cases 10, 11, 12, 20).
 * ========================================================================== */

const NODES_CSV = [
  'id,name,scientific_name,node_type,trophic_role,description,icon_key',
  'algae,Algae,,species,producer,Basal producer,algae',
  'zooplankton,Zooplankton,,trophic-group,primary-consumer,Grazer,zooplankton',
  'minnow,Minnow,,species,secondary-consumer,Small fish,minnow',
].join('\n')

const EDGES_CSV = [
  'source,target,relationship,source_note',
  'algae,zooplankton,grazing,field note',
  'zooplankton,minnow,predation,field note',
].join('\n')

describe('successful CSV import', () => {
  it('parses nodes and links and preserves the source -> consumer direction', () => {
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: EDGES_CSV,
      fileName: 'pond.csv',
      datasetName: 'Pond import',
      ecosystem: 'freshwater',
      citation: 'Example et al. 2020',
      origin: 'Example journal',
    })

    expect(preview.blocked).toBe(false)
    expect(preview.dataset).not.toBeNull()
    const dataset = preview.dataset!
    expect(dataset.nodes).toHaveLength(3)
    expect(dataset.edges).toHaveLength(2)
    expect(dataset.edges[0]).toMatchObject({ source: 'algae', target: 'zooplankton' })
    expect(dataset.edges[0].relationship).toBe('grazing')
    expect(dataset.edges[0].id).toBe('e:algae->zooplankton')

    const graph = buildGraph(dataset)
    expect(graph.foodSourcesOf.get('zooplankton')).toEqual(['algae'])
    expect(graph.consumersOf.get('algae')).toEqual(['zooplankton'])
    expect(validateGraphIntegrity(dataset).some((issue) => issue.severity === 'error')).toBe(false)
  })

  it('records the provenance and never claims the import is verified', () => {
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: EDGES_CSV,
      citation: 'Example et al. 2020',
      origin: 'Example journal',
      license: 'CC-BY-4.0',
    })
    const dataset = preview.dataset!
    expect(dataset.provenance.validationStatus).toBe('research-provided-validation-pending')
    expect(dataset.provenance.validationStatus).not.toBe('research-verified')
    expect(dataset.provenance.cleaningNotes.join(' ')).toMatch(/never changes a dataset to "Research source verified"/)
  })

  it('marks a dataset with no citation as research-pending, not verified', () => {
    const preview = importFromCsv({ nodesText: NODES_CSV, edgesText: EDGES_CSV })
    expect(preview.dataset?.provenance.validationStatus).toBe('research-pending')
    expect(
      preview.issues.some((issue) => issue.code === 'MISSING_CITATION' && issue.severity === 'warning'),
    ).toBe(true)
  })

  it('reports how many duplicate links were removed', () => {
    const duplicateEdges = [EDGES_CSV, 'algae,zooplankton,grazing,duplicate row'].join('\n')
    const preview = importFromCsv({ nodesText: NODES_CSV, edgesText: duplicateEdges })

    expect(preview.blocked).toBe(false)
    expect(preview.dataset?.edges).toHaveLength(2)
    expect(preview.report?.duplicateEdgesRemoved).toBe(1)
    expect(preview.issues.some((issue) => issue.code === 'DUPLICATE_EDGE')).toBe(true)
    expect(preview.report?.inferredMetadata.join(' ')).toMatch(/deduplication policy/)
  })

  it('excludes self-links from the primary analysis and documents the exclusion', () => {
    const withSelfLink = [EDGES_CSV, 'minnow,minnow,predation,self link'].join('\n')
    const preview = importFromCsv({ nodesText: NODES_CSV, edgesText: withSelfLink })

    expect(preview.blocked).toBe(false)
    expect(preview.dataset?.edges).toHaveLength(2)
    expect(preview.report?.selfLinksExcluded).toBe(1)
    expect(preview.issues.some((issue) => issue.code === 'SELF_LINK')).toBe(true)
    expect(preview.report?.inferredMetadata.join(' ')).toMatch(/self-link\(s\) were excluded/)
  })
})

describe('blocking validation rules', () => {
  it('blocks a missing required column and names it', () => {
    const nodesWithoutName = [
      'id,trophic_role',
      'algae,producer',
    ].join('\n')
    const preview = importFromCsv({ nodesText: nodesWithoutName, edgesText: EDGES_CSV })
    expect(preview.blocked).toBe(true)
    const issue = preview.issues.find((entry) => entry.code === 'MISSING_COLUMNS')
    expect(issue?.message).toMatch(/name/)
    expect(preview.dataset).toBeNull()
  })

  it('blocks links that reference an undefined node instead of dropping them silently', () => {
    const badEdges = ['source,target', 'algae,zooplankton', 'unknown_fish,minnow'].join('\n')
    const preview = importFromCsv({ nodesText: NODES_CSV, edgesText: badEdges })

    expect(preview.blocked).toBe(true)
    const issue = preview.issues.find((entry) => entry.code === 'UNKNOWN_EDGE_ENDPOINT')
    expect(issue?.severity).toBe('error')
    expect(issue?.message).toMatch(/unknown_fish/)
    expect(issue?.fixable).toBe(true)
  })

  it('excludes invalid links only when the user explicitly chooses to', () => {
    const badEdges = ['source,target', 'algae,zooplankton', 'unknown_fish,minnow'].join('\n')
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: badEdges,
      options: { invalidEdgePolicy: 'exclude' },
    })

    expect(preview.blocked).toBe(false)
    expect(preview.report?.invalidEdgesExcluded).toBe(1)
    expect(preview.dataset?.edges).toHaveLength(1)
    expect(preview.issues.some((issue) => issue.code === 'UNKNOWN_EDGE_ENDPOINT_EXCLUDED')).toBe(true)
  })

  it('blocks duplicate node ids until the user keeps the first record', () => {
    const duplicateNodes = [
      'id,name,trophic_role',
      'algae,Algae,producer',
      'algae,Algae again,producer',
      'zooplankton,Zooplankton,primary-consumer',
    ].join('\n')
    const edges = ['source,target', 'algae,zooplankton'].join('\n')

    const blocked = importFromCsv({ nodesText: duplicateNodes, edgesText: edges })
    expect(blocked.blocked).toBe(true)
    expect(blocked.issues.some((issue) => issue.code === 'DUPLICATE_NODE_ID')).toBe(true)

    const repaired = importFromCsv({
      nodesText: duplicateNodes,
      edgesText: edges,
      options: { duplicateNodePolicy: 'keep-first' },
    })
    expect(repaired.blocked).toBe(false)
    expect(repaired.dataset?.nodes).toHaveLength(2)
    expect(repaired.dataset?.nodes[0].name).toBe('Algae')
  })

  it('reports empty files', () => {
    expect(importFromCsv({ nodesText: '', edgesText: EDGES_CSV }).blocked).toBe(true)
    expect(importFromCsv({ nodesText: NODES_CSV, edgesText: '   ' }).blocked).toBe(true)

    const headerOnly = importFromCsv({
      nodesText: 'id,name',
      edgesText: 'source,target',
    })
    expect(headerOnly.blocked).toBe(true)
    expect(headerOnly.issues.some((issue) => issue.code === 'EMPTY_FILE')).toBe(true)
  })

  it('rejects unsupported file extensions', () => {
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: EDGES_CSV,
      fileName: 'network.xlsx',
    })
    expect(preview.blocked).toBe(true)
    expect(preview.issues.some((issue) => issue.code === 'UNSUPPORTED_FILE_TYPE')).toBe(true)
  })

  it('warns about a large dataset instead of freezing silently', () => {
    const header = 'id,name,trophic_role'
    const rows = Array.from({ length: 2100 }, (_, index) => `n${index},Node ${index},producer`)
    const preview = importFromCsv({
      nodesText: [header, ...rows].join('\n'),
      edgesText: 'source,target',
    })
    expect(preview.issues.some((issue) => issue.code === 'LARGE_DATASET')).toBe(true)
  })
})

describe('malformed input never replaces the current dataset', () => {
  it('returns no dataset for malformed JSON', () => {
    const preview = importFromJson({ jsonText: '{ "nodes": [ ', fileName: 'broken.json' })
    expect(preview.blocked).toBe(true)
    expect(preview.dataset).toBeNull()
    expect(preview.issues.some((issue) => issue.code === 'MALFORMED_JSON')).toBe(true)
  })

  it('explains the expected JSON shape and never leaks a stack trace', () => {
    const preview = importFromJson({ jsonText: JSON.stringify({ items: [] }) })
    expect(preview.blocked).toBe(true)
    const issue = preview.issues.find((entry) => entry.code === 'MISSING_COLLECTIONS')
    expect(issue?.message).toMatch(/"nodes" and an array named "edges"/)
    for (const entry of preview.issues) {
      expect(entry.message).not.toMatch(/at Object\.|node_modules/)
    }
  })

  it('handles malformed CSV rows without crashing', () => {
    const preview = importFromCsv({
      nodesText: 'id,name,trophic_role\n"unterminated,Algae,producer',
      edgesText: EDGES_CSV,
    })
    expect(preview.blocked).toBe(true)
    expect(preview.issues.length).toBeGreaterThan(0)
    for (const entry of preview.issues) {
      expect(entry.message).not.toMatch(/TypeError|undefined is not/)
    }
  })
})

describe('JSON network import', () => {
  const json = JSON.stringify({
    name: 'Woodland network',
    ecosystem: 'terrestrial',
    provenance: {
      citation: 'Example citation',
      origin: 'Example repository',
      source_url: 'https://example.org/data',
      license: 'CC0',
      node_unit: 'trophic groups',
    },
    nodes: [
      { id: 'oak', name: 'Oak', trophic_role: 'producer', icon_key: 'oak' },
      { id: 'aphid', name: 'Aphid', trophic_role: 'primary-consumer', icon_key: 'aphid' },
      { id: 'ladybird', name: 'Ladybird', trophic_role: 'secondary-consumer', icon_key: 'beetle' },
    ],
    edges: [
      { source: 'oak', target: 'aphid' },
      { source: 'aphid', target: 'ladybird' },
    ],
  })

  it('accepts a documented JSON network and reads its provenance block', () => {
    const preview = importFromJson({ jsonText: json, fileName: 'woodland.json' })
    expect(preview.blocked).toBe(false)
    const dataset = preview.dataset!
    expect(dataset.name).toBe('Woodland network')
    expect(dataset.ecosystem).toBe('terrestrial')
    expect(dataset.provenance.citation).toBe('Example citation')
    expect(dataset.provenance.sourceUrl).toBe('https://example.org/data')
    expect(dataset.provenance.nodeUnit).toBe('trophic groups')
    expect(dataset.nodes).toHaveLength(3)
    expect(dataset.edges).toHaveLength(2)
  })

  it('dispatches on file type through importNetwork', () => {
    expect(importNetwork({ jsonText: json, fileName: 'a.json' }).blocked).toBe(false)
    expect(
      importNetwork({ nodesText: NODES_CSV, edgesText: EDGES_CSV, fileName: 'a.csv' }).blocked,
    ).toBe(false)
  })
})

describe('role normalisation', () => {
  it('stores an unrecognised role as "other" with unknown evidence and warns', () => {
    const nodes = [
      'id,name,trophic_role',
      'plant,Plant,producer',
      'animal,Animal,consumer',
    ].join('\n')
    const edges = ['source,target', 'plant,animal'].join('\n')

    const preview = importFromCsv({ nodesText: nodes, edgesText: edges })
    const animal = preview.dataset?.nodes.find((node) => node.id === 'animal')
    expect(animal?.trophicRole).toBe('other')
    expect(animal?.roleEvidence).toBe('unknown')
    expect(preview.issues.some((issue) => issue.code === 'ROLE_NORMALISED')).toBe(true)
  })

  it('normalises a spaced role and marks it as inferred rather than documented', () => {
    const nodes = ['id,name,trophic_role', 'a,A,primary consumer', 'p,P,producer'].join('\n')
    const edges = ['source,target', 'p,a'].join('\n')
    const preview = importFromCsv({ nodesText: nodes, edgesText: edges })
    const node = preview.dataset?.nodes.find((entry) => entry.id === 'a')
    expect(node?.trophicRole).toBe('primary-consumer')
    expect(node?.roleEvidence).toBe('inferred')
  })
})

describe('cleaning report', () => {
  it('summarises input, accepted, deduplicated and excluded records', () => {
    const nodes = [
      'id,name,trophic_role,icon_key',
      'algae,Algae,producer,algae',
      'zooplankton,Zooplankton,primary-consumer,zooplankton',
      'minnow,Minnow,secondary-consumer,minnow',
    ].join('\n')
    const edges = [
      'source,target',
      'algae,zooplankton',
      'algae,zooplankton',
      'minnow,minnow',
      'zooplankton,minnow',
      'ghost,minnow',
    ].join('\n')

    const preview = importFromCsv({
      nodesText: nodes,
      edgesText: edges,
      options: { invalidEdgePolicy: 'exclude' },
    })

    expect(preview.report).toMatchObject({
      inputNodeCount: 3,
      inputEdgeCount: 5,
      acceptedNodeCount: 3,
      acceptedEdgeCount: 2,
      duplicateEdgesRemoved: 1,
      selfLinksExcluded: 1,
      invalidEdgesExcluded: 1,
    })
    expect(preview.report?.outstandingWarnings.length).toBeGreaterThan(0)
  })

  it('counts issues by severity for the dialog header', () => {
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: ['source,target', 'algae,unknown'].join('\n'),
    })
    const counts = countIssues(preview.issues)
    expect(counts.errors).toBeGreaterThan(0)
  })
})

describe('nodes but no links', () => {
  it('accepts the import but explains that structural analysis is limited', () => {
    const preview = importFromCsv({
      nodesText: NODES_CSV,
      edgesText: 'source,target',
      citation: 'Example',
      origin: 'Example',
    })
    expect(preview.blocked).toBe(false)
    expect(preview.dataset?.edges).toHaveLength(0)
    expect(preview.issues.some((issue) => issue.code === 'NO_LINKS')).toBe(true)
  })
})
