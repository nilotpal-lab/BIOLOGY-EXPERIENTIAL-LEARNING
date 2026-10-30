/* ============================================================================
 * BotanicalLeaves — Delicate natural botanical leaves for framing the corners
 * Matching the natural-history watercolor aesthetic of Image 1 and Image 2.
 * ========================================================================== */

export function BotanicalCorner({
  position = 'top-left',
  className = '',
}: {
  position?: 'top-left' | 'bottom-left' | 'bottom-right'
  className?: string
}) {
  if (position === 'top-left') {
    return (
      <svg
        viewBox="0 0 160 220"
        className={`pointer-events-none select-none text-[#35563B] opacity-75 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="#35563B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="#899B78" fillOpacity="0.45">
          {/* Main Stem */}
          <path d="M-10,-10 C20,30 40,80 45,140 C48,170 42,200 35,220" strokeWidth="1.8" fill="none" />
          
          {/* Leaf pairs trailing down */}
          {/* Leaf 1 */}
          <path d="M12,18 C28,14 44,24 46,34 C36,38 22,34 12,18 Z" />
          {/* Leaf 2 */}
          <path d="M10,24 C-2,34 -4,50 4,58 C14,54 18,40 10,24 Z" />
          {/* Leaf 3 */}
          <path d="M25,50 C44,46 62,56 64,68 C52,72 35,68 25,50 Z" />
          {/* Leaf 4 */}
          <path d="M22,58 C10,70 12,88 22,94 C30,86 32,72 22,58 Z" />
          {/* Leaf 5 */}
          <path d="M37,88 C58,82 78,92 82,106 C68,110 50,104 37,88 Z" />
          {/* Leaf 6 */}
          <path d="M34,98 C22,112 26,130 36,136 C44,126 44,112 34,98 Z" />
          {/* Leaf 7 */}
          <path d="M43,130 C64,124 80,136 82,148 C70,152 54,146 43,130 Z" />
          {/* Leaf 8 */}
          <path d="M41,142 C30,158 36,174 46,178 C52,168 50,154 41,142 Z" />
          {/* Leaf 9 */}
          <path d="M42,175 C58,172 70,182 70,192 C60,196 48,190 42,175 Z" />
        </g>
      </svg>
    )
  }

  if (position === 'bottom-left') {
    return (
      <svg
        viewBox="0 0 160 200"
        className={`pointer-events-none select-none text-[#35563B] opacity-75 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="#35563B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="#899B78" fillOpacity="0.45">
          {/* Main stem curving up */}
          <path d="M-10,210 C30,170 45,120 40,60 C38,30 30,5 20,-10" strokeWidth="1.8" fill="none" />
          {/* Leaves climbing */}
          <path d="M8,180 C26,186 42,176 44,166 C34,162 20,166 8,180 Z" />
          <path d="M12,172 C-2,160 -2,144 6,138 C16,144 18,158 12,172 Z" />
          <path d="M24,142 C44,146 60,134 62,122 C50,118 34,124 24,142 Z" />
          <path d="M26,134 C14,120 18,104 28,100 C36,108 36,122 26,134 Z" />
          <path d="M36,100 C56,104 72,92 74,80 C62,76 48,82 36,100 Z" />
          <path d="M36,92 C26,78 30,62 40,58 C48,66 46,80 36,92 Z" />
          <path d="M38,60 C52,62 64,52 64,42 C54,40 44,46 38,60 Z" />
        </g>
      </svg>
    )
  }

  // bottom-right
  return (
    <svg
      viewBox="0 0 160 200"
      className={`pointer-events-none select-none text-[#35563B] opacity-75 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="#35563B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="#899B78" fillOpacity="0.45" transform="scale(-1, 1) translate(-160, 0)">
        <path d="M-10,210 C30,170 45,120 40,60 C38,30 30,5 20,-10" strokeWidth="1.8" fill="none" />
        <path d="M8,180 C26,186 42,176 44,166 C34,162 20,166 8,180 Z" />
        <path d="M12,172 C-2,160 -2,144 6,138 C16,144 18,158 12,172 Z" />
        <path d="M24,142 C44,146 60,134 62,122 C50,118 34,124 24,142 Z" />
        <path d="M26,134 C14,120 18,104 28,100 C36,108 36,122 26,134 Z" />
        <path d="M36,100 C56,104 72,92 74,80 C62,76 48,82 36,100 Z" />
        <path d="M36,92 C26,78 30,62 40,58 C48,66 46,80 36,92 Z" />
      </g>
    </svg>
  )
}
