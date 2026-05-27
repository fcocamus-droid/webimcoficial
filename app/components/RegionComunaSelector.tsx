'use client'

import { useMemo } from 'react'
import { REGION_NAMES, comunasDeRegion } from '@/lib/chile-regiones'

type Props = {
  region: string
  comuna: string
  onChangeRegion: (region: string) => void
  onChangeComuna: (comuna: string) => void
  required?: boolean
}

export default function RegionComunaSelector({
  region,
  comuna,
  onChangeRegion,
  onChangeComuna,
  required,
}: Props) {
  const comunas = useMemo(() => comunasDeRegion(region), [region])

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="label-base">
          Región {required && '*'}
        </label>
        <select
          value={region}
          onChange={(e) => {
            onChangeRegion(e.target.value)
            onChangeComuna('') // reset comuna al cambiar región
          }}
          className="input-base"
          required={required}
        >
          <option value="">Selecciona región…</option>
          {REGION_NAMES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-base">
          Comuna {required && '*'}
        </label>
        <select
          value={comuna}
          onChange={(e) => onChangeComuna(e.target.value)}
          className="input-base"
          disabled={!region}
          required={required}
        >
          <option value="">
            {region ? 'Selecciona comuna…' : 'Primero selecciona región'}
          </option>
          {comunas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
