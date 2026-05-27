'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string }
type PreselectedProduct = {
  id: string
  title: string
  slug: string
  unit: string
  moq: number
  categoryId: string | null
  company: { razonSocial: string }
  image: string | null
}

export default function NuevaRfqForm({
  categories,
  preselectedProduct,
}: {
  categories: Category[]
  preselectedProduct: PreselectedProduct | null
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: preselectedProduct
      ? `Cotización: ${preselectedProduct.title}`
      : '',
    description: '',
    quantity: preselectedProduct?.moq ?? 1,
    unit: preselectedProduct?.unit || 'unidad',
    categoryId: preselectedProduct?.categoryId || '',
    productId: preselectedProduct?.id || '',
    budgetMaxCLP: '' as number | '',
    deliveryDeadline: '',
    deliveryLocation: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k as string]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (form.title.trim().length < 5) errs.title = 'Mínimo 5 caracteres'
    if (form.description.trim().length < 20)
      errs.description = 'Cuéntales algo más, mínimo 20 caracteres'
    if (!form.quantity || form.quantity < 1) errs.quantity = 'Cantidad ≥ 1'
    if (!form.unit.trim()) errs.unit = 'Indica la unidad'
    if (!form.productId && !form.categoryId)
      errs.categoryId = 'Elige una categoría o un producto'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/buyer/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          budgetMaxCLP:
            form.budgetMaxCLP === '' ? undefined : Number(form.budgetMaxCLP),
          deliveryDeadline: form.deliveryDeadline || undefined,
          productId: form.productId || undefined,
          categoryId: form.categoryId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.field) setErrors({ [data.field]: data.error })
        else if (data.issues) {
          const fe: Record<string, string> = {}
          Object.entries(data.issues).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          })
          setErrors(fe)
        } else setServerError(data.error || 'Error al crear la RFQ')
        setLoading(false)
        return
      }
      router.push(`/panel/comprador/rfqs/${data.id}`)
      router.refresh()
    } catch {
      setServerError('Error de red')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {preselectedProduct && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-4 flex items-center gap-3">
          {preselectedProduct.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preselectedProduct.image}
              alt={preselectedProduct.title}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
              📦
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">
              Cotizando producto
            </p>
            <p className="font-semibold text-slate-900 truncate">
              {preselectedProduct.title}
            </p>
            <p className="text-sm text-slate-500 truncate">
              {preselectedProduct.company.razonSocial}
            </p>
          </div>
        </div>
      )}

      <Section title="Detalles de la solicitud">
        <div className="grid gap-4">
          <div>
            <label className="label-base">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="input-base"
              placeholder="Ej: Soda cáustica granulada — pedido mensual"
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>
          <div>
            <label className="label-base">Descripción detallada *</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input-base min-h-[140px]"
              placeholder="Especificaciones técnicas requeridas, marcas aceptadas, condiciones de calidad…"
            />
            {errors.description && (
              <p className="error-text">{errors.description}</p>
            )}
          </div>
          {!preselectedProduct && (
            <div>
              <label className="label-base">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                className="input-base"
              >
                <option value="">Selecciona…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="error-text">{errors.categoryId}</p>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title="Cantidad y plazo">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label-base">Cantidad *</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                update(
                  'quantity',
                  e.target.value === '' ? 1 : Number(e.target.value)
                )
              }
              className="input-base"
            />
            {errors.quantity && (
              <p className="error-text">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label className="label-base">Unidad *</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="input-base"
              list="units"
            />
            <datalist id="units">
              <option value="unidad" />
              <option value="kg" />
              <option value="lt" />
              <option value="m" />
              <option value="caja" />
              <option value="palet" />
              <option value="tambor" />
              <option value="saco" />
            </datalist>
            {errors.unit && <p className="error-text">{errors.unit}</p>}
          </div>
          <div>
            <label className="label-base">Presupuesto máx (CLP)</label>
            <input
              type="number"
              min={0}
              value={form.budgetMaxCLP}
              onChange={(e) =>
                update(
                  'budgetMaxCLP',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className="input-base"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="label-base">Fecha límite de entrega</label>
            <input
              type="date"
              value={form.deliveryDeadline}
              onChange={(e) => update('deliveryDeadline', e.target.value)}
              className="input-base"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-base">Lugar de entrega</label>
            <input
              type="text"
              value={form.deliveryLocation}
              onChange={(e) => update('deliveryLocation', e.target.value)}
              className="input-base"
              placeholder="Ej: Quilicura, RM"
            />
          </div>
        </div>
      </Section>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/panel/comprador/rfqs')}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {loading ? 'Enviando…' : 'Enviar solicitud →'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-navy-600 mb-4">{title}</h3>
      {children}
    </section>
  )
}
