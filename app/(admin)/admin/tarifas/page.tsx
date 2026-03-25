'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type ShippingRate = {
  id: string
  carrierId: string
  carrier: { name: string; code: string }
  originPort: string
  destPort: string
  shipmentType: string
  ratePerCBM: number | null
  ratePerTon: number | null
  minCBM: number | null
  rateContainer: number | null
  ratePerKg: number | null
  minKg: number | null
  currency: string
  validFrom: string
  validTo: string
  active: boolean
}

const TABS = ['Todos', 'LCL', 'FCL_20', 'FCL_40', 'FCL_40HC', 'AIR'] as const

export default function TarifasPage() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('Todos')

  const fetchRates = async (type?: string) => {
    setLoading(true)
    const params = type && type !== 'Todos' ? `?shipmentType=${type}` : ''
    const res = await fetch(`/api/admin/tariffs${params}`)
    if (res.ok) {
      const data = await res.json()
      setRates(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRates(activeTab)
  }, [activeTab])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarifa?')) return
    const res = await fetch(`/api/admin/tariffs/${id}`, { method: 'DELETE' })
    if (res.ok) fetchRates(activeTab)
  }

  const rateDisplay = (r: ShippingRate) => {
    if (r.shipmentType === 'LCL') return `$${r.ratePerCBM}/CBM`
    if (r.shipmentType === 'AIR') return `$${r.ratePerKg}/kg`
    return `$${r.rateContainer}/cont.`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tarifas de Flete</h1>
        <Link
          href="/admin/tarifas/nueva"
          className="inline-flex items-center gap-2 bg-[#F47920] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Tarifa
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-white text-[#1B2A6B] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'Todos' ? 'Todos' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Carrier</th>
                <th className="px-6 py-3 font-medium">Origen</th>
                <th className="px-6 py-3 font-medium">Destino</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Tarifa</th>
                <th className="px-6 py-3 font-medium">Vigencia</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">Cargando...</td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No hay tarifas registradas</td>
                </tr>
              ) : (
                rates.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{r.carrier?.name || r.carrierId}</td>
                    <td className="px-6 py-3">{r.originPort}</td>
                    <td className="px-6 py-3">{r.destPort}</td>
                    <td className="px-6 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {r.shipmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono">{rateDisplay(r)}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(r.validFrom).toLocaleDateString('es-CL')} — {new Date(r.validTo).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/tarifas/${r.id}/editar`}
                          className="text-[#1B2A6B] hover:text-blue-800 text-xs font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
