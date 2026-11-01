import { computeConnectance, computeDunneConnectance } from './metrics'
import type { FoodWebGraph, TrophicRole } from './types'

/* ============================================================================
 * robustness — Network Robustness Lab Engine
 *
 * Implements the published methodology of:
 *   Dunne, Williams, and Martinez (2002), "Network structure and biodiversity
 *   loss in food webs: robustness increases with connectance,"
 *   Ecology Letters, 5(4), 558–567.
 *
 * Removal strategies:
 *   - Strategy A: Most-connected first (dynamic total degree = in + out)
 *   - Strategy B: Most-connected first, basal species protected
 *   - Strategy C: Least-connected first (dynamic total degree = in + out)
 *   - Strategy D: Random removal (1,000 independent runs, seeded PRNG)
 * ========================================================================== */

export type DeterministicStrategy =
  | 'most-connected'
  | 'most-connected-basal-protected'
  | 'least-connected'

export type RobustnessStrategy = DeterministicStrategy | 'random'

export const ROBUSTNESS_STRATEGY_INFO: Record<
  RobustnessStrategy,
  { label: string; shortLabel: string; code: string; description: string; color: string }
> = {
  'most-connected': {
    label: 'Strategy A · Most-connected first',
    shortLabel: 'Most-connected',
    code: 'A',
    description:
      'Removes the species with the highest total degree (in-degree + out-degree) at each step. Degrees are dynamically recalculated after each primary removal and secondary cascade round.',
    color: '#E07A5F', // Terra cotta / warm coral
  },
  'most-connected-basal-protected': {
    label: 'Strategy B · Most-connected (basal protected)',
    shortLabel: 'Basal protected',
    code: 'B',
    description:
      'Removes the most-connected species, but protects all basal species (autotrophs / detritus with 0 baseline incoming links) from primary removal.',
    color: '#D4973B', // Warm amber
  },
  'least-connected': {
    label: 'Strategy C · Least-connected first',
    shortLabel: 'Least-connected',
    code: 'C',
    description:
      'Removes the species with the lowest total degree at each step. Degrees are dynamically recalculated after each step.',
    color: '#4B7B94', // Muted slate / river blue
  },
  'random': {
    label: 'Strategy D · Random removal (Dunne 2002)',
    shortLabel: 'Random (1,000 runs)',
    code: 'D',
    description:
      '1,000 independent Monte Carlo deletion sequences using a seeded PRNG. Displays the mean extinction curve and the 2.5th–97.5th percentile envelope.',
    color: '#35563B', // Forest green
  },
}

/** Step record for sequential removal analysis */
export interface RobustnessStep {
  step: number // 1-based primary removal index
  primaryNodeId: string
  primaryNodeName: string
  primaryNodeRole: TrophicRole
  primaryDegree: number // degree in active subgraph when selected
  secondaryRemovedIds: string[]
  secondaryRemovedNames: string[]
  secondaryCount: number
  cascadeRounds: number
  cumulativePrimary: number
  cumulativeSecondary: number
  cumulativeTotalLost: number
  survivingCount: number
  primaryFraction: number // cumulativePrimary / totalSpecies
  totalLossFraction: number // cumulativeTotalLost / totalSpecies
}

/** Extinction curve coordinate for plotting */
export interface ExtinctionCurvePoint {
  primaryCount: number
  primaryFraction: number
  totalLostCount: number
  totalLossFraction: number
  // Fields for random envelope:
  meanTotalLossFraction?: number
  percentile2_5TotalLossFraction?: number
  percentile97_5TotalLossFraction?: number
  medianTotalLossFraction?: number
}

/** R50 metric calculation output */
export interface R50Result {
  /** R50 = primary removals required to reach 50% total loss / totalSpecies (max 0.5) */
  r50: number | null
  /** Linearly interpolated primary removal count */
  interpolatedPrimary: number | null
  /** Whether 50% total loss was reached in the sequence */
  thresholdReached: boolean
}

/** Result for a single deterministic strategy */
export interface DeterministicRobustnessResult {
  strategy: DeterministicStrategy
  strategyLabel: string
  datasetId: string
  totalSpecies: number
  totalLinks: number
  dunneConnectance: number
  fwgConnectance: number
  basalCount: number
  basalFraction: number
  steps: RobustnessStep[]
  r50: number | null
  r50PrimaryRemovals: number | null
  thresholdReached: boolean
  extinctionCurve: ExtinctionCurvePoint[]
}

