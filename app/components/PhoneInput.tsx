'use client'

import { extractClNumber, formatClPhone } from '@/lib/phone-cl'

type Props = {
  value: string
  onChange: (formatted: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/**
 * Input de teléfono chileno con +56 fijo a la izquierda.
 * El usuario solo escribe los 9 dígitos. Se auto-formatea como
 * `+56 9 1234 5678`.
 */
export default function PhoneInput({
  value,
  onChange,
  placeholder = '9 1234 5678',
  required,
  className = '',
}: Props) {
  const digits = extractClNumber(value)

  return (
    <div className="relative flex">
      <span className="inline-flex items-center px-3 text-sm font-semibold text-slate-700 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg">
        🇨🇱 +56
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={digits ? formatClPhone(digits).replace(/^\+56\s?/, '') : ''}
        onChange={(e) => {
          const next = extractClNumber(e.target.value)
          onChange(next ? formatClPhone(next) : '')
        }}
        placeholder={placeholder}
        required={required}
        className={`input-base rounded-l-none flex-1 ${className}`}
        maxLength={12} /* "9 1234 5678" = 11 chars + safety */
      />
    </div>
  )
}
