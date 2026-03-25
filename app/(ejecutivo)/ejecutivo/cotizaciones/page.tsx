'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText } from 'lucide-react'

interface QuoteRow {
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Aceptada', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirada', color: 'bg-amber-100 text-amber-700' },
}

const TYPE_LABELS: Record<string, string> = {
  LCL: 'LCL',
  FCL_20: "FCL 20'",
  FCL_40: "FCL 40'",
  FCL_40HC: "FCL 40'HC",
  AIR: 'Aéreo',
}

export default function EjecutivoCotizacionesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/executive/quotes?page=${page}&limit=20`)
      if (!res.ok) throw new Error('Error al cargar cotizaciones')
      const data = await res.json()
      setQuotes(data.quotes || [])
      setPagination(data.pagination || null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

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
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Todas las cotizaciones de tus clientes asignados
          </p>
        </div>
        <div className="w-10 h-10 bg-[#F47920]/10 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#F47920]" strokeWidth={1.5} />
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin cotizaciones</h3>
          <p className="text-sm text-gray-500">Tus clientes aún no han generado cotizaciones</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2A6B] text-white">
                  <th className="text-left px-4 py-3 font-semibold">N&ordm;</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold">Ruta</th>
                  <th className="text-right px-4 py-3 font-semibold">Total USD</th>
                  <th className="text-center px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const statusInfo = STATUS_LABELS[q.status] || STATUS_LABELS.DRAFT
                  return (
                    <tr key={q.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#1B2A6B]">
                        {q.number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{q.user?.name || '—'}</div>
                        <div className="text-xs text-gray-400">{q.user?.company || q.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {TYPE_LABELS[q.shipmentType] || q.shipmentType}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {q.originPort} &rarr; {q.destPort}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        US$ {q.totalCostUSD.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {quotes.map((q) => {
              const statusInfo = STATUS_LABELS[q.status] || STATUS_LABELS.DRAFT
              return (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#1B2A6B] text-sm font-mono">{q.number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {q.user?.name || '—'}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(q.createdAt).toLocaleDateString('es-CL')}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    {q.originPort} &rarr; {q.destPort}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {TYPE_LABELS[q.shipmentType] || q.shipmentType}
                    </span>
                    <span className="font-bold text-[#1B2A6B]">
                      US$ {q.totalCostUSD.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500 px-3">
                Página {page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
