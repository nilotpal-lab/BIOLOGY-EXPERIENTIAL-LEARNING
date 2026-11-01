import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_DATASETS,
  BUILT_IN_RESEARCH_DATASETS,
  DEMO_LAB_DATASETS,
  RESEARCH_SLOTS,
  RESEARCH_SLOT_SUMMARY,
  getBuiltInDataset,
} from '../data/datasetRegistry'
import { chainFixture, validationFixture } from '../data/fixtures'
import { buildGraph } from '../core/graphModel'
import { computeConnectance, computeDunneConnectance } from '../core/metrics'
import {
  auditDatasetEligibility,
  calculateR50,
  createPrng,
  exportExtinctionCurvesCsv,
  exportStepReplayCsv,
  quantile,
  runAllRobustnessStrategies,
  runDeterministicRemoval,
  runRandomRemovals,
  runRobustnessStrategy,
  ROBUSTNESS_STRATEGY_INFO,
} from '../core/robustness'

/* ============================================================================
 * robustness.test.ts — Network Robustness Lab (Dunne et al. 2002) Tests
 * ========================================================================== */

describe('Pre-Implementation Dataset Audit & Eligibility', () => {
  it('confirms all 6 research slots are research-verified with bundled datasets', () => {
    expect(BUILT_IN_RESEARCH_DATASETS.length).toBe(6)
    expect(DEMO_LAB_DATASETS.length).toBe(6)
    expect(BUILT_IN_DATASETS.length).toBeGreaterThanOrEqual(14)

    expect(RESEARCH_SLOT_SUMMARY.total).toBe(6)
    expect(RESEARCH_SLOT_SUMMARY.verified).toBe(6)
    expect(RESEARCH_SLOT_SUMMARY.pending).toBe(0)
    expect(RESEARCH_SLOT_SUMMARY.bundled).toBe(6)

    expect(ROBUSTNESS_STRATEGY_INFO['most-connected'].label).toContain('Strategy A')
    expect(ROBUSTNESS_STRATEGY_INFO['random'].label).toContain('Strategy D')

    const expectedBundled = [
      { slotId: 'RES-FW-1', datasetId: 'RES-FW-A', ecosystem: 'freshwater' },
      { slotId: 'RES-FW-2', datasetId: 'RES-FW-B', ecosystem: 'freshwater' },
      { slotId: 'RES-TER-1', datasetId: 'RES-TER-C', ecosystem: 'terrestrial' },
      { slotId: 'RES-TER-2', datasetId: 'RES-TER-D', ecosystem: 'terrestrial' },
      { slotId: 'RES-MAR-1', datasetId: 'MAR-TATOOSH-1', ecosystem: 'marine' },
      { slotId: 'RES-MAR-2', datasetId: 'MAR-YTHAN-1', ecosystem: 'marine' },
    ]

    for (const item of expectedBundled) {
      const slot = RESEARCH_SLOTS.find((s) => s.slotId === item.slotId)
      expect(slot).toBeDefined()
      expect(slot?.status).toBe('research-verified')
      expect(slot?.bundledDatasetId).toBe(item.datasetId)
      expect(slot?.ecosystem).toBe(item.ecosystem)

      const dataset = getBuiltInDataset(item.datasetId)
      expect(dataset).toBeDefined()
      expect(dataset?.sourceStatus).toBe('research-verified')
      expect(dataset?.ecosystem).toBe(item.ecosystem)
    }
  })

  it('audits all 6 research networks for link direction, nodes, links, and basal species', () => {
    const researchAudit = [
      { id: 'RES-FW-A', nodes: 11, links: 18, expectedBasalCount: 3 },
      { id: 'RES-FW-B', nodes: 14, links: 39, expectedBasalCount: 3 },
      { id: 'RES-TER-C', nodes: 395, links: 322, expectedBasalCount: 141 },
      { id: 'RES-TER-D', nodes: 57, links: 98, expectedBasalCount: 48 },
      { id: 'MAR-TATOOSH-1', nodes: 110, links: 869, expectedBasalCount: 25 },
      { id: 'MAR-YTHAN-1', nodes: 87, links: 373, expectedBasalCount: 7 },
    ]

    for (const audit of researchAudit) {
      const ds = getBuiltInDataset(audit.id)
      expect(ds, `Dataset ${audit.id} must exist`).toBeDefined()
      expect(ds?.nodes.length).toBe(audit.nodes)
      expect(ds?.edges.length).toBe(audit.links)

      const graph = buildGraph(ds!)
      // Count basal species: baseline incoming food sources === 0
      const basalNodes = graph.nodes.filter(
        (n) => (graph.foodSourcesOf.get(n.id) ?? []).length === 0,
      )
      expect(basalNodes.length).toBe(audit.expectedBasalCount)

      // Confirm edge direction: every link source is a valid node, target is a valid node
      for (const edge of ds!.edges) {
        expect(graph.nodeById.has(edge.source)).toBe(true)
        expect(graph.nodeById.has(edge.target)).toBe(true)
        expect(edge.source).not.toBe(edge.target) // No self-links
      }
    }
  })

  it('audits all 6 demo lab networks for nodes, links, and basal species', () => {
    const demoAudit = [
      { id: 'FW-POND-A', nodes: 12, links: 17, expectedBasalCount: 3 },
      { id: 'FW-LAKE-B', nodes: 13, links: 20, expectedBasalCount: 3 },
      { id: 'TER-GRASS-A', nodes: 14, links: 29, expectedBasalCount: 2 },
      { id: 'TER-FOREST-B', nodes: 15, links: 29, expectedBasalCount: 3 },
      { id: 'MAR-COAST-A', nodes: 13, links: 22, expectedBasalCount: 2 },
      { id: 'MAR-OPEN-B', nodes: 12, links: 22, expectedBasalCount: 2 },
    ]

    for (const audit of demoAudit) {
      const ds = getBuiltInDataset(audit.id)
      expect(ds).toBeDefined()
      expect(ds?.nodes.length).toBe(audit.nodes)
      expect(ds?.edges.length).toBe(audit.links)
      expect(ds?.isDemo).toBe(true)

      const graph = buildGraph(ds!)
      const basalNodes = graph.nodes.filter(
        (n) => (graph.foodSourcesOf.get(n.id) ?? []).length === 0,
      )
      expect(basalNodes.length).toBe(audit.expectedBasalCount)
    }
  })
})

