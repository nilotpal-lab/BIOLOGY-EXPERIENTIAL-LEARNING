import {
  baselineIncomingCount,
  labelOf,
  remainingFoodSourceIds,
  survivingEdges,
  survivingNodes,
} from './graphModel'
import { analyzeDirectEffects, assembleScenarioMetrics, computeBaselineMetrics } from './metrics'
import { structuralLossEligibility } from './rules'
import type {
  CascadeRemovalRecord,
  CascadeRound,
  FoodWebGraph,
  ScenarioMode,
  ScenarioResult,
  ScenarioWarning,
} from './types'

/* ============================================================================
 * scenarios — the two analytical operations.
 *
 * Both always start from a fresh copy of the *baseline* graph. The baseline is
 * never mutated, and one scenario can never leak into the next (Prompt §8, §15.2).
 * ========================================================================== */

/** Thrown when a scenario is requested with input that cannot be simulated. */
export class ScenarioInputError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ScenarioInputError'
    this.code = code
  }
}

function assertRemovable(graph: FoodWebGraph, primaryNodeId: string): void {
  if (!graph.nodes.length) {
    throw new ScenarioInputError(
      'EMPTY_DATASET',
      'No valid graph is loaded. Load a demo network or import a dataset before running a scenario.',
    )
  }
  if (!primaryNodeId) {
    throw new ScenarioInputError(
      'NO_NODE_SELECTED',
      'Select a species or trophic group before running a scenario.',
    )
  }
  if (!graph.nodeById.has(primaryNodeId)) {
    throw new ScenarioInputError(
      'UNKNOWN_NODE',
      `Node "${primaryNodeId}" is not part of the loaded dataset.`,
    )
  }
}

function collectWarnings(args: {
  graph: FoodWebGraph
  removed: ReadonlySet<string>
  effects: ReturnType<typeof analyzeDirectEffects>
  mode: ScenarioMode
  cascadeDepth: number
  secondaryRemovals: number
}): ScenarioWarning[] {
  const { graph, removed, effects, mode, cascadeDepth, secondaryRemovals } = args
  const warnings: ScenarioWarning[] = []
  const baseline = computeBaselineMetrics(graph)

  if (baseline.linkCount === 0) {
    warnings.push({
      code: 'BASELINE_NO_LINKS',
      message:
        'The baseline network has no recorded feeding links, so structural analysis is limited. Link loss is not applicable.',
    })
  }

  for (const excluded of effects.excludedFromConsumerCount) {
    warnings.push({
      code: 'EXCLUDED_FROM_CONSUMER_COUNT',
      message: `"${labelOf(graph, excluded.nodeId)}" lost recorded food links but was not counted as an affected consumer. ${excluded.reason}`,
    })
  }

  if (removed.size >= graph.nodes.length && graph.nodes.length > 0) {
    warnings.push({
      code: 'NETWORK_EMPTY_AFTER_SCENARIO',
      message:
        'This scenario removes every node in the network. The remaining network is empty, so connectance and any other network-shape metric is not applicable.',
    })
  }

  if (mode === 'cascade') {
    if (secondaryRemovals === 0) {
      warnings.push({
        code: 'NO_SECONDARY_REMOVALS',
        message:
          'No secondary removals under the current cascade rule. No surviving consumer had lost all of its recorded food sources, so cascade depth is zero. This is not evidence that the food web is robust in nature.',
      })
    } else if (cascadeDepth === 1) {
      warnings.push({
        code: 'CASCADE_SINGLE_ROUND',
        message: `The cascade finished after 1 round with ${secondaryRemovals} secondary removal(s). No further consumer met the eligibility rule.`,
      })
    }
  }

  const isolated = survivingNodes(graph, removed).filter(
    (node) =>
      (graph.foodSourcesOf.get(node.id)?.filter((s) => !removed.has(s)).length ?? 0) === 0 &&
      (graph.consumersOf.get(node.id)?.filter((c) => !removed.has(c)).length ?? 0) === 0,
  )
  if (isolated.length > 0) {
    warnings.push({
      code: 'ISOLATED_SURVIVORS',
      message: `${isolated.length} surviving node(s) now have no recorded links in either direction: ${isolated
        .map((n) => `"${n.name}"`)
        .join(', ')}. They are preserved rather than discarded.`,
    })
  }

  return warnings
}

/**
 * Direct removal (Prompt §8): clone the baseline, remove the selected node and
 * every link where it is the source or the target, then measure the immediate
 * structural effects. Surviving consumers that lost food links are flagged but
 * are NOT removed.
 */
