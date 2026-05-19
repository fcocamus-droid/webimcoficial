'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PkgType = { id: string; name: string; slug: string }

export default function NewPreAlertForm({ types }: { types: PkgType[] }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    store: '',
    tracking: '',
    description: '',
    valueUSD: '',
    estimatedWeight: '',
    packageTypeId: types[0]?.id || '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/box/prealerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: form.store || null,
          tracking: form.tracking || null,
          description: form.description,
          valueUSD: parseFloat(form.valueUSD),
          estimatedWeight: form.estimatedWeight ? parseFloat(form.estimatedWeight) : null,
          packageTypeId: form.packageTypeId || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Error al crear pre-alerta')
      }

      router.push('/box/prealertas')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tienda</label>
          <input
            type="text"
            value={form.store}
            onChange={(e) => setForm({ ...form, store: e.target.value })}
            placeholder="Amazon, eBay, Best Buy…"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tracking USPS/UPS/FedEx</label>
          <input
            type="text"
            value={form.tracking}
            onChange={(e) => setForm({ ...form, tracking: e.target.value })}
            placeholder="9434608106245…"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920] font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción del producto *</label>
        <input
          type="text"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Notebook Lenovo ThinkPad X1"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor USD *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              required
              value={form.valueUSD}
              onChange={(e) => setForm({ ...form, valueUSD: e.target.value })}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Peso estimado (kg)</label>
          <input
            type="number"
            step="0.01"
            value={form.estimatedWeight}
            onChange={(e) => setForm({ ...form, estimatedWeight: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
          <select
            value={form.packageTypeId}
            onChange={(e) => setForm({ ...form, packageTypeId: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920] bg-white"
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas adicionales</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Información adicional para nuestro equipo en Miami…"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#F47920] hover:bg-[#e06810] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
        >
          {submitting ? 'Creando…' : 'Crear pre-alerta'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
