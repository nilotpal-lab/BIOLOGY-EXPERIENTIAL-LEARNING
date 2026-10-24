import { baselineIncomingCount, remainingFoodSourceIds, survivingEdges, survivingNodes } from './graphModel'
import type { BaselineMetrics, FoodWebGraph, MetricValue, ScenarioMetrics } from './types'

/* ============================================================================
 * metrics — every definition from the Master Build Prompt, Part 7, in one place.
 *
 * All values are computed from the underlying graph data, never from the visual
 * layout or the displayed labels. Percentages are returned as full numbers
 * (33.333…), and rounded only for display.
 * ========================================================================== */

/** Exact explanations shown wherever a metric legitimately has no value. */
export const NOT_APPLICABLE = {
  linkLossNoBaselineLinks:
    'Not applicable — the baseline network has no feeding links, so there is no link loss to express as a percentage.',
  connectanceTooFewNodes:
    'Not applicable — connectance needs at least two nodes, because the denominator is N x (N - 1).',
  removedPercentEmptyBaseline:
    'Not applicable — the baseline network contains no nodes, so a percentage of baseline nodes cannot be formed.',
} as const

/** Circular/self-consistent guard: round only for display. */
export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Display helper — one decimal place for percentages (Prompt §10.4). */
export function formatPercent(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return 'N/A'
  return `${roundTo(value, digits).toFixed(digits)}%`
}

/** Display helper — connectance with three decimals, e.g. 0.200. */
export function formatConnectance(value: number | null, digits = 3): string {
  if (value === null || Number.isNaN(value)) return 'N/A'
  return roundTo(value, digits).toFixed(digits)
}

/**
 * Connectance = L / (N x (N - 1)) for a directed graph without self-links.
 * Valid only when N >= 2 (Prompt §7.4).
 */
export function computeConnectance(nodeCount: number, linkCount: number): MetricValue {
  if (nodeCount < 2) {
    return { value: null, notApplicable: NOT_APPLICABLE.connectanceTooFewNodes }
  }
  return { value: linkCount / (nodeCount * (nodeCount - 1)) }
}

/**
 * Link loss = 100 x (L0 - Ls) / L0, defined only when L0 > 0.
 * Never divides by zero and never invents a 0% result (Prompt §7.3).
 */
export function computeLinkLossPercent(
  baselineLinks: number,
  remainingLinks: number,
): MetricValue {
  if (baselineLinks <= 0) {
    return { value: null, notApplicable: NOT_APPLICABLE.linkLossNoBaselineLinks }
  }
  const lost = baselineLinks - remainingLinks
  return { value: (100 * lost) / baselineLinks }
}

/** Baseline metrics before any scenario is run (Prompt §7.1, §7.2, §7.4). */
export function computeBaselineMetrics(graph: FoodWebGraph): BaselineMetrics {
  const nodeCount = graph.nodes.length
  const linkCount = graph.edges.length
  return {
    nodeCount,
    linkCount,
    connectance: computeConnectance(nodeCount, linkCount),
  }
}

export interface StateMetrics {
  nodeCount: number
  linkCount: number
  linksLost: number
  linkLossPercent: MetricValue
  connectance: MetricValue
  removedCount: number
  removedPercentOfBaseline: MetricValue
}

/** Counts for an arbitrary scenario state expressed as a set of removed nodes. */
export function computeStateMetrics(
  graph: FoodWebGraph,
  removed: ReadonlySet<string>,
  baseline: BaselineMetrics,
): StateMetrics {
  const nodeCount = graph.nodes.length - removed.size
  const linkCount = survivingEdges(graph, removed).length
  const linksLost = baseline.linkCount - linkCount

  const removedPercentOfBaseline: MetricValue =
    baseline.nodeCount > 0
      ? { value: (100 * removed.size) / baseline.nodeCount }
      : { value: null, notApplicable: NOT_APPLICABLE.removedPercentEmptyBaseline }

  return {
    nodeCount,
    linkCount,
    linksLost,
    linkLossPercent: computeLinkLossPercent(baseline.linkCount, linkCount),
    connectance: computeConnectance(nodeCount, linkCount),
    removedCount: removed.size,
    removedPercentOfBaseline,
  }
}