export function runDirectRemovalScenario(
  graph: FoodWebGraph,
  datasetName: string,
  primaryNodeId: string,
): ScenarioResult {
  assertRemovable(graph, primaryNodeId)

  const baseline = computeBaselineMetrics(graph)
  const removed = new Set<string>([primaryNodeId])
  const effects = analyzeDirectEffects(graph, primaryNodeId)

  const scenario = assembleScenarioMetrics({
    graph,
    removed,
    baseline,
    effects,
    cascadeDepth: 0,
  })

  return {
    datasetId: graph.datasetId,
    datasetName,
    mode: 'direct',
    primaryNodeId,
    primaryNodeLabel: labelOf(graph, primaryNodeId),
    computedAt: new Date().toISOString(),
    baseline,
    scenario,
    rounds: [],
    removedNodeIds: [...removed],
    directlyRemovedLinks: effects.directlyRemovedLinks,
    warnings: collectWarnings({
      graph,
      removed,
      effects,
      mode: 'direct',
      cascadeDepth: 0,
      secondaryRemovals: 0,
    }),
  }
}

/**
 * Rule-based cascade (Prompt §9).
 *
 * A surviving node is eligible for secondary removal when ALL of:
 *  - it had at least one recorded incoming food-source link in the baseline;
 *  - it has zero incoming food-source links in the current scenario;
 *  - it has not already been removed.
 *
 * Trophic role / role evidence are reported for context only and never gate the
 * rule, so unknown-role nodes still participate in the structural calculation.
 *
 * Each round identifies every eligible node against the state at the *start* of
 * the round and removes them simultaneously, so the result never depends on the
 * order in which nodes happen to be stored. The loop terminates because no node
 * can be removed twice, and a defensive round cap is applied as well.
 */
export function runCascadeScenario(
  graph: FoodWebGraph,
  datasetName: string,
  primaryNodeId: string,
): ScenarioResult {
  assertRemovable(graph, primaryNodeId)

  const baseline = computeBaselineMetrics(graph)
  const removed = new Set<string>([primaryNodeId])
  const effects = analyzeDirectEffects(graph, primaryNodeId)

  const rounds: CascadeRound[] = []
  const excludedFromCascade: { nodeId: string; reason: string }[] = []
  const hardCap = graph.nodes.length + 1

  for (let round = 1; round <= hardCap; round += 1) {
    const eligible: CascadeRemovalRecord[] = []

    for (const node of graph.nodes) {
      if (removed.has(node.id)) continue
      const baselineIncoming = baselineIncomingCount(graph, node.id)
      // A node with no recorded food source in the baseline is never eligible:
      // it did not lose anything (Prompt §9.1, Case 5).
      if (baselineIncoming === 0) continue

      const remaining = remainingFoodSourceIds(graph, node.id, removed)
      if (remaining.length > 0) continue

      const eligibility = structuralLossEligibility(node, baselineIncoming, remaining.length)
      if (!eligibility.eligible) {
        if (!excludedFromCascade.some((entry) => entry.nodeId === node.id)) {
          excludedFromCascade.push({ nodeId: node.id, reason: eligibility.reason })
        }
        continue
      }

      const baselineFoodSourceIds = graph.foodSourcesOf.get(node.id) ?? []
      eligible.push({
        nodeId: node.id,
        label: node.name,
        role: node.trophicRole,
        reason:
          `Had ${baselineIncoming} recorded food-source link(s) in the baseline and none remaining at the start of cascade round ${round}. ` +
          `Food sources recorded before: ${baselineFoodSourceIds.map((id) => `"${labelOf(graph, id)}"`).join(', ')}. ` +
          `Lost by this point: ${
            baselineFoodSourceIds
              .filter((id) => removed.has(id))
              .map((id) => `"${labelOf(graph, id)}"`)
              .join(', ') || 'none'
          }.`,
        baselineFoodSourceIds: [...baselineFoodSourceIds],
        remainingFoodSourceIds: [...remaining],
      })
    }

    if (eligible.length === 0) break // Case 14: nothing new qualifies → stop.

    // Simultaneous removal of the whole round.
    const before = removed.size
    for (const record of eligible) removed.add(record.nodeId)
    if (removed.size === before) break // defensive: guarantees progress

    rounds.push({ round, removals: eligible })
  }

  const warnings = collectWarnings({
    graph,
    removed,
    effects,
    mode: 'cascade',
    cascadeDepth: rounds.length,
    secondaryRemovals: Math.max(0, removed.size - 1),
  })
  for (const excluded of excludedFromCascade) {
    warnings.push({
      code: 'CASCADE_ELIGIBILITY_EXCLUDED',
      message: `"${labelOf(graph, excluded.nodeId)}" ran out of recorded food sources but was NOT removed by the cascade rule. ${excluded.reason}`,
    })
  }

  const scenario = assembleScenarioMetrics({
    graph,
    removed,
    baseline,
    effects,
    cascadeDepth: rounds.length,
  })

  return {
    datasetId: graph.datasetId,
    datasetName,
    mode: 'cascade',
    primaryNodeId,
    primaryNodeLabel: labelOf(graph, primaryNodeId),
    computedAt: new Date().toISOString(),
    baseline,
    scenario,
    rounds,
    removedNodeIds: [...removed],
    directlyRemovedLinks: effects.directlyRemovedLinks,
    warnings,
  }
}

