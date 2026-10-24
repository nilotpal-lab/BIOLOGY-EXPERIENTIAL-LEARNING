import { describe, expect, it } from 'vitest'
import { buildGraph, labelOf } from '../core/graphModel'
import { computeBaselineMetrics } from '../core/metrics'
import { runCascadeScenario, runDirectRemovalScenario } from '../core/scenarios'
import { chainFixture, validationFixture, VALIDATION_EXPECTATIONS } from '../data/fixtures'

/* ============================================================================
 * Manual fixture validation (Master Build Prompt §10, §18)
 *
 * These tests compare the program's output with results that were calculated by
 * hand from the fixture definition. They are the scientific acceptance test.
 * ========================================================================== */

const fixtureFor = (nodeId: string) =>
  nodeId === 'P' ? chainFixture : validationFixture

describe('VALIDATION-FOODWEB-6 baseline', () => {
  const graph = buildGraph(validationFixture)
  const baseline = computeBaselineMetrics(graph)

  it('has exactly 6 nodes and 6 directed feeding links', () => {
    expect(baseline.nodeCount).toBe(6)
    expect(baseline.linkCount).toBe(6)
  })

  it('has connectance 6 / (6 x 5) = 0.200', () => {
    expect(baseline.connectance.value).toBeCloseTo(0.2, 10)
  })

  it('reports link loss as not applicable before anything is removed', () => {
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'algae')
    const baselineOnly = computeBaselineMetrics(graph)
    expect(baselineOnly.linkCount).toBe(6)
    // There is no scenario that removes nothing, so link loss has no baseline
    // value to report; the guard itself is asserted in metrics.test.ts.
    expect(result.baseline.linkCount).toBe(6)
  })

  it('keeps every edge pointing from the food organism to the consumer', () => {
    for (const edge of graph.edges) {
      expect(edge.source).toBeTruthy()
      expect(edge.target).toBeTruthy()
      expect(edge.source).not.toBe(edge.target)
    }
    // Spot-check the mandated direction on two edges.
    const algaeToZooplankton = graph.edges.find(
      (edge) => edge.source === 'algae' && edge.target === 'zooplankton',
    )
    const fishToHeron = graph.edges.find(
      (edge) => edge.source === 'small_fish' && edge.target === 'heron',
    )
    expect(algaeToZooplankton).toBeDefined()
    expect(fishToHeron).toBeDefined()
    expect(graph.foodSourcesOf.get('zooplankton')).toEqual(['algae'])
    expect(graph.consumersOf.get('small_fish')).toEqual(
      expect.arrayContaining(['heron']),
    )
  })
})

describe('VALIDATION-FOODWEB-6 · removing Small fish', () => {
  const graph = buildGraph(validationFixture)

  it('direct removal: 5 nodes, 3 links, 3 links lost, 50.0% link loss', () => {
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'small_fish')

    expect(result.scenario.nodeCount).toBe(5)
    expect(result.scenario.linkCount).toBe(3)
    expect(result.scenario.linksLost).toBe(3)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(50, 10)
    expect(result.scenario.connectance.value).toBeCloseTo(3 / (5 * 4), 10)
  })

  it('direct removal: Heron is the only directly affected and food-depleted consumer', () => {
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'small_fish')

    expect(result.scenario.directlyAffectedConsumerIds).toHaveLength(1)
    expect(result.scenario.foodDepletedConsumerIds).toHaveLength(1)
    expect(labelOf(graph, result.scenario.directlyAffectedConsumerIds[0])).toBe('Heron')
    expect(labelOf(graph, result.scenario.foodDepletedConsumerIds[0])).toBe('Heron')
    // Direct-removal mode must NOT remove the affected consumer.
    expect(result.removedNodeIds).toEqual(['small_fish'])
    expect(result.rounds).toHaveLength(0)
    expect(result.scenario.cascadeDepth).toBe(0)
  })

  it('cascade: 1 secondary removal, depth 1, 4 nodes and 3 links remaining, 50.0% link loss', () => {
    const result = runCascadeScenario(graph, validationFixture.name, 'small_fish')

    expect(result.rounds).toHaveLength(1)
    expect(result.rounds[0].removals).toHaveLength(1)
    expect(result.rounds[0].removals[0].label).toBe('Heron')
    expect(result.scenario.secondaryRemovals).toBe(1)
    expect(result.scenario.cascadeDepth).toBe(1)
    expect(result.scenario.nodeCount).toBe(4)
    expect(result.scenario.linkCount).toBe(3)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(50, 10)
    expect(result.scenario.connectance.value).toBeCloseTo(3 / (4 * 3), 10)
  })

  it('keeps the specification\'s internally inconsistent "2 links lost" figure out of the program', () => {
    // Part 10.3 prints "Remaining edges: 4 / Lost edges: 2 / 33.333%" for this
    // removal, but Part 8 step 5 (and the project proposal) require every link
    // where the node is the source OR the target to be deleted. This node has
    // three such links, and Part 10.3's own cascade expectation for the same
    // removal ("Remaining edges: 3 ... 100 * 3 / 6 = 50%") is only reachable
    // when all three are deleted. The program therefore removes all three and
    // never leaves a dangling link attached to a removed node.
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'small_fish')
    const incident = graph.edges.filter(
      (edge) => edge.source === 'small_fish' || edge.target === 'small_fish',
    )
    expect(incident).toHaveLength(3)
    expect(result.directlyRemovedLinks).toHaveLength(3)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(50, 10)
    expect(result.scenario.linkCount).toBe(3)
  })
})

