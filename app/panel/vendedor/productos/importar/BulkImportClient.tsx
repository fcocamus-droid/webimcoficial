'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Category = { slug: string; name: string }

type PreviewRow = {
  rowNumber: number
  ok: boolean
  data: any
  error?: string
  categoryName?: string
}

type PreviewResponse = {
  total: number
  validCount: number
  invalidCount: number
  rows: PreviewRow[]
  validCategories: { slug: string; name: string }[]
}

type ImportResponse = {
  created: number
  errors: { rowNumber: number; titulo?: string; error: string }[]
}

type Step = 1 | 2 | 3

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Descargar plantilla' },
  { id: 2, label: 'Subir y revisar' },
  { id: 3, label: 'Confirmar e importar' },
]

function formatCLP(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(num)
}

export default function BulkImportClient({
  categories,
}: {
  categories: Category[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ──────────────────────────────────────────────────────────
  // PASO 2 → subir archivo y obtener preview
  // ──────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo CSV primero.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/seller/products/bulk/preview', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al procesar el archivo.')
        setLoading(false)
        return
      }
      setPreview(data as PreviewResponse)
    } catch {
      setError('Error de red. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────
  // PASO 3 → import real
  // ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return
    if (!preview || preview.validCount === 0) {
      setError('No hay filas válidas para importar.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/seller/products/bulk/import', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al importar.')
        setLoading(false)
        return
      }
      setImportResult(data as ImportResponse)
      setStep(3)
      // refrescar el catálogo cuando el user vuelva
      router.refresh()
    } catch {
      setError('Error de red al importar. Algunos productos pueden haberse creado igual.')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setError(null)
    setStep(1)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="flex items-center gap-1 sm:gap-3 mb-6 text-xs sm:text-sm">
        {STEPS.map((s, idx) => {
          const active = step === s.id
          const done = step > s.id
          return (
            <li key={s.id} className="flex items-center gap-1 sm:gap-3 flex-1">
              <div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold shrink-0 ${
                  active
                    ? 'bg-navy-600 text-white'
                    : done
                      ? 'bg-verified-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : s.id}
              </div>
              <span
                className={`hidden sm:inline ${
                  active
                    ? 'text-navy-700 font-semibold'
                    : done
                      ? 'text-verified-700'
                      : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    done ? 'bg-verified-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* PASO 1: Descargar plantilla + reglas                    */}
      {/* ────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              1. Descarga la plantilla CSV
            </h3>
            <p className="text-sm text-slate-600">
              Te entregamos un archivo con las columnas correctas y dos filas de
              ejemplo. Ábrelo en Excel o Google Sheets, completa tus productos y
              guarda como CSV.
            </p>
          </div>

          <a
            href="/api/seller/products/bulk/template"
            download
            className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Descargar plantilla CSV
          </a>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h4 className="font-semibold text-slate-900">
              Reglas importantes para llenar la plantilla
            </h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  <strong>Máximo 500 productos por archivo.</strong> Si tienes
                  más, divídelos en varias subidas.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  Columnas obligatorias: <code className="bg-slate-100 px-1 rounded">titulo</code>{' '}
                  y <code className="bg-slate-100 px-1 rounded">categoria_slug</code>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  La columna <code className="bg-slate-100 px-1 rounded">categoria_slug</code>{' '}
                  debe ser exactamente uno de los slugs válidos (ver tabla abajo).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  <code className="bg-slate-100 px-1 rounded">stock_status</code>{' '}
                  acepta: <code className="bg-slate-100 px-1 rounded">DISPONIBLE</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">A_PEDIDO</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">AGOTADO</code>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  <code className="bg-slate-100 px-1 rounded">origen</code>{' '}
                  acepta: <code className="bg-slate-100 px-1 rounded">CHILE</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">CHINA</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">USA</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">EUROPA</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">LATAM</code>,{' '}
                  <code className="bg-slate-100 px-1 rounded">OTRO</code>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  <code className="bg-slate-100 px-1 rounded">precio_neto_clp</code>{' '}
                  es el precio sin IVA. Déjalo vacío si prefieres mostrar “a
                  cotizar”.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-verified-600 font-bold">✓</span>
                <span>
                  <code className="bg-slate-100 px-1 rounded">destacado</code>{' '}
                  y <code className="bg-slate-100 px-1 rounded">visible</code>{' '}
                  usan 1 (sí) o 0 (no).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">!</span>
                <span>
                  Esta herramienta crea productos <strong>sin imágenes</strong>.
                  Luego puedes editar cada uno para subir fotos.
                </span>
              </li>
            </ul>
          </div>

          <details className="border-t border-slate-200 pt-6">
            <summary className="cursor-pointer font-semibold text-slate-900 hover:text-navy-600">
              Ver categorías válidas ({categories.length})
            </summary>
            <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm">
              {categories.map((c) => (
                <div key={c.slug} className="flex justify-between gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-700">{c.name}</span>
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-navy-700">
                    {c.slug}
                  </code>
                </div>
              ))}
            </div>
          </details>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              Ya tengo mi archivo, continuar →
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* PASO 2: Subir archivo + preview                          */}
      {/* ────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {!preview && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  2. Sube tu archivo CSV
                </h3>
                <p className="text-sm text-slate-600">
                  Te mostraremos una vista previa con los errores antes de
                  crear nada.
                </p>
              </div>

              <label className="block">
                <span className="label-base">Archivo CSV</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null)
                    setError(null)
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
                />
                {file && (
                  <p className="mt-2 text-xs text-slate-500">
                    Seleccionado: <strong>{file.name}</strong> (
                    {(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </label>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost"
                  disabled={loading}
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando…' : 'Procesar archivo'}
                </button>
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">
                      {preview.total}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
                      Filas totales
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-verified-600">
                      {preview.validCount}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
                      Válidas
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-3xl font-bold ${
                        preview.invalidCount > 0 ? 'text-red-600' : 'text-slate-400'
                      }`}
                    >
                      {preview.invalidCount}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
                      Con errores
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de filas */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold text-slate-900">
                    Detalle por fila
                  </h4>
                  <p className="text-xs text-slate-500">
                    Solo se importarán las filas marcadas con ✓
                  </p>
                </div>
                <div className="overflow-x-auto max-h-[480px]">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-2 w-12">#</th>
                        <th className="px-4 py-2 w-10"></th>
                        <th className="px-4 py-2">Título</th>
                        <th className="px-4 py-2">Categoría</th>
                        <th className="px-4 py-2">Precio neto</th>
                        <th className="px-4 py-2">Estado / Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r) => (
                        <tr
                          key={r.rowNumber}
                          className={`border-t border-slate-100 ${
                            r.ok ? '' : 'bg-red-50/50'
                          }`}
                        >
                          <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                            {r.rowNumber}
                          </td>
                          <td className="px-4 py-2">
                            {r.ok ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-verified-100 text-verified-700 text-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                ✗
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-900 max-w-xs">
                            <p className="line-clamp-2">
                              {r.data?.titulo || (
                                <span className="text-slate-400 italic">
                                  (vacío)
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {r.categoryName || (
                              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {r.data?.categoria_slug || '—'}
                              </code>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-700 whitespace-nowrap">
                            {formatCLP(r.data?.precio_neto_clp)}
                          </td>
                          <td className="px-4 py-2">
                            {r.ok ? (
                              <span className="text-verified-700 text-xs font-medium">
                                Lista para importar
                              </span>
                            ) : (
                              <span className="text-red-700 text-xs">
                                {r.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {preview.invalidCount > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  <strong>Aviso:</strong> hay {preview.invalidCount} fila
                  {preview.invalidCount === 1 ? '' : 's'} con errores. Si
                  continúas, solo se crearán las {preview.validCount} filas
                  válidas. Puedes corregir el archivo y volver a subirlo si
                  prefieres importar todo de una vez.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="btn-ghost"
                  disabled={loading}
                >
                  ← Subir otro archivo
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || preview.validCount === 0}
                  className="bg-verified-600 hover:bg-verified-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Importando…'
                    : `Importar ${preview.validCount} producto${
                        preview.validCount === 1 ? '' : 's'
                      }`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* PASO 3: Resultado                                       */}
      {/* ────────────────────────────────────────────────────── */}
      {step === 3 && importResult && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-verified-100 text-verified-700 mb-4">
              <svg
                className="w-9 h-9"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              ¡Importación completa!
            </h3>
            <p className="text-slate-600">
              Se crearon{' '}
              <strong className="text-verified-700">
                {importResult.created}
              </strong>{' '}
              producto{importResult.created === 1 ? '' : 's'} nuevo
              {importResult.created === 1 ? '' : 's'} en tu catálogo.
            </p>
            {importResult.errors.length > 0 && (
              <p className="text-sm text-amber-700 mt-2">
                {importResult.errors.length} fila
                {importResult.errors.length === 1 ? '' : 's'} no se pudieron
                crear. Revisa el detalle abajo.
              </p>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-900">
                  Filas con errores
                </h4>
              </div>
              <div className="overflow-x-auto max-h-[320px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2 w-12">Fila</th>
                      <th className="px-4 py-2">Título</th>
                      <th className="px-4 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.map((e) => (
                      <tr
                        key={e.rowNumber}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                          {e.rowNumber}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {e.titulo || (
                            <span className="text-slate-400 italic">
                              (sin título)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-red-700 text-xs">
                          {e.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/panel/vendedor/productos"
              className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              Ver mi catálogo
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="btn-ghost"
            >
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
