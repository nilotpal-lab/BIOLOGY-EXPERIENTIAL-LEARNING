import { labelOf } from './graphModel'
import { runScenario } from './scenarios'
import type {
  BaselineMetrics,
  FoodWebGraph,
  FoodWebNode,
  ScenarioMode,
  ScenarioResult,
  TrophicRole,
} from './types'

/* ============================================================================
 * Plain-English Explanations Engine
 *
 * Designed to make complex ecological network simulations immediately understandable
 * to first-time users, students, and educators who know nothing about graph theory
 * or mathematical food-web metrics.
 *
 * Translates abstract numbers (connectance, link loss, cascade depth) into:
 *   1. Engaging human-language ecosystem stories
 *   2. Step-by-step cause-and-effect breakdowns ("Why did this happen?")
 *   3. Dietary redundancy analysis ("Safe" vs "Starving")
 *   4. Guided educational presets for 1-click exploration
 * ========================================================================== */

export type ImpactSeverity = 'low' | 'moderate' | 'high' | 'severe'

export interface PlainEnglishStory {
  headline: string
  severity: ImpactSeverity
  severityLabel: string
  severityColor: {
    bg: string
    text: string
    border: string
  }
  overview: string
  directRemovalStory: string
  cascadeStory: string
  resilienceStory: string
  keyEcologicalPrinciple: string
}

export interface AffectedSpeciesDetail {
  id: string
  name: string
  scientificName?: string | null
  iconKey?: string
  role: TrophicRole
  isDirectlyRemoved: boolean
  isStarved: boolean
  lostFoodCount: number
  lostFoodNames: string[]
  remainingFoodCount: number
  remainingFoodNames: string[]
  predatorNames: string[]
  statusBadge: {
    label: string
    tone: 'safe' | 'warning' | 'danger'
    description: string
  }
  causeAndEffect: string
}

export interface EducationalPreset {
  id: string
  title: string
  badge: string
  speciesId: string
  speciesName: string
  mode: ScenarioMode
  description: string
  expectedOutcome: string
}

/**
 * Metric definitions written in plain, friendly language for students and newcomers.
 */
export const PLAIN_METRIC_GUIDE: Record<
  string,
  { title: string; simpleExplanation: string; analogy: string }
> = {
  speciesRemoved: {
    title: 'Species Removed (Direct)',
    simpleExplanation:
      'The organism you deliberately removed from the ecosystem (e.g. due to overfishing, disease, or habitat loss).',
    analogy: 'Pulling a specific player out of a sports team.',
  },
  linksLost: {
    title: 'Feeding Links Lost',
    simpleExplanation:
      'Predator-prey relationships severed. Each link is an energy pathway where one creature eats another.',
    analogy: 'Roads closed in a delivery network — when a link is lost, food stops travelling along that road.',
  },
  secondaryRemovals: {
    title: 'Secondary Removals (Cascade)',
    simpleExplanation:
      'Victims of starvation! Animals that vanished because 100% of their recorded food sources disappeared.',
    analogy: 'Domino effect — when one piece falls, any other piece depending on it toppled too.',
  },
  totalRemoved: {
    title: 'Total Species Removed',
    simpleExplanation:
      'The combined count of your initial removal plus all subsequent starvation victims.',
    analogy: 'Total casualties in the ecosystem from a single initial disturbance.',
  },
  connectance: {
    title: 'Food Web Complexity (Connectance)',
    simpleExplanation:
      'A percentage measure of how tightly woven the food web is. High connectance means animals have lots of backup foods.',
    analogy: 'A dense safety net vs. a fragile single rope.',
  },
  linkLossPercent: {
    title: 'Food Web Disruption',
    simpleExplanation:
      'Percentage of all feeding relationships broken across the entire ecosystem.',
    analogy: 'The percentage of power lines cut in a regional grid.',
  },
  cascadeDepth: {
    title: 'Cascade Rounds',
    simpleExplanation:
      'How many sequential waves of starvation occurred before the ecosystem stabilized.',
    analogy: 'Aftershocks following an earthquake.',
  },
}

/**
 * Generates an intuitive, readable plain-English narrative for any scenario result.
 */
