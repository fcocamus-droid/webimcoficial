'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string }

export type ProductFormValues = {
  title: string
  categoryId: string
  shortDescription: string
  description: string
  sku: string
  brand: string
  unit: string
  moq: number | ''
  leadTimeDays: number | ''
  stockStatus: 'DISPONIBLE' | 'A_PEDIDO' | 'AGOTADO'
  origin: 'CHILE' | 'CHINA' | 'USA' | 'EUROPA' | 'LATAM' | 'OTRO'
  basePriceCLP: number | ''
  available: boolean
  featured: boolean
  specs: Record<string, string>
  pricingTiers: { minQuantity: number | ''; priceCLP: number | ''; label: string }[]
}

export type ProductImage = {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
}

export const emptyProduct: ProductFormValues = {
  title: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  sku: '',
  brand: '',
  unit: 'unidad',
  moq: 1,
  leadTimeDays: '',
  stockStatus: 'DISPONIBLE',
  origin: 'CHILE',
  basePriceCLP: '',
  available: true,
  featured: false,
  specs: {},
  pricingTiers: [],
}

const STOCK_OPTIONS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'A_PEDIDO', label: 'A pedido' },
  { value: 'AGOTADO', label: 'Agotado' },
]
const ORIGIN_OPTIONS = [
  { value: 'CHILE', label: 'Chile' },
  { value: 'CHINA', label: 'China' },
  { value: 'USA', label: 'Estados Unidos' },
  { value: 'EUROPA', label: 'Europa' },
  { value: 'LATAM', label: 'Latinoamérica' },
  { value: 'OTRO', label: 'Otro' },
]
const UNIT_SUGGESTIONS = ['unidad', 'kg', 'lt', 'm', 'm²', 'caja', 'palet', 'tambor', 'saco']

