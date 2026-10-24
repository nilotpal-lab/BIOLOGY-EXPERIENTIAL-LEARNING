import { describe, expect, it } from 'vitest'
import {
  baselineIncomingCount,
  buildGraph,
  isolatedNodeIds,
  survivingEdges,
  survivingNodes,
  validateGraphIntegrity,
} from '../core/graphModel'
import { computeBaselineMetrics, computeConnectance, computeLinkLossPercent } from '../core/metrics'
import {
  runCascadeScenario,
  runDirectRemovalScenario,
  ScenarioInputError,
} from '../core/scenarios'
import { testDataset, testNode } from './helpers'
import { demoDatasets } from '../data/demoDatasets'
import { validationFixture, chainFixture } from '../data/fixtures'

/* ============================================================================
 * Master Build Prompt §11 — every case below is required behaviour.
 * Cases that belong to the import pipeline are covered in
 * dataValidation.test.ts (Cases 10, 11, 12, 20) and Case 24 in the UI tests.
 * ========================================================================== */

describe('Case 1 — select a valid node in an ordinary network', () => {
  const graph = buildGraph(validationFixture)

  it('runs the simulation and reports metrics with no page refresh required', () => {
    const direct = runDirectRemovalScenario(graph, 'fixture', 'small_fish')
    const cascade = runCascadeScenario(graph, 'fixture', 'small_fish')
    expect(direct.scenario.nodeCount).toBe(5)
    expect(cascade.scenario.nodeCount).toBe(4)
  })

  it('rejects a node that is not in the dataset instead of producing a wrong result', () => {
    expect(() => runDirectRemovalScenario(graph, 'fixture', 'not_a_node')).toThrow(
      ScenarioInputError,
    )
    try {
      runDirectRemovalScenario(graph, 'fixture', 'not_a_node')
    } catch (error) {
      expect((error as ScenarioInputError).code).toBe('UNKNOWN_NODE')
    }
  })

  it('rejects an empty selection and an empty dataset with clear reasons', () => {
    expect(() => runDirectRemovalScenario(graph, 'fixture', '')).toThrow(/Select a species/)
    const empty = testDataset('EMPTY-1', [], [])
    expect(() => runDirectRemovalScenario(buildGraph(empty), 'empty', 'anything')).toThrow(
      /No valid graph is loaded/,
    )
  })
})

describe('Case 2 — a consumer with alternative food sources', () => {
  const graph = buildGraph(validationFixture)

  it('flags the snail as affected but never removes it because it keeps a food link', () => {
    const direct = runDirectRemovalScenario(graph, 'fixture', 'algae')
    const cascade = runCascadeScenario(graph, 'fixture', 'algae')

    expect(direct.scenario.directlyAffectedConsumerIds).toContain('snail')
    expect(direct.scenario.foodDepletedConsumerIds).not.toContain('snail')
    expect(cascade.removedNodeIds).not.toContain('snail')
    expect(cascade.removedNodeIds).not.toContain('small_fish')
  })
})

describe('Case 3 — a consumer loses its only recorded food source', () => {
  const graph = buildGraph(validationFixture)

  it('stays visible and flagged in direct mode, and cascades in cascade mode', () => {
    const direct = runDirectRemovalScenario(graph, 'fixture', 'small_fish')
    const cascade = runCascadeScenario(graph, 'fixture', 'small_fish')

    expect(direct.scenario.foodDepletedConsumerIds).toEqual(['heron'])
    expect(direct.removedNodeIds).toEqual(['small_fish'])
    expect(cascade.rounds[0].removals.map((removal) => removal.nodeId)).toEqual(['heron'])
  })
})

