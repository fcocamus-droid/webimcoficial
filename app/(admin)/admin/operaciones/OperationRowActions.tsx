'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STAGE_LABEL = {
  PENDING: 'Pendiente',
  IN_ORIGIN: 'En Origen',
  IN_TRANSIT: 'En Tránsito',
  AT_DESTINATION: 'En Destino',
  DELIVERED: 'Entregado',
}

const STAGE_ORDER = ['PENDING', 'IN_ORIGIN', 'IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED'] as const

export default function OperationRowActions({
  operationId,
  currentStage,
  disabled,
}: {
  operationId: string
  currentStage: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEvent, setShowEvent] = useState(false)
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '' })

  const currentIdx = STAGE_ORDER.indexOf(currentStage as any)
  const nextStage = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null

  async function advance() {
    if (!nextStage) return
    if (!confirm(`¿Avanzar operación a "${STAGE_LABEL[nextStage]}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/operations/${operationId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        alert(e.error || 'Error al avanzar etapa')
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!eventForm.title.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/operations/${operationId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStage: currentStage,  // stay on current stage
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.location,
        }),
      })
      if (res.ok) {
        setShowEvent(false)
        setEventForm({ title: '', description: '', location: '' })
        router.refresh()
      } else {
        const j = await res.json().catch(() => ({}))
        alert(j.error || 'Error al agregar evento')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={advance}
          disabled={disabled || loading || !nextStage}
          className="text-xs text-[#F47920] hover:text-orange-700 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          title={nextStage ? `Avanzar a ${STAGE_LABEL[nextStage]}` : 'Etapa final'}
        >
          ⏭ Avanzar
        </button>
        <button
          onClick={() => setShowEvent(true)}
          disabled={disabled || loading}
          className="text-xs text-[#1B2A6B] hover:text-blue-800 font-medium disabled:opacity-30"
          title="Agregar evento al timeline"
        >
          + Evento
        </button>
      </div>

      {showEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEvent(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Agregar evento al timeline</h2>
            <form onSubmit={addEvent} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Ej: Carga consolidada en bodega Miami"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Detalles adicionales…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Ej: Miami, FL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEvent(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#F47920] hover:bg-[#e06810] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {loading ? 'Guardando…' : 'Guardar evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
