'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ImportResponse = {
  productId: string
  slug: string
  imagesUploaded: number
  imagesFailed: number
  imageErrors: string[]
  extracted: {
    source: string
    sourceHost: string
    sourceUrl: string
    title: string
    brand: string | null
    sku: string | null
    priceCLP: number | null
    priceCurrency: string | null
  }
}

const POPULAR_SITES = [
  'mercadolibre.cl',
  'sodimac.cl',
  'easy.cl',
  'aliexpress.com',
  'tu propio sitio',
]

function formatCLP(n: number | null) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function ImportFromUrlButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<
    'idle' | 'fetching' | 'extracting' | 'images' | 'done'
  >('idle')

  const close = () => {
    if (loading) return
    setOpen(false)
    setUrl('')
    setError(null)
    setStage('idle')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Pega una URL primero')
      return
    }
    setLoading(true)
    setError(null)
    setStage('fetching')
    try {
      // Cambiar el stage mientras la promesa corre — el endpoint hace todo
      // en un solo request, así que solo damos feedback aproximado.
      setTimeout(() => setStage((s) => (s === 'fetching' ? 'extracting' : s)), 2000)
      setTimeout(() => setStage((s) => (s === 'extracting' ? 'images' : s)), 5000)

      const res = await fetch('/api/seller/products/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo importar')
        setLoading(false)
        setStage('idle')
        return
      }
      setStage('done')
      const imported = data as ImportResponse
      // Redirigir al editor del producto con flag de éxito
      router.push(
        `/panel/vendedor/productos/${imported.productId}?imported=1&imgs=${imported.imagesUploaded}`
      )
      router.refresh()
    } catch {
      setError('Error de red. Verifica tu conexión.')
      setLoading(false)
      setStage('idle')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white border border-amber-500 text-amber-700 hover:bg-amber-50 font-semibold px-4 py-2.5 rounded-lg"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
        Importar desde URL
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-xl font-bold text-navy-700">
                Importar producto desde una URL
              </h3>
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Pega la URL de cualquier producto. Extraemos título, descripción,
              marca, SKU, precio e imágenes. Luego completas la categoría y
              los detalles B2B antes de publicar.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label-base">URL del producto</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.sodimac.cl/sodimac-cl/product/..."
                  className="input-base"
                  disabled={loading}
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Funciona con la mayoría de sitios: {POPULAR_SITES.join(', ')}.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading && (
                <div className="rounded-lg bg-navy-50 border border-navy-100 px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <svg
                      className="animate-spin w-4 h-4 text-navy-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-navy-700">
                      {stage === 'fetching' && 'Descargando la página…'}
                      {stage === 'extracting' && 'Leyendo los datos del producto…'}
                      {stage === 'images' && 'Guardando imágenes en tu catálogo…'}
                      {stage === 'done' && 'Listo, redirigiendo…'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-navy-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-navy-600 transition-all duration-700"
                      style={{
                        width:
                          stage === 'fetching'
                            ? '30%'
                            : stage === 'extracting'
                              ? '65%'
                              : stage === 'images'
                                ? '90%'
                                : stage === 'done'
                                  ? '100%'
                                  : '5%',
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Puede tomar entre 5 y 30 segundos según el sitio.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importando…' : 'Importar producto'}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1">Qué hace por ti:</p>
              <ul className="space-y-0.5">
                <li>• Lee título, marca, SKU y descripción</li>
                <li>• Detecta el precio (si está visible en CLP)</li>
                <li>• Descarga hasta 3 imágenes a tu catálogo</li>
                <li>• Crea el producto como <strong>oculto</strong> para que lo revises antes de publicar</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
