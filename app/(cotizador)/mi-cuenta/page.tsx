'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanyDocument {
  id: string
  type: string
  fileName: string
  fileUrl: string
  fileSize: number
  createdAt: string
}

interface Company {
  id: string
  razonSocial: string
  rut: string
  giro: string
  direccion: string
  comuna: string
  ciudad: string
  region: string
  telefono: string | null
  emailFacturacion: string | null
  documents: CompanyDocument[]
}

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  companyId: string | null
  companyRef: Company | null
}

const DOC_TYPES = [
  { key: 'RUT_EMPRESA', label: 'RUT Empresa' },
  { key: 'CERTIFICADO_SII', label: 'Certificado SII' },
  { key: 'PODER_NOTARIAL', label: 'Poder Notarial' },
] as const

// ─── Small helpers ────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
}: {
  msg: string
  type: 'success' | 'error'
}) {
  if (!msg) return null
  return (
    <div
      className={`px-4 py-3 rounded-lg text-sm mb-4 border ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      {msg}
    </div>
  )
}

function FieldInput({
  label,
  id,
  value,
  onChange,
  type = 'text',
  disabled = false,
  placeholder = '',
}: {
  label: string
  id: string
  value: string
  onChange?: (v: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none transition ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'
        }`}
      />
    </div>
  )
}

// ─── Tab 1 — Mi Perfil ────────────────────────────────────────────────────────