/** Result for Strategy D (Random removal with 1,000 iterations) */
export interface RandomRobustnessResult {
  strategy: 'random'
  strategyLabel: string
  datasetId: string
  totalSpecies: number
  totalLinks: number
  dunneConnectance: number
  fwgConnectance: number
  basalCount: number
  basalFraction: number
  iterations: number
  seed: number
  meanR50: number | null
  r50Percentile2_5: number | null
  r50Percentile97_5: number | null
  r50StdDev: number | null
  thresholdReached: boolean
  extinctionCurve: ExtinctionCurvePoint[]
  sampleRun: RobustnessStep[]
}

export type RobustnessResult = DeterministicRobustnessResult | RandomRobustnessResult

/** Full experiment run across all strategies for a network */
export interface RobustnessLabRun {
  datasetId: string
  datasetName: string
  totalSpecies: number
  totalLinks: number
  dunneConnectance: number
  fwgConnectance: number
  basalCount: number
  basalFraction: number
  results: {
    'most-connected'?: DeterministicRobustnessResult
    'most-connected-basal-protected'?: DeterministicRobustnessResult
    'least-connected'?: DeterministicRobustnessResult
    'random'?: RandomRobustnessResult
  }
}

/* -------------------------------------------------------------------------- */
/* Mathematical utilities: PRNG, Quantile & R50 Interpolation                 */
/* -------------------------------------------------------------------------- */

/**
 * 32-bit Mulberry32 PRNG.
 * Deterministic and reproducible across browsers and Node test runners.
 */
export function createPrng(seed: number = 42): () => number {
  let s = seed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Quantile calculation using standard Type 7 (R default / linear interpolation).
 * Assumes `sortedValues` is sorted in ascending order.
 */
export function quantile(sortedValues: readonly number[], q: number): number {
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]
  if (q <= 0) return sortedValues[0]
  if (q >= 1) return sortedValues[sortedValues.length - 1]

  const pos = (sortedValues.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base

  if (base + 1 < sortedValues.length) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base])
  }
  return sortedValues[base]
}

/**
 * Calculates R50 via linear interpolation between removal steps.
 *
 * R50 is the proportion of species that must be removed primarily to result
 * in a cumulative total loss of at least 50% of the species (Dunne et al. 2002).
 *
 * Total loss = primary removals + secondary structural cascade removals.
 * Target loss = 0.5 * S.
 * Since primary removals cannot exceed 50% to reach 50% loss, R50 <= 0.5.
 */
export function calculateR50(
  curve: readonly { primaryCount: number; totalLostCount: number }[],
  totalSpecies: number,
): R50Result {
  if (totalSpecies <= 0) {
    return { r50: null, interpolatedPrimary: null, thresholdReached: false }
  }

  const targetLoss = 0.5 * totalSpecies

  // Find the first point that reaches or exceeds the 50% loss threshold
  const index = curve.findIndex((pt) => pt.totalLostCount >= targetLoss)
  if (index === -1) {
    // 50% threshold was never reached (e.g. basal-protected in webs with >50% basal species)
    return { r50: null, interpolatedPrimary: null, thresholdReached: false }
  }

  const current = curve[index]
  if (current.totalLostCount === targetLoss) {
    const r50 = Math.min(0.5, current.primaryCount / totalSpecies)
    return { r50, interpolatedPrimary: current.primaryCount, thresholdReached: true }
  }

  // Linear interpolation with the previous point
  const prev = index > 0 ? curve[index - 1] : { primaryCount: 0, totalLostCount: 0 }
  const deltaLoss = current.totalLostCount - prev.totalLostCount
  const deltaPrimary = current.primaryCount - prev.primaryCount

  let interpolatedPrimary: number
  if (deltaLoss === 0) {
    interpolatedPrimary = current.primaryCount
  } else {
    interpolatedPrimary =
      prev.primaryCount + ((targetLoss - prev.totalLostCount) / deltaLoss) * deltaPrimary
  }

  // R50 is bounded by 0.5
  const r50 = Math.min(0.5, Math.max(0, interpolatedPrimary / totalSpecies))
  return {
    r50,
    interpolatedPrimary,
    thresholdReached: true,
  }
}

/* -------------------------------------------------------------------------- */
/* Pure Simulation Engine                                                     */
/* -------------------------------------------------------------------------- */