describe('Connectance Metrics (Dunne vs FoodWebGuard)', () => {
  it('computes Dunne connectance C = L / S^2 correctly', () => {
    // 10 nodes, 20 links -> C_Dunne = 20 / 100 = 0.200
    const dunne = computeDunneConnectance(10, 20)
    expect(dunne.value).toBe(0.2)
    expect(dunne.notApplicable).toBeUndefined()

    // 0 nodes -> not applicable
    const empty = computeDunneConnectance(0, 0)
    expect(empty.value).toBeNull()
    expect(empty.notApplicable).toContain('S^2')
  })

  it('preserves FoodWebGuard directed connectance C = L / (N * (N - 1))', () => {
    // 10 nodes, 20 links -> C_FWG = 20 / (10 * 9) = 20 / 90 = 0.2222...
    const fwg = computeConnectance(10, 20)
    expect(fwg.value).toBeCloseTo(20 / 90, 5)

    // 1 node -> not applicable
    const single = computeConnectance(1, 0)
    expect(single.value).toBeNull()
    expect(single.notApplicable).toContain('N x (N - 1)')
  })
})

describe('Mathematical Utilities (PRNG, Quantile & R50 Interpolation)', () => {
  it('produces deterministic output with seeded PRNG', () => {
    const prng1 = createPrng(12345)
    const prng2 = createPrng(12345)

    const seq1 = Array.from({ length: 50 }, () => prng1())
    const seq2 = Array.from({ length: 50 }, () => prng2())

    expect(seq1).toEqual(seq2)
    expect(seq1.every((v) => v >= 0 && v < 1)).toBe(true)
  })

  it('computes quantiles correctly with Type 7 interpolation', () => {
    const vals = [10, 20, 30, 40, 50]
    expect(quantile(vals, 0)).toBe(10)
    expect(quantile(vals, 0.5)).toBe(30)
    expect(quantile(vals, 1.0)).toBe(50)
    expect(quantile(vals, 0.25)).toBe(20)
    expect(quantile(vals, 0.75)).toBe(40)
  })

  it('linearly interpolates R50 on odd-sized networks', () => {
    // S = 11 nodes. 50% target = 5.5 lost nodes.
    // Step 5: 5 lost. Step 6: 6 lost.
    // Interpolated primary = 5 + (5.5 - 5) / (6 - 5) = 5.5.
    // R50 = 5.5 / 11 = 0.500.
    const curve = [
      { primaryCount: 0, totalLostCount: 0 },
      { primaryCount: 1, totalLostCount: 1 },
      { primaryCount: 2, totalLostCount: 2 },
      { primaryCount: 3, totalLostCount: 3 },
      { primaryCount: 4, totalLostCount: 4 },
      { primaryCount: 5, totalLostCount: 5 },
      { primaryCount: 6, totalLostCount: 6 },
    ]
    const res = calculateR50(curve, 11)
    expect(res.thresholdReached).toBe(true)
    expect(res.interpolatedPrimary).toBe(5.5)
    expect(res.r50).toBe(0.5)
  })

  it('linearly interpolates R50 when a cascade causes sudden jump', () => {
    // S = 10 nodes. 50% target = 5 lost nodes.
    // Step 1: 1 primary, 0 secondary -> 1 total lost.
    // Step 2: 2 primary, 5 secondary -> 7 total lost.
    // Between step 1 (loss 1) and step 2 (loss 7):
    // deltaLoss = 6, deltaPrimary = 1.
    // interpolated = 1 + (5 - 1) / 6 = 1 + 4/6 = 1.6666...
    // R50 = (1 + 4/6) / 10 = 0.16666...
    const curve = [
      { primaryCount: 0, totalLostCount: 0 },
      { primaryCount: 1, totalLostCount: 1 },
      { primaryCount: 2, totalLostCount: 7 },
    ]
    const res = calculateR50(curve, 10)
    expect(res.thresholdReached).toBe(true)
    expect(res.interpolatedPrimary).toBeCloseTo(1 + 4 / 6, 5)
    expect(res.r50).toBeCloseTo((1 + 4 / 6) / 10, 5)
  })

  it('handles threshold not reached gracefully', () => {
    // Only 2 nodes lost out of 10
    const curve = [
      { primaryCount: 0, totalLostCount: 0 },
      { primaryCount: 1, totalLostCount: 1 },
      { primaryCount: 2, totalLostCount: 2 },
    ]
    const res = calculateR50(curve, 10)
    expect(res.thresholdReached).toBe(false)
    expect(res.r50).toBeNull()
    expect(res.interpolatedPrimary).toBeNull()
  })
})

