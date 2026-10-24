import { importFromCsv, importFromJson } from './dataValidation'
import {
  baselineIncomingCount,
  buildGraph,
  isolatedNodeIds,
  validateGraphIntegrity,
} from './graphModel'
import { computeBaselineMetrics, computeConnectance, computeLinkLossPercent } from './metrics'
import { analyseAllSpecies, buildRanking } from './rankingEngine'
import { runCascadeScenario, runDirectRemovalScenario } from './scenarios'
import { CHAIN_FIXTURE_ID, chainFixture, validationFixture, VALIDATION_EXPECTATIONS } from '../data/fixtures'
import { demoDatasets } from '../data/demoDatasets'
import { buildEdges } from '../data/datasetBuilders'
import type { FoodWebDataset, FoodWebNode, RoleProvenance, TrophicRole } from './types'

/* ============================================================================
 * validationSuite — the checks the Methodology & Validation screen runs live.
 *
 * The same expectations are asserted by the automated test suite; this module
 * exposes them to the running application so a reviewer can watch them pass in
 * the browser rather than taking the test output on trust.
 * ========================================================================== */

export interface CheckResult {
  group: string
  name: string
  expected: string
  actual: string
  passed: boolean
  /** Set when the check documents a specification inconsistency. */
  note?: string
}

export interface SuiteReport {
  checks: CheckResult[]
  passed: number
  failed: number
  total: number
}

function check(
  group: string,
  name: string,
  expected: unknown,
  actual: unknown,
  note?: string,
): CheckResult {
  const expectedText = String(expected)
  const actualText = String(actual)
  return {
    group,
    name,
    expected: expectedText,
    actual: actualText,
    passed: expectedText === actualText,
    note,
  }
}

function checkClose(
  group: string,
  name: string,
  expected: number | null,
  actual: number | null,
  digits = 6,
  note?: string,
): CheckResult {
  if (expected === null || actual === null) {
    return check(group, name, expected === null ? 'not applicable' : expected, actual === null ? 'not applicable' : actual, note)
  }
  const passed = Math.abs(expected - actual) < 10 ** -(digits - 1)
  return {
    group,
    name,
    expected: expected.toFixed(digits),
    actual: actual.toFixed(digits),
    passed,
    note,
  }
}

function node(
  id: string,
  role: TrophicRole,
  evidence: RoleProvenance = 'documented',
  name = id,
): FoodWebNode {
  return {
    id,
    name,
    scientificName: null,
    nodeType: 'species',
    trophicRole: role,
    roleEvidence: evidence,
    description: '',
    iconKey: 'fallback',
    habitat: null,
    sourceNote: null,
    originalId: null,
  }
}

function miniDataset(
  id: string,
  nodes: FoodWebNode[],
  edges: readonly (readonly [string, string])[],
): FoodWebDataset {
  return {
    id,
    name: id,
    ecosystem: 'freshwater',
    summary: '',
    isDemo: true,
    sourceStatus: 'illustrative-demo',
    provenance: {
      origin: 'validation suite',
      citation: 'validation suite',
      sourceUrl: null,
      license: null,
      version: '1',
      nodeUnit: 'individual species',
      cleaningNotes: [],
      validationStatus: 'illustrative-demo',
      retrievedOn: null,
    },
    nodes,
    edges: buildEdges(edges),
  }
}

