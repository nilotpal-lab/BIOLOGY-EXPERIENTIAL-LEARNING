import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { describe, expect, it } from 'vitest'
import { graphStyles } from '../components/graph/graphStyles'
import { ROLE_COLOURS } from '../art/roleColours'
import { buildGraph } from '../core/graphModel'
import { validationFixture } from '../data/fixtures'
import { speciesIconDataUri } from '../art/speciesIcons'
import { TROPHIC_ROLES } from '../core/types'

/* ============================================================================
 * Visual verification against the REAL Cytoscape.js style engine.
 *
 * jsdom cannot render a canvas, but Cytoscape can run headless with style
 * resolution enabled, which makes it possible to prove that the intended visual
 * states (role colours, selection, removal, food depletion, link highlighting
 * and arrow direction) actually resolve — rather than being silently ignored
 * because a style property was misspelled.
 * ========================================================================== */

/** A single-valued style read, because collection.style(name) is array-valued. */
function readStyle(element: ReturnType<Core['getElementById']>, name: string): string {
  const value = element.style(name) as unknown
  if (Array.isArray(value)) return String(value[0])
  return String(value)
}

/**
 * The production stylesheet plus a zero-duration override.
 *
 * The real stylesheet animates border colour, border width and opacity over
 * 140 ms. Reading `style()` while such a transition is in flight returns the
 * interpolated value (for example `2.500002`), which describes a mid-animation
 * frame rather than the resolved style. Zeroing the duration here tests the
 * settled result, so a genuine precedence bug cannot hide behind an animation.
 */
function settledStyles(): cytoscape.StylesheetStyle[] {
  return [
    ...graphStyles(),
    { selector: 'node, edge', style: { 'transition-duration': 0 } },
  ] as unknown as cytoscape.StylesheetStyle[]
}

