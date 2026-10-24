/* ============================================================================
 * speciesIcons — the in-app species artwork registry (Master Build Prompt §3).
 *
 * Art direction, applied consistently to every icon:
 *   - 64 x 64 viewBox, natural direction facing right.
 *   - two-tone flat fills plus a single darker outline, no photographic or 3D
 *     rendering, no external image services, no emoji.
 *   - a strong silhouette with a few recognisable features rather than detail,
 *     so icons stay readable at graph-node size on a dark background.
 *   - one shared outline colour and one shared stroke width, so animals drawn
 *     for different habitats still look like members of the same set.
 *
 * The artwork NEVER influences a calculation. Nodes are matched by their stable
 * id; the icon key is decoration only, and an unknown key always resolves to the
 * neutral fallback so the graph can never fail to render.
 * ========================================================================== */

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
}

/* -------------------------------------------------------------------------- */
/* Shared drawing language                                                    */
/* -------------------------------------------------------------------------- */

const OUTLINE = '#0E1622'
const STROKE = `stroke="${OUTLINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`

/** Wrap a set of shapes in a consistent 64x64 SVG document. */
function wrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g ${STROKE}>${inner}</g></svg>`
}

/** Two-tone eye that reads at small sizes. */
function eye(cx: number, cy: number, r = 2.5): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0B1220"/><circle cx="${cx - 0.9}" cy="${cy - 1}" r="${(r * 0.36).toFixed(2)}" fill="#F8FAFC" stroke="none"/>`
}

/** Rounded organic strand drawn as a dark pass plus a lighter inner pass. */
function strand(d: string, colour: string, shade: string, width = 7): string {
  return (
    `<path d="${d}" fill="none" stroke="${shade}" stroke-width="${width}" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${(width * 0.5).toFixed(1)}" stroke-linecap="round"/>`
  )
}

/* -------------------------------------------------------------------------- */
/* Fish builder (minnow, herring, perch, cod, pike, tuna, shark, whale, …)     */
/* -------------------------------------------------------------------------- */

interface FishOptions {
  tail?: 'fork' | 'crescent' | 'fluke' | 'round'
  top?: number
  bottom?: number
  nose?: number
  back: string
  belly: string
  fin: string
  dorsal?: 'small' | 'triangle' | 'large' | 'none'
  markings?: 'stripes' | 'spots' | 'dots' | 'barbel' | 'none'
  markingColour?: string
  eyeSize?: number
}