interface GraphInternalState {
  totalSpecies: number
  totalLinks: number
  dunneConnectance: number
  fwgConnectance: number
  basalCount: number
  basalFraction: number
  nodeIds: string[]
  nodeNameById: Map<string, string>
  nodeRoleById: Map<string, TrophicRole>
  foodSourcesById: Map<string, string[]>
  consumersById: Map<string, string[]>
  baselineIncomingById: Map<string, number>
  isBasalById: Map<string, boolean>
}

function initGraphState(graph: FoodWebGraph): GraphInternalState {
  const totalSpecies = graph.nodes.length
  const totalLinks = graph.edges.length

  const dunneConnectance = computeDunneConnectance(totalSpecies, totalLinks).value ?? 0
  const fwgConnectance = computeConnectance(totalSpecies, totalLinks).value ?? 0

  const nodeIds = graph.nodes.map((n) => n.id)
  const nodeNameById = new Map<string, string>()
  const nodeRoleById = new Map<string, TrophicRole>()
  const foodSourcesById = new Map<string, string[]>()
  const consumersById = new Map<string, string[]>()
  const baselineIncomingById = new Map<string, number>()
  const isBasalById = new Map<string, boolean>()

  let basalCount = 0

  for (const node of graph.nodes) {
    nodeNameById.set(node.id, node.name)
    nodeRoleById.set(node.id, node.trophicRole)
    const sources = graph.foodSourcesOf.get(node.id) ?? []
    const consumers = graph.consumersOf.get(node.id) ?? []
    foodSourcesById.set(node.id, sources)
    consumersById.set(node.id, consumers)

    const baselineIn = sources.length
    baselineIncomingById.set(node.id, baselineIn)
    const isBasal = baselineIn === 0
    isBasalById.set(node.id, isBasal)
    if (isBasal) basalCount++
  }

  return {
    totalSpecies,
    totalLinks,
    dunneConnectance,
    fwgConnectance,
    basalCount,
    basalFraction: totalSpecies > 0 ? basalCount / totalSpecies : 0,
    nodeIds,
    nodeNameById,
    nodeRoleById,
    foodSourcesById,
    consumersById,
    baselineIncomingById,
    isBasalById,
  }
}

/**
 * Propagate structural cascades given a set of newly removed nodes.
 * Reuses the exact structural rule from `src/core/rules.ts` and `src/core/scenarios.ts`:
 * - Basal species (0 baseline incoming food links) are NEVER secondary removed.
 * - Surviving consumer with baseline incoming > 0 and 0 remaining incoming food links is removed.
 * - Simultaneous removal per round.
 */
function resolveCascade(
  state: GraphInternalState,
  removedSet: Set<string>,
): { secondaryRemovedIds: string[]; cascadeRounds: number } {
  const secondaryRemovedIds: string[] = []
  let cascadeRounds = 0
  const hardCap = state.totalSpecies + 1

  while (cascadeRounds < hardCap) {
    const roundRemovals: string[] = []

    for (const id of state.nodeIds) {
      if (removedSet.has(id)) continue
      // Basal species never undergo secondary removal
      if (state.isBasalById.get(id)) continue

      const foodSources = state.foodSourcesById.get(id) ?? []
      // Check if all recorded food sources are removed
      const hasSurvivingFoodSource = foodSources.some((srcId) => !removedSet.has(srcId))
      if (!hasSurvivingFoodSource) {
        roundRemovals.push(id)
      }
    }

    if (roundRemovals.length === 0) break

    cascadeRounds++
    for (const id of roundRemovals) {
      removedSet.add(id)
      secondaryRemovedIds.push(id)
    }
  }

  return { secondaryRemovedIds, cascadeRounds }
}

/**
 * Computes active degree (in-degree + out-degree) for surviving nodes.
 */
function computeActiveDegree(
  nodeId: string,
  state: GraphInternalState,
  removedSet: ReadonlySet<string>,
): number {
  const sources = state.foodSourcesById.get(nodeId) ?? []
  const consumers = state.consumersById.get(nodeId) ?? []

  let inDeg = 0
  for (let i = 0; i < sources.length; i++) {
    if (!removedSet.has(sources[i])) inDeg++
  }

  let outDeg = 0
  for (let i = 0; i < consumers.length; i++) {
    if (!removedSet.has(consumers[i])) outDeg++
  }

  return inDeg + outDeg
}

/**
 * Runs a deterministic removal strategy (Strategy A, B, or C).
 */