export default function ProductForm({
  mode,
  productId,
  initialImages = [],
  initialValues,
  categories,
}: {
  mode: 'create' | 'edit'
  productId?: string
  initialImages?: ProductImage[]
  initialValues: ProductFormValues
  categories: Category[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormValues>(initialValues)
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof ProductFormValues>(
    k: K,
    v: ProductFormValues[K]
  ) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k as string]: '' }))
  }

  // Specs handling — key/value libres
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')
  const addSpec = () => {
    const k = specKey.trim()
    const v = specValue.trim()
    if (!k || !v) return
    setForm((s) => ({ ...s, specs: { ...s.specs, [k]: v } }))
    setSpecKey('')
    setSpecValue('')
  }
  const removeSpec = (k: string) => {
    setForm((s) => {
      const next = { ...s.specs }
      delete next[k]
      return { ...s, specs: next }
    })
  }

  // Pricing tiers
  const addTier = () => {
    setForm((s) => ({
      ...s,
      pricingTiers: [
        ...s.pricingTiers,
        { minQuantity: '', priceCLP: '', label: '' },
      ],
    }))
  }
  const updateTier = (i: number, patch: Partial<ProductFormValues['pricingTiers'][number]>) => {
    setForm((s) => ({
      ...s,
      pricingTiers: s.pricingTiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }))
  }
  const removeTier = (i: number) => {
    setForm((s) => ({
      ...s,
      pricingTiers: s.pricingTiers.filter((_, idx) => idx !== i),
    }))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.title || form.title.length < 3) errs.title = 'Título muy corto'
    if (!form.categoryId) errs.categoryId = 'Selecciona una categoría'
    if (form.moq !== '' && form.moq < 1) errs.moq = 'Debe ser ≥ 1'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildPayload = () => ({
    title: form.title.trim(),
    categoryId: form.categoryId,
    shortDescription: form.shortDescription.trim() || undefined,
    description: form.description.trim() || undefined,
    sku: form.sku.trim() || undefined,
    brand: form.brand.trim() || undefined,
    unit: form.unit.trim() || 'unidad',
    moq: form.moq === '' ? 1 : Number(form.moq),
    leadTimeDays: form.leadTimeDays === '' ? undefined : Number(form.leadTimeDays),
    stockStatus: form.stockStatus,
    origin: form.origin,
    basePriceCLP: form.basePriceCLP === '' ? undefined : Number(form.basePriceCLP),
    available: form.available,
    featured: form.featured,
    specs: form.specs,
    pricingTiers: form.pricingTiers
      .filter((t) => t.minQuantity !== '' && t.priceCLP !== '')
      .map((t) => ({
        minQuantity: Number(t.minQuantity),
        priceCLP: Number(t.priceCLP),
        label: t.label.trim() || undefined,
      })),
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setSavedMsg(null)
    if (!validate()) return

    setSaving(true)
    try {
      const url =
        mode === 'create' ? '/api/seller/products' : `/api/seller/products/${productId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.field && data.error) {
          setErrors((e) => ({ ...e, [data.field]: data.error }))
        } else if (data.issues) {
          const fe: Record<string, string> = {}
          Object.entries(data.issues).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          })
          setErrors(fe)
        } else {
          setServerError(data.error || 'Error al guardar')
        }
        setSaving(false)
        return
      }

      if (mode === 'create') {
        // Redirige a la página de edición para subir imágenes
        router.push(`/panel/vendedor/productos/${data.id}`)
        router.refresh()
      } else {
        setSavedMsg('Cambios guardados')
        setTimeout(() => setSavedMsg(null), 3000)
      }
    } catch {
      setServerError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!productId) return
    if (
      !confirm(
        '¿Eliminar este producto definitivamente? Sus imágenes también se borrarán.'
      )
    )
      return
    const res = await fetch(`/api/seller/products/${productId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      router.push('/panel/vendedor/productos')
      router.refresh()
    }
  }

  // Imágenes
  const onPickImage = () => fileRef.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !productId) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/seller/products/${productId}/images`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Error al subir')
      } else {
        setImages((arr) => [...arr, data.image])
      }
    } catch {
      setUploadError('Error de red')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  const setPrimary = async (imgId: string) => {
    setImages((arr) =>
      arr.map((i) => ({ ...i, isPrimary: i.id === imgId }))
    )
    await fetch(`/api/seller/products/${productId}/images/${imgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    })
  }
  const removeImage = async (imgId: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    setImages((arr) => arr.filter((i) => i.id !== imgId))
    await fetch(`/api/seller/products/${productId}/images/${imgId}`, {
      method: 'DELETE',
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Datos básicos */}
      <Section title="Datos básicos">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label-base">Título del producto *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="input-base"
              placeholder="Ej: Soda cáustica granulada 99% — sacos 25kg"
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>
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
          <div>
            <label className="label-base">Marca</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
              className="input-base"
              placeholder="Ej: Solvay"
            />
          </div>
          <div>
            <label className="label-base">SKU / código interno</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              className="input-base"
              placeholder="Ej: SC-99-25K"
            />
          </div>
          <div>
            <label className="label-base">Origen</label>
            <select
              value={form.origin}
              onChange={(e) => update('origin', e.target.value as any)}
              className="input-base"
            >
              {ORIGIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label-base">Descripción corta</label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => update('shortDescription', e.target.value)}
              className="input-base"
              placeholder="Resumen de una línea, aparece en listados"
              maxLength={280}
            />
            <p className="helper-text">
              {form.shortDescription.length} / 280
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="label-base">Descripción completa</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input-base min-h-[140px]"
              placeholder="Aplicaciones, pureza, certificaciones, observaciones de manejo…"
            />
          </div>
        </div>
      </Section>

      {/* Stock / venta */}
      <Section title="Condiciones de venta">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label-base">Estado de stock</label>
            <select
              value={form.stockStatus}
              onChange={(e) => update('stockStatus', e.target.value as any)}
              className="input-base"
            >
              {STOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Unidad de venta</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="input-base"
              list="units"
            />
            <datalist id="units">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label-base">MOQ (mínimo de compra)</label>
            <input
              type="number"
              min={1}
              value={form.moq}
              onChange={(e) =>
                update('moq', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="input-base"
            />
            {errors.moq && <p className="error-text">{errors.moq}</p>}
          </div>
          <div>
            <label className="label-base">Plazo de entrega (días)</label>
            <input
              type="number"
              min={0}
              value={form.leadTimeDays}
              onChange={(e) =>
                update(
                  'leadTimeDays',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className="input-base"
              placeholder="Ej: 7"
            />
          </div>
          <div>
            <label className="label-base">Precio base (CLP)</label>
            <input
              type="number"
              min={0}
              value={form.basePriceCLP}
              onChange={(e) =>
                update(
                  'basePriceCLP',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className="input-base"
              placeholder="Ej: 25000"
            />
            <p className="helper-text">Precio referencial por {form.unit || 'unidad'}.</p>
          </div>
        </div>

        {/* Pricing tiers */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">
                Descuentos por volumen
              </h4>
              <p className="text-xs text-slate-500">
                Define precios distintos a partir de cierta cantidad mínima.
              </p>
            </div>
            <button
              type="button"
              onClick={addTier}
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              + Agregar tier
            </button>
          </div>
          {form.pricingTiers.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              Sin descuentos por volumen.
            </p>
          ) : (
            <div className="space-y-2">
              {form.pricingTiers.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[110px_140px_1fr_auto] gap-2 items-center bg-slate-50 rounded-lg p-2"
                >
                  <input
                    type="number"
                    min={1}
                    placeholder="Desde"
                    value={t.minQuantity}
                    onChange={(e) =>
                      updateTier(i, {
                        minQuantity: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="input-base"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio CLP"
                    value={t.priceCLP}
                    onChange={(e) =>
                      updateTier(i, {
                        priceCLP: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="input-base"
                  />
                  <input
                    type="text"
                    placeholder="Etiqueta opcional (ej: 10+ unidades)"
                    value={t.label}
                    onChange={(e) => updateTier(i, { label: e.target.value })}
                    className="input-base"
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Visibilidad */}
      <Section title="Visibilidad">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => update('available', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">
              Visible en el marketplace (los compradores lo verán)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">
              Marcar como destacado en tu catálogo
            </span>
          </label>
        </div>
      </Section>

      {/* Specs */}
      <Section title="Especificaciones técnicas (opcional)">
        <p className="text-sm text-slate-600 mb-3">
          Pares clave/valor que se mostrarán como una ficha técnica. Ej:
          <code className="bg-slate-100 px-1 rounded text-xs ml-1">
            concentración / 99%
          </code>
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(form.specs).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-2 bg-navy-600/5 border border-navy-600/20 text-navy-600 px-3 py-1.5 rounded-lg text-sm"
            >
              <strong>{k}:</strong> {v}
              <button
                type="button"
                onClick={() => removeSpec(k)}
                className="text-navy-600/60 hover:text-navy-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            type="text"
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            placeholder="Clave (ej: pureza)"
            className="input-base"
          />
          <input
            type="text"
            value={specValue}
            onChange={(e) => setSpecValue(e.target.value)}
            placeholder="Valor (ej: 99%)"
            className="input-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSpec()
              }
            }}
          />
          <button
            type="button"
            onClick={addSpec}
            className="btn-secondary whitespace-nowrap"
          >
            + Añadir
          </button>
        </div>
      </Section>

      {/* Imágenes — solo en modo edit */}
      {mode === 'edit' && productId && (
        <Section title={`Imágenes (${images.length})`}>
          <p className="text-sm text-slate-600 mb-4">
            JPG, PNG o WEBP hasta 5MB cada una. La primera marcada como
            primaria es la que aparece en los listados.
          </p>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                      ★ Primaria
                    </span>
                  )}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-end justify-end p-2 gap-2 opacity-0 group-hover:opacity-100">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(img.id)}
                        className="text-xs font-medium bg-white/90 hover:bg-white px-2 py-1 rounded"
                      >
                        Hacer primaria
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPickImage}
              disabled={uploading}
              className="btn-primary"
            >
              {uploading ? 'Subiendo…' : '+ Subir imagen'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFile}
              className="hidden"
            />
            {uploadError && (
              <p className="error-text inline-block">{uploadError}</p>
            )}
          </div>
        </Section>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {savedMsg && (
        <div className="rounded-lg bg-verified-50 border border-verified-500/40 px-4 py-2.5 text-sm text-verified-600">
          ✓ {savedMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Eliminar producto
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.push('/panel/vendedor/productos')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {saving
              ? 'Guardando…'
              : mode === 'create'
                ? 'Crear y continuar →'
                : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-navy-600 mb-4">{title}</h3>
      {children}
    </section>
  )
}
