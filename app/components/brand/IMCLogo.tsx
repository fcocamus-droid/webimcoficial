/**
 * IMC Master Logo
 * Unified brand mark for Grupo IMC (Cargo, Box, Importadora)
 *
 * Design:
 *   - Isometric cube symbol = unified group (3 facets = 3 businesses)
 *   - Orange #F47920 (IMC accent) + Navy #1B2A6B (corporate)
 *   - Modern geometric sans-serif wordmark
 */

interface IMCLogoProps {
  variant?: 'default' | 'mono-navy' | 'mono-orange' | 'mono-white'
  showWordmark?: boolean
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE = {
  sm: { h: 28, w: 90 },
  md: { h: 40, w: 130 },
  lg: { h: 56, w: 182 },
  xl: { h: 80, w: 260 }
}

export default function IMCLogo({
  variant = 'default',
  showWordmark = true,
  showTagline = false,
  size = 'md',
  className = ''
}: IMCLogoProps) {
  const dims = SIZE[size]
  const navy = variant === 'mono-white' ? '#FFFFFF' : variant === 'mono-orange' ? '#F47920' : '#1B2A6B'
  const orange = variant === 'mono-navy' ? '#1B2A6B' : variant === 'mono-white' ? '#FFFFFF' : '#F47920'
  const accent = variant === 'mono-white' ? '#FFFFFF' : variant === 'default' ? '#0F1740' : navy

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${showWordmark ? 280 : 80} 80`}
      height={dims.h}
      width={showWordmark ? dims.w : dims.h}
      className={className}
      aria-label="Grupo IMC"
    >
      {/* Isometric cube symbol */}
      <g>
        {/* Top facet (lightest — represents Cargo / sky) */}
        <path
          d="M 40 8 L 64 22 L 40 36 L 16 22 Z"
          fill={orange}
          opacity="0.95"
        />
        {/* Left facet (darker — represents Box / ground) */}
        <path
          d="M 16 22 L 40 36 L 40 64 L 16 50 Z"
          fill={navy}
        />
        {/* Right facet (medium — represents Importadora / retail) */}
        <path
          d="M 64 22 L 64 50 L 40 64 L 40 36 Z"
          fill={accent}
          opacity="0.85"
        />
        {/* Inner highlight line */}
        <path
          d="M 40 36 L 40 64"
          stroke={orange}
          strokeWidth="0.8"
          opacity="0.6"
        />
      </g>

      {/* Wordmark */}
      {showWordmark && (
        <g>
          <text
            x="86"
            y="44"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize="28"
            fontWeight="800"
            letterSpacing="-0.5"
            fill={navy}
          >
            IMC
          </text>
          {/* Vertical accent line */}
          <rect x="156" y="20" width="1.5" height="28" fill={orange} opacity="0.7" />
          <text
            x="164"
            y="32"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize="10"
            fontWeight="600"
            letterSpacing="2"
            fill={orange}
          >
            GRUPO
          </text>
          <text
            x="164"
            y="46"
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize="9"
            fontWeight="500"
            letterSpacing="0.5"
            fill={navy}
            opacity="0.75"
          >
            Logística Internacional
          </text>
          {showTagline && (
            <text
              x="86"
              y="64"
              fontFamily="'Inter', system-ui, sans-serif"
              fontSize="8"
              fontWeight="500"
              letterSpacing="1"
              fill={orange}
              opacity="0.9"
            >
              CARGO · BOX · IMPORTADORA
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