describe('Case 4 — a producer has no incoming edges', () => {
  it('is never treated as an endangered consumer', () => {
    const graph = buildGraph(validationFixture)
    expect(baselineIncomingCount(graph, 'algae')).toBe(0)

    // Removing a different node must never remove the producer.
    const cascade = runCascadeScenario(graph, 'fixture', 'small_fish')
    expect(cascade.removedNodeIds).not.toContain('algae')

    // The documented cascade rule is structural: a node that loses its only
    // recorded food source is removed, and the reported role is context only.
    // (See rules.ts — role is never used as an extra eligibility condition.)
    const odd = testDataset(
      'PRODUCER-IN',
      [
        testNode('upper_producer', 'producer'),
        testNode('lower_producer', 'producer'),
        testNode('grazer', 'primary-consumer'),
      ],
      [
        ['upper_producer', 'lower_producer'],
        ['lower_producer', 'grazer'],
      ],
    )
    const oddGraph = buildGraph(odd)
    const result = runCascadeScenario(oddGraph, 'odd', 'upper_producer')
    expect(result.rounds.map((round) => round.removals.map((entry) => entry.nodeId))).toEqual([
      ['lower_producer'],
      ['grazer'],
    ])
    expect(result.scenario.secondaryRemovals).toBe(2)
  })
})

describe('Case 5 — a node already had zero incoming baseline links', () => {
  it('is not cascade-removed under the food-loss rule', () => {
    const dataset = testDataset(
      'BASELINE-EMPTY-CONSUMER',
      [
        testNode('producer', 'producer'),
        testNode('grazer', 'primary-consumer'),
        testNode('starved_before', 'secondary-consumer', { name: 'No recorded food' }),
      ],
      [['producer', 'grazer']],
    )
    const graph = buildGraph(dataset)
    expect(baselineIncomingCount(graph, 'starved_before')).toBe(0)

    const result = runCascadeScenario(graph, 'baseline-empty', 'producer')
    expect(result.removedNodeIds).toEqual(['producer', 'grazer'])
    expect(result.removedNodeIds).not.toContain('starved_before')
    expect(result.scenario.secondaryRemovals).toBe(1)
    expect(result.scenario.cascadeDepth).toBe(1)
  })
})

describe('Case 6 — a one-node dataset with zero links', () => {
  const dataset = testDataset('ONE-NODE', [testNode('lonely', 'producer')], [])
  const graph = buildGraph(dataset)

  it('renders, does not crash, and reports not-applicable metrics honestly', () => {
    const baseline = computeBaselineMetrics(graph)
    expect(baseline.nodeCount).toBe(1)
    expect(baseline.linkCount).toBe(0)
    expect(baseline.connectance.value).toBeNull()
    expect(baseline.connectance.notApplicable).toMatch(/at least two nodes/)

    const result = runDirectRemovalScenario(graph, 'one-node', 'lonely')
    expect(result.scenario.nodeCount).toBe(0)
    expect(result.scenario.linkLossPercent.value).toBeNull()
    expect(result.scenario.linkLossPercent.notApplicable).toMatch(/no feeding links/)
    expect(result.scenario.connectance.value).toBeNull()
    expect(result.scenario.removedPercentOfBaseline.value).toBeCloseTo(100, 10)
  })
})

describe('Case 7 — an empty dataset', () => {
  it('explains that no valid graph is loaded and blocks scenario analysis', () => {
    const graph = buildGraph(testDataset('EMPTY', [], []))
    expect(graph.nodes).toHaveLength(0)
    expect(() => runCascadeScenario(graph, 'empty', 'x')).toThrow(/No valid graph is loaded/)
    const issues = validateGraphIntegrity(testDataset('EMPTY', [], []))
    expect(issues.some((issue) => issue.code === 'EMPTY_NETWORK')).toBe(true)
  })
})

