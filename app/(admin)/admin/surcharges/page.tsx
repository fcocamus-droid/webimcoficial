'use client'

import { useEffect, useState } from 'react'

type Surcharge = {
  id: string
  code: string
  name: string
  description: string | null
  amount: number
  currency: string
  shipmentType: string | null
  portCode: string | null
  active: boolean
}

const EMPTY: Surcharge = {
  id: '', code: '', name: '', description: '', amount: 0,
  currency: 'USD', shipmentType: null, portCode: null, active: true,
}

export default function SurchargesPage() {
  const [items, setItems] = useState<Surcharge[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Surcharge | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/surcharges')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const method = isNew ? 'POST' : 'PUT'
    const url = isNew ? '/api/admin/surcharges' : `/api/admin/surcharges/${editing.id}`
    const body = {
      code: editing.code,
      name: editing.name,
      description: editing.description,
      amount: editing.amount,
      currency: editing.currency,
      shipmentType: editing.shipmentType || null,
      portCode: editing.portCode || null,
      active: editing.active,
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEditing(null)
      setIsNew(false)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este surcharge?')) return
    await fetch(`/api/admin/surcharges/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const openNew = () => {
    setEditing({ ...EMPTY })
    setIsNew(true)
  }

  const openEdit = (s: Surcharge) => {
    setEditing({ ...s })
    setIsNew(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Surcharges (Recargos)</h1>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-[#F47920] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Surcharge
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{isNew ? 'Nuevo Surcharge' : 'Editar Surcharge'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
                <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="BAF" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Bunker Adjustment Factor" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input type="number" step="0.01" value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select value={editing.currency} onChange={e => setEditing({ ...editing, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="USD">USD</option>
                  <option value="CLP">CLP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Embarque</label>
                <select value={editing.shipmentType || ''} onChange={e => setEditing({ ...editing, shipmentType: e.target.value || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Todos</option>
                  <option value="LCL">LCL</option>
                  <option value="FCL_20">FCL 20</option>
                  <option value="FCL_40">FCL 40</option>
                  <option value="FCL_40HC">FCL 40HC</option>
                  <option value="AIR">AIR</option>
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
                <th className="px-6 py-3 font-medium">Monto</th>
                <th className="px-6 py-3 font-medium">Moneda</th>
                <th className="px-6 py-3 font-medium">Tipo Embarque</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No hay surcharges registrados</td></tr>
              ) : items.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs font-bold">{s.code}</td>
                  <td className="px-6 py-3">{s.name}</td>
                  <td className="px-6 py-3 font-mono">${s.amount.toFixed(2)}</td>
                  <td className="px-6 py-3">{s.currency}</td>
                  <td className="px-6 py-3">{s.shipmentType || 'Todos'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#1B2A6B] hover:text-blue-800 text-xs font-medium">Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
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
