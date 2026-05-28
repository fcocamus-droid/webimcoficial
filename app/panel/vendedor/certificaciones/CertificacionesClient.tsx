'use client'

import { useRef, useState } from 'react'

type Cert = {
  id: string
  type: string
  customName: string | null
  fileUrl: string | null
  expiresAt: string | null
  verified: boolean
  createdAt: string
}

const TYPES = [
  { value: 'ISO_9001', label: 'ISO 9001 — Gestión de la calidad' },
  { value: 'ISO_14001', label: 'ISO 14001 — Gestión ambiental' },
  { value: 'HACCP', label: 'HACCP — Seguridad alimentaria' },
  { value: 'BPM', label: 'BPM — Buenas Prácticas de Manufactura' },
  { value: 'GMP', label: 'GMP — Good Manufacturing Practice' },
  { value: 'KOSHER', label: 'KOSHER' },
  { value: 'ORGANICO', label: 'Certificación Orgánica' },
  { value: 'FDA', label: 'FDA (USA)' },
  { value: 'OTRA', label: 'Otra (especificar)' },
]

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPES.map((t) => [t.value, t.label.split('—')[0].trim()])
)

export default function CertificacionesClient({
  initial,
}: {
  initial: Cert[]
}) {
  const [certs, setCerts] = useState<Cert[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('ISO_9001')
  const [customName, setCustomName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setType('ISO_9001')
    setCustomName('')
    setExpiresAt('')
    setErr(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('type', type)
      if (type === 'OTRA') fd.append('customName', customName)
      if (expiresAt) fd.append('expiresAt', expiresAt)
      const f = fileRef.current?.files?.[0]
      if (f) fd.append('file', f)

      const res = await fetch('/api/seller/certifications', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al guardar')
        return
      }
      setCerts((c) => [data.certification, ...c])
      setShowForm(false)
      reset()
    } catch {
      setErr('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const onRemove = async (id: string) => {
    if (!confirm('¿Eliminar esta certificación?')) return
    const res = await fetch(`/api/seller/certifications/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) setCerts((c) => c.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          + Agregar certificación
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-6 bg-white rounded-2xl border-t-4 border-t-navy-600 border border-slate-200 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-navy-600">
            Nueva certificación
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-base">Tipo *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-base"
                required
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {type === 'OTRA' && (
              <div className="md:col-span-2">
                <label className="label-base">Nombre de la certificación *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input-base"
                  placeholder="Ej: SQF, BRC, OHSAS 18001…"
                  required
                />
              </div>
            )}
            <div>
              <label className="label-base">Fecha de vencimiento</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input-base"
              />
              <p className="helper-text">
                Opcional. Útil si tu certificado tiene fecha de expiración.
              </p>
            </div>
            <div>
              <label className="label-base">Archivo (PDF o imagen)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="input-base"
              />
              <p className="helper-text">Opcional. Máximo 10MB.</p>
            </div>
          </div>

          {err && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                reset()
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      {certs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl mb-3">📜</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no tienes certificaciones
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Las certificaciones aumentan la confianza de los compradores. Sube
            ISO, HACCP, BPM o cualquier otra que tu empresa posea.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certs.map((c) => {
            const expired =
              c.expiresAt && new Date(c.expiresAt) < new Date()
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900">
                        {TYPE_LABEL[c.type] || c.type}
                      </h3>
                      {c.verified ? (
                        <span className="text-xs font-semibold text-verified-600 bg-verified-50 px-2 py-0.5 rounded">
                          ✓ Verificado
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          ⏱ Pendiente
                        </span>
                      )}
                      {expired && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Vencido
                        </span>
                      )}
                    </div>
                    {c.customName && (
                      <p className="text-sm text-slate-700">{c.customName}</p>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    📅 Agregado{' '}
                    {new Date(c.createdAt).toLocaleDateString('es-CL')}
                  </p>
                  {c.expiresAt && (
                    <p className={expired ? 'text-red-600 font-medium' : ''}>
                      ⏳ Vence{' '}
                      {new Date(c.expiresAt).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3 items-center text-sm">
                  {c.fileUrl ? (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline font-medium"
                    >
                      📎 Ver archivo →
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Sin archivo adjunto
                    </span>
                  )}
                  <button
                    onClick={() => onRemove(c.id)}
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