export function runDeterministicRemoval(
  graph: FoodWebGraph,
  strategy: DeterministicStrategy,
): DeterministicRobustnessResult {
  const state = initGraphState(graph)
  const S = state.totalSpecies

  if (S === 0) {
    return {
      strategy,
      strategyLabel: ROBUSTNESS_STRATEGY_INFO[strategy].label,
      datasetId: graph.datasetId,
      totalSpecies: 0,
      totalLinks: 0,
      dunneConnectance: 0,
      fwgConnectance: 0,
      basalCount: 0,
      basalFraction: 0,
      steps: [],
      r50: null,
      r50PrimaryRemovals: null,
      thresholdReached: false,
      extinctionCurve: [{ primaryCount: 0, primaryFraction: 0, totalLostCount: 0, totalLossFraction: 0 }],
    }
  }

  const removedSet = new Set<string>()
  const steps: RobustnessStep[] = []
  const curve: ExtinctionCurvePoint[] = [
    { primaryCount: 0, primaryFraction: 0, totalLostCount: 0, totalLossFraction: 0 },
  ]

  let cumulativePrimary = 0
  let cumulativeSecondary = 0

  while (removedSet.size < S) {
    // 1. Determine eligible candidate nodes for primary removal
    const candidates: { id: string; degree: number }[] = []

    for (const id of state.nodeIds) {
      if (removedSet.has(id)) continue

      // Strategy B: exclude basal species from primary removal
      if (strategy === 'most-connected-basal-protected' && state.isBasalById.get(id)) {
        continue
      }

      const degree = computeActiveDegree(id, state, removedSet)
      candidates.push({ id, degree })
    }

    // If no primary candidates remain (e.g. only basal nodes remain under Strategy B), stop.
    if (candidates.length === 0) break

    // 2. Select primary node according to strategy and documented tie-breaking policy
    if (strategy === 'most-connected' || strategy === 'most-connected-basal-protected') {
      // Primary: degree descending. Secondary: node id ascending.
      candidates.sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id))
    } else {
      // Strategy C (least-connected):
      // Primary: degree ascending. Secondary: node id ascending.
      candidates.sort((a, b) => a.degree - b.degree || a.id.localeCompare(b.id))
    }

    const selected = candidates[0]
    const primaryId = selected.id
    const primaryDegree = selected.degree

    // 3. Execute primary removal
    removedSet.add(primaryId)
    cumulativePrimary++

    // 4. Run structural cascade
    const { secondaryRemovedIds, cascadeRounds } = resolveCascade(state, removedSet)
    cumulativeSecondary += secondaryRemovedIds.length
    const cumulativeTotalLost = cumulativePrimary + cumulativeSecondary

    const stepRecord: RobustnessStep = {
      step: cumulativePrimary,
      primaryNodeId: primaryId,
      primaryNodeName: state.nodeNameById.get(primaryId) ?? primaryId,
      primaryNodeRole: state.nodeRoleById.get(primaryId) ?? 'other',
      primaryDegree,
      secondaryRemovedIds,
      secondaryRemovedNames: secondaryRemovedIds.map((id) => state.nodeNameById.get(id) ?? id),
      secondaryCount: secondaryRemovedIds.length,
      cascadeRounds,
      cumulativePrimary,
      cumulativeSecondary,
      cumulativeTotalLost,
      survivingCount: S - cumulativeTotalLost,
      primaryFraction: cumulativePrimary / S,
      totalLossFraction: cumulativeTotalLost / S,
    }

    steps.push(stepRecord)
    curve.push({
      primaryCount: cumulativePrimary,
      primaryFraction: cumulativePrimary / S,
      totalLostCount: cumulativeTotalLost,
      totalLossFraction: cumulativeTotalLost / S,
    })
  }

  // Calculate R50
  const r50Result = calculateR50(curve, S)

  return {
    strategy,
    strategyLabel: ROBUSTNESS_STRATEGY_INFO[strategy].label,
    datasetId: graph.datasetId,
    totalSpecies: S,
    totalLinks: state.totalLinks,
    dunneConnectance: state.dunneConnectance,
    fwgConnectance: state.fwgConnectance,
    basalCount: state.basalCount,
    basalFraction: state.basalFraction,
    steps,
    r50: r50Result.r50,
    r50PrimaryRemovals: r50Result.interpolatedPrimary,
    thresholdReached: r50Result.thresholdReached,
    extinctionCurve: curve,
  }
}

