'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface ClientRow {
  id: string
  name: string | null
  email: string
  company: string | null
  companyRazonSocial: string | null
  quoteCount: number
  lastQuoteDate: string | null
}

export default function EjecutivoClientesPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/executive/clients')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar clientes')
        return res.json()
      })
      .then((data) => setClients(data.clients || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#1B2A6B] border-t-[#F47920] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} asignado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#1B2A6B]/10 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-[#1B2A6B]" strokeWidth={1.5} />
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin clientes asignados</h3>
          <p className="text-sm text-gray-500">Aún no tienes clientes asignados a tu cartera</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2A6B] text-white">
                  <th className="text-left px-6 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Empresa</th>
                  <th className="text-center px-6 py-3 font-semibold">Cotizaciones</th>
                  <th className="text-left px-6 py-3 font-semibold">Última Cotización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => {
                  const companyName = client.companyRazonSocial || client.company || '—'
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {client.name || '(Sin nombre)'}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{client.email}</td>
                      <td className="px-6 py-3 text-gray-600">{companyName}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-[#1B2A6B]/10 text-[#1B2A6B] rounded-full text-xs font-bold">
                          {client.quoteCount}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {client.lastQuoteDate
                          ? new Date(client.lastQuoteDate).toLocaleDateString('es-CL')
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
