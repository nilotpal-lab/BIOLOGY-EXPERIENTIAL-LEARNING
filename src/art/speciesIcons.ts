/* ============================================================================
 * speciesIcons — the in-app species artwork registry (Master Build Prompt §3).
 *
 * Rich, high-fidelity biological vector artwork generated with Gemini Argon:
 *   - 64 x 64 viewBox, natural direction facing right.
 *   - High-contrast, vibrant, biologically accurate vector silhouettes.
 *   - Self-contained SVG images with embedded optimized artwork for Cytoscape.js
 *   - Standalone PNG assets served from /assets/organisms/ for maximum sharpness.
 *
 * The artwork NEVER influences a calculation. Nodes are matched by their stable
 * id; the icon key is decoration only, and an unknown key always resolves to the
 * neutral fallback so the graph can never fail to render.
 * ========================================================================== */

import { SPECIES_IMAGE_DATA_URIS } from './speciesImages'

export type SpeciesGroup =
  | 'producer'
  | 'invertebrate'
  | 'fish'
  | 'bird'
  | 'mammal'
  | 'reptile'
  | 'microbe'
  | 'neutral'

export interface SpeciesIcon {
  key: string
  label: string
  group: SpeciesGroup
  /** Complete `<svg>` markup string, usable inline or as a data URI. */
  svg: string
  imagePath: string
}