describe('Case 8 — nodes but no links', () => {
  const dataset = testDataset(
    'NO-LINKS',
    [testNode('a', 'producer'), testNode('b', 'producer'), testNode('c', 'primary-consumer')],
    [],
  )
  const graph = buildGraph(dataset)

  it('shows the nodes, reports zero links and connectance 0 with N >= 2', () => {
    const baseline = computeBaselineMetrics(graph)
    expect(baseline.nodeCount).toBe(3)
    expect(baseline.linkCount).toBe(0)
    expect(baseline.connectance.value).toBe(0)

    const result = runDirectRemovalScenario(graph, 'no-links', 'a')
    expect(result.scenario.linkLossPercent.value).toBeNull()
    expect(result.warnings.some((warning) => warning.code === 'BASELINE_NO_LINKS')).toBe(true)
  })
})

describe('Case 9 — an isolated node inside a larger network', () => {
  const dataset = testDataset(
    'ISOLATED',
    [
      testNode('producer', 'producer'),
      testNode('grazer', 'primary-consumer'),
      testNode('hermit', 'primary-consumer', { name: 'Hermit' }),
    ],
    [['producer', 'grazer']],
  )
  const graph = buildGraph(dataset)

  it('is preserved and reported rather than silently discarded', () => {
    expect(isolatedNodeIds(graph)).toEqual(['hermit'])
    const removed = new Set<string>(['producer'])
    expect(survivingNodes(graph, removed).map((node) => node.id)).toContain('hermit')
    const issues = validateGraphIntegrity(dataset)
    expect(issues.some((issue) => issue.code === 'ISOLATED_NODE' && issue.nodeId === 'hermit')).toBe(
      true,
    )
  })
})

describe('Case 13 — a cyclic network', () => {
  const dataset = testDataset(
    'CYCLIC',
    [
      testNode('x', 'primary-consumer'),
      testNode('y', 'secondary-consumer'),
      testNode('z', 'apex-predator'),
    ],
    [
      ['x', 'y'],
      ['y', 'z'],
      ['z', 'x'],
    ],
  )
  const graph = buildGraph(dataset)

  it('never assumes an acyclic chain and always terminates', () => {
    const result = runCascadeScenario(graph, 'cyclic', 'x')
    // After removing x, y has no remaining food source and is removed; z keeps
    // its recorded link from y until y is removed, then qualifies in round 2.
    expect(result.scenario.cascadeDepth).toBe(2)
    expect(result.scenario.secondaryRemovals).toBe(2)
    expect(result.removedNodeIds).toHaveLength(3)
  })
})

describe('Case 14 — all eligible consumers have already been removed', () => {
  it('removes zero nodes in the next round and stops without inventing rounds', () => {
    const graph = buildGraph(validationFixture)
    const result = runCascadeScenario(graph, 'fixture', 'small_fish')
    // Exactly one round happened, and the round after it found nobody.
    expect(result.rounds).toHaveLength(1)
    const afterFirst = new Set(result.removedNodeIds)
    const stillEligible = survivingNodes(graph, afterFirst).filter((node) => {
      const incoming = baselineIncomingCount(graph, node.id)
      if (incoming === 0) return false
      const remaining = survivingEdges(graph, afterFirst).filter((edge) => edge.target === node.id)
      return remaining.length === 0
    })
    // The only node left in that state is a producer-adjacent case that the rule
    // deliberately does not remove; the important assertion is that no round
    // beyond the recorded ones exists and no node is removed twice.
    expect(new Set(result.removedNodeIds).size).toBe(result.removedNodeIds.length)
    expect(stillEligible.every((node) => node.trophicRole === 'producer')).toBe(true)
  })
})

describe('Case 15 — Analyse All Species independence', () => {
  it('starts every scenario from the immutable baseline', () => {
    const graph = buildGraph(validationFixture)
    const before = graph.edges.length

    runDirectRemovalScenario(graph, 'fixture', 'algae')
    runCascadeScenario(graph, 'fixture', 'algae')
    const second = runDirectRemovalScenario(graph, 'fixture', 'small_fish')

    expect(graph.edges.length).toBe(before)
    // The second scenario behaves exactly as if it had run first.
    expect(second.scenario.linkCount).toBe(3)
    expect(second.removedNodeIds).toEqual(['small_fish'])
  })
})

