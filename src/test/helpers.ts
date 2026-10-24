import { buildEdges } from '../data/datasetBuilders'
import type { FoodWebDataset, FoodWebNode, RoleProvenance, TrophicRole } from '../core/types'

/** Small dataset builder for tests — keeps every test readable and explicit. */
export function testNode(
  id: string,
  role: TrophicRole,
  overrides: Partial<FoodWebNode> = {},
): FoodWebNode {
  const evidence: RoleProvenance = role === 'producer' || role === 'basal-group' ? 'documented' : 'documented'
  return {
    id,
    name: overrides.name ?? id,
    scientificName: null,
    nodeType: 'species',
    trophicRole: role,
    roleEvidence: evidence,
    description: '',
    iconKey: 'fallback',
    habitat: null,
    sourceNote: null,
    originalId: null,
    ...overrides,
  }
}

export function testDataset(
  id: string,
  nodes: FoodWebNode[],
  edges: readonly (readonly [string, string])[],
): FoodWebDataset {
  return {
    id,
    name: `Test dataset ${id}`,
    ecosystem: 'freshwater',
    summary: 'Test fixture',
    isDemo: true,
    sourceStatus: 'illustrative-demo',
    provenance: {
      origin: 'test',
      citation: 'test fixture',
      sourceUrl: null,
      license: null,
      version: '1',
      nodeUnit: 'individual species',
      cleaningNotes: [],
      validationStatus: 'illustrative-demo',
      retrievedOn: null,
    },
    nodes,
    edges: buildEdges(edges),
  }
}