describe('VALIDATION-FOODWEB-6 · removing Algae', () => {
  const graph = buildGraph(validationFixture)

  it('direct removal: 5 nodes, 4 links, 2 links lost, 33.3% link loss', () => {
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'algae')

    expect(result.scenario.nodeCount).toBe(5)
    expect(result.scenario.linkCount).toBe(4)
    expect(result.scenario.linksLost).toBe(2)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(100 * (2 / 6), 10)
  })

  it('direct removal: Zooplankton and the snail are affected; only Zooplankton is food depleted', () => {
    const result = runDirectRemovalScenario(graph, validationFixture.name, 'algae')
    const affected = result.scenario.directlyAffectedConsumerIds.map((id) => labelOf(graph, id))

    expect(affected).toHaveLength(2)
    expect(affected).toEqual(expect.arrayContaining(['Zooplankton', 'Freshwater snail']))
    expect(result.scenario.foodDepletedConsumerIds.map((id) => labelOf(graph, id))).toEqual([
      'Zooplankton',
    ])
  })

  it('cascade: the snail survives because it keeps the aquatic-plant link', () => {
    const result = runCascadeScenario(graph, validationFixture.name, 'algae')

    expect(result.rounds).toHaveLength(1)
    expect(result.rounds[0].removals.map((removal) => removal.label)).toEqual(['Zooplankton'])
    expect(result.scenario.secondaryRemovals).toBe(1)
    expect(result.scenario.cascadeDepth).toBe(1)
    expect(result.scenario.nodeCount).toBe(4)
    expect(result.scenario.linkCount).toBe(3)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(50, 10)
    // The small fish still has the recorded link from the snail.
    expect(result.removedNodeIds).not.toContain('small_fish')
    expect(result.removedNodeIds).not.toContain('snail')
  })
})

describe('VALIDATION-CHAIN-4 · multi-round cascade', () => {
  const graph = buildGraph(chainFixture)

  it('removes A, then B, then C in three successive rounds', () => {
    const result = runCascadeScenario(graph, chainFixture.name, 'P')

    expect(result.scenario.secondaryRemovals).toBe(3)
    expect(result.scenario.cascadeDepth).toBe(3)
    expect(result.rounds.map((round) => round.round)).toEqual([1, 2, 3])
    expect(result.rounds.map((round) => round.removals.map((r) => r.label))).toEqual([
      ['A (primary consumer)'],
      ['B (secondary consumer)'],
      ['C (top consumer)'],
    ])
  })

  it('terminates with no eligible node remaining and an empty network', () => {
    const result = runCascadeScenario(graph, chainFixture.name, 'P')

    expect(result.scenario.nodeCount).toBe(0)
    expect(result.scenario.linkCount).toBe(0)
    expect(result.scenario.linkLossPercent.value).toBeCloseTo(100, 10)
    // No network remains, so connectance is not applicable rather than zero.
    expect(result.scenario.connectance.value).toBeNull()
    expect(result.scenario.connectance.notApplicable).toBeTruthy()
  })
})

describe('every scenario expectation stated in the specification', () => {
  for (const expected of VALIDATION_EXPECTATIONS) {
    const fixture = fixtureFor(expected.removedNodeId)
    const graph = buildGraph(fixture)

    it(`${expected.mode} removal of "${expected.removedNodeId}" matches the expected numbers`, () => {
      const result =
        expected.mode === 'cascade'
          ? runCascadeScenario(graph, fixture.name, expected.removedNodeId)
          : runDirectRemovalScenario(graph, fixture.name, expected.removedNodeId)

      expect(result.scenario.nodeCount).toBe(expected.nodeCount)
      expect(result.scenario.linkCount).toBe(expected.linkCount)
      expect(result.scenario.linksLost).toBe(expected.linksLost)

      if (expected.linkLossPercent === null) {
        expect(result.scenario.linkLossPercent.value).toBeNull()
      } else {
        expect(result.scenario.linkLossPercent.value).toBeCloseTo(expected.linkLossPercent, 10)
      }

      if (expected.connectance === null) {
        expect(result.scenario.connectance.value).toBeNull()
        expect(result.scenario.connectance.notApplicable).toBeTruthy()
      } else {
        expect(result.scenario.connectance.value).toBeCloseTo(expected.connectance, 10)
      }

      expect(result.scenario.directlyAffectedConsumerIds).toHaveLength(
        expected.directlyAffectedConsumers,
      )
      expect(result.scenario.foodDepletedConsumerIds).toHaveLength(expected.foodDepletedConsumers)
      expect(result.scenario.secondaryRemovals).toBe(expected.secondaryRemovals)
      expect(result.scenario.cascadeDepth).toBe(expected.cascadeDepth)
    })
  }
})
