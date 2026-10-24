import { describe, expect, it } from 'vitest'
import { buildGraph } from '../core/graphModel'
import {
  analyseAllSpecies,
  buildAllRankings,
  buildRanking,
  RANKING_METRICS,
} from '../core/rankingEngine'
import { runDirectRemovalScenario } from '../core/scenarios'
import { validationFixture } from '../data/fixtures'
import { testDataset, testNode } from './helpers'

/* ============================================================================
 * Ranking requirements (Master Build Prompt §12, §11 Cases 15, 16, 23).
 * ========================================================================== */

const graph = buildGraph(validationFixture)

describe('analyseAllSpecies', () => {
  it('evaluates every node independently from the immutable baseline', async () => {
    const analysis = await analyseAllSpecies(graph, validationFixture.name)
    expect(analysis.scenarios.size).toBe(6)
    expect(analysis.nodeOrder).toEqual([
      'algae',
      'zooplankton',
      'aquatic_plant',
      'snail',
      'small_fish',
      'heron',
    ])

    // Each stored scenario equals a freshly computed one.
    for (const [nodeId, scenarios] of analysis.scenarios) {
      const fresh = runDirectRemovalScenario(graph, validationFixture.name, nodeId)
      expect(scenarios.direct.scenario).toEqual(fresh.scenario)
    }
  })

  it('reports progress for every node', async () => {
    const seen: number[] = []
    await analyseAllSpecies(graph, 'fixture', {
      onProgress: (completed) => seen.push(completed),
    })
    expect(seen).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('can be cancelled without producing partial rankings silently', async () => {
    const controller = new AbortController()
    controller.abort()
    const analysis = await analyseAllSpecies(graph, 'fixture', { signal: controller.signal })
    expect(analysis.cancelled).toBe(true)
    expect(analysis.scenarios.size).toBe(0)
  })

  it('produces identical results when run twice (repeatability)', async () => {
    const first = await analyseAllSpecies(graph, 'fixture')
    const second = await analyseAllSpecies(graph, 'fixture')
    for (const metric of RANKING_METRICS) {
      expect(buildRanking(first, metric.key).rows).toEqual(buildRanking(second, metric.key).rows)
    }
  })
})

describe('ranking by percentage of links lost', () => {
  it('orders by descending link loss and gives tied values the same rank', async () => {
    const analysis = await analyseAllSpecies(graph, validationFixture.name)
    const ranking = buildRanking(analysis, 'linkLossPercent')

    // Hand-computed link loss for the fixture:
    //   small_fish 3/6 = 50.0%   snail 3/6 = 50.0%
    //   algae 2/6 = 33.3%        zooplankton 2/6 = 33.3%
    //   aquatic_plant 1/6 = 16.7%  heron 1/6 = 16.7%
    expect(ranking.rows.map((row) => [row.label, row.rank])).toEqual([
      ['Freshwater snail', 1],
      ['Small fish', 1],
      ['Algae', 3],
      ['Zooplankton', 3],
      ['Aquatic plant', 5],
      ['Heron', 5],
    ])
    expect(ranking.rows[0].metricValue).toBeCloseTo(50, 10)
    expect(ranking.mode).toBe('direct')
  })

  it('uses an alphabetical tie-break so the order never depends on map ordering', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const ranking = buildRanking(analysis, 'linkLossPercent')
    const tied = ranking.rows.filter((row) => row.rank === 1).map((row) => row.label)
    expect(tied).toEqual([...tied].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })))
  })
})

describe('ranking by consumers directly affected', () => {
  it('counts surviving consumers that lost a recorded food link', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const ranking = buildRanking(analysis, 'directlyAffectedConsumers')
    const byLabel = Object.fromEntries(ranking.rows.map((row) => [row.label, row.metricValue]))

    expect(byLabel['Algae']).toBe(2) // zooplankton + snail
    expect(byLabel['Small fish']).toBe(1) // heron
    expect(byLabel['Heron']).toBe(0) // nothing consumes the heron
    expect(ranking.rows[0].label).toBe('Algae')
  })
})

