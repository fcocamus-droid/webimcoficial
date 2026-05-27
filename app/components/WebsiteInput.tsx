'use client'

type Props = {
  value: string
  onChange: (full: string) => void
  placeholder?: string
  required?: boolean
}

/**
 * Input de sitio web con `https://` fijo a la izquierda.
 * El usuario solo escribe el dominio: `miempresa.cl`.
 * Internamente siempre se guarda como `https://miempresa.cl`.
 * Si el usuario pega un URL completo con http:// o https://, lo quita
 * para mostrar solo el dominio.
 */
export default function WebsiteInput({
  value,
  onChange,
  placeholder = 'miempresa.cl',
  required,
}: Props) {
  // Para mostrar: quitamos cualquier protocolo o www. al inicio
  const display = value
    ? value
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
    : ''

  return (
    <div className="relative flex">
      <span className="inline-flex items-center px-3 text-sm font-mono font-semibold text-slate-600 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg">
        https://
      </span>
      <input
        type="text"
        value={display}
        onChange={(e) => {
          // Limpia: si pegó https:// o www., lo quitamos
          const clean = e.target.value
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .trim()
          // Guardamos siempre con https:// si hay algo
          onChange(clean ? `https://${clean}` : '')
        }}
        placeholder={placeholder}
        required={required}
        className="input-base rounded-l-none flex-1"
        autoComplete="url"
      />
    </div>
  )
}
