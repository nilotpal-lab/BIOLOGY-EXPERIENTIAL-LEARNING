import type {
  FoodWebDataset,
  FoodWebEdge,
  FoodWebGraph,
  FoodWebNode,
  ValidationIssue,
} from './types'

/* ============================================================================
 * graphModel — one shared, testable representation of a food web.
 *
 * All algorithms read from this structure and key off stable node ids, never
 * off display labels or the visual layout (Master Build Prompt §7, §15.1).
 * The baseline graph is treated as immutable: nothing in this module mutates a
 * dataset, and callers express scenarios as *sets of removed node ids*.
 * ========================================================================== */

/** Deterministic edge id so duplicate edges collapse onto the same identity. */
export function makeEdgeId(source: string, target: string): string {
  return `e:${source}->${target}`
}

/** Build the indexed graph model from a dataset. Does not mutate the input. */
export function buildGraph(dataset: FoodWebDataset): FoodWebGraph {
  const nodeById = new Map<string, FoodWebNode>()
  for (const node of dataset.nodes) {
    // First definition wins; validation reports duplicates separately.
    if (!nodeById.has(node.id)) nodeById.set(node.id, node)
  }

  const foodSourcesOf = new Map<string, string[]>()
  const consumersOf = new Map<string, string[]>()
  const edgeIdsOf = new Map<string, string[]>()

  for (const id of nodeById.keys()) {
    foodSourcesOf.set(id, [])
    consumersOf.set(id, [])
    edgeIdsOf.set(id, [])
  }

  const edges: FoodWebEdge[] = []
  for (const edge of dataset.edges) {
    const hasSource = nodeById.has(edge.source)
    const hasTarget = nodeById.has(edge.target)
    // A graph model can only hold edges whose endpoints exist. Dangling edges
    // are reported by validateGraphIntegrity and blocked at import time.
    if (!hasSource || !hasTarget) continue

    edges.push(edge)
    foodSourcesOf.get(edge.target)?.push(edge.source)
    consumersOf.get(edge.source)?.push(edge.target)
    edgeIdsOf.get(edge.source)?.push(edge.id)
    if (edge.target !== edge.source) edgeIdsOf.get(edge.target)?.push(edge.id)
  }

  return {
    datasetId: dataset.id,
    nodes: [...nodeById.values()],
    edges,
    nodeById,
    foodSourcesOf,
    consumersOf,
    edgeIdsOf,
  }
}

/** Baseline number of recorded food-source links for a node. */
export function baselineIncomingCount(graph: FoodWebGraph, nodeId: string): number {
  return graph.foodSourcesOf.get(nodeId)?.length ?? 0
}

/** Nodes that survive a scenario, in stable dataset order. */
export function survivingNodes(graph: FoodWebGraph, removed: ReadonlySet<string>): FoodWebNode[] {
  return graph.nodes.filter((node) => !removed.has(node.id))
}

/**
 * Edges that survive a scenario: an edge exists only while BOTH its endpoints
 * exist. Removing a node therefore deletes every link where it is the source
 * *or* the target (Prompt §7.2, §8 step 5).
 */
export function survivingEdges(graph: FoodWebGraph, removed: ReadonlySet<string>): FoodWebEdge[] {
  if (removed.size === 0) return graph.edges
  return graph.edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
}

/** Nodes with no recorded links at all, in either direction. */
export function isolatedNodeIds(graph: FoodWebGraph): string[] {
  return graph.nodes
    .filter(
      (node) =>
        (graph.foodSourcesOf.get(node.id)?.length ?? 0) === 0 &&
        (graph.consumersOf.get(node.id)?.length ?? 0) === 0,
    )
    .map((node) => node.id)
}

/**
 * Recorded food sources still present in a scenario for a given consumer.
 * If the consumer itself is removed, it has none.
 */
export function remainingFoodSourceIds(
  graph: FoodWebGraph,
  nodeId: string,
  removed: ReadonlySet<string>,
): string[] {
  if (removed.has(nodeId)) return []
  return (graph.foodSourcesOf.get(nodeId) ?? []).filter((sourceId) => !removed.has(sourceId))
}

/** Human-readable label for a node id, falling back to the id itself. */
export function labelOf(graph: FoodWebGraph, nodeId: string): string {
  return graph.nodeById.get(nodeId)?.name ?? nodeId
}

/* -------------------------------------------------------------------------- */
/* Integrity checking                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Structural problems in a dataset. Used both by the import validator and by
 * the demo-data self-check so shipped data cannot silently be broken.
 */
export function validateGraphIntegrity(dataset: FoodWebDataset): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (dataset.nodes.length === 0) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_NETWORK',
      message: 'The dataset contains zero nodes, so there is no network to analyse.',
    })
  }

  const seen = new Set<string>()
  for (const node of dataset.nodes) {
    if (!node.id) {
      issues.push({
        severity: 'error',
        code: 'MISSING_ID',
        message: `Node "${node.name || '(unnamed)'}" has no id.`,
      })
      continue
    }
    if (seen.has(node.id)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node id "${node.id}". Node ids must be unique.`,
        nodeId: node.id,
      })
    }
    seen.add(node.id)
    if (!node.name || !node.name.trim()) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_NAME',
        message: `Node "${node.id}" has an empty name.`,
        nodeId: node.id,
      })
    }
  }

  const seenEdges = new Set<string>()
  for (const edge of dataset.edges) {
    if (!seen.has(edge.source)) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_EDGE_SOURCE',
        message: `Link "${edge.source} -> ${edge.target}" refers to an undefined food-source node "${edge.source}".`,
        edgeId: edge.id,
        fixable: true,
      })
    }
    if (!seen.has(edge.target)) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_EDGE_TARGET',
        message: `Link "${edge.source} -> ${edge.target}" refers to an undefined consumer node "${edge.target}".`,
        edgeId: edge.id,
        fixable: true,
      })
    }
    if (edge.source === edge.target) {
      issues.push({
        severity: 'warning',
        code: 'SELF_LINK',
        message: `Self-link "${edge.source} -> ${edge.target}" found.`,
        edgeId: edge.id,
        fixable: true,
      })
    }
    const key = makeEdgeId(edge.source, edge.target)
    if (seenEdges.has(key)) {
      issues.push({
        severity: 'warning',
        code: 'DUPLICATE_EDGE',
        message: `Duplicate link "${edge.source} -> ${edge.target}".`,
        edgeId: key,
        fixable: true,
      })
    }
    seenEdges.add(key)
  }

  if (dataset.nodes.length > 0 && dataset.edges.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'NO_LINKS',
      message:
        'The dataset has nodes but no feeding links. Structural metrics such as connectance and link loss are limited or not applicable.',
    })
  }

  for (const nodeId of isolatedNodeIds(buildGraph(dataset))) {
    issues.push({
      severity: 'info',
      code: 'ISOLATED_NODE',
      message: `Node "${nodeId}" has no recorded links in this dataset. It is preserved rather than discarded.`,
      nodeId,
    })
  }

  return issues
}