describe('ranking by secondary removals and cascade metrics', () => {
  it('reports cascade mode metrics and the baseline-size denominator', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const secondary = buildRanking(analysis, 'secondaryRemovals')
    const percent = buildRanking(analysis, 'cascadeRemovedPercent')

    expect(secondary.mode).toBe('cascade')
    expect(secondary.rows.find((row) => row.label === 'Small fish')?.metricValue).toBe(1)
    expect(secondary.rows.find((row) => row.label === 'Heron')?.metricValue).toBe(0)

    // 1 secondary removal out of 6 baseline nodes = 16.7%
    expect(percent.rows[0].metricValue).toBeCloseTo(100 / 6, 10)
    expect(percent.metric.definition).toMatch(/N0/)
  })

  it('shows cascade depth as its own sortable metric and never merges it into a score', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const depth = buildRanking(analysis, 'cascadeDepth')
    expect(depth.rows.find((row) => row.label === 'Small fish')?.metricValue).toBe(1)
    expect(Object.keys(buildAllRankings(analysis))).toEqual([
      'linkLossPercent',
      'directlyAffectedConsumers',
      'secondaryRemovals',
      'cascadeRemovedPercent',
      'cascadeDepth',
    ])
  })
})

describe('ranking correctness rules', () => {
  it('keeps nodes with valid zero values instead of silently dropping them', async () => {
    const dataset = testDataset(
      'ZERO-LINKS',
      [
        testNode('first', 'producer', { name: 'First' }),
        testNode('second', 'producer', { name: 'Second' }),
      ],
      [],
    )
    const analysis = await analyseAllSpecies(buildGraph(dataset), dataset.name)
    const ranking = buildRanking(analysis, 'linkLossPercent')

    expect(ranking.rows).toHaveLength(2)
    expect(ranking.rows.every((row) => row.metricValue === null)).toBe(true)
    expect(ranking.rows.every((row) => row.metricNotApplicable)).toBeTruthy()
    // Not-applicable rows are kept, given a deterministic alphabetical order,
    // and marked rank 0 so they are never presented as a score.
    expect(ranking.rows.map((row) => row.rank)).toEqual([0, 0])
    expect(ranking.rows.map((row) => row.label)).toEqual(['First', 'Second'])
  })

  it('distinguishes not-applicable from a genuine zero', async () => {
    // Two producers share a grazer, so no removal ever produces a cascade.
    const dataset = testDataset(
      'MIXED',
      [
        testNode('plant_a', 'producer', { name: 'Plant A' }),
        testNode('plant_b', 'producer', { name: 'Plant B' }),
        testNode('grazer', 'primary-consumer', { name: 'Grazer' }),
      ],
      [
        ['plant_a', 'grazer'],
        ['plant_b', 'grazer'],
      ],
    )
    const analysis = await analyseAllSpecies(buildGraph(dataset), dataset.name)
    const ranking = buildRanking(analysis, 'secondaryRemovals')
    expect(ranking.rows.every((row) => row.metricValue === 0)).toBe(true)
    expect(ranking.rows.every((row) => row.metricNotApplicable === undefined)).toBe(true)
    // A real zero is ranked, unlike a not-applicable value.
    expect(ranking.rows.every((row) => row.rank > 0)).toBe(true)
  })

  it('reports supporting counts alongside the ranked metric value', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const row = buildRanking(analysis, 'linkLossPercent').rows[0]
    expect(row).toMatchObject({
      nodeId: expect.any(String),
      label: expect.any(String),
      role: expect.any(String),
    })
    expect(typeof row.linksLost).toBe('number')
    expect(typeof row.linkCount).toBe('number')
    expect(typeof row.nodeCount).toBe('number')
    expect(typeof row.directlyAffectedConsumers).toBe('number')
    expect(typeof row.foodDepletedConsumers).toBe('number')
    expect(typeof row.secondaryRemovals).toBe('number')
    expect(typeof row.cascadeDepth).toBe('number')
  })

  it('keeps the baseline node count visible for coverage reporting', async () => {
    const analysis = await analyseAllSpecies(graph, 'fixture')
    const ranking = buildRanking(analysis, 'secondaryRemovals')
    expect(ranking.baselineNodeCount).toBe(6)
    expect(ranking.excluded).toEqual([])
  })
})
