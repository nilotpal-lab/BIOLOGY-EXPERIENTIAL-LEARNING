import { computeBaselineMetrics } from './metrics'
import { runCascadeScenario, runDirectRemovalScenario } from './scenarios'
import type {
  BaselineMetrics,
  FoodWebGraph,
  RankingMetricDefinition,
  RankingMetricKey,
  RankingResult,
  RankingRow,
  ScenarioResult,
} from './types'

/* ============================================================================
 * rankingEngine — metric-wise rankings (Prompt §12).
 *
 * There is deliberately NO combined vulnerability score in this version. Each
 * metric is ranked on its own, with its own direction and its own definition.
 *
 * Every scenario is run independently from the immutable baseline, so one
 * species removal can never influence the next (Prompt §11 Case 15).
 * ========================================================================== */

export const RANKING_METRICS: RankingMetricDefinition[] = [
  {
    key: 'linkLossPercent',
    label: 'Percentage of links lost',
    shortLabel: 'Link loss',
    direction: 'desc',
    unit: 'percent',
    mode: 'direct',
    definition:
      '100 x (L0 - Ls) / L0 for the direct removal of this node, where L0 is the baseline link count and Ls the links remaining. Not applicable when the baseline has no links.',
  },
  {
    key: 'directlyAffectedConsumers',
    label: 'Consumers directly affected',
    shortLabel: 'Directly affected',
    direction: 'desc',
    unit: 'count',
    mode: 'direct',
    definition:
      'Number of surviving consumer nodes that lost at least one previously recorded food-source link immediately after the direct removal. Each consumer is counted once.',
  },
  {
    key: 'secondaryRemovals',
    label: 'Secondary removals (cascade)',
    shortLabel: 'Secondary removals',
    direction: 'desc',
    unit: 'count',
    mode: 'cascade',
    definition:
      'Number of additional nodes removed by the rule-based cascade, excluding the initially selected node.',
  },
  {
    key: 'cascadeRemovedPercent',
    label: 'Percentage of baseline nodes removed during cascade',
    shortLabel: 'Cascade removed %',
    direction: 'desc',
    unit: 'percent',
    mode: 'cascade',
    definition:
      '100 x secondary removals / N0, where N0 is the baseline node count. The denominator is the whole baseline network, and the initially selected node is excluded from the numerator.',
  },
  {
    key: 'cascadeDepth',
    label: 'Cascade depth',
    shortLabel: 'Cascade depth',
    direction: 'desc',
    unit: 'count',
    mode: 'cascade',
    definition:
      'Number of cascade rounds in which at least one new node met the eligibility rule. The initial user-selected removal is not a round. Zero when no secondary removal occurs.',
  },
]

export function getRankingMetric(key: RankingMetricKey): RankingMetricDefinition {
  const metric = RANKING_METRICS.find((entry) => entry.key === key)
  if (!metric) throw new Error(`Unknown ranking metric "${key}"`)
  return metric
}

export interface SpeciesScenarios {
  nodeId: string
  /** Display label taken from the dataset, so tables never diverge from the graph. */
  label: string
  role: RankingRow['role']
  direct: ScenarioResult
  cascade: ScenarioResult
}

export interface SpeciesAnalysis {
  datasetId: string
  datasetName: string
  baseline: BaselineMetrics
  /** Stable dataset order, so progress and exports are deterministic. */
  nodeOrder: string[]
  scenarios: Map<string, SpeciesScenarios>
  computedAt: string
  /** True when the run was cancelled before completing every node. */
  cancelled: boolean
}

