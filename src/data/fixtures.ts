import { buildEdges } from './datasetBuilders'
import type { FoodWebDataset, FoodWebNode } from '../core/types'

/* ============================================================================
 * fixtures — hand-checkable test networks (Master Build Prompt §10, §18).
 *
 * These are deliberately tiny, illustrative graphs used to prove the
 * calculations. They are NOT claims about real ecosystems.
 * ========================================================================== */

function fixtureNode(
  id: string,
  name: string,
  trophicRole: FoodWebNode['trophicRole'],
  iconKey: string,
  description: string,
): FoodWebNode {
  return {
    id,
    name,
    scientificName: null,
    nodeType: 'species',
    trophicRole,
    // The prompt states each role explicitly for this fixture, so the roles are
    // treated as documented rather than inferred.
    roleEvidence: 'documented',
    description,
    iconKey,
    habitat: 'Illustrative test network',
    sourceNote: 'Manual validation fixture, defined in the project specification.',
    originalId: null,
  }
}

/* -------------------------------------------------------------------------- */
/* VALIDATION-FOODWEB-6                                                       */
/* -------------------------------------------------------------------------- */

export const VALIDATION_FIXTURE_ID = 'VALIDATION-FOODWEB-6'

export const validationFixture: FoodWebDataset = {
  id: VALIDATION_FIXTURE_ID,
  name: 'VALIDATION-FOODWEB-6 (manual test network)',
  ecosystem: 'freshwater',
  summary:
    'Six-node, six-link hand-checkable test network used to verify the program against manually calculated results. Not an empirical dataset.',
  isDemo: true,
  sourceStatus: 'illustrative-demo',
  provenance: {
    origin: 'Defined inside this project (project specification, Part 10)',
    citation:
      'FoodWebGuard manual validation fixture — hand-computable test network, not a published dataset.',
    sourceUrl: null,
    license: null,
    version: '1.0',
    nodeUnit: 'Individual named organisms',
    cleaningNotes: [
      'Fixture is authored, not imported, so no cleaning was required.',
      'Baseline: 6 nodes, 6 directed links, connectance = 6 / (6 x 5) = 0.200.',
    ],
    validationStatus: 'illustrative-demo',
    retrievedOn: null,
  },
  nodes: [
    fixtureNode('algae', 'Algae', 'producer', 'algae', 'Basal producer in this test network. It has no recorded incoming food-source links, which is expected for a producer.'),
    fixtureNode('zooplankton', 'Zooplankton', 'primary-consumer', 'zooplankton', 'Consumer that grazes on algae in this test network.'),
    fixtureNode('aquatic_plant', 'Aquatic plant', 'producer', 'aquatic-plant', 'Second basal producer in this test network.'),
    fixtureNode('snail', 'Freshwater snail', 'primary-consumer', 'snail', 'Grazer with two recorded food sources, so it keeps a food link if only one producer is removed.'),
    fixtureNode('small_fish', 'Small fish', 'secondary-consumer', 'minnow', 'Consumer of zooplankton and the snail, and the sole recorded food source of the heron here.'),
    fixtureNode('heron', 'Heron', 'apex-predator', 'heron', 'Top consumer in this test network, with a single recorded food source.'),
  ],
  edges: buildEdges([
    ['algae', 'zooplankton'],
    ['algae', 'snail'],
    ['aquatic_plant', 'snail'],
    ['zooplankton', 'small_fish'],
    ['snail', 'small_fish'],
    ['small_fish', 'heron'],
  ]),
}

/* -------------------------------------------------------------------------- */
/* VALIDATION-CHAIN-4 — multi-round cascade fixture                           */
/* -------------------------------------------------------------------------- */

export const CHAIN_FIXTURE_ID = 'VALIDATION-CHAIN-4'

export const chainFixture: FoodWebDataset = {
  id: CHAIN_FIXTURE_ID,
  name: 'VALIDATION-CHAIN-4 (multi-round cascade chain)',
  ecosystem: 'terrestrial',
  summary:
    'Four-node chain P -> A -> B -> C used to prove that the cascade continues for several simultaneous rounds and then terminates. A structural algorithm test, not a real ecological chain.',
  isDemo: true,
  sourceStatus: 'illustrative-demo',
  provenance: {
    origin: 'Defined inside this project (project specification, Part 18)',
    citation: 'FoodWebGuard multi-round cascade fixture — structural algorithm test, not a published dataset.',
    sourceUrl: null,
    license: null,
    version: '1.0',
    nodeUnit: 'Illustrative trophic levels P, A, B, C',
    cleaningNotes: ['Fixture is authored, not imported, so no cleaning was required.'],
    validationStatus: 'illustrative-demo',
    retrievedOn: null,
  },
  nodes: [
    fixtureNode('P', 'P (producer)', 'producer', 'grass', 'Producer at the start of the test chain.'),
    fixtureNode('A', 'A (primary consumer)', 'primary-consumer', 'grasshopper', 'Depends only on P; becomes eligible in cascade round 1.'),
    fixtureNode('B', 'B (secondary consumer)', 'secondary-consumer', 'songbird', 'Depends only on A; becomes eligible in cascade round 2.'),
    fixtureNode('C', 'C (top consumer)', 'apex-predator', 'hawk', 'Depends only on B; becomes eligible in cascade round 3.'),
  ],
  edges: buildEdges([
    ['P', 'A'],
    ['A', 'B'],
    ['B', 'C'],
  ]),
}

