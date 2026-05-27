'use client'

import { useId } from 'react'
import { GIROS_SII } from '@/lib/sii-giros'

type Props = {
  value: string
  onChange: (giro: string) => void
  placeholder?: string
  required?: boolean
}

/**
 * Input con autocomplete de giros SII vía <datalist>.
 * El usuario puede:
 * - Seleccionar uno de la lista (autocomplete mientras escribe)
 * - Escribir uno libre si su giro no está en la lista
 */
export default function GiroSelector({
  value,
  onChange,
  placeholder = 'Empieza a escribir tu giro o selecciona…',
  required,
}: Props) {
  const listId = useId()

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        className="input-base"
        placeholder={placeholder}
        required={required}
        maxLength={200}
      />
      <datalist id={listId}>
        {GIROS_SII.flatMap((g) => g.items).map((giro) => (
          <option key={giro} value={giro} />
        ))}
      </datalist>
      <p className="helper-text">
        Sugerencias del SII según tu actividad. Puedes escribir uno propio
        si no aparece.
      </p>
    </>
  )
}