describe('Case 17 — unknown trophic-role evidence (Prompt §5 Example 11)', () => {
  it('still runs the structural rule and keeps the role uncertainty unchanged', () => {
    const dataset = testDataset(
      'UNKNOWN-ROLE',
      [
        testNode('x', 'other', { roleEvidence: 'unknown' }),
        testNode('y', 'other', { roleEvidence: 'unknown' }),
        testNode('z', 'other', { roleEvidence: 'unknown' }),
      ],
      [
        ['x', 'y'],
        ['y', 'z'],
      ],
    )
    const graph = buildGraph(dataset)
    const result = runCascadeScenario(graph, 'unknown-role', 'x')

    // Y in round 1, Z in round 2 — unknown role evidence must not disable the
    // explicitly defined structural calculation.
    expect(result.rounds.map((round) => round.removals.map((entry) => entry.nodeId))).toEqual([
      ['y'],
      ['z'],
    ])
    expect(result.scenario.cascadeDepth).toBe(2)
    expect(result.scenario.secondaryRemovals).toBe(2)
    expect(result.removedNodeIds).toHaveLength(3)
    // The uncertainty label is preserved, not silently promoted to a verified role.
    expect(graph.nodes.every((node) => node.roleEvidence === 'unknown')).toBe(true)
    expect(graph.nodes.map((node) => node.trophicRole)).toEqual(['other', 'other', 'other'])
  })
})

describe('Case 18 — no cascade occurs', () => {
  it('reports zero depth and states that no secondary removals occurred', () => {
    const dataset = testDataset(
      'ROBUST',
      [
        testNode('grass', 'producer'),
        testNode('clover', 'producer'),
        testNode('grazer', 'primary-consumer'),
      ],
      [
        ['grass', 'grazer'],
        ['clover', 'grazer'],
      ],
    )
    const graph = buildGraph(dataset)
    const result = runCascadeScenario(graph, 'robust', 'grass')

    expect(result.scenario.secondaryRemovals).toBe(0)
    expect(result.scenario.cascadeDepth).toBe(0)
    expect(result.rounds).toHaveLength(0)
    expect(result.warnings.some((warning) => warning.code === 'NO_SECONDARY_REMOVALS')).toBe(true)
    expect(result.warnings.find((w) => w.code === 'NO_SECONDARY_REMOVALS')?.message).toMatch(
      /not evidence that the food web is robust in nature/,
    )
  })
})

describe('Case 19 — a scenario that removes every node', () => {
  it('displays an empty network without dividing by zero', () => {
    const graph = buildGraph(chainFixture)
    const result = runCascadeScenario(graph, 'chain', 'P')

    expect(result.scenario.nodeCount).toBe(0)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(100, 10)
    expect(result.scenario.connectance.value).toBeNull()
    expect(result.scenario.secondaryPercentOfBaseline.value).toBeCloseTo(75, 10)
    expect(result.warnings.some((warning) => warning.code === 'NETWORK_EMPTY_AFTER_SCENARIO')).toBe(
      true,
    )
  })
})

describe('Case 21 — reset', () => {
  it('restores the exact original node and edge set without mutating the dataset', () => {
    const graph = buildGraph(validationFixture)
    const originalNodes = validationFixture.nodes.map((node) => node.id)
    const originalEdges = validationFixture.edges.map((edge) => edge.id)

    runCascadeScenario(graph, 'fixture', 'algae')
    runCascadeScenario(graph, 'fixture', 'small_fish')

    // The baseline graph is never mutated by a scenario.
    expect(graph.nodes.map((node) => node.id)).toEqual(originalNodes)
    expect(graph.edges.map((edge) => edge.id)).toEqual(originalEdges)
    expect(validationFixture.nodes.map((node) => node.id)).toEqual(originalNodes)
    expect(validationFixture.edges.map((edge) => edge.id)).toEqual(originalEdges)
  })
})