/* -------------------------------------------------------------------------- */
/* Expected values, stated explicitly and asserted by the test suite          */
/* -------------------------------------------------------------------------- */

export interface ExpectedScenario {
  removedNodeId: string
  mode: 'direct' | 'cascade'
  nodeCount: number
  linkCount: number
  linksLost: number
  linkLossPercent: number | null
  connectance: number | null
  directlyAffectedConsumers: number
  foodDepletedConsumers: number
  secondaryRemovals: number
  cascadeDepth: number
}

/**
 * Expected results for VALIDATION-FOODWEB-6.
 *
 * NOTE ON A KNOWN INCONSISTENCY IN THE SOURCE SPECIFICATION
 * ---------------------------------------------------------
 * The build specification (Part 8, step 5 and the accompanying project proposal,
 * Methodology step 4) require that removing a node deletes *every* link where
 * that node is the source or the target. For "remove Small fish" this deletes
 * three links (zooplankton -> small_fish, snail -> small_fish, small_fish ->
 * heron), leaving 3 of 6 links and a link loss of 50.0%.
 *
 * Part 10.3 of the same specification states "Remaining edges: 4 / Lost edges: 2
 * / Link loss: 33.333%" for that same removal. Those numbers contradict the
 * fixture's own edge list, Part 8 step 5, and Part 10.3's *own* cascade
 * expectation lower down ("Remaining edges: 3 ... 100 * 3 / 6 = 50%") — which is
 * only reachable when all three incident links are removed, since removing the
 * heron afterwards deletes no additional link.
 *
 * FoodWebGuard implements the internally consistent definition (all incident
 * links are removed) and displays this discrepancy in the Methodology &
 * Validation screen. The 33.3% figure would require the program to leave a
 * dangling link attached to a removed node, which is not a valid network.
 */
export const VALIDATION_EXPECTATIONS: ExpectedScenario[] = [
  {
    removedNodeId: 'small_fish',
    mode: 'direct',
    nodeCount: 5,
    linkCount: 3,
    linksLost: 3,
    linkLossPercent: 50,
    connectance: 3 / (5 * 4),
    directlyAffectedConsumers: 1,
    foodDepletedConsumers: 1,
    secondaryRemovals: 0,
    cascadeDepth: 0,
  },
  {
    removedNodeId: 'small_fish',
    mode: 'cascade',
    nodeCount: 4,
    linkCount: 3,
    linksLost: 3,
    linkLossPercent: 50,
    connectance: 3 / (4 * 3),
    directlyAffectedConsumers: 1,
    foodDepletedConsumers: 1,
    secondaryRemovals: 1,
    cascadeDepth: 1,
  },
  {
    removedNodeId: 'algae',
    mode: 'direct',
    nodeCount: 5,
    linkCount: 4,
    linksLost: 2,
    linkLossPercent: 100 * (2 / 6),
    connectance: 4 / (5 * 4),
    directlyAffectedConsumers: 2,
    foodDepletedConsumers: 1,
    secondaryRemovals: 0,
    cascadeDepth: 0,
  },
  {
    removedNodeId: 'algae',
    mode: 'cascade',
    nodeCount: 4,
    linkCount: 3,
    linksLost: 3,
    linkLossPercent: 50,
    connectance: 3 / (4 * 3),
    directlyAffectedConsumers: 2,
    foodDepletedConsumers: 1,
    secondaryRemovals: 1,
    cascadeDepth: 1,
  },
  {
    removedNodeId: 'P',
    mode: 'direct',
    nodeCount: 3,
    linkCount: 2,
    linksLost: 1,
    linkLossPercent: 100 * (1 / 3),
    connectance: 2 / (3 * 2),
    directlyAffectedConsumers: 1,
    foodDepletedConsumers: 1,
    secondaryRemovals: 0,
    cascadeDepth: 0,
  },
  {
    removedNodeId: 'P',
    mode: 'cascade',
    nodeCount: 0,
    linkCount: 0,
    linksLost: 3,
    linkLossPercent: 100,
    connectance: null,
    directlyAffectedConsumers: 1,
    foodDepletedConsumers: 1,
    secondaryRemovals: 3,
    cascadeDepth: 3,
  },
]
