'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { formatRut, cleanRut, isValidRut } from '@/lib/rut'
import { isValidClPhone, normalizeClPhone } from '@/lib/phone-cl'
import PasswordInput from '@/app/components/PasswordInput'
import PhoneInput from '@/app/components/PhoneInput'
import RegionComunaSelector from '@/app/components/RegionComunaSelector'
import GiroSelector from '@/app/components/GiroSelector'
import WebsiteInput from '@/app/components/WebsiteInput'

type Tipo = 'fabricante' | 'comprador'

type FormState = {
  email: string
  password: string
  password2: string
  name: string
  phone: string
  razonSocial: string
  rut: string
  giro: string
  contactPhone: string
  region: string
  ciudad: string
  comuna: string
  address: string
  websiteUrl: string
  description: string
  cargo: string
  sector: string
  acceptTerms: boolean
}

const initialState: FormState = {
  email: '',
  password: '',
  password2: '',
  name: '',
  phone: '',
  razonSocial: '',
  rut: '',
  giro: '',
  contactPhone: '',
  region: '',
  ciudad: '',
  comuna: '',
  address: '',
  websiteUrl: '',
  description: '',
  cargo: '',
  sector: '',
  acceptTerms: false,
}

const SECTORES_COMPRADOR = [
  'Manufactura',
  'Alimentos y bebidas',
  'Cosmética',
  'Limpieza industrial',
  'Farmacéutica / suplementos',
  'Packaging',
  'Construcción',
  'Minería',
  'Energía',
  'Agroindustria',
  'Retail',
  'Logística',
  'Servicios',
  'Otro',
]