export function generatePlainEnglishStory(
  graph: FoodWebGraph,
  baseline: BaselineMetrics,
  result: ScenarioResult,
): PlainEnglishStory {
  const s = result.scenario
  const targetName = result.primaryNodeLabel
  const datasetName = result.datasetName
  const linkLossPct = s.linkLossPercent.value ?? 0
  const secondaryCount = s.secondaryRemovals
  const totalRemoved = s.totalRemoved
  const affectedCount = s.directlyAffectedConsumerIds.length
  const depletedCount = s.foodDepletedConsumerIds.length

  // Determine overall severity
  let severity: ImpactSeverity = 'low'
  let severityLabel = 'Minimal Impact'
  let severityColor = {
    bg: '#E8EDE0',
    text: '#35563B',
    border: '#B5D39A',
  }

  if (secondaryCount > 2 || totalRemoved > baseline.nodeCount * 0.4 || linkLossPct > 40) {
    severity = 'severe'
    severityLabel = 'Severe Ecosystem Collapse'
    severityColor = {
      bg: '#FDEEEB',
      text: '#C04938',
      border: '#EF9A88',
    }
  } else if (secondaryCount > 0 || linkLossPct > 25) {
    severity = 'high'
    severityLabel = 'High Ecosystem Disruption'
    severityColor = {
      bg: '#FEF4E8',
      text: '#C06918',
      border: '#F1B36F',
    }
  } else if (linkLossPct > 10 || affectedCount > 0) {
    severity = 'moderate'
    severityLabel = 'Moderate Disruption'
    severityColor = {
      bg: '#FEF9E7',
      text: '#9A6B1F',
      border: '#F3D98B',
    }
  }

  // Headline
  let headline = `1 Species Removed: Ecosystem Shows Strong Resilience`
  if (secondaryCount > 0) {
    const starvedNames = result.rounds
      .flatMap((r) => r.removals.map((rem) => rem.label))
      .join(', ')
    headline = `Chain Reaction: ${secondaryCount} Species Starved (${starvedNames}) Following ${targetName} Removal`
  } else if (affectedCount > 0) {
    headline = `${targetName} Removed: Ecosystem Resilient (${affectedCount} Lost Food, 0 Starved)`
  } else {
    headline = `${targetName} Removed: Minimal Impact on Surviving Predators (Resilience High)`
  }

  // Direct Removal Story
  const directLinkCount = result.directlyRemovedLinks.length
  const directRemovalStory =
    directLinkCount === 0
      ? `Removing "${targetName}" broke 0 recorded feeding connections because no species in the records fed on it or was eaten by it.`
      : `Removing "${targetName}" immediately severed ${directLinkCount} feeding link(s). ${
          affectedCount > 0
            ? `${affectedCount} predator species (${s.directlyAffectedConsumerIds
                .map((id) => labelOf(graph, id))
                .join(', ')}) lost an established food supply${depletedCount > 0 ? ` (${depletedCount} lost every food source)` : ''}.`
            : 'No surviving predator lost a food supply, as none fed on this organism.'
        }`

  // Cascade Story
  let cascadeStory = ''
  if (result.mode === 'direct') {
    cascadeStory =
      'You ran this in Direct Removal mode. The simulation measures immediate damage to the feeding network without triggering secondary starvations.'
  } else if (secondaryCount === 0) {
    cascadeStory =
      'Good news: The cascade ended at Round 0! Even though some predators lost a meal, every surviving consumer had backup food sources available in this ecosystem. No species starved to extinction.'
  } else {
    const starvedNames = result.rounds
      .flatMap((r) => r.removals.map((rem) => rem.label))
      .join(', ')
    cascadeStory = `Chain Reaction Occurred! ${secondaryCount} consumer species (${starvedNames}) relied exclusively on the lost organisms. With 100% of their food gone, they starved in ${result.rounds.length} cascade round(s).`
  }

  // Resilience Story
  const remainingSpecies = baseline.nodeCount - totalRemoved
  const remainingLinks = baseline.linkCount - s.linksLost
  const resilienceStory = `The ecosystem now has ${remainingSpecies} of ${baseline.nodeCount} species remaining (${remainingLinks} feeding links intact). ${
    secondaryCount === 0
      ? 'High dietary redundancy (alternative prey choices) acted as an ecological safety net.'
      : 'Specialist species with only a single food source made this food web vulnerable to collapse.'
  }`

  // Educational Principle
  let keyEcologicalPrinciple =
    'Dietary Redundancy: Ecosystems where predators eat multiple different prey types are far more resistant to extinction cascades than fragile systems with single-prey specialists.'
  if (secondaryCount > 0) {
    keyEcologicalPrinciple =
      'Trophic Dependency: When a predator specializes on a single food source, any threat to that prey directly threatens the predator. Protecting biodiversity protects backup food chains!'
  }

  // Overview paragraph
  const overview = `In the "${datasetName}" ecosystem, we simulated the loss of ${targetName}. ${
    secondaryCount > 0
      ? `This triggered a cascade that caused ${secondaryCount} additional species to starve, breaking ${linkLossPct.toFixed(1)}% of all feeding interactions.`
      : `The ecosystem absorbed the shock with zero secondary starvations, although ${linkLossPct.toFixed(1)}% of feeding interactions were broken.`
  }`

  return {
    headline,
    severity,
    severityLabel,
    severityColor,
    overview,
    directRemovalStory,
    cascadeStory,
    resilienceStory,
    keyEcologicalPrinciple,
  }
}

