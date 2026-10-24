import type { EcosystemCategory } from '../../core/types'

/* ============================================================================
 * EcosystemThumbnail — Stylized vector landscape for Current Network sidebar card.
 *
 * Dynamically reflects the loaded ecosystem biome:
 * - marine: coastal inlet, deep teal waters, rolling rocky shoreline, gulls.
 * - freshwater: scenic lake with lilypads, reeds, pine trees, water reflection.
 * - terrestrial: lush forest canopy, rolling meadow, gentle hills, birds.
 * ========================================================================== */

export function EcosystemThumbnail({
  ecosystem,
  className = '',
}: {
  ecosystem: EcosystemCategory
  className?: string
}) {
  if (ecosystem === 'marine') {
    return (
      <div className={`relative h-28 w-full overflow-hidden rounded-xl border border-[#DCE7E1] bg-gradient-to-b from-[#A5D8E6] via-[#6BBAD1] to-[#2B7A8E] shadow-2xs ${className}`}>
        <svg viewBox="0 0 320 120" className="absolute inset-0 h-full w-full object-cover" preserveAspectRatio="none">
          {/* Distant Hills */}
          <path d="M0,75 Q80,45 160,65 T320,55 L320,120 L0,120 Z" fill="#3D7B75" opacity="0.6" />
          <path d="M0,82 Q90,60 190,75 T320,70 L320,120 L0,120 Z" fill="#29635E" opacity="0.8" />
          {/* Estuary Shoreline */}
          <path d="M0,95 Q100,75 220,88 T320,85 L320,120 L0,120 Z" fill="#1C4F4B" />
          {/* Calm Estuary Water Reflection */}
          <rect y="92" width="320" height="28" fill="#1E5C6B" opacity="0.9" />
          <path d="M40,98 Q80,95 120,98" stroke="#8CE0E8" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M180,105 Q240,102 290,105" stroke="#8CE0E8" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          {/* Flying Seabirds */}
          <path d="M220,32 Q225,28 230,32 Q235,28 240,32" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
          <path d="M245,24 Q248,21 252,24 Q256,21 260,24" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
        </svg>
        <span className="absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
          Marine Estuary
        </span>
      </div>
    )
  }

  if (ecosystem === 'freshwater') {
    return (
      <div className={`relative h-28 w-full overflow-hidden rounded-xl border border-[#DCE7E1] bg-gradient-to-b from-[#BFDFCF] via-[#85C4A8] to-[#39785F] shadow-2xs ${className}`}>
        <svg viewBox="0 0 320 120" className="absolute inset-0 h-full w-full object-cover" preserveAspectRatio="none">
          {/* Mountain Ridge */}
          <path d="M0,60 Q90,35 180,50 T320,40 L320,120 L0,120 Z" fill="#3E755F" opacity="0.5" />
          {/* Forest Ridge */}
          <path d="M0,75 Q110,55 210,68 T320,62 L320,120 L0,120 Z" fill="#245844" opacity="0.7" />
          {/* Pine Trees Silhouette */}
          <path d="M15,75 L22,60 L29,75 M40,78 L47,62 L54,78 M120,74 L127,58 L134,74 M270,72 L277,57 L284,72" stroke="#174333" strokeWidth="2" fill="none" />
          {/* Pond Shoreline */}
          <path d="M0,88 Q130,76 240,84 T320,80 L320,120 L0,120 Z" fill="#174333" />
          {/* Pond Water */}
          <rect y="86" width="320" height="34" fill="#2A6451" opacity="0.9" />
          {/* Water Lilies & Ripples */}
          <ellipse cx="60" cy="100" rx="14" ry="4" fill="#589B7E" opacity="0.8" />
          <ellipse cx="63" cy="99" rx="3" ry="1.5" fill="#E8F5EE" />
          <ellipse cx="220" cy="106" rx="16" ry="4.5" fill="#589B7E" opacity="0.7" />
          <path d="M110,98 Q150,96 190,98" stroke="#A7E1C7" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </svg>
        <span className="absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
          Freshwater Wetland
        </span>
      </div>
    )
  }

  // Terrestrial
  return (
    <div className={`relative h-28 w-full overflow-hidden rounded-xl border border-[#DCE7E1] bg-gradient-to-b from-[#D4E8D4] via-[#A8D1A8] to-[#4F8752] shadow-2xs ${className}`}>
      <svg viewBox="0 0 320 120" className="absolute inset-0 h-full w-full object-cover" preserveAspectRatio="none">
        {/* Soft Hills */}
        <path d="M0,65 Q100,42 200,58 T320,48 L320,120 L0,120 Z" fill="#588B5A" opacity="0.5" />
        <path d="M0,78 Q110,60 210,72 T320,66 L320,120 L0,120 Z" fill="#3D6E3F" opacity="0.75" />
        {/* Canopy Forest Edge */}
        <path d="M0,90 Q90,75 190,82 T320,80 L320,120 L0,120 Z" fill="#2A522C" />
        <circle cx="45" cy="84" r="14" fill="#376739" />
        <circle cx="70" cy="80" r="16" fill="#305D32" />
        <circle cx="95" cy="83" r="13" fill="#376739" />
        <circle cx="210" cy="78" r="18" fill="#305D32" />
        <circle cx="235" cy="82" r="14" fill="#376739" />
        {/* Meadow Grass Floor */}
        <rect y="92" width="320" height="28" fill="#3A6C3C" />
        <path d="M30,105 L33,96 L36,105 M140,108 L143,99 L146,108 M260,104 L263,95 L266,104" stroke="#7CB87F" strokeWidth="1.5" strokeLinecap="round" />
        {/* Birds in Sky */}
        <path d="M120,30 Q124,26 128,30 Q132,26 136,30" fill="none" stroke="#254727" strokeWidth="1.2" opacity="0.6" />
      </svg>
      <span className="absolute bottom-2 left-2.5 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
        Terrestrial Forest
      </span>
    </div>
  )
}