/**
 * Runs Strategy D (Random removal with 1,000 Monte Carlo deletion sequences).
 * Uses indexed structures and Mulberry32 PRNG for sub-100ms execution.
 */
export function runRandomRemovals(
  graph: FoodWebGraph,
  options?: { iterations?: number; seed?: number },
): RandomRobustnessResult {
  const iterations = options?.iterations ?? 1000
  const seed = options?.seed ?? 42
  const prng = createPrng(seed)

  const state = initGraphState(graph)
  const S = state.totalSpecies

  if (S === 0) {
    return {
      strategy: 'random',
      strategyLabel: ROBUSTNESS_STRATEGY_INFO['random'].label,
      datasetId: graph.datasetId,
      totalSpecies: 0,
      totalLinks: 0,
      dunneConnectance: 0,
      fwgConnectance: 0,
      basalCount: 0,
      basalFraction: 0,
      iterations,
      seed,
      meanR50: null,
      r50Percentile2_5: null,
      r50Percentile97_5: null,
      r50StdDev: null,
      thresholdReached: false,
      extinctionCurve: [{ primaryCount: 0, primaryFraction: 0, totalLostCount: 0, totalLossFraction: 0 }],
      sampleRun: [],
    }
  }

  // Map nodes to integer indices for high-performance loops
  const idToIndex = new Map<string, number>()
  state.nodeIds.forEach((id, idx) => idToIndex.set(id, idx))

  const foodSourcesIndices: Int32Array[] = state.nodeIds.map((id) => {
    const list = state.foodSourcesById.get(id) ?? []
    const arr = new Int32Array(list.length)
    list.forEach((srcId, i) => (arr[i] = idToIndex.get(srcId)!))
    return arr
  })

  const consumersIndices: Int32Array[] = state.nodeIds.map((id) => {
    const list = state.consumersById.get(id) ?? []
    const arr = new Int32Array(list.length)
    list.forEach((cId, i) => (arr[i] = idToIndex.get(cId)!))
    return arr
  })

  const baselineIncoming = new Int32Array(S)
  const isBasal = new Uint8Array(S)
  for (let i = 0; i < S; i++) {
    baselineIncoming[i] = foodSourcesIndices[i].length
    isBasal[i] = baselineIncoming[i] === 0 ? 1 : 0
  }

  // Pre-allocate matrices to collect total loss at each primary step m in [0, S]
  // lossAtStep[m][runIndex]
  const lossAtStep: Float32Array[] = Array.from({ length: S + 1 }, () => new Float32Array(iterations))
  const r50Values = new Float64Array(iterations)

  let sampleRun: RobustnessStep[] = []

  // Reusable buffers
  const remainingIn = new Int32Array(S)
  const isRemoved = new Uint8Array(S)
  const aliveNodes: number[] = new Array(S)

  for (let run = 0; run < iterations; run++) {
    // Reset state
    remainingIn.set(baselineIncoming)
    isRemoved.fill(0)
    aliveNodes.length = S
    for (let i = 0; i < S; i++) aliveNodes[i] = i

    let cumulativePrimary = 0
    let cumulativeSecondary = 0

    const runCurve: { primaryCount: number; totalLostCount: number }[] = [
      { primaryCount: 0, totalLostCount: 0 },
    ]
    lossAtStep[0][run] = 0

    const isFirstRun = run === 0
    const currentSampleSteps: RobustnessStep[] = isFirstRun ? [] : []

    while (aliveNodes.length > 0) {
      // Pick random node from aliveNodes
      const randIdx = Math.floor(prng() * aliveNodes.length)
      const primaryIdx = aliveNodes[randIdx]

      // Fast remove from aliveNodes (swap with last)
      aliveNodes[randIdx] = aliveNodes[aliveNodes.length - 1]
      aliveNodes.pop()

      // Calculate dynamic active degree when selected for sampleRun step inspection
      let primaryActiveDegree = 0
      if (isFirstRun) {
        let activeOut = 0
        const pConsumers = consumersIndices[primaryIdx]
        for (let c = 0; c < pConsumers.length; c++) {
          if (isRemoved[pConsumers[c]] === 0) activeOut++
        }
        primaryActiveDegree = remainingIn[primaryIdx] + activeOut
      }

      isRemoved[primaryIdx] = 1
      cumulativePrimary++

      // Cascade propagation
      let stepSecondaryCount = 0
      let cascadeRounds = 0
      const stepSecondaryIds: string[] = []

      // Decrement incoming food sources for direct consumers of primary
      let currentRoundRemovals: number[] = []
      const primaryConsumers = consumersIndices[primaryIdx]
      for (let c = 0; c < primaryConsumers.length; c++) {
        const cIdx = primaryConsumers[c]
        remainingIn[cIdx]--
        if (isBasal[cIdx] === 0 && remainingIn[cIdx] === 0 && isRemoved[cIdx] === 0) {
          currentRoundRemovals.push(cIdx)
          isRemoved[cIdx] = 1 // mark so it is not pushed multiple times
        }
      }

      while (currentRoundRemovals.length > 0) {
        cascadeRounds++
        const nextRoundRemovals: number[] = []

        for (let r = 0; r < currentRoundRemovals.length; r++) {
          const removedIdx = currentRoundRemovals[r]
          stepSecondaryCount++
          if (isFirstRun) stepSecondaryIds.push(state.nodeIds[removedIdx])

          // Remove from aliveNodes
          const pos = aliveNodes.indexOf(removedIdx)
          if (pos !== -1) {
            aliveNodes[pos] = aliveNodes[aliveNodes.length - 1]
            aliveNodes.pop()
          }

          // Decrement consumers of this secondary removed node
          const cList = consumersIndices[removedIdx]
          for (let c = 0; c < cList.length; c++) {
            const nextConsumerIdx = cList[c]
            remainingIn[nextConsumerIdx]--
            if (
              isBasal[nextConsumerIdx] === 0 &&
              remainingIn[nextConsumerIdx] === 0 &&
              isRemoved[nextConsumerIdx] === 0
            ) {
              nextRoundRemovals.push(nextConsumerIdx)
              isRemoved[nextConsumerIdx] = 1
            }
          }
        }

        currentRoundRemovals = nextRoundRemovals
      }

      cumulativeSecondary += stepSecondaryCount
      const totalLost = cumulativePrimary + cumulativeSecondary

      if (cumulativePrimary <= S) {
        lossAtStep[cumulativePrimary][run] = totalLost / S
      }

      runCurve.push({ primaryCount: cumulativePrimary, totalLostCount: totalLost })

      if (isFirstRun) {
        const pId = state.nodeIds[primaryIdx]
        currentSampleSteps.push({
          step: cumulativePrimary,
          primaryNodeId: pId,
          primaryNodeName: state.nodeNameById.get(pId) ?? pId,
          primaryNodeRole: state.nodeRoleById.get(pId) ?? 'other',
          primaryDegree: primaryActiveDegree,
          secondaryRemovedIds: stepSecondaryIds,
          secondaryRemovedNames: stepSecondaryIds.map((id) => state.nodeNameById.get(id) ?? id),
          secondaryCount: stepSecondaryCount,
          cascadeRounds,
          cumulativePrimary,
          cumulativeSecondary,
          cumulativeTotalLost: totalLost,
          survivingCount: S - totalLost,
          primaryFraction: cumulativePrimary / S,
          totalLossFraction: totalLost / S,
        })
      }
    }

    // For any remaining primary steps after all nodes died, loss is 100%
    for (let m = cumulativePrimary + 1; m <= S; m++) {
      lossAtStep[m][run] = 1.0
    }

    // Compute R50 for this run
    const r50Res = calculateR50(runCurve, S)
    r50Values[run] = r50Res.r50 ?? 0.5

    if (isFirstRun) {
      sampleRun = currentSampleSteps
    }
  }

  // Calculate extinction curve statistics across the 1,000 runs
  const extinctionCurve: ExtinctionCurvePoint[] = []

  for (let m = 0; m <= S; m++) {
    const values = Array.from(lossAtStep[m]).sort((a, b) => a - b)
    const sum = values.reduce((acc, v) => acc + v, 0)
    const mean = sum / iterations
    const p2_5 = quantile(values, 0.025)
    const p97_5 = quantile(values, 0.975)
    const median = quantile(values, 0.5)

    extinctionCurve.push({
      primaryCount: m,
      primaryFraction: m / S,
      totalLostCount: Math.round(mean * S),
      totalLossFraction: mean,
      meanTotalLossFraction: mean,
      percentile2_5TotalLossFraction: p2_5,
      percentile97_5TotalLossFraction: p97_5,
      medianTotalLossFraction: median,
    })
  }

  // Aggregate R50 statistics
  const sortedR50 = Array.from(r50Values).sort((a, b) => a - b)
  const r50Sum = sortedR50.reduce((acc, v) => acc + v, 0)
  const meanR50 = r50Sum / iterations
  const r50Percentile2_5 = quantile(sortedR50, 0.025)
  const r50Percentile97_5 = quantile(sortedR50, 0.975)

  // Standard deviation
  const variance =
    sortedR50.reduce((acc, v) => acc + (v - meanR50) ** 2, 0) / Math.max(1, iterations - 1)
  const r50StdDev = Math.sqrt(variance)

  return {
    strategy: 'random',
    strategyLabel: ROBUSTNESS_STRATEGY_INFO['random'].label,
    datasetId: graph.datasetId,
    totalSpecies: S,
    totalLinks: state.totalLinks,
    dunneConnectance: state.dunneConnectance,
    fwgConnectance: state.fwgConnectance,
    basalCount: state.basalCount,
    basalFraction: state.basalFraction,
    iterations,
    seed,
    meanR50,
    r50Percentile2_5,
    r50Percentile97_5,
    r50StdDev,
    thresholdReached: true,
    extinctionCurve,
    sampleRun,
  }
}

