/**
 * IMC Cargo Logo — Colinter-style horizontal lockup
 * Replaces the old multi-brand logo system. Single-brand IMC Cargo focus.
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'mono-white' | 'mono-navy'
  className?: string
  href?: string
}

const SIZES = {
  sm: { h: 28, isoW: 30, fontSize: 14, tagSize: 8 },
  md: { h: 40, isoW: 44, fontSize: 18, tagSize: 9 },
  lg: { h: 56, isoW: 62, fontSize: 26, tagSize: 11 },
}

export default function IMCLogo({ size = 'md', variant = 'default', className = '' }: Props) {
  const s = SIZES[size]
  const orange = variant === 'mono-white' ? '#FFFFFF' : variant === 'mono-navy' ? '#1B2A6B' : '#F47920'
  const navy = variant === 'mono-white' ? '#FFFFFF' : '#1B2A6B'
  const subtle = variant === 'mono-white' ? 'rgba(255,255,255,0.75)' : '#6B7280'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 60"
      height={s.h}
      className={className}
      aria-label="IMC Cargo"
    >
      {/* Isotype: stylized container/cube */}
      <g>
        {/* Cube top facet (orange) */}
        <path d="M 30 10 L 50 20 L 30 30 L 10 20 Z" fill={orange} />
        {/* Cube left facet (navy) */}
        <path d="M 10 20 L 30 30 L 30 50 L 10 40 Z" fill={navy} />
        {/* Cube right facet (lighter navy) */}
        <path d="M 50 20 L 50 40 L 30 50 L 30 30 Z" fill={navy} opacity="0.7" />
      </g>

      {/* Wordmark */}
      <g>
        <text
          x="62"
          y="32"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize={s.fontSize}
          fontWeight="900"
          letterSpacing="-0.5"
          fill={navy}
        >
          IMC
        </text>
        <text
          x="106"
          y="32"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize={s.fontSize}
          fontWeight="500"
          letterSpacing="-0.3"
          fill={orange}
        >
          CARGO
        </text>
        <text
          x="62"
          y="46"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize={s.tagSize}
          fontWeight="600"
          letterSpacing="2.5"
          fill={subtle}
        >
          FREIGHT FORWARDING
        </text>
      </g>
    </svg>
  )
}