function wrapImage(key: string): string {
  const uri = SPECIES_IMAGE_DATA_URIS[key] || SPECIES_IMAGE_DATA_URIS['fallback'] || ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image href="${uri}" width="64" height="64" preserveAspectRatio="xMidYMid meet"/></svg>`
}

const FALLBACK_KEY = 'fallback'

const icons: SpeciesIcon[] = [
  {
    key: 'algae',
    label: 'Algae',
    group: 'producer',
    svg: wrapImage('algae'),
    imagePath: '/assets/organisms/algae.webp',
  },
  {
    key: 'phytoplankton',
    label: 'Phytoplankton',
    group: 'producer',
    svg: wrapImage('phytoplankton'),
    imagePath: '/assets/organisms/phytoplankton.webp',
  },
  {
    key: 'aquatic-plant',
    label: 'Aquatic plant',
    group: 'producer',
    svg: wrapImage('aquatic-plant'),
    imagePath: '/assets/organisms/aquatic-plant.webp',
  },
  {
    key: 'seaweed',
    label: 'Kelp',
    group: 'producer',
    svg: wrapImage('seaweed'),
    imagePath: '/assets/organisms/seaweed.webp',
  },
  {
    key: 'grass',
    label: 'Grass',
    group: 'producer',
    svg: wrapImage('grass'),
    imagePath: '/assets/organisms/grass.webp',
  },
  {
    key: 'clover',
    label: 'Clover',
    group: 'producer',
    svg: wrapImage('clover'),
    imagePath: '/assets/organisms/clover.webp',
  },
  {
    key: 'oak',
    label: 'Oak',
    group: 'producer',
    svg: wrapImage('oak'),
    imagePath: '/assets/organisms/oak.webp',
  },
  {
    key: 'hazel',
    label: 'Hazel',
    group: 'producer',
    svg: wrapImage('hazel'),
    imagePath: '/assets/organisms/hazel.webp',
  },
  {
    key: 'bracken',
    label: 'Bracken',
    group: 'producer',
    svg: wrapImage('bracken'),
    imagePath: '/assets/organisms/bracken.webp',
  },
  {
    key: 'fungus',
    label: 'Fungus',
    group: 'producer',
    svg: wrapImage('fungus'),
    imagePath: '/assets/organisms/fungus.webp',
  },
  {
    key: 'zooplankton',
    label: 'Zooplankton (water flea)',
    group: 'invertebrate',
    svg: wrapImage('zooplankton'),
    imagePath: '/assets/organisms/zooplankton.webp',
  },
  {
    key: 'krill',
    label: 'Krill',
    group: 'invertebrate',
    svg: wrapImage('krill'),
    imagePath: '/assets/organisms/krill.webp',
  },
  {
    key: 'amphipod',
    label: 'Amphipod',
    group: 'invertebrate',
    svg: wrapImage('amphipod'),
    imagePath: '/assets/organisms/amphipod.webp',
  },
  {
    key: 'insect-larva',
    label: 'Aquatic insect larva',
    group: 'invertebrate',
    svg: wrapImage('insect-larva'),
    imagePath: '/assets/organisms/insect-larva.webp',
  },
  {
    key: 'snail',
    label: 'Aquatic snail',
    group: 'invertebrate',
    svg: wrapImage('snail'),
    imagePath: '/assets/organisms/snail.webp',
  },
  {
    key: 'shrimp',
    label: 'Shrimp',
    group: 'invertebrate',
    svg: wrapImage('shrimp'),
    imagePath: '/assets/organisms/shrimp.webp',
  },
  {
    key: 'crab',
    label: 'Crab',
    group: 'invertebrate',
    svg: wrapImage('crab'),
    imagePath: '/assets/organisms/crab.webp',
  },
  {
    key: 'mussel',
    label: 'Mussel',
    group: 'invertebrate',
    svg: wrapImage('mussel'),
    imagePath: '/assets/organisms/mussel.webp',
  },
  {
    key: 'grasshopper',
    label: 'Grasshopper',
    group: 'invertebrate',
    svg: wrapImage('grasshopper'),
    imagePath: '/assets/organisms/grasshopper.webp',
  },
  {
    key: 'caterpillar',
    label: 'Caterpillar',
    group: 'invertebrate',
    svg: wrapImage('caterpillar'),
    imagePath: '/assets/organisms/caterpillar.webp',
  },
  {
    key: 'beetle',
    label: 'Beetle',
    group: 'invertebrate',
    svg: wrapImage('beetle'),
    imagePath: '/assets/organisms/beetle.webp',
  },
  {
    key: 'aphid',
    label: 'Aphid',
    group: 'invertebrate',
    svg: wrapImage('aphid'),
    imagePath: '/assets/organisms/aphid.webp',
  },
  {
    key: 'squid',
    label: 'Squid',
    group: 'invertebrate',
    svg: wrapImage('squid'),
    imagePath: '/assets/organisms/squid.webp',
  },
  {
    key: 'minnow',
    label: 'Minnow',
    group: 'fish',
    svg: wrapImage('minnow'),
    imagePath: '/assets/organisms/minnow.webp',
  },
  {
    key: 'anchovy',
    label: 'Anchovy',
    group: 'fish',
    svg: wrapImage('anchovy'),
    imagePath: '/assets/organisms/anchovy.webp',
  },
  {
    key: 'herring',
    label: 'Herring',
    group: 'fish',
    svg: wrapImage('herring'),
    imagePath: '/assets/organisms/herring.webp',
  },
  {
    key: 'perch',
    label: 'Perch',
    group: 'fish',
    svg: wrapImage('perch'),
    imagePath: '/assets/organisms/perch.webp',
  },
  {
    key: 'cod',
    label: 'Cod',
    group: 'fish',
    svg: wrapImage('cod'),
    imagePath: '/assets/organisms/cod.webp',
  },
  {
    key: 'pike',
    label: 'Pike',
    group: 'fish',
    svg: wrapImage('pike'),
    imagePath: '/assets/organisms/pike.webp',
  },
  {
    key: 'tuna',
    label: 'Tuna',
    group: 'fish',
    svg: wrapImage('tuna'),
    imagePath: '/assets/organisms/tuna.webp',
  },
  {
    key: 'lanternfish',
    label: 'Lanternfish',
    group: 'fish',
    svg: wrapImage('lanternfish'),
    imagePath: '/assets/organisms/lanternfish.webp',
  },
  {
    key: 'shark',
    label: 'Shark',
    group: 'fish',
    svg: wrapImage('shark'),
    imagePath: '/assets/organisms/shark.webp',
  },
  {
    key: 'whale',
    label: 'Baleen whale',
    group: 'fish',
    svg: wrapImage('whale'),
    imagePath: '/assets/organisms/whale.webp',
  },
  {
    key: 'carp',
    label: 'Common carp',
    group: 'fish',
    svg: wrapImage('carp'),
    imagePath: '/assets/organisms/carp.webp',
  },
  {
    key: 'songbird',
    label: 'Songbird',
    group: 'bird',
    svg: wrapImage('songbird'),
    imagePath: '/assets/organisms/songbird.webp',
  },
  {
    key: 'owl',
    label: 'Owl',
    group: 'bird',
    svg: wrapImage('owl'),
    imagePath: '/assets/organisms/owl.webp',
  },
  {
    key: 'hawk',
    label: 'Hawk',
    group: 'bird',
    svg: wrapImage('hawk'),
    imagePath: '/assets/organisms/hawk.webp',
  },
  {
    key: 'osprey',
    label: 'Osprey',
    group: 'bird',
    svg: wrapImage('osprey'),
    imagePath: '/assets/organisms/osprey.webp',
  },
  {
    key: 'heron',
    label: 'Heron',
    group: 'bird',
    svg: wrapImage('heron'),
    imagePath: '/assets/organisms/heron.webp',
  },
  {
    key: 'seabird',
    label: 'Seabird',
    group: 'bird',
    svg: wrapImage('seabird'),
    imagePath: '/assets/organisms/seabird.webp',
  },
  {
    key: 'woodpecker',
    label: 'Woodpecker',
    group: 'bird',
    svg: wrapImage('woodpecker'),
    imagePath: '/assets/organisms/woodpecker.webp',
  },
  {
    key: 'kingfisher',
    label: 'Kingfisher',
    group: 'bird',
    svg: wrapImage('kingfisher'),
    imagePath: '/assets/organisms/kingfisher.webp',
  },
  {
    key: 'field-mouse',
    label: 'Mouse',
    group: 'mammal',
    svg: wrapImage('field-mouse'),
    imagePath: '/assets/organisms/field-mouse.webp',
  },
  {
    key: 'rabbit',
    label: 'Rabbit',
    group: 'mammal',
    svg: wrapImage('rabbit'),
    imagePath: '/assets/organisms/rabbit.webp',
  },
  {
    key: 'squirrel',
    label: 'Squirrel',
    group: 'mammal',
    svg: wrapImage('squirrel'),
    imagePath: '/assets/organisms/squirrel.webp',
  },
  {
    key: 'deer',
    label: 'Deer',
    group: 'mammal',
    svg: wrapImage('deer'),
    imagePath: '/assets/organisms/deer.webp',
  },
  {
    key: 'fox',
    label: 'Fox',
    group: 'mammal',
    svg: wrapImage('fox'),
    imagePath: '/assets/organisms/fox.webp',
  },
  {
    key: 'otter',
    label: 'Otter',
    group: 'mammal',
    svg: wrapImage('otter'),
    imagePath: '/assets/organisms/otter.webp',
  },
  {
    key: 'seal',
    label: 'Seal',
    group: 'mammal',
    svg: wrapImage('seal'),
    imagePath: '/assets/organisms/seal.webp',
  },
  {
    key: 'lizard',
    label: 'Lizard',
    group: 'reptile',
    svg: wrapImage('lizard'),
    imagePath: '/assets/organisms/lizard.webp',
  },
  {
    key: 'frog',
    label: 'Frog',
    group: 'reptile',
    svg: wrapImage('frog'),
    imagePath: '/assets/organisms/frog.webp',
  },
  {
    key: 'tadpole',
    label: 'Tadpole',
    group: 'reptile',
    svg: wrapImage('tadpole'),
    imagePath: '/assets/organisms/tadpole.webp',
  },
  {
    key: 'snake',
    label: 'Snake',
    group: 'reptile',
    svg: wrapImage('snake'),
    imagePath: '/assets/organisms/snake.webp',
  },
  {
    key: 'bacteria',
    label: 'Bacteria',
    group: 'microbe',
    svg: wrapImage('bacteria'),
    imagePath: '/assets/organisms/bacteria.webp',
  },
  {
    key: 'detritus',
    label: 'Detritus',
    group: 'microbe',
    svg: wrapImage('detritus'),
    imagePath: '/assets/organisms/detritus.webp',
  },
  {
    key: FALLBACK_KEY,
    label: 'Species or trophic group',
    group: 'neutral',
    svg: wrapImage(FALLBACK_KEY),
    imagePath: '/assets/organisms/fallback.webp',
  },
]

export const SPECIES_ICONS: Record<string, SpeciesIcon> = Object.fromEntries(
  icons.map((icon) => [icon.key, icon]),
)

export const FALLBACK_ICON = SPECIES_ICONS[FALLBACK_KEY]

/** Never throws: an unknown or missing key resolves to the neutral fallback. */
export function getSpeciesIcon(key: string | null | undefined): SpeciesIcon {
  if (key && SPECIES_ICONS[key]) return SPECIES_ICONS[key]
  return FALLBACK_ICON
}

export function hasSpeciesIcon(key: string): boolean {
  return Boolean(SPECIES_ICONS[key])
}

/** Data URI suitable for a Cytoscape `background-image`, or any `<img>`. */
export function speciesIconDataUri(key: string | null | undefined): string {
  const icon = getSpeciesIcon(key)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}`
}

export const SPECIES_ICON_KEYS: string[] = icons.map((icon) => icon.key)
