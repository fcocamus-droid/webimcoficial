'use client'

import { useEffect, useState } from 'react'

type Port = {
  id: string
  code: string
  name: string
  country: string
  type: string
  active: boolean
}

const EMPTY: Port = { id: '', code: '', name: '', country: '', type: 'SEA', active: true }

export default function PuertosPage() {
  const [items, setItems] = useState<Port[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Port | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/ports')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const method = isNew ? 'POST' : 'PUT'
    const url = isNew ? '/api/admin/ports' : `/api/admin/ports/${editing.id}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: editing.code,
        name: editing.name,
        country: editing.country,
        type: editing.type,
        active: editing.active,
      }),
    })
    if (res.ok) {
      setEditing(null)
      setIsNew(false)
      fetchData()
    }
    setSaving(false)
  }

  const toggleActive = async (p: Port) => {
    await fetch(`/api/admin/ports/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, active: !p.active }),
    })
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Puertos</h1>
        <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true) }}
          className="inline-flex items-center gap-2 bg-[#F47920] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Puerto
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Nuevo Puerto' : 'Editar Puerto'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
                <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="CLVAP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Valparaiso" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pais</label>
                <input value={editing.country} onChange={e => setEditing({ ...editing, country: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Chile" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="SEA">Maritimo (SEA)</option>
                  <option value="AIR">Aereo (AIR)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.active}
                onChange={e => setEditing({ ...editing, active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#1B2A6B]" />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="bg-[#1B2A6B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false) }}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Codigo</th>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Pais</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No hay puertos registrados</td></tr>
              ) : items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs font-bold">{p.code}</td>
                  <td className="px-6 py-3">{p.name}</td>
                  <td className="px-6 py-3">{p.country}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.type === 'SEA' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {p.type === 'SEA' ? 'Maritimo' : 'Aereo'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => { setEditing({ ...p }); setIsNew(false) }}
                      className="text-[#1B2A6B] hover:text-blue-800 text-xs font-medium">Editar</button>
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