export interface AnalyseOptions {
  onProgress?: (completed: number, total: number) => void
  signal?: AbortSignal
  /** Yield to the browser every N nodes so progress can be painted. */
  yieldEvery?: number
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Run every eligible initial removal, once in direct mode and once in cascade
 * mode, always from the same immutable baseline graph.
 *
 * All nodes are eligible initial-removal targets: the user is free to select any
 * node. Nodes whose removal changes nothing are kept in the results with honest
 * zero values rather than being dropped.
 */
export async function analyseAllSpecies(
  graph: FoodWebGraph,
  datasetName: string,
  options: AnalyseOptions = {},
): Promise<SpeciesAnalysis> {
  const { onProgress, signal, yieldEvery = 8 } = options
  const baseline = computeBaselineMetrics(graph)
  const nodeOrder = graph.nodes.map((node) => node.id)
  const scenarios = new Map<string, SpeciesScenarios>()
  const total = nodeOrder.length
  let completed = 0
  let cancelled = false

  for (const nodeId of nodeOrder) {
    if (signal?.aborted) {
      cancelled = true
      break
    }
    const node = graph.nodeById.get(nodeId)
    scenarios.set(nodeId, {
      nodeId,
      label: node?.name ?? nodeId,
      role: node?.trophicRole ?? 'other',
      direct: runDirectRemovalScenario(graph, datasetName, nodeId),
      cascade: runCascadeScenario(graph, datasetName, nodeId),
    })
    completed += 1
    onProgress?.(completed, total)
    if (completed % yieldEvery === 0 && completed < total) {
      await nextTick()
    }
  }

  return {
    datasetId: graph.datasetId,
    datasetName,
    baseline,
    nodeOrder,
    scenarios,
    computedAt: new Date().toISOString(),
    cancelled,
  }
}

function metricValueOf(
  metric: RankingMetricDefinition,
  entry: SpeciesScenarios,
): { value: number | null; notApplicable?: string } {
  switch (metric.key) {
    case 'linkLossPercent':
      return {
        value: entry.direct.scenario.linkLossPercent.value,
        notApplicable: entry.direct.scenario.linkLossPercent.notApplicable,
      }
    case 'directlyAffectedConsumers':
      return { value: entry.direct.scenario.directlyAffectedConsumerIds.length }
    case 'secondaryRemovals':
      return { value: entry.cascade.scenario.secondaryRemovals }
    case 'cascadeRemovedPercent':
      return {
        value: entry.cascade.scenario.secondaryPercentOfBaseline.value,
        notApplicable: entry.cascade.scenario.secondaryPercentOfBaseline.notApplicable,
      }
    case 'cascadeDepth':
      return { value: entry.cascade.scenario.cascadeDepth }
    default:
      return { value: null }
  }
}

function buildRow(
  nodeId: string,
  label: string,
  role: RankingRow['role'],
  metric: RankingMetricDefinition,
  entry: SpeciesScenarios,
): RankingRow {
  const { value, notApplicable } = metricValueOf(metric, entry)
  return {
    rank: 0, // assigned after sorting
    nodeId,
    label,
    role,
    metricValue: value,
    metricNotApplicable: notApplicable,
    linksLost: entry.direct.scenario.linksLost,
    linkCount: entry.direct.scenario.linkCount,
    nodeCount: entry.direct.scenario.nodeCount,
    directlyAffectedConsumers: entry.direct.scenario.directlyAffectedConsumerIds.length,
    foodDepletedConsumers: entry.direct.scenario.foodDepletedConsumerIds.length,
    secondaryRemovals: entry.cascade.scenario.secondaryRemovals,
    cascadeDepth: entry.cascade.scenario.cascadeDepth,
    removedPercentOfBaseline: entry.cascade.scenario.removedPercentOfBaseline.value,
  }
}

/**
 * Sort and rank the analysis under one metric.
 *
 * Primary sort: the chosen metric, descending (a larger measured structural
 * change ranks higher). Secondary sort: node label, ascending, which makes ties
 * deterministic. Node id is a final tie-break so the order is fully stable.
 * Tied values receive the SAME rank number, shown honestly (Prompt §12.3,
 * §11 Case 16).
 */
export function buildRanking(analysis: SpeciesAnalysis, metricKey: RankingMetricKey): RankingResult {
  const metric = getRankingMetric(metricKey)

  const rows: RankingRow[] = analysis.nodeOrder.map((nodeId) => {
    const entry = analysis.scenarios.get(nodeId)
    if (!entry) throw new Error(`Missing scenario for node "${nodeId}"`)
    return buildRow(nodeId, entry.label, entry.role, metric, entry)
  })

  rows.sort((a, b) => {
    const av = a.metricValue
    const bv = b.metricValue
    // Not-applicable values always sort last.
    if (av === null && bv === null) {
      return compareLabels(a, b)
    }
    if (av === null) return 1
    if (bv === null) return -1
    // All ranking metrics use "larger measured change ranks higher".
    if (bv !== av) return bv - av
    return compareLabels(a, b)
  })

  // Competition ranking: equal values share a rank (1, 1, 3, ...). Not-applicable
  // rows are given rank 0, so "not applicable" can never be mistaken for a good
  // or a bad score, and can never be confused with a real zero.
  let previousValue: number | undefined
  let previousRank = 0
  rows.forEach((row, index) => {
    if (row.metricValue === null) {
      row.rank = 0
      return
    }
    if (previousValue !== undefined && row.metricValue === previousValue) {
      row.rank = previousRank
      return
    }
    row.rank = index + 1
    previousRank = row.rank
    previousValue = row.metricValue
  })

  return {
    datasetId: analysis.datasetId,
    datasetName: analysis.datasetName,
    metric,
    mode: metric.mode,
    rows,
    excluded: [],
    computedAt: analysis.computedAt,
    baselineNodeCount: analysis.baseline.nodeCount,
  }
}

function compareLabels(a: RankingRow, b: RankingRow): number {
  const byLabel = a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
  if (byLabel !== 0) return byLabel
  return a.nodeId.localeCompare(b.nodeId)
}

/** Rows for every metric, used by exports and the comparison screen. */
export function buildAllRankings(analysis: SpeciesAnalysis): Record<RankingMetricKey, RankingResult> {
  const output = {} as Record<RankingMetricKey, RankingResult>
  for (const metric of RANKING_METRICS) {
    output[metric.key] = buildRanking(analysis, metric.key)
  }
  return output
}