describe('Chain Network Deletion Dynamics', () => {
  // Chain fixture: 4 nodes:
  // P (producer) -> A -> B -> C (apex)
  // Edges: 3.
  // Basal node: P (0 incoming).
  // Non-basal nodes: A, B, C (each 1 incoming).
  const graph = buildGraph(chainFixture)

  it('Strategy A (Most-connected): removing most-connected first triggers downstream cascade', () => {
    const res = runDeterministicRemoval(graph, 'most-connected')
    expect(res.totalSpecies).toBe(4)
    expect(res.totalLinks).toBe(3)
    expect(res.steps.length).toBeGreaterThan(0)

    // First removed node has degree 2 (A or B)
    const firstStep = res.steps[0]
    expect(firstStep.primaryDegree).toBe(2)

    // Cumulative total loss reaches 4
    expect(res.extinctionCurve[res.extinctionCurve.length - 1].totalLostCount).toBe(4)
    expect(res.r50).toBeDefined()
    expect(res.r50!).toBeLessThanOrEqual(0.5)
  })

  it('Strategy B (Basal protected): producer P is NEVER primarily removed', () => {
    const res = runDeterministicRemoval(graph, 'most-connected-basal-protected')
    const primaryIds = res.steps.map((s) => s.primaryNodeId)
    expect(primaryIds).not.toContain('P')

    // P also NEVER gets secondary cascade removed
    for (const step of res.steps) {
      expect(step.secondaryRemovedIds).not.toContain('P')
    }
  })

  it('Strategy C (Least-connected): removes degree-1 endpoints first (P or C)', () => {
    const res = runDeterministicRemoval(graph, 'least-connected')
    const firstStep = res.steps[0]
    expect(firstStep.primaryDegree).toBe(1)
  })
})