export interface DirectEffects {
  /** Surviving consumers that lost >= 1 previously recorded food link. */
  directlyAffectedConsumerIds: string[]
  /** Consumers with a recorded baseline food source and none remaining. */
  foodDepletedConsumerIds: string[]
  /** Every link deleted by the initial removal, as source -> target pairs. */
  directlyRemovedLinks: { source: string; target: string }[]
  /** Nodes that lost links but were excluded from the consumer count, with why. */
  excludedFromConsumerCount: { nodeId: string; reason: string }[]
}

/**
 * Immediate structural effects of removing ONE node (Prompt §7.5, §7.6, §8).
 *
 * - Directly affected consumers: surviving consumer nodes that had at least one
 *   recorded food-source link in the baseline and lost at least one of those
 *   links. Each consumer is counted once. The removed node itself is excluded.
 * - Food-depleted consumers: consumers with >= 1 baseline food-source link and
 *   zero remaining. Nodes that already had no incoming links in the baseline are
 *   never counted.
 */
export function analyzeDirectEffects(graph: FoodWebGraph, primaryNodeId: string): DirectEffects {
  const removed = new Set<string>([primaryNodeId])
  const surviving = survivingNodes(graph, removed)

  const directlyAffectedConsumerIds: string[] = []
  const foodDepletedConsumerIds: string[] = []
  const excludedFromConsumerCount: { nodeId: string; reason: string }[] = []

  for (const node of surviving) {
    const baselineIncoming = baselineIncomingCount(graph, node.id)
    // A node that already had zero recorded food sources in the baseline is not
    // "food depleted" and is not "directly affected" (Prompt §7.6, Case 5).
    if (baselineIncoming === 0) continue

    const remaining = remainingFoodSourceIds(graph, node.id, removed)
    if (remaining.length === baselineIncoming) continue // lost nothing

    // Directly affected is a direct-impact measure, not a cascade-eligibility
    // decision: a consumer that lost at least one recorded food source counts
    // here even if it still has others (Prompt §6.5). Role gating does not apply,
    // so `excludedFromConsumerCount` stays empty unless a future rule adds one.
    directlyAffectedConsumerIds.push(node.id)
    if (remaining.length === 0) foodDepletedConsumerIds.push(node.id)
  }

  const directlyRemovedLinks = graph.edges
    .filter((edge) => edge.source === primaryNodeId || edge.target === primaryNodeId)
    .map((edge) => ({ source: edge.source, target: edge.target }))

  return {
    directlyAffectedConsumerIds,
    foodDepletedConsumerIds,
    directlyRemovedLinks,
    excludedFromConsumerCount,
  }
}

/**
 * Assemble scenario metrics for a state, given the direct effects measured
 * immediately after the initial removal.
 *
 * Note on `foodDepletedConsumerIds`: this is deliberately reported for the state
 * *immediately after the initial removal* in both modes. It is the set that
 * drives the cascade rule, so reporting the same figure in direct and cascade
 * mode keeps the two modes comparable. Cascade mode additionally shows which of
 * those consumers were actually removed, round by round.
 */
export function assembleScenarioMetrics(args: {
  graph: FoodWebGraph
  removed: ReadonlySet<string>
  baseline: BaselineMetrics
  effects: DirectEffects
  cascadeDepth: number
}): ScenarioMetrics {
  const { graph, removed, baseline, effects, cascadeDepth } = args
  const state = computeStateMetrics(graph, removed, baseline)
  const secondaryRemovals = Math.max(0, removed.size - 1)

  return {
    nodeCount: state.nodeCount,
    linkCount: state.linkCount,
    linksLost: state.linksLost,
    linkLossPercent: state.linkLossPercent,
    connectance: state.connectance,
    directlyAffectedConsumerIds: effects.directlyAffectedConsumerIds,
    foodDepletedConsumerIds: effects.foodDepletedConsumerIds,
    secondaryRemovals,
    secondaryPercentOfBaseline: computeSecondaryRemovalPercent(
      secondaryRemovals,
      baseline.nodeCount,
    ),
    removedPercentOfBaseline: state.removedPercentOfBaseline,
    cascadeDepth,
    totalRemoved: removed.size,
  }
}

/** Percentage of baseline nodes removed by the cascade alone (Prompt §7.7). */
export function computeSecondaryRemovalPercent(
  secondaryRemovals: number,
  baselineNodeCount: number,
): MetricValue {
  if (baselineNodeCount <= 0) {
    return { value: null, notApplicable: NOT_APPLICABLE.removedPercentEmptyBaseline }
  }
  return { value: (100 * secondaryRemovals) / baselineNodeCount }
}
