'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Calendar } from 'lucide-react'

interface RecentQuote {
  id: string
  number: string
  shipmentType: string
  originPort: string
  destPort: string
  totalCostUSD: number
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
    company: string | null
  } | null
}

interface Stats {
  clientCount: number
  totalQuotes: number
  quotesThisMonth: number
  recentQuotes: RecentQuote[]
}

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  SENT: { text: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { text: 'Aceptada', cls: 'bg-green-100 text-green-700' },
  REJECTED: { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { text: 'Expirada', cls: 'bg-yellow-100 text-yellow-700' },
}

export default function EjecutivoDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/executive/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar estadísticas')
        return res.json()
      })
      .then((data) => setStats(data))
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

  const kpiCards = [
    {
      label: 'Clientes Asignados',
      value: stats?.clientCount ?? 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Cotizaciones',
      value: stats?.totalQuotes ?? 0,
      icon: FileText,
      color: 'bg-[#F47920]',
    },
    {
      label: 'Cotizaciones Este Mes',
      value: stats?.quotesThisMonth ?? 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-[#1B2A6B]">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          <p className="text-sm text-gray-500 mt-0.5">Últimas 5 cotizaciones de clientes asignados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">N&ordm;</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Ruta</th>
                <th className="px-6 py-3 font-medium">Total USD</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!stats?.recentQuotes?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No hay actividad reciente
                  </td>
                </tr>
              ) : (
                stats.recentQuotes.map((q) => {
                  const st = STATUS_LABELS[q.status] || { text: q.status, cls: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs">{q.number}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{q.user?.name || 'Sin usuario'}</div>
                        <div className="text-xs text-gray-400">{q.user?.company || q.user?.email}</div>
                      </td>
                      <td className="px-6 py-3">{q.shipmentType}</td>
                      <td className="px-6 py-3 text-xs">{q.originPort} &rarr; {q.destPort}</td>
                      <td className="px-6 py-3 font-medium">
                        ${q.totalCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
