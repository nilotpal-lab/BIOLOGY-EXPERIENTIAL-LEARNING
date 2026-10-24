import type { FoodWebGraph } from './types'

/* ============================================================================
 * layout — a deterministic, scientifically meaningful graph layout.
 *
 * Nodes are placed in rows by trophic level: recorded producers and basal
 * groups at the bottom, apex predators at the top. The layout uses stable node
 * ids and labels only, never randomness, so a scenario never needlessly
 * rearranges the network and the same dataset always looks the same
 * (Master Build Prompt §3.4, §19).
 * ========================================================================== */

export interface LayoutPosition {
  x: number
  y: number
}

export interface GraphLayout {
  positions: Map<string, LayoutPosition>
  levels: Map<string, number>
  maxLevel: number
}

/**
 * Longest-path trophic level: a node's level is one more than the deepest
 * recorded food source, capped at the node count so a cyclic or aggregated
 * network can never loop forever (Prompt §11 Case 13).
 */
export function computeTrophicLevels(graph: FoodWebGraph): Map<string, number> {
  const levels = new Map<string, number>()
  for (const node of graph.nodes) levels.set(node.id, 0)

  const iterations = graph.nodes.length + 2
  for (let pass = 0; pass < iterations; pass += 1) {
    let changed = false
    for (const edge of graph.edges) {
      const sourceLevel = levels.get(edge.source)
      const targetLevel = levels.get(edge.target)
      if (sourceLevel === undefined || targetLevel === undefined) continue
      const candidate = Math.min(sourceLevel + 1, graph.nodes.length)
      if (candidate > targetLevel) {
        levels.set(edge.target, candidate)
        changed = true
      }
    }
    if (!changed) break
  }

  return levels
}

export interface LayoutOptions {
  rowHeight?: number
  columnWidth?: number
}

/**
 * Layered layout with one barycentre pass to reduce obvious edge crossings
 * while staying fully deterministic.
 */
export function computeLayeredLayout(
  graph: FoodWebGraph,
  options: LayoutOptions = {},
): GraphLayout {
  const rowHeight = options.rowHeight ?? 118
  const columnWidth = options.columnWidth ?? 116

  const levels = computeTrophicLevels(graph)
  const maxLevel = graph.nodes.reduce((max, node) => Math.max(max, levels.get(node.id) ?? 0), 0)

  const byLevel: string[][] = Array.from({ length: maxLevel + 1 }, () => [])
  for (const node of graph.nodes) {
    byLevel[levels.get(node.id) ?? 0].push(node.id)
  }

  const labelOf = (id: string) => graph.nodeById.get(id)?.name ?? id
  const compare = (a: string, b: string) =>
    labelOf(a).localeCompare(labelOf(b), 'en', { sensitivity: 'base' }) || a.localeCompare(b)

  // Deterministic starting order.
  for (const row of byLevel) row.sort(compare)

  // One barycentre pass: order each row by the average position of its food
  // sources in the row below, which pulls each consumer under its prey.
  for (let level = 1; level <= maxLevel; level += 1) {
    const below = byLevel[level - 1]
    const indexBelow = new Map(below.map((id, index) => [id, index]))
    const barycentre = new Map<string, number>()
    for (const id of byLevel[level]) {
      const sources = graph.foodSourcesOf.get(id) ?? []
      const indices = sources
        .map((source) => indexBelow.get(source))
        .filter((value): value is number => value !== undefined)
      barycentre.set(
        id,
        indices.length ? indices.reduce((sum, value) => sum + value, 0) / indices.length : Number.NaN,
      )
    }
    byLevel[level].sort((a, b) => {
      const ba = barycentre.get(a)
      const bb = barycentre.get(b)
      const aMissing = ba === undefined || Number.isNaN(ba)
      const bMissing = bb === undefined || Number.isNaN(bb)
      if (aMissing && bMissing) return compare(a, b)
      if (aMissing) return -1
      if (bMissing) return 1
      if (ba !== bb) return ba - bb
      return compare(a, b)
    })
  }

  const positions = new Map<string, LayoutPosition>()
  const step = Math.max(64, columnWidth)
  byLevel.forEach((row, level) => {
    row.forEach((id, index) => {
      positions.set(id, {
        x: (index - (row.length - 1) / 2) * step,
        y: (maxLevel - level) * rowHeight,
      })
    })
  })

  return { positions, levels, maxLevel }
}

/** Short description of the layout used, for the graph legend. */
export function describeLayout(layout: GraphLayout): string {
  return `${layout.maxLevel + 1} trophic level(s), highest recorded level at the top`
}
