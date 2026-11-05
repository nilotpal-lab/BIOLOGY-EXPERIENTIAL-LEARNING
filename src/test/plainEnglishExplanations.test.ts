import { describe, expect, it } from 'vitest'
import { buildGraph } from '../core/graphModel'
import { computeBaselineMetrics } from '../core/metrics'
import { runScenario } from '../core/scenarios'
import {
  generatePlainEnglishStory,
  getEducationalPresets,
  getSpeciesVulnerabilityDetail,
  PLAIN_METRIC_GUIDE,
} from '../core/plainEnglishExplanations'
import { validationFixture } from '../data/fixtures'
import { demoDatasets } from '../data/demoDatasets'

describe('Plain-English Explanations Engine', () => {
  const validationGraph = buildGraph(validationFixture)
  const validationBaseline = computeBaselineMetrics(validationGraph)

  it('provides student-friendly definitions for all essential simulation metrics', () => {
    expect(PLAIN_METRIC_GUIDE.speciesRemoved.simpleExplanation).toBeTruthy()
    expect(PLAIN_METRIC_GUIDE.linksLost.simpleExplanation).toBeTruthy()
    expect(PLAIN_METRIC_GUIDE.secondaryRemovals.simpleExplanation).toBeTruthy()
    expect(PLAIN_METRIC_GUIDE.connectance.simpleExplanation).toBeTruthy()
    expect(PLAIN_METRIC_GUIDE.cascadeDepth.simpleExplanation).toBeTruthy()
  })

  it('generates a vivid plain-English story when a cascade extinction occurs', () => {
    // In validationFixture, small_fish is the sole food source of heron.
    const result = runScenario(validationGraph, validationFixture.name, 'small_fish', 'cascade')
    const story = generatePlainEnglishStory(validationGraph, validationBaseline, result)

    expect(story.headline).toContain('Chain Reaction')
    expect(story.headline).toContain('Heron')
    expect(story.severity).toBe('severe')
    expect(story.directRemovalStory).toContain('Small fish')
    expect(story.cascadeStory).toContain('Heron')
    expect(story.cascadeStory).toContain('starved')
    expect(story.keyEcologicalPrinciple).toContain('Trophic Dependency')
  })

  it('generates an encouraging resilience story when dietary redundancy prevents starvation', () => {
    const pondDataset = demoDatasets[0]
    const pondGraph = buildGraph(pondDataset)
    const pondBaseline = computeBaselineMetrics(pondGraph)

    // In FW-POND-A, minnow removal leaves surviving predators with alternative food
    const result = runScenario(pondGraph, pondDataset.name, 'minnow', 'cascade')
    const story = generatePlainEnglishStory(pondGraph, pondBaseline, result)

    expect(story.headline).toContain('Resilient')
    expect(story.cascadeStory).toContain('Good news')
    expect(story.cascadeStory).toContain('backup food sources')
  })

  it('computes detailed species vulnerability with food loss and backup analysis', () => {
    const result = runScenario(validationGraph, validationFixture.name, 'small_fish', 'cascade')
    const heronDetail = getSpeciesVulnerabilityDetail(validationGraph, result, 'heron')

    expect(heronDetail).not.toBeNull()
    expect(heronDetail?.isStarved).toBe(true)
    expect(heronDetail?.statusBadge.label).toBe('Starved (Extinct)')
    expect(heronDetail?.lostFoodCount).toBe(1)
    expect(heronDetail?.remainingFoodCount).toBe(0)
    expect(heronDetail?.causeAndEffect).toContain('Small fish')
  })

  it('distinguishes between starved in cascade vs food depleted in direct removal', () => {
    // In direct mode, heron loses small_fish but is NOT removed because cascade mode was not chosen
    const directResult = runScenario(validationGraph, validationFixture.name, 'small_fish', 'direct')
    const heronDirect = getSpeciesVulnerabilityDetail(validationGraph, directResult, 'heron')

    expect(heronDirect).not.toBeNull()
    expect(heronDirect?.isStarved).toBe(false)
    expect(heronDirect?.statusBadge.label).toBe('Food Depleted (Vulnerable)')
    expect(heronDirect?.causeAndEffect).toContain('Direct mode')
  })

  it('recommends educational presets tailored to any loaded network', () => {
    const presets = getEducationalPresets(validationGraph)
    expect(presets.length).toBeGreaterThan(0)
    expect(presets[0].speciesId).toBe('small_fish') // Discovers the keystone/cascade trigger
    expect(presets[0].mode).toBe('cascade')
  })
})
