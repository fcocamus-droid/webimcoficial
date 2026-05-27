'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { slug: string; name: string; icon: string }

export default function ImportProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [categorySlug, setCategorySlug] = useState('otros')
  const [marginFactor, setMarginFactor] = useState('1.30')
  const [shippingUSD, setShippingUSD] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          categorySlug,
          marginFactor: parseFloat(marginFactor) || 1.30,
          shippingUSD: shippingUSD ? parseFloat(shippingUSD) : 0,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al importar')
      } else {
        setResult(data.product)
        setUrl('')
        setShippingUSD('')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-[#F47920]/10 text-[#F47920] rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Importar desde URL</h2>
          <p className="text-xs text-slate-500">Pega un link de Amazon o eBay y extraemos los datos automáticamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">URL del producto</label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/B0XXXXXXX  o  https://www.ebay.com/itm/XXXXXXXXX"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Factor margen</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max="5"
              value={marginFactor}
              onChange={(e) => setMarginFactor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">1.30 = +30% (default)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Shipping USA→Chile (USD)</label>
            <input
              type="number"
              step="0.01"
              value={shippingUSD}
              onChange={(e) => setShippingUSD(e.target.value)}
              placeholder="opcional"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[10px] text-slate-400">Precio final = (USD producto + USD shipping) × margen × tipo cambio</p>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-[#F47920] hover:bg-[#e06810] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm"
          >
            {loading ? 'Importando…' : '→ Importar producto'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-sm">
          <p className="font-semibold mb-1">✅ Producto importado</p>
          <p className="text-xs">{result.title}</p>
          <p className="text-xs mt-1">
            {result.priceUSD ? `USD $${result.priceUSD.toFixed(2)}` : 'Sin precio detectado'}
            {' → '}
            {result.priceCLP ? `CLP $${Number(result.priceCLP).toLocaleString('es-CL')}` : 'CLP por calcular'}
            {' · '}
            {result.imageCount} imagen(es) descargada(s)
          </p>
        </div>
      )}
    </div>
  )
}
