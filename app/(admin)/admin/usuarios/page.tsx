'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  name: string | null
  email: string
  company: string | null
  role: string
  emailVerified: string | null
  createdAt: string
}

type Assignment = {
  id: string
  clientId: string
  client: {
    id: string
    name: string | null
    email: string
    company: string | null
  }
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  EXECUTIVE: 'Ejecutivo',
  SUPERADMIN: 'Admin',
}

const ROLE_BADGE: Record<string, string> = {
  CLIENT: 'bg-blue-100 text-blue-700',
  EXECUTIVE: 'bg-orange-100 text-[#F47920]',
  SUPERADMIN: 'bg-purple-100 text-purple-700',
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Create executive modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Assign clients modal
  const [assignExecutive, setAssignExecutive] = useState<User | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  // Track pending checked state: clientId -> true/false
  const [checkedClients, setCheckedClients] = useState<Record<string, boolean>>({})

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users.filter(u => {
    const matchSearch =
      search === '' ||
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'SUPERADMIN' ? 'CLIENT' : 'SUPERADMIN'
    if (!confirm(`¿Cambiar rol de ${user.email} a ${newRole}?`)) return
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    fetchUsers()
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createForm, role: 'EXECUTIVE' }),
    })
    if (res.ok) {
      setShowCreate(false)
      setCreateForm({ name: '', email: '', phone: '', password: '' })
      fetchUsers()
    } else {
      const data = await res.json()
      setCreateError(data.error || 'Error al crear ejecutivo')
    }
    setCreateLoading(false)
  }

  const openAssignModal = async (executive: User) => {
    setAssignExecutive(executive)
    setAssignLoading(true)
    const res = await fetch(`/api/admin/assignments?executiveId=${executive.id}`)
    if (res.ok) {
      const data: Assignment[] = await res.json()
      setAssignments(data)
      const checked: Record<string, boolean> = {}
      data.forEach(a => { checked[a.clientId] = true })
      setCheckedClients(checked)
    }
    setAssignLoading(false)
  }

  const handleAssignSave = async () => {
    if (!assignExecutive) return
    setSavingAssign(true)

    const clients = users.filter(u => u.role === 'CLIENT')

    // Previously assigned client IDs
    const prevAssigned = new Set(assignments.map(a => a.clientId))

    const toAdd = clients.filter(c => checkedClients[c.id] && !prevAssigned.has(c.id))
    const toRemove = clients.filter(c => !checkedClients[c.id] && prevAssigned.has(c.id))

    await Promise.all([
      ...toAdd.map(c =>
        fetch('/api/admin/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ executiveId: assignExecutive.id, clientId: c.id }),
        })
      ),
      ...toRemove.map(c =>
        fetch('/api/admin/assignments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ executiveId: assignExecutive.id, clientId: c.id }),
        })
      ),
    ])

    setSavingAssign(false)
    setAssignExecutive(null)
  }

  const roleFilterButtons = [
    { value: 'ALL', label: 'Todos' },
    { value: 'CLIENT', label: 'Clientes' },
    { value: 'EXECUTIVE', label: 'Ejecutivos' },
    { value: 'SUPERADMIN', label: 'Admins' },
  ]

  const clientUsers = users.filter(u => u.role === 'CLIENT')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-[#F47920] hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Ejecutivo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
        />
        <div className="flex gap-1">
          {roleFilterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setRoleFilter(btn.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === btn.value
                  ? 'bg-[#1B2A6B] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Empresa</th>
                <th className="px-6 py-3 font-medium">Rol</th>
                <th className="px-6 py-3 font-medium">Email Verificado</th>
                <th className="px-6 py-3 font-medium">Creado</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Cargando...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No hay usuarios que coincidan</td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{u.name || '—'}</td>
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3">{u.company || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {u.emailVerified ? (
                      <span className="text-green-600 text-xs font-medium">Verificado</span>
                    ) : (
                      <span className="text-red-500 text-xs font-medium">No verificado</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRole(u)}
                        className="text-[#1B2A6B] hover:text-blue-800 text-xs font-medium"
                      >
                        Cambiar Rol
                      </button>
                      {u.role === 'EXECUTIVE' && (
                        <button
                          onClick={() => openAssignModal(u)}
                          className="text-[#F47920] hover:text-orange-700 text-xs font-medium"
                        >
                          Asignar Clientes
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Create Executive Modal ===== */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Crear Ejecutivo</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
                  placeholder="juan@imccargo.cl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-[#F47920] hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {createLoading ? 'Creando...' : 'Crear Ejecutivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Assign Clients Modal ===== */}
      {assignExecutive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignExecutive(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Asignar Clientes</h2>
                <p className="text-sm text-gray-500 mt-0.5">Ejecutivo: {assignExecutive.name || assignExecutive.email}</p>
              </div>
              <button onClick={() => setAssignExecutive(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {assignLoading ? (
                <p className="text-center text-gray-400 py-8">Cargando clientes...</p>
              ) : clientUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay clientes registrados</p>
              ) : (
                <div className="space-y-1">
                  {clientUsers.map(client => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedClients[client.id]}
                        onChange={e =>
                          setCheckedClients(prev => ({ ...prev, [client.id]: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#F47920]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{client.name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      </div>
                      {client.company && (
                        <span className="text-xs text-gray-400 flex-shrink-0">{client.company}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
              <button
                onClick={() => setAssignExecutive(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignSave}
                disabled={savingAssign}
                className="flex-1 px-4 py-2 bg-[#1B2A6B] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {savingAssign ? 'Guardando...' : 'Guardar Asignaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
