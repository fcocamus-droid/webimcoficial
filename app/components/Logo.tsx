/**
 * IMC Industriales — Logo
 * Industrial B2B marketplace identity
 */

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'mono-white' | 'mono-navy'
  showTagline?: boolean
  className?: string
}

const SIZES = {
  sm: { h: 36 },
  md: { h: 56 },
  lg: { h: 76 },
  xl: { h: 100 },
}

export default function Logo({
  size = 'md',
  variant = 'default',
  showTagline = false,
  className = '',
}: Props) {
  const h = SIZES[size].h
  const navy = variant === 'mono-white' ? '#FFFFFF' : '#1B2A6B'
  const amber =
    variant === 'mono-white'
      ? '#FFFFFF'
      : variant === 'mono-navy'
        ? '#1B2A6B'
        : '#F59E0B'
  const tagline =
    variant === 'mono-white' ? 'rgba(255,255,255,0.75)' : '#64748B'

  // Si hay tagline, el SVG necesita más altura y ancho
  const viewBox = showTagline ? '0 0 365 88' : '0 0 280 70'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      height={h}
      className={className}
      aria-label="IMC Industriales · Insumos, Materiales y Componentes Industriales"
    >
      {/* Geometric isotype: layered industrial brackets */}
      <g>
        {/* Outer ring */}
        <circle
          cx="30"
          cy="35"
          r="22"
          fill="none"
          stroke={navy}
          strokeWidth="2.5"
        />
        {/* Inner geometric "I" / industrial brackets */}
        <rect x="24" y="20" width="3.5" height="30" fill={navy} />
        <rect x="32.5" y="20" width="3.5" height="30" fill={amber} />
        {/* Top/bottom serifs */}
        <rect x="20" y="20" width="20" height="3" fill={navy} />
        <rect x="20" y="47" width="20" height="3" fill={navy} />
      </g>

      {/* Wordmark */}
      <g>
        <text
          x="62"
          y="35"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="22"
          fontWeight="900"
          letterSpacing="-0.5"
          fill={navy}
        >
          IMC
        </text>
        <text
          x="116"
          y="35"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="22"
          fontWeight="400"
          letterSpacing="-0.3"
          fill={amber}
        >
          Industriales
        </text>
        {showTagline && (
          <text
            x="62"
            y="58"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize="11"
            fontWeight="700"
            letterSpacing="-0.1"
            fill={tagline}
          >
            Insumos, Materiales y Componentes Industriales
          </text>
        )}
      </g>
    </svg>
  )
}