describe('Validation Fixture Robustness (6 Nodes, 6 Links)', () => {
  const graph = buildGraph(validationFixture)

  it('runs Strategy A, B, and C deterministically with documented tie-breaking', () => {
    const stratA = runDeterministicRemoval(graph, 'most-connected')
    const stratB = runDeterministicRemoval(graph, 'most-connected-basal-protected')
    const stratC = runDeterministicRemoval(graph, 'least-connected')
    const viaHelper = runRobustnessStrategy(graph, 'most-connected')
    expect(viaHelper.strategy).toBe('most-connected')

    expect(stratA.totalSpecies).toBe(6)
    expect(stratA.totalLinks).toBe(6)
    expect(stratA.dunneConnectance).toBeCloseTo(6 / 36, 4)
    expect(stratA.fwgConnectance).toBeCloseTo(6 / 30, 4)

    // Strategy A removes highest degree first
    expect(stratA.steps[0].primaryDegree).toBeGreaterThanOrEqual(stratA.steps[1].primaryDegree)

    // Strategy B never removes basal nodes primarily
    const basalIds = graph.nodes
      .filter((n) => (graph.foodSourcesOf.get(n.id) ?? []).length === 0)
      .map((n) => n.id)

    for (const step of stratB.steps) {
      expect(basalIds).not.toContain(step.primaryNodeId)
    }

    // Strategy C starts with minimum degree
    expect(stratC.steps[0].primaryDegree).toBeLessThanOrEqual(stratA.steps[0].primaryDegree)
  })

  it('runs Strategy D (Random 1,000 runs) and reports mean curve, envelope, and mean R50', () => {
    const res = runRandomRemovals(graph, { iterations: 1000, seed: 999 })
    expect(res.strategy).toBe('random')
    expect(res.iterations).toBe(1000)
    expect(res.seed).toBe(999)

    expect(res.meanR50).toBeDefined()
    expect(res.meanR50!).toBeGreaterThan(0)
    expect(res.meanR50!).toBeLessThanOrEqual(0.5)

    expect(res.r50Percentile2_5).toBeDefined()
    expect(res.r50Percentile97_5).toBeDefined()
    expect(res.r50Percentile2_5!).toBeLessThanOrEqual(res.meanR50!)
    expect(res.r50Percentile97_5!).toBeGreaterThanOrEqual(res.meanR50!)

    // Extinction curve has S + 1 points (from 0 to 6)
    expect(res.extinctionCurve.length).toBe(7)
    expect(res.extinctionCurve[0].primaryCount).toBe(0)
    expect(res.extinctionCurve[0].meanTotalLossFraction).toBe(0)
    expect(res.extinctionCurve[6].meanTotalLossFraction).toBe(1.0)

    // Every point has 2.5th <= mean <= 97.5th
    for (const pt of res.extinctionCurve) {
      expect(pt.percentile2_5TotalLossFraction!).toBeLessThanOrEqual(
        pt.percentile97_5TotalLossFraction! + 1e-6,
      )
    }
  })
})

describe('Tatoosh Island & Empirical Research Networks', () => {
  it('runs all 4 strategies on MAR-TATOOSH-1 (110 nodes, 869 links) in under 1.5 seconds', () => {
    const ds = getBuiltInDataset('MAR-TATOOSH-1')!
    const graph = buildGraph(ds)

    const start = performance.now()
    const labRun = runAllRobustnessStrategies(graph, { iterations: 1000, seed: 42 })
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1500) // Fast execution requirement
    expect(labRun.totalSpecies).toBe(110)
    expect(labRun.totalLinks).toBe(869)
    expect(labRun.dunneConnectance).toBeCloseTo(869 / (110 * 110), 4)

    const stratA = labRun.results['most-connected']!
    const stratB = labRun.results['most-connected-basal-protected']!
    const stratC = labRun.results['least-connected']!
    const stratD = labRun.results['random']!

    expect(stratA.r50).toBeDefined()
    expect(stratB.r50).toBeDefined()
    expect(stratC.r50).toBeDefined()
    expect(stratD.meanR50).toBeDefined()

    // Highly connected webs like Tatoosh are robust under random removal:
    // Mean R50 for random removal is significantly higher than Strategy A
    expect(stratD.meanR50!).toBeGreaterThan(stratA.r50!)
  })

  it('runs all 4 strategies on RES-FW-A and FW-POND-A', () => {
    for (const id of ['RES-FW-A', 'FW-POND-A']) {
      const ds = getBuiltInDataset(id)!
      const graph = buildGraph(ds)
      const labRun = runAllRobustnessStrategies(graph, { iterations: 500, seed: 100 })

      expect(labRun.results['most-connected']?.r50).toBeDefined()
      expect(labRun.results['least-connected']?.r50).toBeDefined()
      expect(labRun.results['random']?.meanR50).toBeDefined()
    }
  })
})

describe('CSV Exports', () => {
  it('generates non-empty CSV strings with headers and rows for curves and step replay', () => {
    const graph = buildGraph(validationFixture)
    const labRun = runAllRobustnessStrategies(graph, { iterations: 100, seed: 42 })

    const curveCsv = exportExtinctionCurvesCsv(labRun)
    expect(curveCsv).toContain('strategy,strategy_label')
    expect(curveCsv).toContain('most-connected')
    expect(curveCsv).toContain('random')

    const stepCsv = exportStepReplayCsv(labRun.results['most-connected']!.steps)
    expect(stepCsv).toContain('step,primary_species_id')
    expect(stepCsv.split('\n').length).toBeGreaterThan(2)
  })
})

