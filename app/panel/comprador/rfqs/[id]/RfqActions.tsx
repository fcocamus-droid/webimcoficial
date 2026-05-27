'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RfqActions({
  rfqId,
  status,
}: {
  rfqId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isClosed = status === 'CLOSED' || status === 'CANCELLED'

  const change = async (next: 'CLOSED' | 'CANCELLED') => {
    const verb = next === 'CLOSED' ? 'cerrar' : 'cancelar'
    if (!confirm(`¿Seguro que quieres ${verb} esta cotización?`)) return
    setLoading(true)
    const res = await fetch(`/api/buyer/rfqs/${rfqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      alert('No pudimos actualizar la cotización')
    }
    setLoading(false)
  }

  if (isClosed) return null

  return (
    <div className="flex gap-2">
      <button
        onClick={() => change('CLOSED')}
        disabled={loading}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 disabled:opacity-60"
      >
        Cerrar cotización
      </button>
      <button
        onClick={() => change('CANCELLED')}
        disabled={loading}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        Cancelar
      </button>
    </div>
  )
}