describe('Case 22 — switching datasets', () => {
  it('keeps each dataset\'s baseline and results independent', () => {
    const a = buildGraph(validationFixture)
    const b = buildGraph(chainFixture)

    const resultA = runDirectRemovalScenario(a, 'a', 'algae')
    const resultB = runDirectRemovalScenario(b, 'b', 'P')

    expect(resultA.datasetId).toBe(validationFixture.id)
    expect(resultB.datasetId).toBe(chainFixture.id)
    expect(resultA.baseline.linkCount).toBe(6)
    expect(resultB.baseline.linkCount).toBe(3)
    expect(resultA.removedNodeIds).toEqual(['algae'])
    expect(resultB.removedNodeIds).toEqual(['P'])
  })
})

describe('Case 23 — switching analysis modes', () => {
  it('keeps direct and cascade results separate but based on the same baseline', () => {
    const graph = buildGraph(validationFixture)
    const direct = runDirectRemovalScenario(graph, 'fixture', 'algae')
    const cascade = runCascadeScenario(graph, 'fixture', 'algae')

    expect(direct.mode).toBe('direct')
    expect(cascade.mode).toBe('cascade')
    expect(direct.baseline).toEqual(cascade.baseline)
    expect(direct.scenario.nodeCount).toBe(5)
    expect(cascade.scenario.nodeCount).toBe(4)
  })
})

describe('metric guards never divide by zero', () => {
  it('returns a not-applicable value instead of a fake zero', () => {
    expect(computeLinkLossPercent(0, 0).value).toBeNull()
    expect(computeLinkLossPercent(0, 0).notApplicable).toBeTruthy()
    expect(computeConnectance(1, 0).value).toBeNull()
    expect(computeConnectance(0, 0).value).toBeNull()
    expect(computeConnectance(2, 1).value).toBeCloseTo(0.5, 10)
  })

  it('shows connectance can rise after a removal when the denominator shrinks faster', () => {
    const baseline = computeConnectance(6, 6)
    const afterRemoval = computeConnectance(5, 5)
    expect(baseline.value).toBeCloseTo(0.2, 10)
    expect(afterRemoval.value).toBeCloseTo(0.25, 10)
    expect(afterRemoval.value! > baseline.value!).toBe(true)
  })
})

describe('shipped demo networks', () => {
  it('all pass structural integrity checks', () => {
    for (const dataset of demoDatasets) {
      const errors = validateGraphIntegrity(dataset).filter((issue) => issue.severity === 'error')
      expect(errors, `dataset ${dataset.id} has structural errors`).toEqual([])
    }
  })

  it('all have a workable number of nodes and links, and no isolated nodes', () => {
    for (const dataset of demoDatasets) {
      expect(dataset.nodes.length, `${dataset.id} node count`).toBeGreaterThanOrEqual(9)
      expect(dataset.nodes.length, `${dataset.id} node count`).toBeLessThanOrEqual(15)
      expect(dataset.edges.length, `${dataset.id} link count`).toBeGreaterThan(5)
      expect(isolatedNodeIds(buildGraph(dataset)), `${dataset.id} isolated nodes`).toEqual([])
    }
  })

  it('are labelled as illustrative demo data with the required notice', () => {
    for (const dataset of demoDatasets) {
      expect(dataset.sourceStatus).toBe('illustrative-demo')
      expect(dataset.provenance.citation).toMatch(/not a verified empirical food-web dataset/)
    }
  })

  it('give every consumer at least one recorded food source so effects are demonstrable', () => {
    for (const dataset of demoDatasets) {
      const graph = buildGraph(dataset)
      for (const node of graph.nodes) {
        if (node.trophicRole === 'producer' || node.trophicRole === 'basal-group') continue
        expect(
          baselineIncomingCount(graph, node.id),
          `${dataset.id} / ${node.id} has no recorded food source`,
        ).toBeGreaterThan(0)
      }
    }
  })
})
