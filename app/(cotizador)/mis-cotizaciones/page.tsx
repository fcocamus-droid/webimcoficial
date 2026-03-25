'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface QuoteRow {
  id: string
  number: string
  createdAt: string
  originPort: string
  destPort: string
  shipmentType: string
  totalCostUSD: number
  status: string
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
  AIR: 'Aereo',
}

export default function MisCotizacionesPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/mis-cotizaciones')
    }
  }, [authStatus, router])

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes?page=${page}&limit=20`)
      if (!res.ok) throw new Error('Error')
      const json = await res.json()
      setQuotes(json.quotes || [])
      setPagination(json.pagination || null)
    } catch {
      console.error('Error fetching quotes')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchQuotes()
    }
  }, [authStatus, fetchQuotes])

  if (authStatus === 'loading' || authStatus === 'unauthenticated') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B2A6B] border-t-[#F47920] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A6B]">Mis Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de todas tus cotizaciones</p>
        </div>
        <Link
          href="/cotizar"
          className="bg-[#F47920] hover:bg-[#e06810] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#F47920]/25"
        >
          Nueva Cotizacion
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1B2A6B] border-t-[#F47920] rounded-full animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin cotizaciones</h3>
          <p className="text-sm text-gray-500 mb-6">Aun no has realizado ninguna cotizacion</p>
          <Link
            href="/cotizar"
            className="inline-flex items-center gap-2 bg-[#F47920] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e06810] transition-colors"
          >
            Crear mi primera cotizacion
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2A6B] text-white">
                  <th className="text-left px-4 py-3 font-semibold">Numero</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Ruta</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold">Total USD</th>
                  <th className="text-center px-4 py-3 font-semibold">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const statusInfo = STATUS_LABELS[q.status] || STATUS_LABELS.DRAFT
                  return (
                    <tr key={q.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1B2A6B]">{q.number}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(q.createdAt).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {q.originPort} → {q.destPort}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {TYPE_LABELS[q.shipmentType] || q.shipmentType}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        US$ {q.totalCostUSD.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => window.print()}
                          className="text-[#1B2A6B] hover:text-[#F47920] transition-colors p-1"
                          title="Descargar PDF"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
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
                    <span className="font-semibold text-[#1B2A6B] text-sm">{q.number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(q.createdAt).toLocaleDateString('es-CL')}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    {q.originPort} → {q.destPort}
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
                Pagina {page} de {pagination.totalPages}
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
