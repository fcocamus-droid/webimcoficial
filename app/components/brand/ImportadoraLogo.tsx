/**
 * Importadora IMC Sub-Brand Logo
 * For the retail / shopping service
 *
 * Design:
 *   - Shopping bag with star = retail experience
 *   - "Importadora" wordmark (lowercase for friendlier retail feel)
 */

interface ImportadoraLogoProps {
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

export default function ImportadoraLogo({
  variant = 'default',
  size = 'md',
  className = ''
}: ImportadoraLogoProps) {
  const h = SIZE[size].h
  const orange = variant === 'mono-white' ? '#FFFFFF' : '#F47920'
  const navy = variant === 'mono-white' ? '#FFFFFF' : '#1B2A6B'
  const light = variant === 'mono-white' ? 'rgba(255,255,255,0.5)' : '#FCE5D2'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 360 80"
      height={h}
      className={className}
      aria-label="Importadora IMC"
    >
      {/* Shopping bag symbol */}
      <g transform="translate(8, 10)">
        {/* Bag body */}
        <path
          d="M 12 24 L 12 60 Q 12 64 16 64 L 60 64 Q 64 64 64 60 L 64 24 Z"
          fill={light}
          stroke={navy}
          strokeWidth="1.5"
        />
        {/* Handle left */}
        <path
          d="M 22 24 L 22 16 Q 22 6 32 6 Q 42 6 42 16 L 42 24"
          fill="none"
          stroke={navy}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Handle right */}
        <path
          d="M 34 24 L 34 16 Q 34 6 44 6 Q 54 6 54 16 L 54 24"
          fill="none"
          stroke={orange}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* IMC text on bag */}
        <text
          x="38"
          y="50"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill={orange}
        >
          IMC
        </text>
      </g>

      {/* Wordmark */}
      <g>
        <text
          x="92"
          y="42"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="26"
          fontWeight="700"
          letterSpacing="-0.5"
          fill={navy}
        >
          Importadora
        </text>
        <text
          x="240"
          y="42"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="26"
          fontWeight="800"
          letterSpacing="-0.5"
          fill={orange}
        >
          IMC
        </text>
        <text
          x="92"
          y="60"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="2.5"
          fill={navy}
          opacity="0.75"
        >
          TIENDA ONLINE · COMPRA Y RECIBE
        </text>
      </g>
    </svg>
  )
}