function MiPerfil({ profile }: { profile: UserProfile }) {
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const showFor = (
    setter: (v: { text: string; type: 'success' | 'error' } | null) => void,
    text: string,
    type: 'success' | 'error'
  ) => {
    setter({ text, type })
    setTimeout(() => setter(null), 4000)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      if (res.ok) {
        showFor(setProfileMsg, 'Perfil actualizado correctamente.', 'success')
      } else {
        const data = await res.json()
        showFor(setProfileMsg, data.error || 'Error al guardar el perfil.', 'error')
      }
    } catch {
      showFor(setProfileMsg, 'Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      showFor(setPwMsg, 'Las contrasenas nuevas no coinciden.', 'error')
      return
    }
    if (newPassword.length < 8) {
      showFor(setPwMsg, 'La nueva contrasena debe tener al menos 8 caracteres.', 'error')
      return
    }
    setSavingPw(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        showFor(setPwMsg, 'Contrasena cambiada correctamente.', 'success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      } else {
        const data = await res.json()
        showFor(setPwMsg, data.error || 'Error al cambiar la contrasena.', 'error')
      }
    } catch {
      showFor(setPwMsg, 'Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion Personal</h2>

        {profileMsg && <Toast msg={profileMsg.text} type={profileMsg.type} />}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Nombre"
              id="name"
              value={name}
              onChange={setName}
              placeholder="Tu nombre completo"
            />
            <FieldInput
              label="Telefono"
              id="phone"
              value={phone}
              onChange={setPhone}
              placeholder="+56 9 1234 5678"
            />
          </div>
          <FieldInput
            label="Correo electronico"
            id="email"
            value={profile.email}
            disabled
          />
          <div className="pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#1B2A6B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contrasena</h2>

        {pwMsg && <Toast msg={pwMsg.text} type={pwMsg.type} />}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <FieldInput
            label="Contrasena actual"
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Tu contrasena actual"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Nueva contrasena"
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Minimo 8 caracteres"
            />
            <FieldInput
              label="Confirmar nueva contrasena"
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Repite la nueva contrasena"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={savingPw || !currentPassword || !newPassword || !confirmNewPassword}
              className="bg-[#F47920] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#e06810] transition-colors disabled:opacity-50"
            >
              {savingPw ? 'Cambiando...' : 'Cambiar Contrasena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({
  companyId,
  docType,
  docLabel,
  existing,
  onRefresh,
}: {
  companyId: string
  docType: string
  docLabel: string
  existing: CompanyDocument | undefined
  onRefresh: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 4000)
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('type', docType)
      fd.append('file', file)
      const res = await fetch(`/api/companies/${companyId}/documents`, {
        method: 'POST',
        body: fd,
      })
      if (res.ok) {
        showMsg('Documento subido correctamente.', 'success')
        if (fileRef.current) fileRef.current.value = ''
        onRefresh()
      } else {
        const data = await res.json()
        showMsg(data.error || 'Error al subir el documento.', 'error')
      }
    } catch {
      showMsg('Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm(`Eliminar "${docLabel}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/documents/${existing.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showMsg('Documento eliminado.', 'success')
        onRefresh()
      } else {
        const data = await res.json()
        showMsg(data.error || 'Error al eliminar.', 'error')
      }
    } catch {
      showMsg('Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{docLabel}</p>
          {existing ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {existing.fileName}{' '}
              <span className="text-gray-400">
                ({(existing.fileSize / 1024).toFixed(0)} KB)
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">No subido</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {existing ? (
            <>
              <a
                href={existing.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#1B2A6B] hover:underline font-medium px-3 py-1.5 border border-[#1B2A6B] rounded-lg"
              >
                Descargar
              </a>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                id={`file-${docType}`}
                onChange={handleUpload}
                disabled={uploading}
              />
              <label
                htmlFor={`file-${docType}`}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  uploading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1B2A6B] text-white hover:bg-blue-900'
                }`}
              >
                {uploading ? 'Subiendo...' : 'Subir PDF'}
              </label>
            </>
          )}
        </div>
      </div>
      {msg && (
        <div className="mt-2">
          <Toast msg={msg.text} type={msg.type} />
        </div>
      )}
    </div>
  )
}

// ─── Tab 2 — Mi Empresa ───────────────────────────────────────────────────────

function MiEmpresa({
  profile,
  onProfileRefresh,
}: {
  profile: UserProfile
  onProfileRefresh: () => void
}) {
  const company = profile.companyRef

  // Create-company form state
  const [createForm, setCreateForm] = useState({
    razonSocial: '',
    rut: '',
    giro: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    telefono: '',
    emailFacturacion: '',
  })
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Edit-company form state (initialise from existing company)
  const [editForm, setEditForm] = useState({
    razonSocial: company?.razonSocial ?? '',
    rut: company?.rut ?? '',
    giro: company?.giro ?? '',
    direccion: company?.direccion ?? '',
    comuna: company?.comuna ?? '',
    ciudad: company?.ciudad ?? '',
    region: company?.region ?? '',
    telefono: company?.telefono ?? '',
    emailFacturacion: company?.emailFacturacion ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [editMsg, setEditMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showFor = (
    setter: (v: { text: string; type: 'success' | 'error' } | null) => void,
    text: string,
    type: 'success' | 'error'
  ) => {
    setter({ text, type })
    setTimeout(() => setter(null), 4000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          telefono: createForm.telefono || undefined,
          emailFacturacion: createForm.emailFacturacion || undefined,
        }),
      })
      if (res.ok) {
        showFor(setCreateMsg, 'Empresa creada correctamente.', 'success')
        onProfileRefresh()
      } else {
        const data = await res.json()
        showFor(setCreateMsg, data.error || 'Error al crear la empresa.', 'error')
      }
    } catch {
      showFor(setCreateMsg, 'Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          telefono: editForm.telefono || undefined,
          emailFacturacion: editForm.emailFacturacion || undefined,
        }),
      })
      if (res.ok) {
        showFor(setEditMsg, 'Cambios guardados correctamente.', 'success')
        onProfileRefresh()
      } else {
        const data = await res.json()
        showFor(setEditMsg, data.error || 'Error al guardar cambios.', 'error')
      }
    } catch {
      showFor(setEditMsg, 'Error de conexion. Intenta nuevamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const companyFields = [
    { key: 'razonSocial', label: 'Razon Social', placeholder: 'Mi Empresa SpA', required: true },
    { key: 'rut', label: 'RUT Empresa', placeholder: '76.543.210-K', required: true },
    { key: 'giro', label: 'Giro', placeholder: 'Importacion y Exportacion', required: true },
    { key: 'direccion', label: 'Direccion', placeholder: 'Av. Ejemplo 1234', required: true },
    { key: 'comuna', label: 'Comuna', placeholder: 'Providencia', required: true },
    { key: 'ciudad', label: 'Ciudad', placeholder: 'Santiago', required: true },
    { key: 'region', label: 'Region', placeholder: 'Region Metropolitana', required: true },
    { key: 'telefono', label: 'Telefono', placeholder: '+56 2 1234 5678', required: false },
    { key: 'emailFacturacion', label: 'Email Facturacion', placeholder: 'facturacion@empresa.cl', required: false },
  ] as const

  // ── No company — show create form ──────────────────────────────────────────
  if (!company) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Crear Empresa</h2>
        <p className="text-sm text-gray-500 mb-5">
          Aun no tienes una empresa asociada. Completa los datos para crear una.
        </p>

        {createMsg && <Toast msg={createMsg.text} type={createMsg.type} />}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companyFields.map(({ key, label, placeholder, required }) => (
              <div key={key} className={key === 'direccion' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`create-${key}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                  {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  id={`create-${key}`}
                  type={key === 'emailFacturacion' ? 'email' : 'text'}
                  required={required}
                  value={createForm[key]}
                  onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none transition"
                />
              </div>
            ))}
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={creating}
              className="bg-[#1B2A6B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Has company — show edit form + documents ───────────────────────────────
  return (
    <div className="space-y-6">
      {/* Edit form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Empresa</h2>

        {editMsg && <Toast msg={editMsg.text} type={editMsg.type} />}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companyFields.map(({ key, label, placeholder, required }) => (
              <div key={key} className={key === 'direccion' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`edit-${key}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                  {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  id={`edit-${key}`}
                  type={key === 'emailFacturacion' ? 'email' : 'text'}
                  required={required}
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none transition"
                />
              </div>
            ))}
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1B2A6B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Documentos Tributarios</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube los documentos requeridos en formato PDF (max 10 MB).
        </p>

        <div>
          {DOC_TYPES.map(({ key, label }) => {
            const existing = company.documents.find((d) => d.type === key)
            return (
              <DocumentRow
                key={key}
                companyId={company.id}
                docType={key}
                docLabel={label}
                existing={existing}
                onRefresh={onProfileRefresh}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MiCuentaPage() {
  const [activeTab, setActiveTab] = useState<'perfil' | 'empresa'>('perfil')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchProfile() {
    try {
      const res = await fetch('/api/users/profile')
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al cargar el perfil.')
        return
      }
      const data: UserProfile = await res.json()
      setProfile(data)
      setError(null)
    } catch {
      setError('Error de conexion. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          <p className="font-medium">No se pudo cargar la informacion</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              fetchProfile()
            }}
            className="mt-4 text-sm text-red-600 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra tu perfil y los datos de tu empresa.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'perfil'
              ? 'bg-[#1B2A6B] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Mi Perfil
        </button>
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'empresa'
              ? 'bg-[#1B2A6B] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Mi Empresa
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'perfil' ? (
        <MiPerfil profile={profile} />
      ) : (
        <MiEmpresa profile={profile} onProfileRefresh={fetchProfile} />
      )}
    </div>
  )
}
