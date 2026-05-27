'use client'

import { useState } from 'react'

type Agent = {
  id: string
  name: string | null
  email: string
  phone: string | null
  active: boolean
  createdAt: string
}

export default function AgentesClient({
  initialAgents,
}: {
  initialAgents: Agent[]
}) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [createdInfo, setCreatedInfo] = useState<{
    agent: Agent
    tempPassword: string
  } | null>(null)

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', password: '' })
    setErrors({})
  }

  const update = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await fetch('/api/superadmin/agentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.field && data.error) {
          setErrors({ [data.field]: data.error })
        } else if (data.issues) {
          const fe: Record<string, string> = {}
          Object.entries(data.issues).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          })
          setErrors(fe)
        } else {
          setErrors({ form: data.error || 'Error al crear' })
        }
        setLoading(false)
        return
      }
      setAgents((arr) => [data.agent, ...arr])
      setCreatedInfo({ agent: data.agent, tempPassword: data.tempPassword })
      setShowForm(false)
      resetForm()
    } catch {
      setErrors({ form: 'Error de red' })
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (a: Agent) => {
    const next = !a.active
    setAgents((arr) =>
      arr.map((x) => (x.id === a.id ? { ...x, active: next } : x))
    )
    const res = await fetch(`/api/superadmin/agentes/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    })
    if (!res.ok) {
      // revert
      setAgents((arr) =>
        arr.map((x) => (x.id === a.id ? { ...x, active: a.active } : x))
      )
    }
  }

  const remove = async (a: Agent) => {
    if (
      !confirm(
        `¿Eliminar definitivamente al agente ${a.name || a.email}? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    const res = await fetch(`/api/superadmin/agentes/${a.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setAgents((arr) => arr.filter((x) => x.id !== a.id))
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-600">
            Mis agentes de ventas
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {agents.length} agente{agents.length !== 1 ? 's' : ''} en tu equipo
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setCreatedInfo(null)
          }}
          className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          + Nuevo agente
        </button>
      </div>

      {/* Info de credenciales recién creadas */}
      {createdInfo && (
        <div className="mb-6 rounded-2xl border-2 border-verified-500 bg-verified-50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-verified-500 text-white flex items-center justify-center text-lg">
              ✓
            </div>
            <div className="flex-1">
              <p className="font-semibold text-verified-600">
                Agente creado: {createdInfo.agent.name}
              </p>
              <p className="text-sm text-slate-700 mt-1">
                Pásale estas credenciales al agente. Esta contraseña no se
                volverá a mostrar.
              </p>
              <div className="mt-3 bg-white rounded-lg border border-slate-200 p-3 grid gap-1 text-sm">
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <code className="font-mono font-semibold">
                    {createdInfo.agent.email}
                  </code>
                </div>
                <div>
                  <span className="text-slate-500">Contraseña:</span>{' '}
                  <code className="font-mono font-semibold text-amber-700">
                    {createdInfo.tempPassword}
                  </code>
                </div>
              </div>
              <button
                onClick={() => setCreatedInfo(null)}
                className="mt-3 text-sm text-slate-600 hover:text-slate-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={onCreate}
          className="mb-6 bg-white rounded-2xl border-t-4 border-t-navy-600 border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-navy-600 mb-4">
            Crear nuevo agente
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Nombre completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input-base"
                placeholder="Juan Pérez"
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
                placeholder="juan@imccargo.cl"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div>
              <label className="label-base">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="input-base"
                placeholder="+56 9 ..."
              />
            </div>
            <div>
              <label className="label-base">
                Contraseña{' '}
                <span className="text-slate-400 text-xs font-normal">
                  (opcional — si la dejas vacía, generamos una)
                </span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-base font-mono"
                placeholder="(automática)"
              />
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>
          </div>

          {errors.form && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              {loading ? 'Creando…' : 'Crear agente'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de agentes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {agents.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Aún no tienes agentes
            </h3>
            <p className="text-sm text-slate-600">
              Crea tu primer agente de ventas para que te ayude a onboardar
              proveedores y dar soporte a compradores.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Agente</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Creado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.id} className={a.active ? '' : 'opacity-50'}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-bold">
                        {(a.name || a.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {a.name || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Agente de ventas
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-900">{a.email}</p>
                    {a.phone && (
                      <p className="text-xs text-slate-500">{a.phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-verified-600 bg-verified-50 px-2 py-1 rounded">
                        ● Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        ○ Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {new Date(a.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleActive(a)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400"
                      >
                        {a.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => remove(a)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
