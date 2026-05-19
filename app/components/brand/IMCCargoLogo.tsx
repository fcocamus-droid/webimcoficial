/**
 * IMC Cargo Sub-Brand Logo
 * For the freight forwarder service
 *
 * Design:
 *   - Stylized container/ship + plane silhouette = multimodal freight
 *   - "CARGO" wordmark
 */

interface IMCCargoLogoProps {
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

export default function IMCCargoLogo({
  variant = 'default',
  size = 'md',
  className = ''
}: IMCCargoLogoProps) {
  const h = SIZE[size].h
  const orange = variant === 'mono-white' ? '#FFFFFF' : '#F47920'
  const navy = variant === 'mono-white' ? '#FFFFFF' : '#1B2A6B'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 80"
      height={h}
      className={className}
      aria-label="IMC Cargo"
    >
      {/* Container ship + plane symbol */}
      <g transform="translate(0, 12)">
        {/* Sea line */}
        <line x1="4" y1="56" x2="86" y2="56" stroke={navy} strokeWidth="1.2" opacity="0.4" strokeDasharray="2 2" />

        {/* Ship hull */}
        <path d="M 12 44 L 78 44 L 72 56 L 18 56 Z" fill={navy} />
        {/* Containers stacked */}
        <rect x="20" y="36" width="14" height="8" fill={orange} />
        <rect x="36" y="36" width="14" height="8" fill={navy} stroke={orange} strokeWidth="1.2" />
        <rect x="52" y="36" width="14" height="8" fill={orange} />
        <rect x="24" y="28" width="14" height="8" fill={navy} stroke={orange} strokeWidth="1.2" />
        <rect x="48" y="28" width="14" height="8" fill={orange} />

        {/* Plane silhouette flying over */}
        <path
          d="M 18 14 L 28 12 L 34 8 L 38 12 L 56 12 L 60 16 L 38 16 L 34 22 L 28 16 Z"
          fill={orange}
          opacity="0.9"
        />
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
          CARGO
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
          FREIGHT FORWARDER · INTERNACIONAL
        </text>
      </g>
    </svg>
  )
}