function fish(opts: FishOptions): string {
  const top = opts.top ?? 19
  const bottom = opts.bottom ?? 46
  const nose = opts.nose ?? 52
  const tail = opts.tail ?? 'fork'
  const belly = opts.belly
  const parts: string[] = []

  // Tail
  switch (tail) {
    case 'crescent':
      parts.push(
        `<path d="M18 ${top + 4} C9 ${top - 4} 3 24 16 31 C3 40 9 ${bottom + 4} 18 ${bottom - 3} Z" fill="${opts.fin}"/>`,
      )
      break
    case 'fluke':
      parts.push(
        `<path d="M18 ${top + 5} C11 ${top - 2} 7 25 17 30 C7 35 11 ${bottom + 2} 18 ${bottom - 4} Z" fill="${opts.fin}"/>`,
      )
      break
    case 'round':
      parts.push(`<path d="M18 ${top + 6} L9 30 L19 ${bottom - 5} Z" fill="${opts.fin}"/>`)
      break
    default:
      parts.push(
        `<path d="M18 ${top + 5} L6 ${top - 3} L11 32 L6 ${bottom + 3} L18 ${bottom - 4} Z" fill="${opts.fin}"/>`,
      )
  }

  // Body
  parts.push(
    `<path d="M18 ${top + 5} C29 ${top - 3} 45 ${top - 2} ${nose} 32 C45 ${bottom + 2} 29 ${bottom + 3} 18 ${bottom - 5} Z" fill="${opts.back}"/>`,
  )

  // Belly highlight
  parts.push(
    `<path d="M20 ${bottom - 8} C30 ${bottom + 1} 42 ${bottom - 4} 48 33 C42 ${bottom - 1} 30 ${bottom + 2} 20 ${bottom - 8} Z" fill="${belly}" stroke="none" opacity="0.85"/>`,
  )

  // Dorsal fin
  if (opts.dorsal !== 'none') {
    const size = opts.dorsal === 'large' ? 11 : opts.dorsal === 'small' ? 6 : 8
    parts.push(
      `<path d="M29 ${top + 1} C33 ${top - size} 42 ${top - size + 1} 45 ${top + 2} Z" fill="${opts.fin}"/>`,
    )
  }

  // Pectoral fin
  parts.push(
    `<path d="M35 ${bottom - 10} C39 ${bottom - 2} 45 ${bottom - 1} 47 ${bottom - 6} Z" fill="${opts.fin}"/>`,
  )

  // Markings
  if (opts.markings === 'stripes') {
    const colour = opts.markingColour ?? OUTLINE
    parts.push(
      `<g fill="${colour}" stroke="none" opacity="0.45">` +
        [26, 33, 40].map((x) => `<rect x="${x}" y="${top - 1}" width="3.4" height="${bottom - top + 2}" rx="1.7"/>`).join('') +
        `</g>`,
    )
  } else if (opts.markings === 'spots') {
    const colour = opts.markingColour ?? OUTLINE
    parts.push(
      `<g fill="${colour}" stroke="none" opacity="0.5">` +
        [
          [26, 26],
          [32, 30],
          [38, 24],
          [30, 38],
          [38, 37],
          [44, 30],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.1"/>`)
          .join('') +
        `</g>`,
    )
  } else if (opts.markings === 'dots') {
    parts.push(
      `<g fill="${opts.markingColour ?? '#FCD34D'}" stroke="none">` +
        [20, 26, 32, 38, 44]
          .map((x) => `<circle cx="${x}" cy="${bottom - 6}" r="1.5"/>`)
          .join('') +
        `</g>`,
    )
  } else if (opts.markings === 'barbel') {
    parts.push(
      `<path d="M${nose - 6} ${bottom - 6} C${nose - 5} 44 ${nose - 8} 46 ${nose - 9} 48" fill="none" stroke="${OUTLINE}" stroke-width="1.8"/>`,
    )
  }

  // Gill line
  parts.push(
    `<path d="M${nose - 12} ${top + 4} C${nose - 15} 30 ${nose - 15} 34 ${nose - 12} ${bottom - 3}" fill="none" stroke="${OUTLINE}" stroke-width="1.6" opacity="0.55"/>`,
  )

  // Eye
  parts.push(eye(nose - 8, 29, opts.eyeSize ?? 2.5))

  return parts.join('')
}

/* -------------------------------------------------------------------------- */
/* Icon definitions                                                           */
/* -------------------------------------------------------------------------- */

const FALLBACK_KEY = 'fallback'

const icons: SpeciesIcon[] = [
  /* ---------------- Producers and basal groups ---------------- */
  {
    key: 'algae',
    label: 'Algae',
    group: 'producer',
    svg: wrap(
      strand('M14 52C19 42 10 36 16 25C20 18 15 13 17 8', '#4ADE80', '#15803D') +
        strand('M31 54C36 43 27 37 33 26C37 19 32 14 34 9', '#22C55E', '#166534') +
        strand('M47 52C52 42 43 36 49 25C53 18 48 13 50 8', '#86EFAC', '#16A34A', 6),
    ),
  },
  {
    key: 'phytoplankton',
    label: 'Phytoplankton',
    group: 'producer',
    svg: wrap(
      `<circle cx="24" cy="26" r="10" fill="#4ADE80"/>` +
        `<path d="M24 16v-6M34 26h6M24 36v6M14 26h-6M31 19l4-4M31 33l4 4M17 19l-4-4M17 33l-4 4" fill="none" stroke="#15803D" stroke-width="2.4"/>` +
        `<circle cx="24" cy="26" r="3.4" fill="#BBF7D0" stroke="none"/>` +
        `<circle cx="45" cy="40" r="7" fill="#22D3EE"/>` +
        `<path d="M45 33v-5M52 40h5M45 47v5M38 40h-5" fill="none" stroke="#0891B2" stroke-width="2.2"/>` +
        `<circle cx="45" cy="40" r="2.4" fill="#CFFAFE" stroke="none"/>` +
        `<circle cx="42" cy="19" r="4.6" fill="#86EFAC"/>`,
    ),
  },
  {
    key: 'aquatic-plant',
    label: 'Aquatic plant',
    group: 'producer',
    svg: wrap(
      strand('M32 56C32 44 32 30 32 14', '#4ADE80', '#15803D', 6) +
        `<path d="M32 30C22 28 14 20 12 10C24 12 32 20 32 30Z" fill="#22C55E"/>` +
        `<path d="M32 40C42 38 50 30 52 20C40 22 32 30 32 40Z" fill="#16A34A"/>` +
        `<path d="M32 22C26 18 24 12 24 6C31 9 33 15 32 22Z" fill="#86EFAC"/>`,
    ),
  },
  {
    key: 'seaweed',
    label: 'Kelp',
    group: 'producer',
    svg: wrap(
      strand('M30 58C34 46 24 38 30 26C34 18 28 12 30 4', '#2DD4BF', '#0F766E') +
        `<path d="M30 44C40 42 50 34 54 22C42 24 31 32 30 44Z" fill="#14B8A6"/>` +
        `<path d="M30 30C40 28 48 20 52 8C40 10 31 18 30 30Z" fill="#5EEAD4"/>` +
        `<circle cx="41" cy="35" r="3.2" fill="#0F766E" stroke="none"/>` +
        `<circle cx="44" cy="20" r="3" fill="#0F766E" stroke="none"/>`,
    ),
  },
  {
    key: 'grass',
    label: 'Grass',
    group: 'producer',
    svg: wrap(
      strand('M32 58C32 44 32 26 32 12', '#4ADE80', '#15803D') +
        strand('M22 58C20 46 14 34 6 26', '#22C55E', '#166534', 6) +
        strand('M42 58C44 46 50 34 58 26', '#22C55E', '#166534', 6) +
        strand('M27 58C26 42 20 24 16 14', '#86EFAC', '#16A34A', 5) +
        strand('M38 58C39 42 46 24 50 14', '#86EFAC', '#16A34A', 5),
    ),
  },
  {
    key: 'clover',
    label: 'Clover',
    group: 'producer',
    svg: wrap(
      strand('M32 58C32 48 32 40 32 34', '#4ADE80', '#15803D', 6) +
        `<circle cx="22" cy="24" r="11" fill="#4ADE80"/>` +
        `<circle cx="42" cy="24" r="11" fill="#22C55E"/>` +
        `<circle cx="32" cy="14" r="11" fill="#86EFAC"/>` +
        `<circle cx="32" cy="24" r="3" fill="#166534" stroke="none"/>`,
    ),
  },
  {
    key: 'oak',
    label: 'Oak',
    group: 'producer',
    svg: wrap(
      `<path d="M32 10C40 14 46 24 44 34C42 44 38 50 32 54C26 50 22 44 20 34C18 24 24 14 32 10Z" fill="#4ADE80"/>` +
        `<path d="M32 14v38" fill="none" stroke="#166534" stroke-width="2.2"/>` +
        `<path d="M32 24l9-6M32 34l10-6M32 44l9-6M32 24l-9-6M32 34l-10-6M32 44l-9-6" fill="none" stroke="#166534" stroke-width="1.8" opacity="0.75"/>` +
        `<path d="M47 40c6 0 9 4 9 8s-4 7-9 7-8-3-8-7 3-8 8-8Z" fill="#C084FC"/>` +
        `<path d="M47 34v6" fill="none" stroke="#7C3AED" stroke-width="2.4"/>`,
    ),
  },
  {
    key: 'hazel',
    label: 'Hazel',
    group: 'producer',
    svg: wrap(
      strand('M32 56C32 46 32 36 32 26', '#4ADE80', '#15803D', 6) +
        `<path d="M32 26C22 24 14 16 12 6C24 8 32 16 32 26Z" fill="#22C55E"/>` +
        `<path d="M32 36C42 34 50 26 52 16C40 18 32 26 32 36Z" fill="#16A34A"/>` +
        `<circle cx="44" cy="44" r="8" fill="#C08552"/>` +
        `<path d="M44 36c3 3 4 8 0 12" fill="none" stroke="#7C4A21" stroke-width="1.8"/>`,
    ),
  },
  {
    key: 'bracken',
    label: 'Bracken',
    group: 'producer',
    svg: wrap(
      strand('M32 58C32 46 32 30 32 10', '#4ADE80', '#15803D', 5) +
        [0, 1, 2, 3]
          .map((index) => {
            const y = 22 + index * 9
            return (
              `<path d="M32 ${y}C24 ${y - 6} 18 ${y - 10} 14 ${y - 12}C22 ${y - 12} 29 ${y - 6} 32 ${y}Z" fill="#22C55E"/>` +
              `<path d="M32 ${y}C40 ${y - 6} 46 ${y - 10} 50 ${y - 12}C42 ${y - 12} 35 ${y - 6} 32 ${y}Z" fill="#16A34A"/>`
            )
          })
          .join('') +
        `<path d="M32 18c-4-4-6-9-5-14 4 3 7 8 5 14Z" fill="#86EFAC"/>`,
    ),
  },
  {
    key: 'fungus',
    label: 'Fungus',
    group: 'producer',
    svg: wrap(
      `<path d="M27 36h10v16c0 3-3 5-5 5s-5-2-5-5V36Z" fill="#E7E5E4"/>` +
        `<path d="M8 36C8 20 19 8 32 8s24 12 24 28c0 3-2 5-5 5H13c-3 0-5-2-5-5Z" fill="#C084FC"/>` +
        `<circle cx="22" cy="24" r="3.4" fill="#F5F3FF" stroke="none"/>` +
        `<circle cx="38" cy="20" r="2.8" fill="#F5F3FF" stroke="none"/>` +
        `<circle cx="44" cy="30" r="3" fill="#F5F3FF" stroke="none"/>` +
        `<circle cx="30" cy="30" r="2.4" fill="#F5F3FF" stroke="none"/>`,
    ),
  },

  /* ---------------- Freshwater invertebrates ---------------- */
  {
    key: 'zooplankton',
    label: 'Zooplankton (water flea)',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M22 20C34 16 46 24 46 34C46 44 36 50 26 46C16 42 12 32 16 24Z" fill="#7DD3FC"/>` +
        `<path d="M22 22C30 20 38 25 40 32" fill="none" stroke="#0284C7" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M20 30C12 26 8 18 10 8C18 12 24 20 26 28" fill="none" stroke="#0EA5E9" stroke-width="4"/>` +
        `<path d="M24 44C22 52 18 56 12 58" fill="none" stroke="#0EA5E9" stroke-width="3"/>` +
        `<path d="M46 34C52 32 56 34 58 38" fill="none" stroke="#0EA5E9" stroke-width="3"/>` +
        eye(30, 28, 3),
    ),
  },
  {
    key: 'krill',
    label: 'Krill',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M14 34C18 24 32 20 46 24C52 26 54 30 52 34C42 32 30 32 22 38Z" fill="#FDA4AF"/>` +
        `<path d="M22 38C26 44 34 46 42 44" fill="none" stroke="#E11D48" stroke-width="2"/>` +
        `<path d="M18 32C10 26 6 18 6 8M20 36C12 32 6 26 2 18" fill="none" stroke="#F87171" stroke-width="2.6"/>` +
        `<path d="M30 40v8M36 40v8M42 40v8M48 37v8" fill="none" stroke="#E11D48" stroke-width="2.4"/>` +
        `<path d="M52 34C58 34 60 38 62 42" fill="none" stroke="#E11D48" stroke-width="2.4"/>` +
        eye(46, 29, 2.4),
    ),
  },
  {
    key: 'amphipod',
    label: 'Amphipod',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M20 16C36 14 50 24 50 36C50 46 42 52 32 50C22 48 14 40 14 30C14 22 16 18 20 16Z" fill="#FDBA74"/>` +
        `<path d="M22 22C34 20 44 28 44 38" fill="none" stroke="#C2410C" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M26 50v8M34 51v8M42 48v8M48 42v8" fill="none" stroke="#EA580C" stroke-width="2.4"/>` +
        `<path d="M22 18C14 14 8 8 4 2M26 17C20 12 16 6 14 0" fill="none" stroke="#EA580C" stroke-width="2.4"/>` +
        `<path d="M20 34C10 32 6 28 2 24" fill="none" stroke="#EA580C" stroke-width="2.2"/>` +
        eye(20, 24, 2.4),
    ),
  },
  {
    key: 'insect-larva',
    label: 'Aquatic insect larva',
    group: 'invertebrate',
    svg: wrap(
      `<g fill="#A3E635">` +
        [10, 20, 30, 40, 48]
          .map((x, index) => `<circle cx="${x + 6}" cy="${32 + (index % 2 === 0 ? 0 : 2)}" r="7"/>`)
          .join('') +
        `</g>` +
        `<path d="M8 32c-4-2-6-4-6-6" fill="none" stroke="#4D7C0F" stroke-width="2.4"/>` +
        `<path d="M8 34c-4 0-6 2-8 4" fill="none" stroke="#4D7C0F" stroke-width="2.4"/>` +
        `<path d="M18 40v8M28 40v8M38 40v8M46 39v8M12 39v8" fill="none" stroke="#4D7C0F" stroke-width="2.4"/>` +
        `<path d="M50 26c4-2 6-4 6-8M50 38c4 2 6 4 6 8" fill="none" stroke="#4D7C0F" stroke-width="2.4"/>` +
        eye(52, 29, 2.2),
    ),
  },
  {
    key: 'snail',
    label: 'Aquatic snail',
    group: 'invertebrate',
    svg: wrap(
      `<circle cx="36" cy="28" r="18" fill="#C084FC"/>` +
        `<path d="M36 28c0-6-5-10-10-9s-7 8-2 12 12 1 12-6-8-11-13-4" fill="none" stroke="#7C3AED" stroke-width="2.6"/>` +
        `<path d="M14 46h34c4 0 6 3 6 6s-3 6-7 6H18c-5 0-8-3-8-6s2-6 4-6Z" fill="#FDE68A"/>` +
        `<path d="M14 34c-4-4-6-8-6-14M20 32c-2-6-2-10 0-16" fill="none" stroke="#A16207" stroke-width="2.6"/>` +
        eye(8, 20, 2.2) +
        eye(20, 16, 2.2),
    ),
  },
  {
    key: 'shrimp',
    label: 'Shrimp',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M16 22C20 14 32 12 40 18C50 25 52 38 46 48C40 56 28 56 22 48C16 40 14 30 16 22Z" fill="#FB923C"/>` +
        `<path d="M20 26C28 20 38 22 44 30" fill="none" stroke="#C2410C" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M22 48C14 52 8 52 2 48" fill="none" stroke="#EA580C" stroke-width="4"/>` +
        `<path d="M28 52v8M36 52v8M44 48v8M48 42v8" fill="none" stroke="#EA580C" stroke-width="2.4"/>` +
        `<path d="M16 20C8 14 4 8 2 1M20 20C14 12 12 7 13 1" fill="none" stroke="#EA580C" stroke-width="2.4"/>` +
        eye(24, 26, 2.4),
    ),
  },
  {
    key: 'crab',
    label: 'Crab',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M10 34C10 22 20 14 32 14s22 8 22 20c0 10-8 16-22 16S10 44 10 34Z" fill="#F87171"/>` +
        `<path d="M14 30C24 24 40 24 50 30" fill="none" stroke="#B91C1C" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M12 36c-6-4-8-10-6-16M52 36c6-4 8-10 6-16" fill="none" stroke="#DC2626" stroke-width="3"/>` +
        `<path d="M2 20c-2-6 0-10 4-12M62 20c2-6 0-10-4-12" fill="none" stroke="#DC2626" stroke-width="3"/>` +
        `<path d="M18 50l-4 8M28 52l-2 10M38 52l2 10M48 50l4 8" fill="none" stroke="#DC2626" stroke-width="2.6"/>` +
        eye(24, 26, 2.6) +
        eye(40, 26, 2.6),
    ),
  },
  {
    key: 'mussel',
    label: 'Mussel',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M32 8C44 14 52 26 52 38C52 48 44 56 32 56C20 56 12 48 12 38C12 26 20 14 32 8Z" fill="#60A5FA"/>` +
        `<path d="M32 12v40" fill="none" stroke="#1E40AF" stroke-width="2.2"/>` +
        `<path d="M22 18C18 26 18 38 22 48M42 18C46 26 46 38 42 48" fill="none" stroke="#1E40AF" stroke-width="1.8" opacity="0.7"/>` +
        `<path d="M32 8C36 12 38 16 38 20C38 24 35 26 32 26C29 26 26 24 26 20C26 16 28 12 32 8Z" fill="#93C5FD"/>`,
    ),
  },
  {
    key: 'grasshopper',
    label: 'Grasshopper',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M22 26C30 20 44 20 52 26C56 30 54 36 46 38H26C18 36 16 30 22 26Z" fill="#A3E635"/>` +
        `<path d="M28 26C36 22 46 22 52 26" fill="none" stroke="#4D7C0F" stroke-width="1.8" opacity="0.7"/>` +
        `<path d="M52 24C56 18 60 14 63 12" fill="none" stroke="#4D7C0F" stroke-width="2.4"/>` +
        `<path d="M26 38C20 44 14 50 8 58C4 62 8 64 12 62C22 56 34 48 40 42" fill="none" stroke="#65A30D" stroke-width="4"/>` +
        `<path d="M24 36L10 56" fill="none" stroke="#4D7C0F" stroke-width="2.6"/>` +
        eye(46, 27, 2.4),
    ),
  },
  {
    key: 'caterpillar',
    label: 'Caterpillar',
    group: 'invertebrate',
    svg: wrap(
      `<g fill="#4ADE80">` +
        [16, 26, 36, 46]
          .map((x, index) => `<circle cx="${x}" cy="${34 + (index % 2 === 0 ? 0 : 3)}" r="8"/>`)
          .join('') +
        `</g>` +
        `<circle cx="9" cy="32" r="9" fill="#22C55E"/>` +
        `<path d="M20 42v10M30 44v10M40 44v10M48 42v10" fill="none" stroke="#166534" stroke-width="2.6"/>` +
        `<path d="M16 26c-2-6-4-8-8-10M20 24c0-6 0-8-2-12" fill="none" stroke="#166534" stroke-width="2.4"/>` +
        eye(6, 29, 2.4),
    ),
  },
  {
    key: 'beetle',
    label: 'Beetle',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M32 14C44 14 52 22 52 34C52 46 44 52 32 52S12 46 12 34C12 22 20 14 32 14Z" fill="#818CF8"/>` +
        `<path d="M32 16v34" fill="none" stroke="#3730A3" stroke-width="2.2"/>` +
        `<path d="M18 30c8-4 20-4 28 0" fill="none" stroke="#3730A3" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M22 12C18 7 17 4 18 1M42 12C46 7 47 4 46 1" fill="none" stroke="#4338CA" stroke-width="2.4"/>` +
        `<path d="M16 40l-8 6M24 48l-6 12M40 48l6 12M48 40l8 6" fill="none" stroke="#4338CA" stroke-width="2.6"/>` +
        `<path d="M32 14c-4-4-4-10 0-14 4 4 4 10 0 14Z" fill="#A5B4FC"/>`,
    ),
  },
  {
    key: 'aphid',
    label: 'Aphid',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M32 14C42 14 48 24 46 36C44 48 36 56 30 56C22 56 16 48 16 36C16 24 22 14 32 14Z" fill="#86EFAC"/>` +
        `<path d="M34 28c6 2 8 8 6 14" fill="none" stroke="#15803D" stroke-width="1.8"/>` +
        `<path d="M26 18C20 12 16 6 16 0M36 18C42 12 46 8 48 2" fill="none" stroke="#15803D" stroke-width="2.4"/>` +
        `<path d="M46 34c6 2 8 8 6 14M16 34c-6 2-8 8-6 14" fill="none" stroke="#15803D" stroke-width="2.4"/>` +
        `<path d="M22 52v10M40 52v10" fill="none" stroke="#15803D" stroke-width="2.4"/>` +
        eye(28, 24, 2.4),
    ),
  },

  /* ---------------- Fish ---------------- */
  {
    key: 'minnow',
    label: 'Minnow',
    group: 'fish',
    svg: wrap(
      fish({ back: '#93C5FD', belly: '#F1F5F9', fin: '#60A5FA', dorsal: 'small', tail: 'fork' }),
    ),
  },
  {
    key: 'anchovy',
    label: 'Anchovy',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#BFDBFE',
        belly: '#F8FAFC',
        fin: '#93C5FD',
        top: 22,
        bottom: 42,
        nose: 56,
        dorsal: 'small',
        tail: 'fork',
      }),
    ),
  },
  {
    key: 'herring',
    label: 'Herring',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#5EEAD4',
        belly: '#F1F5F9',
        fin: '#2DD4BF',
        top: 18,
        bottom: 44,
        nose: 55,
        dorsal: 'small',
        tail: 'fork',
      }),
    ),
  },
  {
    key: 'perch',
    label: 'Perch',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#A3B565',
        belly: '#FCD34D',
        fin: '#DC2626',
        dorsal: 'triangle',
        markings: 'stripes',
        markingColour: '#3F6212',
      }),
    ),
  },
  {
    key: 'cod',
    label: 'Cod',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#B4A48A',
        belly: '#F1F5F9',
        fin: '#8A7A61',
        top: 18,
        bottom: 48,
        nose: 53,
        dorsal: 'triangle',
        tail: 'round',
        markings: 'barbel',
      }),
    ),
  },
  {
    key: 'pike',
    label: 'Pike',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#6B7F3A',
        belly: '#D9E8A8',
        fin: '#4D5B27',
        top: 22,
        bottom: 40,
        nose: 60,
        dorsal: 'small',
        tail: 'round',
        markings: 'spots',
        markingColour: '#FDE68A',
        eyeSize: 2.8,
      }),
    ),
  },
  {
    key: 'tuna',
    label: 'Tuna',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#2563EB',
        belly: '#BFDBFE',
        fin: '#FCD34D',
        top: 18,
        bottom: 46,
        nose: 56,
        dorsal: 'large',
        tail: 'crescent',
      }) + `<path d="M40 22l6-2M42 42l6 2M36 20l5-2" fill="none" stroke="#FCD34D" stroke-width="2"/><circle cx="26" cy="27" r="1.6" fill="#FCD34D" stroke="none"/><circle cx="31" cy="28" r="1.6" fill="#FCD34D" stroke="none"/>`,
    ),
  },
  {
    key: 'lanternfish',
    label: 'Lanternfish',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#334155',
        belly: '#64748B',
        fin: '#1E293B',
        top: 17,
        bottom: 47,
        nose: 54,
        dorsal: 'large',
        tail: 'fork',
        markings: 'dots',
        markingColour: '#FCD34D',
        eyeSize: 3.2,
      }),
    ),
  },
  {
    key: 'shark',
    label: 'Shark',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#94A3B8',
        belly: '#E2E8F0',
        fin: '#64748B',
        top: 20,
        bottom: 42,
        nose: 58,
        dorsal: 'large',
        tail: 'crescent',
      }) +
        `<path d="M34 40l-8 10M40 40l-2 12" fill="none" stroke="#475569" stroke-width="2.2"/>`,
    ),
  },
  {
    key: 'whale',
    label: 'Baleen whale',
    group: 'fish',
    svg: wrap(
      fish({
        back: '#64748B',
        belly: '#E2E8F0',
        fin: '#475569',
        top: 16,
        bottom: 50,
        nose: 56,
        dorsal: 'small',
        tail: 'fluke',
        eyeSize: 2.2,
      }) +
        `<path d="M22 38c6 3 14 3 20 0" fill="none" stroke="#334155" stroke-width="1.8" opacity="0.7"/>` +
        `<path d="M48 42v5M45 43v4M42 43v4" fill="none" stroke="#334155" stroke-width="1.6"/>`,
    ),
  },
  {
    key: 'squid',
    label: 'Squid',
    group: 'invertebrate',
    svg: wrap(
      `<path d="M32 6C40 14 44 24 44 34C44 44 40 50 32 50C24 50 20 44 20 34C20 24 24 14 32 6Z" fill="#F472B6"/>` +
        `<path d="M26 10c-4 10-4 24 0 34M38 10c4 10 4 24 0 34" fill="none" stroke="#9D174D" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M28 50c-6 6-10 8-14 8M36 50c6 6 10 8 14 8M26 52c-2 6-2 10 0 14M30 52c0 6 0 10 2 14M34 52c2 6 2 10 0 14M38 52c2 6 4 10 6 14" fill="none" stroke="#DB2777" stroke-width="2.4"/>` +
        eye(26, 16, 2.6) +
        eye(38, 16, 2.6),
    ),
  },

  /* ---------------- Birds ---------------- */
  {
    key: 'songbird',
    label: 'Songbird',
    group: 'bird',
    svg: wrap(
      `<path d="M18 34C18 24 26 16 36 16s18 8 18 18c0 8-6 14-16 14H24c-4 0-6-6-6-14Z" fill="#FCD34D"/>` +
        `<path d="M24 26C30 20 40 20 46 26" fill="none" stroke="#B45309" stroke-width="1.8" opacity="0.6"/>` +
        `<path d="M18 30C10 30 4 34 2 40C10 42 16 40 20 36Z" fill="#F59E0B"/>` +
        `<path d="M52 30l9 4-9 5Z" fill="#FB923C"/>` +
        `<path d="M28 48v8M38 48v8M26 56h6M36 56h6" fill="none" stroke="#B45309" stroke-width="2.2"/>` +
        eye(44, 26, 2.6),
    ),
  },
  {
    key: 'owl',
    label: 'Owl',
    group: 'bird',
    svg: wrap(
      `<path d="M32 6l-6 8h12Z" fill="#A16207"/>` +
        `<path d="M32 12C44 12 52 22 52 34s-8 22-20 22S12 46 12 34 20 12 32 12Z" fill="#B45309"/>` +
        `<circle cx="24" cy="30" r="8" fill="#FEF3C7"/>` +
        `<circle cx="42" cy="30" r="8" fill="#FEF3C7"/>` +
        eye(24, 30, 3.4) +
        eye(42, 30, 3.4) +
        `<path d="M32 34l4 5-4 4-4-4Z" fill="#FBBF24"/>` +
        `<path d="M22 44c6 4 14 4 20 0" fill="none" stroke="#78350F" stroke-width="2"/>` +
        `<path d="M26 56l-2 6M38 56l2 6" fill="none" stroke="#FBBF24" stroke-width="2.4"/>`,
    ),
  },
  {
    key: 'hawk',
    label: 'Hawk',
    group: 'bird',
    svg: wrap(
      `<path d="M20 30C20 18 26 10 34 10c10 0 18 8 18 20 0 10-6 16-18 16-8 0-14-6-14-16Z" fill="#A16207"/>` +
        `<path d="M22 26C30 20 42 20 50 26" fill="none" stroke="#78350F" stroke-width="1.8"/>` +
        `<path d="M20 34C10 32 2 36 0 44C8 46 16 42 20 38Z" fill="#B45309"/>` +
        `<path d="M34 10c4-4 8-6 12-6-2 6-4 8-8 10Z" fill="#D97706"/>` +
        `<path d="M52 26l6 2-4 3c-2 2-4 0-4-2Z" fill="#FBBF24"/>` +
        `<path d="M30 62c0-4 2-8 2-12M38 62c0-4 2-8 2-12M26 62h8M34 62h8" fill="none" stroke="#FBBF24" stroke-width="2.2"/>` +
        eye(44, 22, 2.6),
    ),
  },
  {
    key: 'osprey',
    label: 'Osprey',
    group: 'bird',
    svg: wrap(
      `<path d="M20 30C20 18 26 10 34 10c10 0 18 8 18 20 0 10-6 16-18 16-8 0-14-6-14-16Z" fill="#F1F5F9"/>` +
        `<path d="M22 26C30 20 42 20 50 26" fill="none" stroke="#94A3B8" stroke-width="1.8"/>` +
        `<path d="M24 22c6-6 16-6 22 0" fill="none" stroke="#78350F" stroke-width="4"/>` +
        `<path d="M20 34C10 32 2 36 0 44C8 46 16 42 20 38Z" fill="#475569"/>` +
        `<path d="M52 26l6 2-4 3c-2 2-4 0-4-2Z" fill="#FBBF24"/>` +
        `<path d="M30 62c0-4 2-8 2-12M38 62c0-4 2-8 2-12M26 62h8M34 62h8" fill="none" stroke="#FBBF24" stroke-width="2.2"/>` +
        eye(44, 22, 2.6),
    ),
  },
  {
    key: 'heron',
    label: 'Heron',
    group: 'bird',
    svg: wrap(
      `<path d="M14 40C14 28 22 20 34 20c10 0 16 6 16 14 0 6-4 10-12 12-10 2-24 0-24-6Z" fill="#94A3B8"/>` +
        `<path d="M16 32C24 24 38 22 48 26" fill="none" stroke="#475569" stroke-width="2"/>` +
        `<path d="M42 22C42 12 36 6 28 4" fill="none" stroke="#CBD5E1" stroke-width="5"/>` +
        `<circle cx="27" cy="4" r="6" fill="#E2E8F0"/>` +
        `<path d="M22 2L4 0l18 6Z" fill="#FBBF24"/>` +
        eye(26, 2, 2.2) +
        `<path d="M22 52v10M34 52v10M18 62h8M30 62h8" fill="none" stroke="#B45309" stroke-width="2.4"/>`,
    ),
  },
  {
    key: 'seabird',
    label: 'Seabird',
    group: 'bird',
    svg: wrap(
      `<path d="M18 36C18 24 26 16 36 16s18 8 18 18c0 8-6 14-16 14H24c-4 0-6-6-6-14Z" fill="#F8FAFC"/>` +
        `<path d="M26 24C34 18 44 20 48 28" fill="none" stroke="#94A3B8" stroke-width="2"/>` +
        `<path d="M18 32C6 30 0 34 0 40C8 42 14 40 18 36Z" fill="#94A3B8"/>` +
        `<path d="M52 30l10 4-10 4Z" fill="#FBBF24"/>` +
        `<path d="M28 48v8M38 48v8M26 56h5l2 4 2-4h5M36 56h5l2 4 2-4h5" fill="none" stroke="#F59E0B" stroke-width="2.2"/>` +
        eye(44, 26, 2.6),
    ),
  },
  {
    key: 'woodpecker',
    label: 'Woodpecker',
    group: 'bird',
    svg: wrap(
      `<path d="M22 34C22 22 28 14 36 14s16 8 16 20c0 10-6 16-16 16s-14-6-14-16Z" fill="#E2E8F0"/>` +
        `<path d="M22 24c8-6 20-6 28 0" fill="none" stroke="#94A3B8" stroke-width="1.8"/>` +
        `<circle cx="30" cy="34" r="4" fill="#DC2626" stroke="none"/>` +
        `<path d="M24 16c-2-6 2-10 8-10-2 6-4 8-8 10Z" fill="#DC2626"/>` +
        `<path d="M50 30l10 2-10 3Z" fill="#475569"/>` +
        `<path d="M24 50v10M32 50v10M20 60h8M30 60h8" fill="none" stroke="#475569" stroke-width="2.4"/>` +
        eye(46, 28, 2.6),
    ),
  },
  {
    key: 'kingfisher',
    label: 'Kingfisher',
    group: 'bird',
    svg: wrap(
      `<path d="M18 34C18 24 26 16 36 16s18 8 18 18c0 8-6 14-16 14H24c-4 0-6-6-6-14Z" fill="#38BDF8"/>` +
        `<path d="M20 24c8-6 20-6 28 0" fill="none" stroke="#0369A1" stroke-width="1.8"/>` +
        `<path d="M18 30C10 30 4 34 2 40C10 42 16 40 20 36Z" fill="#0EA5E9"/>` +
        `<path d="M52 30l10 3-10 4Z" fill="#1E293B"/>` +
        `<path d="M28 48v8M38 48v8M26 56h6M36 56h6" fill="none" stroke="#B45309" stroke-width="2.2"/>` +
        eye(44, 26, 2.6),
    ),
  },

  /* ---------------- Mammals ---------------- */
  {
    key: 'field-mouse',
    label: 'Mouse',
    group: 'mammal',
    svg: wrap(
      `<path d="M16 34C16 24 24 18 34 18c12 0 20 8 20 18 0 4-2 6-6 6H22c-4 0-6-2-6-10Z" fill="#C08552"/>` +
        `<circle cx="20" cy="20" r="8" fill="#D6A77A"/>` +
        `<circle cx="20" cy="20" r="4" fill="#F472B6" stroke="none"/>` +
        `<path d="M54 36c6 0 8 4 8 8s-3 8-7 8" fill="none" stroke="#A16207" stroke-width="3"/>` +
        `<path d="M50 30l8-4M50 36l9 0M50 42l8 4" fill="none" stroke="#78350F" stroke-width="1.6"/>` +
        eye(42, 30, 2.6) +
        `<path d="M26 46v12M36 46v12" fill="none" stroke="#A16207" stroke-width="2.6"/>`,
    ),
  },
  {
    key: 'rabbit',
    label: 'Rabbit',
    group: 'mammal',
    svg: wrap(
      `<path d="M14 38C14 28 24 20 36 20c14 0 22 8 22 18 0 8-8 14-20 14H24c-6 0-10-6-10-14Z" fill="#D6A77A"/>` +
        `<path d="M22 22C18 12 18 4 22 0c6 4 8 14 6 22Z" fill="#D6A77A"/>` +
        `<path d="M23 20c-2-6-2-12 0-16 3 3 4 12 3 16Z" fill="#F472B6" stroke="none"/>` +
        `<path d="M34 20C32 10 34 2 38 0c4 6 4 16 0 22Z" fill="#D6A77A"/>` +
        `<circle cx="52" cy="42" r="6" fill="#F1F5F9"/>` +
        `<path d="M40 30l8-2M40 36l9 2" fill="none" stroke="#78350F" stroke-width="1.6"/>` +
        eye(42, 32, 2.6) +
        `<path d="M26 52v10M38 52v10" fill="none" stroke="#A16207" stroke-width="2.6"/>`,
    ),
  },
  {
    key: 'squirrel',
    label: 'Squirrel',
    group: 'mammal',
    svg: wrap(
      `<path d="M20 40C20 30 26 24 36 24c12 0 18 6 18 16 0 8-6 12-18 12-10 0-16-4-16-12Z" fill="#C2410C"/>` +
        `<path d="M22 30C10 30 4 20 6 10c2-8 10-10 16-6 6 5 8 16 4 24" fill="none" stroke="#EA580C" stroke-width="6"/>` +
        `<path d="M46 22c4-6 10-8 14-6-2 6-6 10-10 12Z" fill="#F97316"/>` +
        `<circle cx="26" cy="24" r="7" fill="#EA580C"/>` +
        `<path d="M26 24l-6-6" fill="none" stroke="#7C2D12" stroke-width="2"/>` +
        `<path d="M30 44c4 0 6 4 5 8" fill="none" stroke="#7C2D12" stroke-width="2.2"/>` +
        eye(28, 22, 2.4) +
        `<path d="M26 52v10M38 52v10" fill="none" stroke="#7C2D12" stroke-width="2.6"/>`,
    ),
  },
  {
    key: 'deer',
    label: 'Deer',
    group: 'mammal',
    svg: wrap(
      `<path d="M14 40C14 30 22 24 34 24c14 0 22 6 22 14 0 8-8 12-22 12-12 0-20-4-20-10Z" fill="#A16207"/>` +
        `<path d="M20 22C20 12 24 4 30 0" fill="none" stroke="#78350F" stroke-width="3"/>` +
        `<path d="M22 12c-6-2-8-6-8-10M26 6c-4-4-4-8-2-12" fill="none" stroke="#78350F" stroke-width="2.6"/>` +
        `<path d="M24 52v10M40 52v10M48 50v12M30 52v10" fill="none" stroke="#78350F" stroke-width="2.8"/>` +
        eye(22, 30, 2.6) +
        `<path d="M14 34c-4 0-6-2-6-4" fill="none" stroke="#78350F" stroke-width="2.2"/>`,
    ),
  },
  {
    key: 'fox',
    label: 'Fox',
    group: 'mammal',
    svg: wrap(
      `<path d="M14 38C14 28 22 22 34 22c14 0 22 6 22 16 0 8-8 14-22 14-12 0-20-6-20-14Z" fill="#EA580C"/>` +
        `<path d="M20 26C16 16 16 8 20 4c6 4 8 12 6 20Z" fill="#C2410C"/>` +
        `<path d="M32 24C30 14 32 6 36 2c6 6 6 16 2 24Z" fill="#C2410C"/>` +
        `<path d="M56 34c6 2 8 8 6 14-4 2-6-2-8-6" fill="none" stroke="#C2410C" stroke-width="7"/>` +
        `<path d="M22 42C30 46 42 46 50 42" fill="none" stroke="#F1F5F9" stroke-width="4"/>` +
        eye(46, 32, 2.6) +
        `<path d="M24 52v10M40 52v10" fill="none" stroke="#7C2D12" stroke-width="2.8"/>`,
    ),
  },
  {
    key: 'otter',
    label: 'Otter',
    group: 'mammal',
    svg: wrap(
      `<path d="M12 36C12 26 22 20 36 20c16 0 26 6 26 16 0 8-8 12-24 12-16 0-26-4-26-12Z" fill="#8A6A4B"/>` +
        `<path d="M16 32C26 26 44 26 54 32" fill="none" stroke="#5C442D" stroke-width="1.8" opacity="0.7"/>` +
        `<path d="M12 40c-6 2-8 6-8 10M18 42c-4 4-4 8-2 12" fill="none" stroke="#5C442D" stroke-width="3"/>` +
        `<path d="M50 36l10 2-10 4Z" fill="#A1887F"/>` +
        `<circle cx="26" cy="24" r="6" fill="#A1887F"/>` +
        `<path d="M22 30l-8 2M22 32l-8 4" fill="none" stroke="#F1F5F9" stroke-width="1.6"/>` +
        eye(28, 26, 2.4),
    ),
  },
  {
    key: 'seal',
    label: 'Seal',
    group: 'mammal',
    svg: wrap(
      `<path d="M10 38C10 26 22 18 38 18c18 0 26 8 26 18 0 8-8 14-26 14-18 0-28-4-28-12Z" fill="#94A3B8"/>` +
        `<path d="M14 32C26 24 44 24 58 30" fill="none" stroke="#64748B" stroke-width="1.8" opacity="0.7"/>` +
        `<path d="M58 44c4 2 6 6 4 10-4 0-6-2-6-6" fill="#64748B"/>` +
        `<path d="M14 44c-4 4-6 8-4 12 4 0 6-2 6-8" fill="#64748B"/>` +
        `<circle cx="24" cy="24" r="7" fill="#CBD5E1"/>` +
        `<path d="M20 30l-9 3M20 33l-9 5" fill="none" stroke="#F1F5F9" stroke-width="1.6"/>` +
        eye(27, 24, 2.6),
    ),
  },

  /* ---------------- Reptiles and amphibians ---------------- */
  {
    key: 'lizard',
    label: 'Lizard',
    group: 'reptile',
    svg: wrap(
      `<path d="M10 40C14 30 24 24 36 24c10 0 18 4 22 10-6 6-16 10-28 10-10 0-18-2-20-4Z" fill="#4ADE80"/>` +
        `<path d="M58 34c4 0 6 2 6 4-2 2-4 3-6 4Z" fill="#22C55E"/>` +
        `<path d="M6 42c-4 2-6 6-4 10 6 2 12-2 14-10" fill="none" stroke="#22C55E" stroke-width="4"/>` +
        `<path d="M24 40l-4 8M34 42l-2 8M44 42l0 8M52 40l2 6" fill="none" stroke="#16A34A" stroke-width="2.6"/>` +
        `<path d="M12 36c-2-4-2-8 0-12M18 34c0-4 0-8 2-10" fill="none" stroke="#16A34A" stroke-width="2.4"/>` +
        eye(56, 33, 2.4),
    ),
  },
  {
    key: 'frog',
    label: 'Frog',
    group: 'reptile',
    svg: wrap(
      `<path d="M12 38C12 26 22 18 34 18c14 0 22 8 22 20 0 10-10 16-22 16s-22-6-22-16Z" fill="#4ADE80"/>` +
        `<circle cx="24" cy="18" r="8" fill="#4ADE80"/>` +
        `<circle cx="44" cy="18" r="8" fill="#4ADE80"/>` +
        eye(24, 17, 3.4) +
        eye(44, 17, 3.4) +
        `<path d="M24 42c6 5 16 5 22 0" fill="none" stroke="#166534" stroke-width="2.2"/>` +
        `<path d="M12 46C4 46 0 50 0 56c6 2 12-2 14-8" fill="#22C55E"/>` +
        `<path d="M56 46c8 0 12 4 12 10-6 2-12-2-14-8" fill="#22C55E"/>`,
    ),
  },
  {
    key: 'tadpole',
    label: 'Tadpole',
    group: 'reptile',
    svg: wrap(
      `<circle cx="24" cy="32" r="16" fill="#4ADE80"/>` +
        `<path d="M38 32c8 0 14-6 20-16-2 12-2 22 0 32-6-10-12-16-20-16Z" fill="#22C55E"/>` +
        `<path d="M40 32c6 0 10-4 14-10" fill="none" stroke="#166534" stroke-width="1.8" opacity="0.7"/>` +
        eye(22, 27, 3),
    ),
  },
  {
    key: 'snake',
    label: 'Snake',
    group: 'reptile',
    svg: wrap(
      `<path d="M8 14C20 14 26 24 36 24c10 0 14-8 14-14 0 0 6 4 6 12 0 12-12 20-24 20S10 34 10 44c0 8 6 12 14 12 10 0 20-4 30-4" fill="none" stroke="#84CC16" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M8 14C20 14 26 24 36 24c10 0 14-8 14-14 0 0 6 4 6 12 0 12-12 20-24 20S10 34 10 44c0 8 6 12 14 12 10 0 20-4 30-4" fill="none" stroke="#BEF264" stroke-width="4" stroke-linecap="round" opacity="0.85"/>` +
        `<circle cx="52" cy="12" r="5" fill="#4D7C0F"/>` +
        `<path d="M56 8l8-4-4 6Z" fill="#F87171"/>` +
        eye(53, 10, 2.2),
    ),
  },

  /* ---------------- Microbes and detritus ---------------- */
  {
    key: 'bacteria',
    label: 'Bacteria',
    group: 'microbe',
    svg: wrap(
      `<rect x="10" y="26" width="26" height="14" rx="7" fill="#C4B5FD"/>` +
        `<rect x="34" y="14" width="22" height="12" rx="6" fill="#A78BFA" transform="rotate(18 45 20)"/>` +
        `<rect x="20" y="44" width="20" height="12" rx="6" fill="#DDD6FE"/>` +
        `<path d="M10 33c-4-2-6-6-6-10M10 33c-5 2-8 4-10 8M56 26c4-4 6-8 6-12" fill="none" stroke="#8B5CF6" stroke-width="2.2"/>` +
        `<circle cx="22" cy="33" r="2" fill="#5B21B6" stroke="none"/>` +
        `<circle cx="28" cy="33" r="2" fill="#5B21B6" stroke="none"/>`,
    ),
  },
  {
    key: 'detritus',
    label: 'Detritus',
    group: 'microbe',
    svg: wrap(
      `<path d="M6 44C10 32 20 26 32 26c12 0 20 8 22 18-8 6-30 6-48 0Z" fill="#A8A29E"/>` +
        `<path d="M12 40c6-6 14-8 22-8" fill="none" stroke="#78716C" stroke-width="1.8" opacity="0.8"/>` +
        `<path d="M40 16C46 10 54 8 60 10c0 8-6 14-14 16-4-2-6-6-6-10Z" fill="#C08454"/>` +
        `<path d="M42 18c4-4 10-6 14-6" fill="none" stroke="#92400E" stroke-width="1.6"/>` +
        `<circle cx="18" cy="20" r="4" fill="#57534E"/>` +
        `<circle cx="30" cy="14" r="3" fill="#78716C"/>` +
        `<circle cx="48" cy="46" r="3.4" fill="#57534E"/>`,
    ),
  },
  {
    key: FALLBACK_KEY,
    label: 'Species or trophic group',
    group: 'neutral',
    svg: wrap(
      `<path d="M32 8l21 12v24L32 56 11 44V20Z" fill="#64748B"/>` +
        `<path d="M32 8l21 12-21 12L11 20Z" fill="#94A3B8"/>` +
        `<circle cx="32" cy="32" r="5" fill="#1F2937" stroke="none"/>` +
        `<circle cx="32" cy="32" r="2.4" fill="#CBD5E1" stroke="none"/>`,
    ),
  },
]

/* -------------------------------------------------------------------------- */
/* Lookup API                                                                 */
/* -------------------------------------------------------------------------- */

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
