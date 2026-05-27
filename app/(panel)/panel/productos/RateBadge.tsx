'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RateBadge({ initialRate }: { initialRate: number }) {
  const router = useRouter()
  const [rate, setRate] = useState(initialRate)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh(recalc: boolean) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/products/refresh-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recalculateAll: recalc }),
      })
      const data = await res.json()
      if (res.ok) {
        setRate(data.rate)
        if (recalc) {
          setMessage(`Recalculados ${data.updated} productos con TC ${data.rate.toFixed(2)}`)
          router.refresh()
        } else {
          setMessage(`TC actualizado: ${data.rate.toFixed(2)}`)
        }
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 min-w-[200px] text-right">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tipo de cambio</p>
      <p className="text-2xl font-bold text-[#1B2A6B]">
        ${rate.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
        <span className="text-xs text-slate-400 font-normal ml-1">CLP/USD</span>
      </p>
      <div className="flex gap-1.5 mt-2 justify-end">
        <button
          onClick={() => refresh(false)}
          disabled={loading}
          className="text-[10px] text-slate-500 hover:text-[#F47920] disabled:opacity-50"
          title="Actualizar desde mindicador.cl"
        >
          ↻ Actualizar
        </button>
        <span className="text-slate-300">·</span>
        <button
          onClick={() => refresh(true)}
          disabled={loading}
          className="text-[10px] text-[#F47920] hover:text-orange-700 font-semibold disabled:opacity-50"
          title="Actualizar TC y recalcular todos los precios CLP"
        >
          {loading ? 'Procesando…' : '↻ + Recalcular'}
        </button>
      </div>
      {message && <p className="text-[10px] text-emerald-700 mt-1">{message}</p>}
    </div>
  )
}