export default function RegistroForm({ initialTipo }: { initialTipo: Tipo }) {
  const router = useRouter()
  const [tipo, setTipo] = useState<Tipo>(initialTipo)
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (k: keyof FormState, v: any) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const handleRutChange = (raw: string) => {
    const clean = cleanRut(raw)
    update('rut', formatRut(clean))
  }

  const validateLocal = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name || form.name.length < 2) errs.name = 'Ingresa tu nombre'
    if (!form.email) errs.email = 'Email requerido'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email inválido'
    if (!form.password || form.password.length < 8)
      errs.password = 'Mínimo 8 caracteres'
    if (form.password !== form.password2)
      errs.password2 = 'Las contraseñas no coinciden'
    if (!form.phone || !isValidClPhone(form.phone))
      errs.phone = 'Teléfono requerido (9 dígitos)'
    if (!form.razonSocial) errs.razonSocial = 'Razón social requerida'
    if (!form.rut || !isValidRut(form.rut)) errs.rut = 'RUT inválido'
    if (!form.region) errs.region = 'Selecciona región'
    if (!form.comuna) errs.comuna = 'Selecciona comuna'
    if (form.contactPhone && !isValidClPhone(form.contactPhone))
      errs.contactPhone = 'Teléfono comercial inválido'
    if (!form.acceptTerms) errs.acceptTerms = 'Debes aceptar los términos'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validateLocal()) return
    setLoading(true)

    try {
      const payload: Record<string, any> = {
        tipo,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        phone: normalizeClPhone(form.phone),
        razonSocial: form.razonSocial.trim(),
        rut: cleanRut(form.rut),
        giro: form.giro.trim() || undefined,
        contactPhone: form.contactPhone
          ? normalizeClPhone(form.contactPhone)
          : undefined,
        region: form.region,
        ciudad: form.ciudad.trim() || undefined,
        comuna: form.comuna,
        address: form.address.trim() || undefined,
        acceptTerms: form.acceptTerms,
      }

      if (tipo === 'fabricante') {
        payload.websiteUrl = form.websiteUrl.trim() || undefined
        payload.description = form.description.trim() || undefined
      } else {
        payload.cargo = form.cargo.trim() || undefined
        payload.sector = form.sector.trim() || undefined
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          setServerError(data.error || 'Error inesperado')
        }
        setLoading(false)
        return
      }

      // Auto sign-in
      const result = await signIn('credentials', {
        email: payload.email,
        password: payload.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError('Cuenta creada, pero no pudimos iniciar sesión. Intenta desde /login.')
        setLoading(false)
        return
      }

      router.push(tipo === 'fabricante' ? '/panel/vendedor' : '/panel/comprador')
      router.refresh()
    } catch (err) {
      setServerError('Error de red. Intenta nuevamente.')
      setLoading(false)
    }
  }

  const isSeller = tipo === 'fabricante'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-navy-600 mb-2">
          Crea tu cuenta
        </h1>
        <p className="text-slate-600">
          Únete al marketplace B2B industrial de Chile. Es gratis para comenzar.
        </p>
      </div>

      {/* Role tabs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setTipo('fabricante')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            tipo === 'fabricante'
              ? 'border-navy-600 bg-navy-600/5 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-navy-600 text-white rounded-xl flex items-center justify-center text-2xl">
              🏭
            </div>
            <div>
              <p className="text-xs text-navy-600 font-bold uppercase tracking-wider">
                Quiero vender
              </p>
              <p className="font-bold text-slate-900">Soy Fabricante o Importador</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTipo('comprador')}
          className={`p-5 rounded-2xl border-2 text-left transition-all ${
            tipo === 'comprador'
              ? 'border-amber-500 bg-amber-500/5 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500 text-white rounded-xl flex items-center justify-center text-2xl">
              🛒
            </div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">
                Quiero comprar
              </p>
              <p className="font-bold text-slate-900">Soy Comprador empresarial</p>
            </div>
          </div>
        </button>
      </div>

      {/* Form card */}
      <form
        onSubmit={onSubmit}
        className={`bg-white rounded-2xl border-t-4 ${
          isSeller ? 'border-t-navy-600' : 'border-t-amber-500'
        } border border-slate-200 shadow-sm p-6 md:p-8 space-y-8`}
      >
        {/* Section: Acceso */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Datos de acceso
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Tu email será tu usuario para iniciar sesión.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Nombre completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input-base"
                placeholder="Tu nombre"
                autoComplete="name"
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div>
              <label className="label-base">Email corporativo *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input-base"
                placeholder="nombre@empresa.cl"
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div>
              <label className="label-base">Contraseña *</label>
              <PasswordInput
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="label-base">Repite contraseña *</label>
              <PasswordInput
                value={form.password2}
                onChange={(e) => update('password2', e.target.value)}
                autoComplete="new-password"
              />
              {errors.password2 && (
                <p className="error-text">{errors.password2}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label-base">Teléfono móvil *</label>
              <PhoneInput
                value={form.phone}
                onChange={(v) => update('phone', v)}
                placeholder="9 1234 5678"
                required
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
              <p className="helper-text">
                Te contactaremos por aquí solo para temas urgentes de tu cuenta.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Empresa */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Datos de la empresa
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Información tributaria y comercial. Los datos marcados con * son
            obligatorios.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Razón social *</label>
              <input
                type="text"
                value={form.razonSocial}
                onChange={(e) => update('razonSocial', e.target.value)}
                className="input-base"
                placeholder="Mi Empresa SpA"
                autoComplete="organization"
              />
              {errors.razonSocial && (
                <p className="error-text">{errors.razonSocial}</p>
              )}
            </div>
            <div>
              <label className="label-base">RUT empresa *</label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => handleRutChange(e.target.value)}
                className="input-base"
                placeholder="76.123.456-7"
                maxLength={14}
                autoComplete="off"
              />
              {errors.rut && <p className="error-text">{errors.rut}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label-base">
                {isSeller ? 'Giro / actividad principal' : 'Rubro o sector'}
              </label>
              <GiroSelector
                value={form.giro}
                onChange={(v) => update('giro', v)}
                placeholder={
                  isSeller
                    ? 'Ej: Venta al por mayor de químicos industriales'
                    : 'Ej: Planta de alimentos'
                }
              />
            </div>

            {/* Seller-only */}
            {isSeller && (
              <>
                <div>
                  <label className="label-base">Sitio web</label>
                  <WebsiteInput
                    value={form.websiteUrl}
                    onChange={(v) => update('websiteUrl', v)}
                    placeholder="miempresa.cl"
                  />
                </div>
                <div>
                  <label className="label-base">Teléfono comercial</label>
                  <PhoneInput
                    value={form.contactPhone}
                    onChange={(v) => update('contactPhone', v)}
                    placeholder="2 2345 6789"
                  />
                  {errors.contactPhone && (
                    <p className="error-text">{errors.contactPhone}</p>
                  )}
                  <p className="helper-text">
                    Aparecerá públicamente en tu perfil para que compradores
                    te contacten.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="label-base">Descripción breve</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    className="input-base min-h-[88px]"
                    placeholder="A qué se dedica tu empresa, productos principales, capacidad…"
                  />
                  <p className="helper-text">
                    Esto aparecerá en tu perfil público de proveedor.
                  </p>
                </div>
              </>
            )}

            {/* Buyer-only */}
            {!isSeller && (
              <>
                <div>
                  <label className="label-base">Tu cargo</label>
                  <input
                    type="text"
                    value={form.cargo}
                    onChange={(e) => update('cargo', e.target.value)}
                    className="input-base"
                    placeholder="Ej: Jefe de compras"
                    autoComplete="organization-title"
                  />
                </div>
                <div>
                  <label className="label-base">Sector de tu empresa</label>
                  <select
                    value={form.sector}
                    onChange={(e) => update('sector', e.target.value)}
                    className="input-base"
                  >
                    <option value="">Selecciona…</option>
                    {SECTORES_COMPRADOR.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section: Ubicación */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {isSeller ? 'Ubicación de bodega / oficina' : 'Ubicación de la empresa'}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Importante para zonas de despacho y filtros del marketplace.
          </p>

          <RegionComunaSelector
            region={form.region}
            comuna={form.comuna}
            onChangeRegion={(v) => update('region', v)}
            onChangeComuna={(v) => update('comuna', v)}
            required
          />
          {(errors.region || errors.comuna) && (
            <p className="error-text mt-1">
              {errors.region || errors.comuna}
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label-base">Ciudad</label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) => update('ciudad', e.target.value)}
                className="input-base"
                placeholder="Ej: Santiago"
                autoComplete="address-level2"
              />
            </div>
            <div>
              <label className="label-base">Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className="input-base"
                placeholder="Calle, número, oficina"
                autoComplete="street-address"
              />
            </div>
          </div>
        </section>

        {/* Terms */}
        <div className="pt-2 border-t border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => update('acceptTerms', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600">
              Acepto los{' '}
              <Link href="/terminos" className="text-amber-600 hover:underline">
                términos de uso
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" className="text-amber-600 hover:underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="error-text">{errors.acceptTerms}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-amber-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold text-white px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              isSeller
                ? 'bg-navy-600 hover:bg-navy-700'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {loading
              ? 'Creando cuenta…'
              : isSeller
                ? 'Crear cuenta de Fabricante →'
                : 'Crear cuenta de Comprador →'}
          </button>
        </div>
      </form>
    </div>
  )
}
