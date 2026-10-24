/* ============================================================================
 * HeronCard — Inspirational sidebar widget matching the reference mockup.
 *
 * "Healthy Food Webs, Resilient Ecosystems."
 * With an elegant botanical heron illustration by the water.
 * ========================================================================== */

export function HeronCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#DCE7E1] bg-gradient-to-b from-[#EAF5EF] via-[#E1EFE7] to-[#D5E8DD] p-4 shadow-2xs ${className}`}
    >
      <div className="relative z-10 max-w-[170px]">
        <p className="text-[13px] font-extrabold tracking-tight text-[#0E1622] leading-snug">
          Healthy Food Webs, Resilient Ecosystems.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#536960]">
          Explore, experiment and understand the species that keep ecosystems in balance.
        </p>
      </div>

      {/* Stylized Heron Silhouette / Illustration */}
      <svg
        viewBox="0 0 110 130"
        className="pointer-events-none absolute right-0 bottom-0 h-28 w-24 object-contain opacity-90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Riverbank rocks & reeds */}
        <ellipse cx="60" cy="120" rx="35" ry="8" fill="#4B6E60" opacity="0.4" />
        <path d="M75,124 Q82,95 86,75" stroke="#37554A" strokeWidth="2" strokeLinecap="round" />
        <path d="M82,126 Q92,100 96,82" stroke="#2B463C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M70,126 Q74,105 78,90" stroke="#486C5E" strokeWidth="1.5" strokeLinecap="round" />

        {/* Heron Legs */}
        <path d="M48,82 L50,118" stroke="#7A6843" strokeWidth="2" strokeLinecap="round" />
        <path d="M54,82 L57,118" stroke="#685633" strokeWidth="2" strokeLinecap="round" />
        <path d="M44,118 L53,118 M51,118 L60,118" stroke="#685633" strokeWidth="2" strokeLinecap="round" />

        {/* Heron Body */}
        <path
          d="M34,58 C34,48 45,45 56,52 C65,58 66,74 58,82 C50,88 38,82 34,70 Z"
          fill="#4A6572"
        />
        {/* Wing Feather Accents */}
        <path
          d="M40,58 C44,68 52,76 60,78 C54,72 50,64 46,56 Z"
          fill="#344955"
        />

        {/* Heron S-Curved Neck & Head */}
        <path
          d="M52,50 C46,42 42,32 46,24 C48,20 54,18 60,20 C64,21 68,25 72,27"
          stroke="#F4F8F5"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52,50 C46,42 42,32 46,24 C48,20 54,18 60,20 C64,21 68,25 72,27"
          stroke="#4A6572"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Crest Plume */}
        <path d="M48,19 Q42,15 36,17" stroke="#1F2E35" strokeWidth="2" strokeLinecap="round" />

        {/* Beak (Long, Yellow-Amber) */}
        <path d="M68,26 L94,29 L68,29 Z" fill="#D99B26" />

        {/* Eye */}
        <circle cx="62" cy="23" r="2" fill="#D99B26" />
        <circle cx="62.5" cy="23" r="1" fill="#0E1622" />
      </svg>
    </div>
  )
}