/**
 * Computes a detailed dietary vulnerability breakdown for an affected species.
 */
export function getSpeciesVulnerabilityDetail(
  graph: FoodWebGraph,
  result: ScenarioResult | null,
  speciesId: string,
): AffectedSpeciesDetail | null {
  const node = graph.nodeById.get(speciesId)
  if (!node) return null

  const isDirectlyRemoved = result ? result.primaryNodeId === speciesId : false
  const isCascadeRemoved = result
    ? result.mode === 'cascade' &&
      result.removedNodeIds.includes(speciesId) &&
      !isDirectlyRemoved
    : false

  const allFoodSources = graph.foodSourcesOf.get(speciesId) ?? []
  const allConsumers = graph.consumersOf.get(speciesId) ?? []

  const removedSet = new Set(result ? result.removedNodeIds : [])
  const lostFoods = allFoodSources.filter((fId) => removedSet.has(fId))
  const remainingFoods = allFoodSources.filter((fId) => !removedSet.has(fId))

  const isDirectMode = result?.mode === 'direct'
  const isStarved = isCascadeRemoved || (!isDirectMode && allFoodSources.length > 0 && remainingFoods.length === 0)
  const isFoodDepleted = isDirectMode && allFoodSources.length > 0 && remainingFoods.length === 0

  let statusBadge: AffectedSpeciesDetail['statusBadge'] = {
    label: 'Unaffected',
    tone: 'safe',
    description: 'This species still has all of its recorded food sources.',
  }

  let causeAndEffect = `${node.name} is stable in the ecosystem with ${allFoodSources.length} food source(s).`

  if (isDirectlyRemoved) {
    statusBadge = {
      label: 'Target of Removal',
      tone: 'danger',
      description: 'The species deliberately removed at the start of this simulation.',
    }
    causeAndEffect = `This is the species you chose to remove. All ${allFoodSources.length} of its prey links and ${allConsumers.length} predator links were disconnected.`
  } else if (isStarved) {
    statusBadge = {
      label: 'Starved (Extinct)',
      tone: 'danger',
      description: 'Lost 100% of recorded food sources and starved in the cascade.',
    }
    causeAndEffect = `${node.name} fed on ${lostFoods.map((f) => labelOf(graph, f)).join(', ')}. When that prey vanished, it had 0 alternative food options left and died of starvation.`
  } else if (isFoodDepleted) {
    statusBadge = {
      label: 'Food Depleted (Vulnerable)',
      tone: 'warning',
      description: 'Lost 100% of recorded food sources. Survives in Direct mode, but would starve in Cascade mode.',
    }
    causeAndEffect = `${node.name} lost all of its recorded prey (${lostFoods.map((f) => labelOf(graph, f)).join(', ')}). In Direct mode it is flagged as vulnerable; in Cascade mode it would starve.`
  } else if (lostFoods.length > 0) {
    statusBadge = {
      label: 'Hungry (Food Lost)',
      tone: 'warning',
      description: 'Lost some food sources, but still has backup food to survive.',
    }
    causeAndEffect = `${node.name} lost ${lostFoods.map((f) => labelOf(graph, f)).join(', ')} from its diet, but survives by eating ${remainingFoods.map((f) => labelOf(graph, f)).join(', ')}.`
  }

  return {
    id: speciesId,
    name: node.name,
    scientificName: node.scientificName,
    iconKey: node.iconKey,
    role: node.trophicRole,
    isDirectlyRemoved,
    isStarved,
    lostFoodCount: lostFoods.length,
    lostFoodNames: lostFoods.map((f) => labelOf(graph, f)),
    remainingFoodCount: remainingFoods.length,
    remainingFoodNames: remainingFoods.map((f) => labelOf(graph, f)),
    predatorNames: allConsumers.map((c) => labelOf(graph, c)),
    statusBadge,
    causeAndEffect,
  }
}

/**
 * Automatically discovers 3-4 interesting educational presets for any loaded network.
 * This lets complete beginners click one button and immediately witness meaningful ecological phenomena!
 */