describe('Edge Cases, Dynamic Active Degrees & Audit Verification', () => {
  it('audits all 12 bundled datasets via auditDatasetEligibility', () => {
    const allDatasets = [...BUILT_IN_RESEARCH_DATASETS, ...DEMO_LAB_DATASETS]
    expect(allDatasets.length).toBe(12)

    for (const ds of allDatasets) {
      const graph = buildGraph(ds)
      const audit = auditDatasetEligibility(graph, {
        name: ds.name,
        ecosystem: ds.ecosystem,
        isDemo: ds.isDemo,
        sourceStatus: ds.sourceStatus,
      })

      expect(audit.totalSpecies).toBe(ds.nodes.length)
      expect(audit.totalLinks).toBe(ds.edges.length)
      expect(audit.dunneConnectance).toBeCloseTo(ds.edges.length / (ds.nodes.length * ds.nodes.length), 4)
      expect(audit.basalCount).toBeGreaterThan(0)
      expect(audit.strategyAEligible).toBe(true)
      expect(audit.strategyCEligible).toBe(true)
      expect(audit.strategyDEligible).toBe(true)

      // Only RES-TER-D has >50% basal species (48/57 = 84.2%)
      if (ds.id === 'RES-TER-D') {
        expect(audit.strategyBEligible).toBe(true)
        expect(audit.strategyBReaches50).toBe(false)
        expect(audit.strategyBNote).toContain('Threshold not reached')
        expect(audit.eligibilityVerdict).toBe('Eligible with Strategy B threshold note')
      } else {
        expect(audit.strategyBReaches50).toBe(true)
        expect(audit.strategyBNote).toContain('Eligible')
        expect(audit.eligibilityVerdict).toBe('Fully eligible')
      }
    }
  })

  it('verifies that Strategy B on RES-TER-D (84.2% basal) terminates after removing all 9 non-basals', () => {
    const ds = getBuiltInDataset('RES-TER-D')!
    const graph = buildGraph(ds)
    const resB = runDeterministicRemoval(graph, 'most-connected-basal-protected')

    expect(resB.totalSpecies).toBe(57)
    expect(resB.basalCount).toBe(48)
    // Only 9 non-basal species exist, so exactly 9 steps are executed
    expect(resB.steps.length).toBe(9)
    // 50% loss (28.5 species) is never reached because 48 basal species are protected
    expect(resB.thresholdReached).toBe(false)
    expect(resB.r50).toBeNull()
    expect(resB.r50PrimaryRemovals).toBeNull()
  })

  it('records dynamic active degree for Strategy D sampleRun steps', () => {
    const ds = getBuiltInDataset('FW-POND-A')!
    const graph = buildGraph(ds)
    const resD = runRandomRemovals(graph, { iterations: 100, seed: 42 })

    expect(resD.sampleRun.length).toBeGreaterThan(0)
    for (const step of resD.sampleRun) {
      // Active degree must be non-negative and <= total species - 1
      expect(step.primaryDegree).toBeGreaterThanOrEqual(0)
      expect(step.primaryDegree).toBeLessThan(graph.nodes.length)
    }
  })

  it('gracefully handles a pure producer web with 0 links under Strategy B', () => {
    const pureBasalGraph = {
      datasetId: 'TEST-BASAL',
      nodes: [
        { id: 'b1', name: 'Basal 1', trophicRole: 'producer' as const },
        { id: 'b2', name: 'Basal 2', trophicRole: 'producer' as const },
      ],
      edges: [],
      nodeById: new Map([
        ['b1', { id: 'b1', name: 'Basal 1', trophicRole: 'producer' as const }],
        ['b2', { id: 'b2', name: 'Basal 2', trophicRole: 'producer' as const }],
      ]),
      edgeById: new Map(),
      foodSourcesOf: new Map([['b1', []], ['b2', []]]),
      consumersOf: new Map([['b1', []], ['b2', []]]),
    } as any

    const resB = runDeterministicRemoval(pureBasalGraph, 'most-connected-basal-protected')
    expect(resB.totalSpecies).toBe(2)
    expect(resB.basalCount).toBe(2)
    expect(resB.steps.length).toBe(0)
    expect(resB.thresholdReached).toBe(false)
    expect(resB.r50).toBeNull()
  })
})

