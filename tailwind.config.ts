import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // IMC Industriales palette
        industrial: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#0a0f1f',
        },
        navy: {
          50: '#eef2ff',
          100: '#dbe2fe',
          200: '#b9c8fc',
          400: '#3b4ea0',
          500: '#1e3a8a',
          600: '#1B2A6B',  // primary brand navy
          700: '#162253',
          800: '#0F2A5C',
          900: '#0a1a3a',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',  // primary brand accent
          600: '#d97706',
          700: '#b45309',
        },
        verified: {
          50: '#ecfdf5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #1B2A6B 0%, #162253 50%, #0F2A5C 100%)',
        'amber-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      },
    },
  },
  plugins: [],
}

export default config