/** Run every check. Synchronous and deterministic. */
export function runValidationSuite(): SuiteReport {
  const checks: CheckResult[] = []
  const fixtureGraph = buildGraph(validationFixture)
  const fixtureBaseline = computeBaselineMetrics(fixtureGraph)

  /* ---- 1. Baseline of the manual fixture ---- */
  checks.push(check('Manual fixture baseline', 'Node count', 6, fixtureBaseline.nodeCount))
  checks.push(check('Manual fixture baseline', 'Link count', 6, fixtureBaseline.linkCount))
  checks.push(
    checkClose(
      'Manual fixture baseline',
      'Connectance = 6 / (6 x 5)',
      0.2,
      fixtureBaseline.connectance.value,
    ),
  )
  const directionHolds =
    fixtureGraph.foodSourcesOf.get('zooplankton')?.join(',') === 'algae' &&
    fixtureGraph.consumersOf.get('small_fish')?.includes('heron') === true
  checks.push(
    check(
      'Manual fixture baseline',
      'Edge direction is food source -> consumer (algae -> zooplankton, small_fish -> heron)',
      'true',
      String(directionHolds),
    ),
  )

  /* ---- 2. Every expected scenario from the specification ---- */
  for (const expectation of VALIDATION_EXPECTATIONS) {
    const dataset = expectation.removedNodeId === 'P' ? chainFixture : validationFixture
    const graph = buildGraph(dataset)
    const result =
      expectation.mode === 'cascade'
        ? runCascadeScenario(graph, dataset.name, expectation.removedNodeId)
        : runDirectRemovalScenario(graph, dataset.name, expectation.removedNodeId)

    const label = `${expectation.mode === 'cascade' ? 'Cascade' : 'Direct'}: remove "${expectation.removedNodeId}"`
    checks.push(
      check(
        'Expected scenario results',
        `${label} — nodes remaining`,
        expectation.nodeCount,
        result.scenario.nodeCount,
      ),
    )
    checks.push(
      check(
        'Expected scenario results',
        `${label} — links remaining`,
        expectation.linkCount,
        result.scenario.linkCount,
      ),
    )
    checks.push(
      checkClose(
        'Expected scenario results',
        `${label} — link loss %`,
        expectation.linkLossPercent,
        result.scenario.linkLossPercent.value,
      ),
    )
    checks.push(
      check(
        'Expected scenario results',
        `${label} — directly affected consumers`,
        expectation.directlyAffectedConsumers,
        result.scenario.directlyAffectedConsumerIds.length,
      ),
    )
    checks.push(
      check(
        'Expected scenario results',
        `${label} — secondary removals`,
        expectation.secondaryRemovals,
        result.scenario.secondaryRemovals,
      ),
    )
    checks.push(
      check(
        'Expected scenario results',
        `${label} — cascade depth`,
        expectation.cascadeDepth,
        result.scenario.cascadeDepth,
      ),
    )
  }

  const directFishLoss = runDirectRemovalScenario(fixtureGraph, 'fixture', 'small_fish')
  checks.push({
    group: 'Expected scenario results',
    name: 'Remove "small_fish" — links deleted by the initial removal',
    expected: '3 (all links where it is source or target)',
    actual: String(directFishLoss.directlyRemovedLinks.length),
    passed: directFishLoss.directlyRemovedLinks.length === 3,
    note:
      'The build specification states 2 links lost (33.3%) for this case, which contradicts its own edge list, its "remove every edge whose source or target is the removed node" rule, and its own cascade figures for the same removal (3 links lost, 50%). FoodWebGuard implements the consistent definition.',
  })

  /* ---- 3. Multi-round cascade ---- */
  const chainGraph = buildGraph(chainFixture)
  const chainResult = runCascadeScenario(chainGraph, CHAIN_FIXTURE_ID, 'P')
  checks.push(
    check(
      'Multi-round cascade',
      `Chain ${CHAIN_FIXTURE_ID}: round count`,
      3,
      chainResult.rounds.length,
    ),
  )
  checks.push(
    check(
      'Multi-round cascade',
      'Chain: rounds remove A, then B, then C',
      'A (primary consumer) | B (secondary consumer) | C (top consumer)',
      chainResult.rounds.map((round) => round.removals.map((r) => r.label).join(',')).join(' | '),
    ),
  )
  checks.push(
    check(
      'Multi-round cascade',
      'Chain: terminates with no eligible node left',
      0,
      chainResult.scenario.nodeCount,
    ),
  )

  /* ---- 4. Metric guards ---- */
  checks.push(
    check(
      'Metric guards',
      'Link loss with an empty baseline is not applicable',
      'not applicable',
      computeLinkLossPercent(0, 0).value === null ? 'not applicable' : 'a number',
    ),
  )
  checks.push(
    check(
      'Metric guards',
      'Connectance with one node is not applicable',
      'not applicable',
      computeConnectance(1, 0).value === null ? 'not applicable' : 'a number',
    ),
  )
  checks.push(
    checkClose(
      'Metric guards',
      'Connectance with two nodes and one link',
      0.5,
      computeConnectance(2, 1).value,
    ),
  )
  checks.push(
    check(
      'Metric guards',
      'Connectance can rise after a removal (6/30 = 0.200 -> 5/20 = 0.250)',
      'rises',
      (computeConnectance(5, 5).value ?? 0) > (computeConnectance(6, 6).value ?? 0) ? 'rises' : 'falls',
    ),
  )

  /* ---- 5. Rule behaviour ---- */
  const producerGraph = buildGraph(
    miniDataset(
      'RULE-PRODUCER',
      [node('sun', 'producer'), node('plant', 'producer'), node('grazer', 'primary-consumer')],
      [
        ['sun', 'plant'],
        ['plant', 'grazer'],
      ],
    ),
  )
  checks.push(
    check(
      'Simulation rules',
      'A node that loses its only recorded food source is cascade-removed regardless of reported role',
      'removed',
      runCascadeScenario(producerGraph, 'rule', 'sun').removedNodeIds.includes('plant')
        ? 'removed'
        : 'not removed',
    ),
  )

  const noBaselineFood = buildGraph(
    miniDataset(
      'RULE-NO-BASELINE-FOOD',
      [node('plant', 'producer'), node('grazer', 'primary-consumer'), node('odd', 'secondary-consumer', 'documented', 'No recorded food')],
      [['plant', 'grazer']],
    ),
  )
  checks.push(
    check(
      'Simulation rules',
      'A node with no recorded baseline food source is never cascade-eligible',
      'not removed',
      runCascadeScenario(noBaselineFood, 'rule', 'plant').removedNodeIds.includes('odd')
        ? 'removed'
        : 'not removed',
    ),
  )

  const alternativeFood = runCascadeScenario(fixtureGraph, 'fixture', 'algae')
  checks.push(
    check(
      'Simulation rules',
      'A consumer with an alternative food source survives the cascade',
      'survives',
      alternativeFood.removedNodeIds.includes('snail') ? 'removed' : 'survives',
    ),
  )

  const unknownRole = buildGraph(
    miniDataset(
      'RULE-UNKNOWN-ROLE',
      [
        node('plant', 'producer'),
        node('grazer', 'primary-consumer'),
        node('mystery', 'secondary-consumer', 'unknown'),
      ],
      [
        ['plant', 'grazer'],
        ['grazer', 'mystery'],
      ],
    ),
  )
  const unknownRoleResult = runCascadeScenario(unknownRole, 'rule', 'plant')
  checks.push(
    check(
      'Simulation rules',
      'Unknown role evidence does not disable the structural rule (role is reported, not gated)',
      'removed',
      unknownRoleResult.removedNodeIds.includes('mystery') ? 'removed' : 'not removed',
    ),
  )

  /* ---- 6. Cyclic network terminates ---- */
  const cyclicGraph = buildGraph(
    miniDataset(
      'RULE-CYCLE',
      [node('x', 'primary-consumer'), node('y', 'secondary-consumer'), node('z', 'apex-predator')],
      [
        ['x', 'y'],
        ['y', 'z'],
        ['z', 'x'],
      ],
    ),
  )
  const cyclicResult = runCascadeScenario(cyclicGraph, 'rule', 'x')
  checks.push(
    check(
      'Simulation rules',
      'A cyclic network terminates and removes no node twice',
      '3 of 3',
      `${cyclicResult.removedNodeIds.length} of ${new Set(cyclicResult.removedNodeIds).size}`,
    ),
  )

  /* ---- 7. Baseline immutability and repeatability ---- */
  const beforeNodes = validationFixture.nodes.length
  const beforeEdges = validationFixture.edges.length
  runCascadeScenario(fixtureGraph, 'fixture', 'algae')
  runCascadeScenario(fixtureGraph, 'fixture', 'small_fish')
  checks.push(
    check(
      'State integrity',
      'Running scenarios never mutates the baseline dataset',
      `${beforeNodes} nodes / ${beforeEdges} links`,
      `${validationFixture.nodes.length} nodes / ${validationFixture.edges.length} links`,
    ),
  )

  /* ---- 8. Import rules ---- */
  const nodesCsv = [
    'id,name,trophic_role',
    'algae,Algae,producer',
    'zooplankton,Zooplankton,primary-consumer',
    'minnow,Minnow,secondary-consumer',
  ].join('\n')

  const duplicateEdges = importFromCsv({
    nodesText: nodesCsv,
    edgesText: ['source,target', 'algae,zooplankton', 'algae,zooplankton', 'zooplankton,minnow'].join('\n'),
    citation: 'suite',
    origin: 'suite',
  })
  checks.push(
    check(
      'Import validation',
      'Duplicate links are removed and reported',
      '1 duplicate removed, 2 accepted links',
      `${duplicateEdges.report?.duplicateEdgesRemoved} duplicate removed, ${duplicateEdges.dataset?.edges.length} accepted links`,
    ),
  )

  const selfLink = importFromCsv({
    nodesText: nodesCsv,
    edgesText: ['source,target', 'algae,zooplankton', 'minnow,minnow'].join('\n'),
  })
  checks.push(
    check(
      'Import validation',
      'Self-links are excluded from the primary analysis',
      '1 excluded, 1 accepted link',
      `${selfLink.report?.selfLinksExcluded} excluded, ${selfLink.dataset?.edges.length} accepted link`,
    ),
  )

  const dangling = importFromCsv({
    nodesText: nodesCsv,
    edgesText: ['source,target', 'unknown_fish,zooplankton'].join('\n'),
  })
  checks.push(
    check(
      'Import validation',
      'Links with undefined endpoints block the import by default',
      'blocked',
      dangling.blocked ? 'blocked' : 'accepted',
    ),
  )

  const danglingRepaired = importFromCsv({
    nodesText: nodesCsv,
    edgesText: ['source,target', 'unknown_fish,zooplankton', 'algae,zooplankton'].join('\n'),
    options: { invalidEdgePolicy: 'exclude' },
  })
  checks.push(
    check(
      'Import validation',
      'Explicit exclusion of an invalid link is recorded',
      '1 excluded, import allowed',
      `${danglingRepaired.report?.invalidEdgesExcluded} excluded, import ${danglingRepaired.blocked ? 'blocked' : 'allowed'}`,
    ),
  )

  const malformed = importFromJson({ jsonText: '{ "nodes": [' })
  checks.push(
    check(
      'Import validation',
      'Malformed JSON is rejected without a stack trace',
      'blocked with a readable message',
      malformed.blocked && malformed.issues.every((issue) => !/at Object\.|node_modules/.test(issue.message))
        ? 'blocked with a readable message'
        : 'not blocked',
    ),
  )

  const noCitation = importFromCsv({
    nodesText: nodesCsv,
    edgesText: ['source,target', 'algae,zooplankton'].join('\n'),
  })
  checks.push(
    check(
      'Import validation',
      'An import without a citation is never marked as verified',
      'research-pending',
      noCitation.dataset?.sourceStatus ?? 'no dataset',
    ),
  )

  /* ---- 9. Edge-case networks ---- */
  const oneNode = buildGraph(miniDataset('ONE', [node('lonely', 'producer')], []))
  const oneNodeResult = runDirectRemovalScenario(oneNode, 'one', 'lonely')
  checks.push(
    check(
      'Edge cases',
      'A one-node network does not crash and reports not-applicable metrics',
      '0 nodes, not applicable link loss',
      `${oneNodeResult.scenario.nodeCount} nodes, ${
        oneNodeResult.scenario.linkLossPercent.value === null ? 'not applicable' : 'a value'
      } link loss`,
    ),
  )

  const noLinks = buildGraph(
    miniDataset('NOLINKS', [node('a', 'producer'), node('b', 'producer')], []),
  )
  const noLinksBaseline = computeBaselineMetrics(noLinks)
  checks.push(
    check(
      'Edge cases',
      'Nodes with no links give connectance 0 when N >= 2',
      '0',
      String(noLinksBaseline.connectance.value),
    ),
  )

  const isolated = buildGraph(
    miniDataset(
      'ISOLATED',
      [node('plant', 'producer'), node('grazer', 'primary-consumer'), node('hermit', 'primary-consumer')],
      [['plant', 'grazer']],
    ),
  )
  checks.push(
    check(
      'Edge cases',
      'An isolated node is preserved rather than discarded',
      'hermit',
      isolatedNodeIds(isolated).join(',') || 'none',
    ),
  )

  /* ---- 10. Shipped demo networks ---- */
  const demoErrors = demoDatasets.flatMap((dataset) =>
    validateGraphIntegrity(dataset).filter((issue) => issue.severity === 'error'),
  )
  checks.push(
    check(
      'Shipped demo data',
      'All six illustrative networks are structurally valid',
      0,
      demoErrors.length,
    ),
  )
  const labelled = demoDatasets.every((dataset) =>
    dataset.provenance.citation.includes('not a verified empirical food-web dataset'),
  )
  checks.push(
    check(
      'Shipped demo data',
      'Every illustrative network carries the required notice',
      'yes',
      labelled ? 'yes' : 'no',
    ),
  )
  const consumersWithFood = demoDatasets.every((dataset) => {
    const graph = buildGraph(dataset)
    return graph.nodes
      .filter((entry) => entry.trophicRole !== 'producer' && entry.trophicRole !== 'basal-group')
      .every((entry) => baselineIncomingCount(graph, entry.id) > 0)
  })
  checks.push(
    check(
      'Shipped demo data',
      'Every demo consumer has a recorded food source',
      'yes',
      consumersWithFood ? 'yes' : 'no',
    ),
  )

  const passed = checks.filter((entry) => entry.passed).length
  return { checks, passed, failed: checks.length - passed, total: checks.length }
}

