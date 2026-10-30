import type cytoscape from 'cytoscape'
import { ROLE_COLOURS, ROLE_BG_COLOURS } from '../../art/roleColours'

/**
 * The one place the graph styles are defined.
 *
 * Kept in its own module so it can also be exercised against the real
 * Cytoscape.js style engine in tests, which proves the intended visual states
 * actually apply instead of being silently ignored.
 *
 * IMPORTANT — how the role colour is declared:
 *   Role colours are applied through per-role CLASS selectors
 *   (`node.role-producer`), not through attribute selectors and not through a
 *   `data()` mapping. Both of those escape routes look tidier but lose:
 *   attribute selectors outrank class and pseudo-state selectors, and mapped
 *   properties outrank matching rules regardless of order — in both cases the
 *   role colour would override `node.selected`, `node.affected` and
 *   `node.depleted`, so those states would be invisible on screen.
 *   With equal-specificity class selectors the documented "later rule wins"
 *   order applies, so the state rules placed further down always take effect.
 *   `graphStyles.test.ts` resolves this stylesheet with the real Cytoscape
 *   engine to keep that guarantee honest.
 *
 * The array is cast because the published typings do not describe every valid
 * Cytoscape CSS property; the property names used here are standard
 * Cytoscape.js style properties.
 */
export function graphStyles(): cytoscape.StylesheetStyle[] {
  const styles = [
    {
      selector: 'node',
      style: {
        'width': 46,
        'height': 46,
        'shape': 'ellipse',
        'background-color': '#FFFFFF',
        'background-image': 'data(icon)',
        'background-fit': 'contain',
        'background-image-opacity': 1,
        'border-width': 2.5,
        'border-color': '#C8D8CF',
        'label': 'data(label)',
        'font-family': 'Inter, Geist, DM Sans, system-ui, sans-serif',
        'font-size': 11,
        'font-weight': 500,
        'color': '#122A23',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 5,
        'text-wrap': 'wrap',
        'text-max-width': '104px',
        'text-background-color': '#FFFFFF',
        'text-background-opacity': 0.88,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'transition-property': 'border-color, border-width, opacity',
        'transition-duration': 140,
      },
    },
    // Role colours and background tints, matching reference visual style
    ...Object.entries(ROLE_COLOURS).map(([role, colour]) => ({
      selector: `node.role-${role}`,
      style: {
        'border-color': colour,
        'background-color': ROLE_BG_COLOURS[role as keyof typeof ROLE_BG_COLOURS] ?? '#FFFFFF',
      },
    })),
    {
      selector: 'node.dimmed',
      style: { opacity: 0.18 },
    },
    {
      selector: 'node.ghost',
      style: { opacity: 0.38, 'border-style': 'dashed', 'border-width': 2 },
    },
    {
      selector: 'node.removed',
      style: {
        opacity: 0.14,
        'border-style': 'dashed',
        'border-color': '#F87171',
        'border-width': 2,
        color: '#64748B',
      },
    },
    {
      selector: 'node.affected',
      style: { 'border-color': '#2DD4BF', 'border-width': 4 },
    },
    {
      selector: 'node.depleted',
      style: { 'border-color': '#FCD34D', 'border-width': 4.5, 'border-style': 'solid' },
    },
    {
      selector: 'node.hovered',
      style: { 'border-color': '#A5B4FC', 'border-width': 3.5 },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#818CF8',
        'border-width': 4.5,
        'outline-width': 8,
        'outline-color': '#818CF8',
        'outline-opacity': 0.28,
        'color': '#122A23',
        'font-weight': 600,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.4,
        'line-color': '#94A3B8',
        'target-arrow-color': '#94A3B8',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.05,
        'curve-style': 'bezier',
        'control-point-step-size': 42,
        'opacity': 0.85,
        'transition-property': 'line-color, width, opacity',
        'transition-duration': 140,
      },
    },
    {
      selector: 'edge.hidden',
      style: { display: 'none' },
    },
    {
      selector: 'edge.dimmed',
      style: { opacity: 0.14 },
    },
    {
      selector: 'edge.food-link',
      style: {
        'line-color': '#2DD4BF',
        'target-arrow-color': '#2DD4BF',
        'width': 2.6,
        opacity: 1,
      },
    },
    {
      selector: 'edge.consumer-link',
      style: {
        'line-color': '#818CF8',
        'target-arrow-color': '#818CF8',
        'width': 2.6,
        opacity: 1,
      },
    },
    {
      selector: 'edge.match',
      style: { 'line-color': '#FCD34D', 'target-arrow-color': '#FCD34D', width: 2, opacity: 1 },
    },
  ] as unknown as cytoscape.StylesheetStyle[]
  return styles
}
