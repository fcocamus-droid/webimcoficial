/**
 * IMC Box Sub-Brand Logo
 * For the Casilla Miami service
 *
 * Design:
 *   - Open package box icon with motion lines (incoming from USA)
 *   - "BOX" wordmark with package highlight
 */

interface IMCBoxLogoProps {
  variant?: 'default' | 'mono-navy' | 'mono-white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE = {
  sm: { h: 32 },
  md: { h: 44 },
  lg: { h: 64 },
  xl: { h: 96 }
}

export default function IMCBoxLogo({
  variant = 'default',
  size = 'md',
  className = ''
}: IMCBoxLogoProps) {
  const h = SIZE[size].h
  const orange = variant === 'mono-white' ? '#FFFFFF' : '#F47920'
  const navy = variant === 'mono-white' ? '#FFFFFF' : '#1B2A6B'
  const light = variant === 'mono-white' ? 'rgba(255,255,255,0.6)' : '#FCE5D2'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 80"
      height={h}
      className={className}
      aria-label="IMC Box"
    >
      {/* Package box symbol */}
      <g transform="translate(0, 8)">
        {/* Box back */}
        <rect x="10" y="20" width="56" height="40" fill={light} stroke={navy} strokeWidth="1.5" rx="2" />
        {/* Box flaps open at top */}
        <path d="M 10 20 L 38 8 L 66 20 L 66 22 L 38 14 L 10 22 Z" fill={orange} />
        {/* Tape line */}
        <rect x="34" y="20" width="8" height="40" fill={orange} opacity="0.85" />
        {/* IMC label on box */}
        <text
          x="38"
          y="48"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
          fill={navy}
        >
          IMC
        </text>
        {/* Motion lines (incoming from right side - USA→Chile) */}
        <line x1="75" y1="32" x2="86" y2="32" stroke={orange} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <line x1="72" y1="40" x2="82" y2="40" stroke={orange} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
        <line x1="75" y1="48" x2="86" y2="48" stroke={orange} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      </g>

      {/* Wordmark */}
      <g>
        <text
          x="100"
          y="44"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="32"
          fontWeight="800"
          letterSpacing="-0.5"
          fill={navy}
        >
          IMC
        </text>
        <text
          x="170"
          y="44"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="32"
          fontWeight="800"
          letterSpacing="-0.5"
          fill={orange}
        >
          BOX
        </text>
        <text
          x="100"
          y="60"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="2.5"
          fill={navy}
          opacity="0.75"
        >
          CASILLA MIAMI · CHILE
        </text>
      </g>
    </svg>
  )
}