export function getEducationalPresets(graph: FoodWebGraph): EducationalPreset[] {
  const presets: EducationalPreset[] = []
  if (!graph || graph.nodes.length === 0) return presets

  // 1. Look for a cascade trigger or keystone species (a node that causes secondary starvation)
  let bestCascadeNode: FoodWebNode | null = null
  let maxSecondary = 0

  // 2. Look for an apex predator
  let apexNode: FoodWebNode | null = null

  // 3. Look for a basal producer
  let producerNode: FoodWebNode | null = null

  // 4. Look for a resilient generalist (many prey and many predators)
  let generalistNode: FoodWebNode | null = null
  let maxDegree = 0

  for (const node of graph.nodes) {
    const consumers = graph.consumersOf.get(node.id) ?? []
    const foodSources = graph.foodSourcesOf.get(node.id) ?? []
    const degree = consumers.length + foodSources.length

    if (consumers.length === 0 && !apexNode) {
      apexNode = node
    }
    if (foodSources.length === 0 && !producerNode) {
      producerNode = node
    }
    if (degree > maxDegree) {
      maxDegree = degree
      generalistNode = node
    }

    // Run real cascade simulation to discover true cascade impact
    try {
      const res = runScenario(graph, graph.datasetId, node.id, 'cascade')
      const secCount = res.scenario.secondaryRemovals
      if (
        secCount > maxSecondary ||
        (secCount === maxSecondary && secCount > 0 && node.trophicRole !== 'producer' && (!bestCascadeNode || bestCascadeNode.trophicRole === 'producer'))
      ) {
        maxSecondary = secCount
        bestCascadeNode = node
      }
    } catch {
      // fallback to 1-degree check
      const specialistCount = consumers.filter((cId) => {
        const cFoods = graph.foodSourcesOf.get(cId) ?? []
        return cFoods.length === 1 && cFoods[0] === node.id
      }).length
      if (specialistCount > maxSecondary) {
        maxSecondary = specialistCount
        bestCascadeNode = node
      }
    }
  }

  // Preset 1: Cascade Trigger or Keystone
  if (bestCascadeNode && maxSecondary > 0) {
    presets.push({
      id: 'cascade-trigger',
      title: '💥 Extinction Domino Effect',
      badge: 'High Impact',
      speciesId: bestCascadeNode.id,
      speciesName: bestCascadeNode.name,
      mode: 'cascade',
      description: `Removing "${bestCascadeNode.name}" leaves specialist predators with zero food, triggering a cascade starvation!`,
      expectedOutcome: `Triggers secondary starvation in ${maxSecondary} species.`,
    })
  } else if (generalistNode) {
    presets.push({
      id: 'central-hub',
      title: '🕸️ Central Food Hub',
      badge: 'High Degree',
      speciesId: generalistNode.id,
      speciesName: generalistNode.name,
      mode: 'cascade',
      description: `"${generalistNode.name}" is deeply connected (${maxDegree} links). Observe how the network responds to losing a major hub.`,
      expectedOutcome: 'Substantial loss of feeding connections.',
    })
  }

  // Preset 2: Basal Producer
  if (producerNode) {
    presets.push({
      id: 'base-producer',
      title: '🌱 Foundation Producer',
      badge: 'Plant / Algae',
      speciesId: producerNode.id,
      speciesName: producerNode.name,
      mode: 'cascade',
      description: `Test what happens when a primary energy source at the bottom of the food web disappears.`,
      expectedOutcome: 'Starves herbivores that depend on fresh vegetation.',
    })
  }

  // Preset 3: Apex Predator
  if (apexNode) {
    presets.push({
      id: 'apex-predator',
      title: '🦅 Apex Predator',
      badge: 'Top Predator',
      speciesId: apexNode.id,
      speciesName: apexNode.name,
      mode: 'direct',
      description: `Remove the top predator ("${apexNode.name}"). Because nothing eats it, zero secondary species starve!`,
      expectedOutcome: 'Zero secondary starvation (top-down effect).',
    })
  }

  // Fallback if needed
  if (presets.length < 3 && graph.nodes.length >= 2) {
    const secondNode = graph.nodes[1]
    presets.push({
      id: 'middle-consumer',
      title: '🐟 Consumer Removal',
      badge: 'Mid Trophic',
      speciesId: secondNode.id,
      speciesName: secondNode.name,
      mode: 'direct',
      description: `Simulate the direct removal of "${secondNode.name}" to examine surviving dietary buffers.`,
      expectedOutcome: 'Measures link loss without full ecosystem collapse.',
    })
  }

  return presets.slice(0, 3)
}
