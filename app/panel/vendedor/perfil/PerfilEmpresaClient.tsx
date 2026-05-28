'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/app/components/PhoneInput'
import RegionComunaSelector from '@/app/components/RegionComunaSelector'
import GiroSelector from '@/app/components/GiroSelector'
import WebsiteInput from '@/app/components/WebsiteInput'
import { extractClNumber } from '@/lib/phone-cl'

type Company = {
  slug: string
  razonSocial: string
  rut: string
  logoUrl: string | null
  bannerUrl: string | null
  giro: string | null
  description: string | null
  websiteUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  region: string | null
  ciudad: string | null
  comuna: string | null
  address: string | null
  verified: boolean
}

export default function PerfilEmpresaClient({
  initial,
}: {
  initial: Company
}) {
  const router = useRouter()
  const [company, setCompany] = useState<Company>(initial)
  const [form, setForm] = useState({
    giro: initial.giro ?? '',
    description: initial.description ?? '',
    websiteUrl: initial.websiteUrl ?? '',
    contactEmail: initial.contactEmail ?? '',
    contactPhone: initial.contactPhone ?? '',
    region: initial.region ?? '',
    ciudad: initial.ciudad ?? '',
    comuna: initial.comuna ?? '',
    address: initial.address ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const update = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    setServerError(null)
    try {
      const res = await fetch('/api/seller/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          setServerError(data.error || 'Error al guardar')
        }
        return
      }
      setCompany((c) => ({ ...c, ...data.company }))
      setSavedMsg('Cambios guardados')
      setTimeout(() => setSavedMsg(null), 3000)
      router.refresh()
    } catch {
      setServerError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* Banner */}
      <ImageUploader
        label="Banner de portada"
        helper="Se muestra como fondo en tu perfil público. Recomendado: 1600×400px, JPG o PNG, máx 3MB."
        currentUrl={company.bannerUrl}
        aspectClass="aspect-[16/4]"
        type="banner"
        onUpdate={(url) => setCompany((c) => ({ ...c, bannerUrl: url }))}
      />

      {/* Logo */}
      <ImageUploader
        label="Logo de la empresa"
        helper="Se muestra en tu perfil, tarjetas de productos y emails. Recomendado: cuadrado, mínimo 256×256px."
        currentUrl={company.logoUrl}
        aspectClass="aspect-square w-32"
        type="logo"
        onUpdate={(url) => setCompany((c) => ({ ...c, logoUrl: url }))}
      />

      {/* Datos no editables */}
      <Section title="Datos tributarios">
        <p className="text-xs text-slate-500 mb-3">
          Estos datos no se pueden cambiar desde aquí. Contacta al equipo de IMC
          si necesitas modificar tu razón social o RUT.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <DisabledField label="Razón social" value={company.razonSocial} />
          <DisabledField label="RUT" value={company.rut} />
        </div>
      </Section>

      <Section title="Información comercial">
        <div className="grid gap-4">
          <div>
            <label className="label-base">Giro / actividad principal</label>
            <GiroSelector
              value={form.giro}
              onChange={(v) => update('giro', v)}
              placeholder="Ej: Venta al por mayor de químicos industriales"
            />
          </div>
          <div>
            <label className="label-base">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input-base min-h-[120px]"
              placeholder="A qué se dedica tu empresa, productos principales, capacidad…"
            />
            <p className="helper-text">
              {form.description.length} / 2000 — aparece en tu perfil público
              completo.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Contacto público">
        <p className="text-xs text-slate-500 mb-3">
          Estos datos se muestran en tu perfil para que compradores te contacten
          directo.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label-base">Sitio web</label>
            <WebsiteInput
              value={form.websiteUrl}
              onChange={(v) => update('websiteUrl', v)}
              placeholder="miempresa.cl"
            />
          </div>
          <div>
            <label className="label-base">Email comercial</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
              className="input-base"
              placeholder="ventas@miempresa.cl"
            />
            {errors.contactEmail && (
              <p className="error-text">{errors.contactEmail}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label-base">Teléfono comercial</label>
            <PhoneInput
              value={
                form.contactPhone
                  ? `+56 ${extractClNumber(form.contactPhone)}`
                  : ''
              }
              onChange={(v) => update('contactPhone', v)}
              placeholder="2 2345 6789"
            />
            {errors.contactPhone && (
              <p className="error-text">{errors.contactPhone}</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Ubicación de bodega / oficina">
        <RegionComunaSelector
          region={form.region}
          comuna={form.comuna}
          onChangeRegion={(v) => update('region', v)}
          onChangeComuna={(v) => update('comuna', v)}
        />
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label-base">Ciudad</label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => update('ciudad', e.target.value)}
              className="input-base"
              placeholder="Ej: Santiago"
            />
          </div>
          <div>
            <label className="label-base">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className="input-base"
              placeholder="Calle, número"
            />
          </div>
        </div>
      </Section>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {savedMsg && (
        <div className="rounded-lg bg-verified-50 border border-verified-500/40 px-4 py-3 text-sm text-verified-600">
          ✓ {savedMsg}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
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

function DisabledField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <input type="text" value={value} disabled className="input-base" />
    </div>
  )
}

function ImageUploader({
  label,
  helper,
  currentUrl,
  aspectClass,
  type,
  onUpdate,
}: {
  label: string
  helper: string
  currentUrl: string | null
  aspectClass: string
  type: 'logo' | 'banner'
  onUpdate: (url: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onPick = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/seller/company/image?type=${type}`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Error al subir')
      else onUpdate(data.url)
    } catch {
      setErr('Error de red')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onRemove = async () => {
    if (!confirm(`¿Quitar ${type === 'logo' ? 'el logo' : 'el banner'}?`))
      return
    setUploading(true)
    const res = await fetch(`/api/seller/company/image?type=${type}`, {
      method: 'DELETE',
    })
    if (res.ok) onUpdate(null)
    setUploading(false)
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-navy-600 mb-1">{label}</h3>
      <p className="text-xs text-slate-500 mb-4">{helper}</p>

      <div
        className={`${aspectClass} bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Sin imagen
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="btn-secondary text-sm py-2"
        >
          {uploading
            ? 'Subiendo…'
            : currentUrl
              ? `Cambiar ${type === 'logo' ? 'logo' : 'banner'}`
              : `Subir ${type === 'logo' ? 'logo' : 'banner'}`}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2"
          >
            Quitar
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {err && <p className="error-text mt-2">{err}</p>}
    </section>
  )
}
