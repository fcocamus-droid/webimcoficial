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

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuarios</h1>

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
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No hay usuarios registrados</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{u.name || '—'}</td>
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3">{u.company || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
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
                    <button onClick={() => toggleRole(u)}
                      className="text-[#1B2A6B] hover:text-blue-800 text-xs font-medium">
                      Cambiar Rol
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