/**
 * Execute any robustness strategy by key.
 */
export function runRobustnessStrategy(
  graph: FoodWebGraph,
  strategy: RobustnessStrategy,
  options?: { iterations?: number; seed?: number },
): RobustnessResult {
  if (strategy === 'random') {
    return runRandomRemovals(graph, options)
  }
  return runDeterministicRemoval(graph, strategy)
}

/**
 * Executes all four published removal strategies for a given network.
 */
export function runAllRobustnessStrategies(
  graph: FoodWebGraph,
  options?: { iterations?: number; seed?: number },
): RobustnessLabRun {
  const state = initGraphState(graph)

  const stratA = runDeterministicRemoval(graph, 'most-connected')
  const stratB = runDeterministicRemoval(graph, 'most-connected-basal-protected')
  const stratC = runDeterministicRemoval(graph, 'least-connected')
  const stratD = runRandomRemovals(graph, options)

  return {
    datasetId: graph.datasetId,
    datasetName: graph.datasetId,
    totalSpecies: state.totalSpecies,
    totalLinks: state.totalLinks,
    dunneConnectance: state.dunneConnectance,
    fwgConnectance: state.fwgConnectance,
    basalCount: state.basalCount,
    basalFraction: state.basalFraction,
    results: {
      'most-connected': stratA,
      'most-connected-basal-protected': stratB,
      'least-connected': stratC,
      'random': stratD,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* CSV Export Utilities                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Exports comparative extinction curves to CSV for research documentation.
 */
export function exportExtinctionCurvesCsv(run: RobustnessLabRun): string {
  const headers = [
    'strategy',
    'strategy_label',
    'step_primary_count',
    'primary_removal_fraction',
    'total_loss_count',
    'total_loss_fraction',
    'mean_total_loss_fraction',
    'ci_2_5_loss_fraction',
    'ci_97_5_loss_fraction',
    'median_loss_fraction',
  ]

  const rows: string[] = [headers.join(',')]

  const strategies: RobustnessStrategy[] = [
    'most-connected',
    'most-connected-basal-protected',
    'least-connected',
    'random',
  ]

  for (const strat of strategies) {
    const res = run.results[strat]
    if (!res) continue

    for (const pt of res.extinctionCurve) {
      rows.push(
        [
          strat,
          `"${res.strategyLabel}"`,
          pt.primaryCount,
          pt.primaryFraction.toFixed(4),
          pt.totalLostCount,
          pt.totalLossFraction.toFixed(4),
          pt.meanTotalLossFraction !== undefined ? pt.meanTotalLossFraction.toFixed(4) : '',
          pt.percentile2_5TotalLossFraction !== undefined
            ? pt.percentile2_5TotalLossFraction.toFixed(4)
            : '',
          pt.percentile97_5TotalLossFraction !== undefined
            ? pt.percentile97_5TotalLossFraction.toFixed(4)
            : '',
          pt.medianTotalLossFraction !== undefined ? pt.medianTotalLossFraction.toFixed(4) : '',
        ].join(','),
      )
    }
  }

  return rows.join('\n')
}

/**
 * Exports step-by-step removal sequence to CSV for audit and inspection.
 */
export function exportStepReplayCsv(steps: readonly RobustnessStep[]): string {
  const headers = [
    'step',
    'primary_species_id',
    'primary_species_name',
    'primary_role',
    'primary_active_degree',
    'secondary_extinction_count',
    'secondary_species_ids',
    'cascade_rounds',
    'cumulative_primary',
    'cumulative_secondary',
    'cumulative_total_lost',
    'surviving_species_count',
    'primary_fraction',
    'total_loss_fraction',
  ]

  const rows: string[] = [headers.join(',')]

  for (const s of steps) {
    rows.push(
      [
        s.step,
        `"${s.primaryNodeId}"`,
        `"${s.primaryNodeName.replace(/"/g, '""')}"`,
        s.primaryNodeRole,
        s.primaryDegree,
        s.secondaryCount,
        `"${s.secondaryRemovedIds.join(';')}"`,
        s.cascadeRounds,
        s.cumulativePrimary,
        s.cumulativeSecondary,
        s.cumulativeTotalLost,
        s.survivingCount,
        s.primaryFraction.toFixed(4),
        s.totalLossFraction.toFixed(4),
      ].join(','),
    )
  }

  return rows.join('\n')
}

/* -------------------------------------------------------------------------- */
/* Pre-Implementation Dataset Audit & Eligibility                             */
/* -------------------------------------------------------------------------- */

export interface DatasetAuditRecord {
  datasetId: string
  datasetName: string
  ecosystem: string
  isDemo: boolean
  sourceStatus: string
  totalSpecies: number
  totalLinks: number
  dunneConnectance: number
  fwgConnectance: number
  basalCount: number
  basalFraction: number
  topPredatorCount: number
  intermediateCount: number
  strategyAEligible: boolean
  strategyBEligible: boolean
  strategyBReaches50: boolean
  strategyCEligible: boolean
  strategyDEligible: boolean
  strategyBNote: string
  eligibilityVerdict: 'Fully eligible' | 'Eligible with Strategy B threshold note'
}

/**
 * Audits a food web graph against Dunne, Williams, and Martinez (2002) criteria.
 * Verifies link directions, counts, basal nodes, and eligibility for all 4 strategies.
 */
export function auditDatasetEligibility(
  graph: FoodWebGraph,
  datasetInfo?: { name?: string; ecosystem?: string; isDemo?: boolean; sourceStatus?: string },
): DatasetAuditRecord {
  const state = initGraphState(graph)
  const S = state.totalSpecies
  const B = state.basalCount
  const basalFraction = state.basalFraction

  let topCount = 0
  let intermediateCount = 0

  for (const id of state.nodeIds) {
    const inDeg = (state.foodSourcesById.get(id) ?? []).length
    const outDeg = (state.consumersById.get(id) ?? []).length
    if (inDeg === 0) {
      // basal
    } else if (outDeg === 0) {
      topCount++
    } else {
      intermediateCount++
    }
  }

  // Under Strategy B, basal species cannot be primarily removed and never cascade.
  // If B >= 0.5 * S, total loss under Strategy B can never reach 50%.
  const strategyBReaches50 = basalFraction < 0.5
  const strategyBNote = strategyBReaches50
    ? `Eligible (Basal fraction ${(basalFraction * 100).toFixed(1)}% < 50%)`
    : `Threshold not reached: ${B} basal species (${(basalFraction * 100).toFixed(1)}%) are protected, so max total loss is ${((1 - basalFraction) * 100).toFixed(1)}%`

  return {
    datasetId: graph.datasetId,
    datasetName: datasetInfo?.name ?? graph.datasetId,
    ecosystem: datasetInfo?.ecosystem ?? 'ecosystem',
    isDemo: datasetInfo?.isDemo ?? false,
    sourceStatus: datasetInfo?.sourceStatus ?? 'research-verified',
    totalSpecies: S,
    totalLinks: state.totalLinks,
    dunneConnectance: state.dunneConnectance,
    fwgConnectance: state.fwgConnectance,
    basalCount: B,
    basalFraction,
    topPredatorCount: topCount,
    intermediateCount,
    strategyAEligible: S > 0,
    strategyBEligible: S > 0,
    strategyBReaches50,
    strategyCEligible: S > 0,
    strategyDEligible: S > 0,
    strategyBNote,
    eligibilityVerdict: strategyBReaches50 ? 'Fully eligible' : 'Eligible with Strategy B threshold note',
  }
}

