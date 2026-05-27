'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PasswordInput from '@/app/components/PasswordInput'

type Tab = 'perfil' | 'password' | 'seguridad'

type Account = {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  roleLabel: string
}

export default function CuentaClient({ initial }: { initial: Account }) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [tab, setTab] = useState<Tab>('perfil')
  const [account, setAccount] = useState<Account>(initial)

  const handleUpdate = async (patch: Partial<Account>) => {
    const next = { ...account, ...patch }
    setAccount(next)
    // Refresca el JWT/sesión para que el header se actualice al instante
    if ('avatarUrl' in patch || 'name' in patch) {
      await updateSession({
        avatarUrl: next.avatarUrl,
        name: next.name,
      })
    }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-slate-200 px-2 flex gap-1 overflow-x-auto">
        {[
          { id: 'perfil', label: 'Perfil' },
          { id: 'password', label: 'Contraseña' },
          { id: 'seguridad', label: 'Sesión y seguridad' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {tab === 'perfil' && (
          <PerfilTab account={account} onUpdate={handleUpdate} />
        )}
        {tab === 'password' && <PasswordTab />}
        {tab === 'seguridad' && <SeguridadTab account={account} />}
      </div>
    </div>
  )
}

// ============ Tab Perfil ============
function PerfilTab({
  account,
  onUpdate,
}: {
  account: Account
  onUpdate: (a: Partial<Account>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [name, setName] = useState(account.name ?? '')
  const [phone, setPhone] = useState(account.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [savedError, setSavedError] = useState<string | null>(null)

  const onPick = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Error al subir')
      } else {
        onUpdate({ avatarUrl: data.avatarUrl })
      }
    } catch {
      setUploadError('Error de red')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onRemoveAvatar = async () => {
    if (!confirm('¿Quitar tu foto de perfil?')) return
    setUploading(true)
    const res = await fetch('/api/account/avatar', { method: 'DELETE' })
    if (res.ok) onUpdate({ avatarUrl: null })
    setUploading(false)
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    setSavedError(null)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSavedError(data.error || 'Error al guardar')
      } else {
        setSavedMsg('Cambios guardados')
        onUpdate(data.user)
        setTimeout(() => setSavedMsg(null), 3000)
      }
    } catch {
      setSavedError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Avatar */}
      <div className="flex items-start gap-6 pb-8 border-b border-slate-200">
        <div className="relative">
          {account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.avatarUrl}
              alt={account.name || account.email}
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-navy-600 text-white flex items-center justify-center text-3xl font-bold">
              {(account.name || account.email).slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">
            Foto de perfil
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            JPG, PNG o WEBP. Máximo 2MB. Se mostrará en el header y en tu
            perfil público.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPick}
              disabled={uploading}
              className="btn-primary text-sm py-2"
            >
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </button>
            {account.avatarUrl && (
              <button
                onClick={onRemoveAvatar}
                disabled={uploading}
                className="btn-secondary text-sm py-2"
              >
                Quitar foto
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
          {uploadError && (
            <p className="error-text mt-2">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Form perfil */}
      <form onSubmit={onSave} className="pt-8 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label-base">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="label-base">Email</label>
            <input
              type="email"
              value={account.email}
              disabled
              className="input-base"
            />
            <p className="helper-text">
              El email no se puede cambiar desde aquí.
            </p>
          </div>
          <div>
            <label className="label-base">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-base"
              placeholder="+56 9 ..."
            />
          </div>
          <div>
            <label className="label-base">Rol</label>
            <input
              type="text"
              value={account.roleLabel}
              disabled
              className="input-base"
            />
          </div>
        </div>

        {savedError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {savedError}
          </div>
        )}
        {savedMsg && (
          <div className="rounded-lg bg-verified-50 border border-verified-500/40 px-4 py-2.5 text-sm text-verified-600">
            ✓ {savedMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ============ Tab Contraseña ============
function PasswordTab() {
  const [form, setForm] = useState({ current: '', next: '', next2: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setOkMsg(null)

    const errs: Record<string, string> = {}
    if (!form.current) errs.current = 'Ingresa tu contraseña actual'
    if (!form.next || form.next.length < 8)
      errs.next = 'Mínimo 8 caracteres'
    if (form.next !== form.next2)
      errs.next2 = 'Las contraseñas no coinciden'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: form.current, next: form.next }),
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
        } else {
          setServerError(data.error || 'Error inesperado')
        }
        return
      }
      setOkMsg('Contraseña actualizada')
      setForm({ current: '', next: '', next2: '' })
      setTimeout(() => setOkMsg(null), 4000)
    } catch {
      setServerError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5">
      <div>
        <h3 className="font-semibold text-slate-900">Cambiar contraseña</h3>
        <p className="text-sm text-slate-600 mt-1">
          Tu nueva contraseña debe tener al menos 8 caracteres y ser distinta a
          la actual.
        </p>
      </div>

      <div>
        <label className="label-base">Contraseña actual</label>
        <PasswordInput
          value={form.current}
          onChange={(e) => update('current', e.target.value)}
          autoComplete="current-password"
        />
        {errors.current && <p className="error-text">{errors.current}</p>}
      </div>

      <div>
        <label className="label-base">Nueva contraseña</label>
        <PasswordInput
          value={form.next}
          onChange={(e) => update('next', e.target.value)}
          autoComplete="new-password"
        />
        {errors.next && <p className="error-text">{errors.next}</p>}
      </div>

      <div>
        <label className="label-base">Repite la nueva contraseña</label>
        <PasswordInput
          value={form.next2}
          onChange={(e) => update('next2', e.target.value)}
          autoComplete="new-password"
        />
        {errors.next2 && <p className="error-text">{errors.next2}</p>}
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

      <button
        type="submit"
        disabled={loading}
        className="btn-primary disabled:opacity-60"
      >
        {loading ? 'Actualizando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

// ============ Tab Seguridad ============
function SeguridadTab({ account }: { account: Account }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Sesión activa</h3>
        <p className="text-sm text-slate-600">
          Estás conectado como{' '}
          <span className="font-mono font-semibold text-slate-900">
            {account.email}
          </span>{' '}
          ({account.roleLabel}).
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
          ID de cuenta
        </p>
        <p className="text-sm font-mono text-slate-700 break-all">
          {account.id}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Próximamente</h3>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>· Autenticación en dos pasos (2FA)</li>
          <li>· Historial de inicios de sesión</li>
          <li>· Cerrar sesión en todos los dispositivos</li>
          <li>· Eliminar mi cuenta</li>
        </ul>
      </div>
    </div>
  )
}