/** Async ranking-related checks, kept separate so the UI can show progress. */
export async function runRankingChecks(): Promise<CheckResult[]> {
  const graph = buildGraph(validationFixture)
  const first = await analyseAllSpecies(graph, validationFixture.name)
  const second = await analyseAllSpecies(graph, validationFixture.name)

  const rankingA = buildRanking(first, 'linkLossPercent')
  const rankingB = buildRanking(second, 'linkLossPercent')

  const results: CheckResult[] = []
  results.push(
    check(
      'Rankings',
      'Rankings are repeatable for identical input',
      'identical rows',
      JSON.stringify(rankingA.rows) === JSON.stringify(rankingB.rows) ? 'identical rows' : 'different rows',
    ),
  )
  results.push(
    check(
      'Rankings',
      'Tied values share a rank and are ordered alphabetically',
      'Freshwater snail=1, Small fish=1, Algae=3, Zooplankton=3',
      rankingA.rows
        .slice(0, 4)
        .map((row) => `${row.label}=${row.rank}`)
        .join(', '),
    ),
  )
  results.push(
    check(
      'Rankings',
      'Every node is analysed independently from the baseline',
      '6',
      String(first.scenarios.size),
    ),
  )
  // Metrics genuinely rank differently, which is why they are never merged
  // into one score: the fixture's link-loss leader is not its affected-consumer
  // leader.
  const affectedRanking = buildRanking(first, 'directlyAffectedConsumers')
  results.push(
    check(
      'Rankings',
      'Metrics rank differently, so they stay separate (no combined score)',
      'link-loss leader "Freshwater snail"; affected-consumer leader "Algae"',
      `link-loss leader "${rankingA.rows[0].label}"; affected-consumer leader "${affectedRanking.rows[0].label}"`,
    ),
  )
  return results
}

export const VALIDATION_SUITE_TOTAL_NOTE =
  'These are the same expectations the automated test suite asserts with Vitest. They are run live in the browser so the checks can be inspected rather than trusted.'
