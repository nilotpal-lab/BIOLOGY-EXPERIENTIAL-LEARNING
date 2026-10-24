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
  'producer': '#2DD4BF',
  'basal-group': '#14B8A6',
  'primary-consumer': '#818CF8',
  'secondary-consumer': '#A78BFA',
  'apex-predator': '#FCD34D',
  'omnivore': '#F472B6',
  'decomposer': '#94A3B8',
  'other': '#64748B',
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