/** Run either mode. Both modes start from the same immutable baseline. */
export function runScenario(
  graph: FoodWebGraph,
  datasetName: string,
  primaryNodeId: string,
  mode: ScenarioMode,
): ScenarioResult {
  return mode === 'cascade'
    ? runCascadeScenario(graph, datasetName, primaryNodeId)
    : runDirectRemovalScenario(graph, datasetName, primaryNodeId)
}

/** Nodes and links remaining in a scenario — used by the graph layer. */
export function scenarioSurvivors(graph: FoodWebGraph, removedNodeIds: readonly string[]) {
  const removed = new Set(removedNodeIds)
  return {
    nodes: survivingNodes(graph, removed),
    edges: survivingEdges(graph, removed),
  }
}

/**
 * Readable, generated-from-the-data explanation of what changed (Prompt §14).
 * Every sentence is derived from the computed result — nothing is speculative,
 * and the wording avoids extinction claims.
 */
export function describeScenario(result: ScenarioResult): string[] {
  const lines: string[] = []
  const s = result.scenario

  lines.push(
    `Removing "${result.primaryNodeLabel}" from "${result.datasetName}" deleted ${result.directlyRemovedLinks.length} feeding link(s).`,
  )

  const affected = s.directlyAffectedConsumerIds.length
  const depleted = s.foodDepletedConsumerIds.length
  if (affected === 0) {
    lines.push(
      'No surviving consumer lost a recorded food source as a direct result, so the immediate structural effect is limited to the deleted links.',
    )
  } else {
    lines.push(
      `${affected} surviving consumer(s) lost at least one recorded food-source link: ${s.directlyAffectedConsumerIds.join(', ')}.`,
    )
    if (depleted === 0) {
      lines.push('Each of them still had at least one other recorded food source remaining.')
    } else {
      lines.push(
        `${depleted} consumer(s) lost every recorded food source: ${s.foodDepletedConsumerIds.join(', ')}. This describes the supplied network, not whether the organism would actually starve.`,
      )
    }
  }

  lines.push(
    `The scenario keeps ${s.nodeCount} of ${result.baseline.nodeCount} nodes and ${s.linkCount} of ${result.baseline.linkCount} links.`,
  )

  if (result.mode === 'cascade') {
    if (s.secondaryRemovals === 0) {
      lines.push(
        'No additional node met the cascade rule, so there were no secondary removals and cascade depth is 0.',
      )
    } else {
      const roundSummary = result.rounds
        .map((round) => `Round ${round.round}: ${round.removals.map((r) => r.label).join(', ')}`)
        .join('; ')
      lines.push(
        `Under the cascade rule, ${s.secondaryRemovals} node(s) qualified for secondary removal in ${s.cascadeDepth} round(s) — ${roundSummary}.`,
      )
      lines.push(
        `With the initial selection included, ${s.totalRemoved} of ${result.baseline.nodeCount} baseline nodes were removed (${s.removedPercentOfBaseline.value === null ? 'percentage not applicable' : `${s.removedPercentOfBaseline.value.toFixed(1)}%`}).`,
      )
    }
  } else if (depleted > 0) {
    lines.push(
      'This is direct-removal mode, so food-depleted consumers stay visible in the network. They are flagged only; run the cascade simulation to see which of them would qualify for rule-based secondary removal.',
    )
  }

  lines.push(
    'Interpretation: these are structural effects under the recorded links and the selected simulation rule. They are not a prediction of extinction, and the cascade is not a population model.',
  )

  return lines
}