/** Cytoscape resolves colours to `rgb(...)`, so hex tokens are compared that way. */
function rgb(hex: string): string {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgb(${red},${green},${blue})`
}

function makeFixtureCore(): Core {
  const graph = buildGraph(validationFixture)
  const elements: ElementDefinition[] = [
    ...graph.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.name,
        icon: speciesIconDataUri(node.iconKey),
        role: node.trophicRole,
      },
      classes: `role-${node.trophicRole}`,
    })),
    ...graph.edges.map((edge) => ({
      data: { id: edge.id, source: edge.source, target: edge.target },
      classes: 'link',
    })),
  ]
  return cytoscape({ headless: true, styleEnabled: true, elements, style: settledStyles() })
}

describe('graph stylesheet resolves against the real Cytoscape engine', () => {
  const cy = makeFixtureCore()

  it('renders every node with its species artwork and its label', () => {
    const algae = cy.getElementById('algae')
    expect(readStyle(algae, 'background-image')).toContain('data:image/svg+xml')
    expect(readStyle(algae, 'label')).toBe('Algae')
    expect(readStyle(algae, 'width')).toMatch(/^46/) // width is returned with a unit suffix
  })

  it('colours each node by its recorded trophic role', () => {
    // Role colours are equal-specificity classes declared above the state
    // rules, so simulation states always take precedence (see graphStyles.ts).
    expect(readStyle(cy.getElementById('algae'), 'border-color')).toBe(rgb(ROLE_COLOURS['producer']))
    expect(readStyle(cy.getElementById('small_fish'), 'border-color')).toBe(
      rgb(ROLE_COLOURS['secondary-consumer']),
    )
    expect(readStyle(cy.getElementById('heron'), 'border-color')).toBe(
      rgb(ROLE_COLOURS['apex-predator']),
    )
  })

  it('draws links as arrows from the food organism to the consumer', () => {
    const edge = cy.getElementById('e:algae->zooplankton')
    expect(readStyle(edge, 'target-arrow-shape')).toBe('triangle')
    expect(edge.data('source')).toBe('algae')
    expect(edge.data('target')).toBe('zooplankton')
  })

  it('applies the simulation states as distinct, non-colour-only styles', () => {
    const heron = cy.getElementById('heron')

    heron.addClass('depleted')
    expect(readStyle(heron, 'border-color')).toBe(rgb('#FCD34D'))
    expect(Number.parseFloat(readStyle(heron, 'border-width'))).toBeGreaterThan(3.5)

    heron.removeClass('depleted').addClass('affected')
    expect(readStyle(heron, 'border-color')).toBe(rgb('#2DD4BF'))

    heron.removeClass('affected').addClass('removed')
    expect(readStyle(heron, 'border-style')).toBe('dashed')
    expect(Number.parseFloat(readStyle(heron, 'opacity'))).toBeLessThan(0.25)

    heron.removeClass('removed').addClass('ghost')
    expect(readStyle(heron, 'border-style')).toBe('dashed')
    expect(Number.parseFloat(readStyle(heron, 'opacity'))).toBeGreaterThan(0.25)
  })

  it('uses a strong periwinkle outline and halo for the selected node', () => {
    const fish = cy.getElementById('small_fish')
    fish.select()
    expect(readStyle(fish, 'border-color')).toBe(rgb('#818CF8'))
    // Cytoscape returns lengths with a unit suffix (`8px`), so parse the number.
    expect(Number.parseFloat(readStyle(fish, 'outline-width'))).toBeGreaterThan(0)
    expect(Number.parseFloat(readStyle(fish, 'outline-opacity'))).toBeGreaterThan(0)
    fish.unselect()
  })

  it('marks a highlighted food link teal and a consumer link periwinkle', () => {
    const foodLink = cy.getElementById('e:algae->snail')
    const consumerLink = cy.getElementById('e:algae->zooplankton')

    foodLink.addClass('food-link')
    consumerLink.addClass('consumer-link')

    expect(readStyle(foodLink, 'line-color')).toBe(rgb('#2DD4BF'))
    expect(readStyle(foodLink, 'target-arrow-color')).toBe(rgb('#2DD4BF'))
    expect(readStyle(consumerLink, 'line-color')).toBe(rgb('#818CF8'))
    expect(readStyle(consumerLink, 'target-arrow-color')).toBe(rgb('#818CF8'))
  })

  it('hides a link whose endpoint has been removed', () => {
    const edge = cy.getElementById('e:small_fish->heron')
    edge.addClass('hidden')
    expect(readStyle(edge, 'display')).toBe('none')
    edge.removeClass('hidden')
    expect(readStyle(edge, 'display')).not.toBe('none')
  })
})

describe('every declared selector can actually match something', () => {
  /** A synthetic core carrying one node per role and one element per state class. */
  function makeCoverageCore(): Core {
    const elements: ElementDefinition[] = [
      ...TROPHIC_ROLES.map((role) => ({
        data: {
          id: `role-${role}`,
          label: role,
          role,
          icon: speciesIconDataUri('fallback'),
        },
        classes: `role-${role}`,
      })),
      { data: { id: 'state-removed', label: 'removed', role: 'other', icon: '' }, classes: 'removed' },
      { data: { id: 'state-ghost', label: 'ghost', role: 'other', icon: '' }, classes: 'ghost' },
      {
        data: { id: 'state-affected', label: 'affected', role: 'other', icon: '' },
        classes: 'affected',
      },
      {
        data: { id: 'state-depleted', label: 'depleted', role: 'other', icon: '' },
        classes: 'depleted',
      },
      { data: { id: 'state-hovered', label: 'hovered', role: 'other', icon: '' }, classes: 'hovered' },
      { data: { id: 'state-dimmed', label: 'dimmed', role: 'other', icon: '' }, classes: 'dimmed' },
      { data: { id: 'e-a', source: 'role-producer', target: 'role-omnivore' }, classes: 'hidden' },
      { data: { id: 'e-b', source: 'role-producer', target: 'role-decomposer' }, classes: 'dimmed' },
      { data: { id: 'e-c', source: 'role-producer', target: 'role-other' }, classes: 'food-link' },
      {
        data: { id: 'e-d', source: 'role-producer', target: 'role-basal-group' },
        classes: 'consumer-link',
      },
      { data: { id: 'e-e', source: 'role-producer', target: 'role-other' }, classes: 'match' },
    ]
    return cytoscape({ headless: true, styleEnabled: true, elements, style: settledStyles() })
  }

  it('resolves every selector in the stylesheet', () => {
    const cy = makeCoverageCore()
    // Give the selected-state selector something to match.
    cy.getElementById('role-apex-predator').select()

    const unmatched: string[] = []
    for (const entry of graphStyles()) {
      const selector = String(entry.selector)
      if (cy.$(selector).length === 0) unmatched.push(selector)
    }
    expect(unmatched).toEqual([])
  })
})
