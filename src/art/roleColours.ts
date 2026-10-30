import { TROPHIC_ROLE_LABEL, type TrophicRole } from '../core/types'

/* ============================================================================
 * roleColours — the role colour tokens and legend content.
 *
 * Kept out of the component module so the graph component only exports
 * components, and so the legend and the graph styles can never drift apart.
 * Colours stay inside the Soft Pop family: teal for producers and basal groups,
 * periwinkle for consumers, yellow for apex predators, grey for decomposers and
 * unspecified roles. Colour is never the only signal — the legend, the tooltip,
 * the inspector and every table also carry text.
 * ========================================================================== */

export const ROLE_COLOURS: Record<TrophicRole, string> = {
  'producer': '#B5D39A',
  'basal-group': '#B5D39A',
  'primary-consumer': '#91BFE0',
  'secondary-consumer': '#F3D98B',
  'apex-predator': '#EF9A88',
  'omnivore': '#F1B36F',
  'decomposer': '#C49A6C',
  'other': '#68716B',
}

export const ROLE_BG_COLOURS: Record<TrophicRole, string> = {
  'producer': '#F2F8ED',
  'basal-group': '#F2F8ED',
  'primary-consumer': '#EEF5FA',
  'secondary-consumer': '#FEF9EC',
  'apex-predator': '#FDF1EE',
  'omnivore': '#FEF5EA',
  'decomposer': '#F9F5F0',
  'other': '#F5F6F4',
}

export interface GraphLegendItem {
  label: string
  colour: string
  description: string
}

export const ROLE_LEGEND: GraphLegendItem[] = Object.entries(ROLE_COLOURS).map(
  ([role, colour]) => ({
    label: TROPHIC_ROLE_LABEL[role as TrophicRole] ?? role,
    colour,
    description: `Recorded trophic role: ${TROPHIC_ROLE_LABEL[role as TrophicRole] ?? role}`,
  }),
)

export const STATE_LEGEND: GraphLegendItem[] = [
  {
    label: 'Selected',
    colour: '#818CF8',
    description: 'The node currently selected for simulation',
  },
  {
    label: 'Directly affected',
    colour: '#2DD4BF',
    description: 'Lost at least one recorded food-source link',
  },
  {
    label: 'Food depleted',
    colour: '#FCD34D',
    description: 'No recorded food source remains in this scenario',
  },
  {
    label: 'Removed',
    colour: '#F87171',
    description: 'Removed in this scenario; faded and dashed',
  },
]
