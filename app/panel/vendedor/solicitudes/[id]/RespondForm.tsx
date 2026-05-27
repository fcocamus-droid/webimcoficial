'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Existing = {
  pricePerUnit: number
  totalPrice: number
  leadTimeDays: number | null
  notes: string
  status: string
}

export default function RespondForm({
  rfqId,
  quantity,
  unit,
  initialResponse,
}: {
  rfqId: string
  quantity: number
  unit: string
  initialResponse: Existing | null
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    pricePerUnit:
      initialResponse?.pricePerUnit !== undefined
        ? String(initialResponse.pricePerUnit)
        : '',
    leadTimeDays:
      initialResponse?.leadTimeDays !== null &&
      initialResponse?.leadTimeDays !== undefined
        ? String(initialResponse.leadTimeDays)
        : '',
    notes: initialResponse?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const update = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const pricePerUnitNum = Number(form.pricePerUnit) || 0
  const totalPreview = pricePerUnitNum * quantity

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setOkMsg(null)
    const errs: Record<string, string> = {}
    if (!form.pricePerUnit || pricePerUnitNum <= 0)
      errs.pricePerUnit = 'Indica el precio por unidad'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/seller/rfqs/${rfqId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePerUnit: pricePerUnitNum,
          leadTimeDays:
            form.leadTimeDays === '' ? undefined : Number(form.leadTimeDays),
          notes: form.notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.issues) {
          const fe: Record<string, string> = {}
          Object.entries(data.issues).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          })
          setErrors(fe)
        } else {
          setServerError(data.error || 'Error al enviar')
        }
        setLoading(false)
        return
      }
      setOkMsg(
        initialResponse ? 'Respuesta actualizada' : 'Cotización enviada'
      )
      setTimeout(() => setOkMsg(null), 3000)
      router.refresh()
    } catch {
      setServerError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const onWithdraw = async () => {
    if (!confirm('¿Retirar tu cotización? Quedará marcada como retirada.'))
      return
    setWithdrawing(true)
    const res = await fetch(`/api/seller/rfqs/${rfqId}/response`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
    setWithdrawing(false)
  }

  const isWithdrawn = initialResponse?.status === 'WITHDRAWN'

  return (
    <div className="bg-white rounded-2xl border-t-4 border-t-amber-500 border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-navy-600 mb-1">
        {initialResponse
          ? isWithdrawn
            ? 'Reenviar cotización'
            : 'Actualizar tu cotización'
          : 'Enviar cotización'}
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        Indica precio, plazo y cualquier observación que ayude al comprador a
        decidir. Puedes editar tu cotización mientras la RFQ esté abierta.
      </p>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-base">
              Precio por {unit} (CLP) *
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={form.pricePerUnit}
              onChange={(e) => update('pricePerUnit', e.target.value)}
              className="input-base"
              placeholder="Ej: 25000"
            />
            {errors.pricePerUnit && (
              <p className="error-text">{errors.pricePerUnit}</p>
            )}
          </div>
          <div>
            <label className="label-base">Lead time (días)</label>
            <input
              type="number"
              min={0}
              value={form.leadTimeDays}
              onChange={(e) => update('leadTimeDays', e.target.value)}
              className="input-base"
              placeholder="Opcional"
            />
          </div>
          <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              Total estimado para {quantity} {unit}:
            </p>
            <p className="text-2xl font-bold text-navy-600">
              {pricePerUnitNum > 0
                ? new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    maximumFractionDigits: 0,
                  }).format(totalPreview)
                : '—'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="input-base min-h-[100px]"
              placeholder="Condiciones de pago, validez, especificaciones técnicas, IVA incluido o no…"
            />
          </div>
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {serverError}
          </div>
        )}
        {okMsg && (
          <div className="rounded-lg bg-verified-50 border border-verified-500/40 px-4 py-2.5 text-sm text-verified-600">
            ✓ {okMsg}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100">
          {initialResponse && !isWithdrawn ? (
            <button
              type="button"
              onClick={onWithdraw}
              disabled={withdrawing}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Retirar cotización
            </button>
          ) : (
            <div />
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {loading
              ? 'Enviando…'
              : initialResponse && !isWithdrawn
                ? 'Actualizar cotización'
                : 'Enviar cotización →'}
          </button>
        </div>
      </form>
    </div>
  )
}
