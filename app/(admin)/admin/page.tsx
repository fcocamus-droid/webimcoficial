import { prisma } from '@/lib/prisma'

async function getStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalQuotes, totalUsers, activeRates, quotesThisMonth, recentQuotes] = await Promise.all([
    prisma.quote.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.shippingRate.count({ where: { active: true } }),
    prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.quote.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, company: true } } },
    }),
  ])

  return { totalQuotes, totalUsers, activeRates, quotesThisMonth, recentQuotes }
}

export default async function AdminDashboard() {
  const { totalQuotes, totalUsers, activeRates, quotesThisMonth, recentQuotes } = await getStats()

  const cards = [
    {
      label: 'Total Cotizaciones',
      value: totalQuotes,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-blue-500',
    },
    {
      label: 'Usuarios Registrados',
      value: totalUsers,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'bg-green-500',
    },
    {
      label: 'Tarifas Activas',
      value: activeRates,
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      color: 'bg-[#F47920]',
    },
    {
      label: 'Cotizaciones Este Mes',
      value: quotesThisMonth,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-purple-500',
    },
  ]

  const statusLabel: Record<string, { text: string; cls: string }> = {
    DRAFT: { text: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
    SENT: { text: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
    ACCEPTED: { text: 'Aceptada', cls: 'bg-green-100 text-green-700' },
    REJECTED: { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
    EXPIRED: { text: 'Expirada', cls: 'bg-yellow-100 text-yellow-700' },
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-[#1B2A6B]">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Cotizaciones Recientes</h2>
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
              {recentQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No hay cotizaciones registradas
                  </td>
                </tr>
              ) : (
                recentQuotes.map((q) => {
                  const st = statusLabel[q.status] || { text: q.status, cls: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs">{q.number}</td>
                      <td className="px-6 py-3">
                        <div>{q.user?.name || 'Sin usuario'}</div>
                        <div className="text-xs text-gray-400">{q.user?.company}</div>
                      </td>
                      <td className="px-6 py-3">{q.shipmentType}</td>
                      <td className="px-6 py-3 text-xs">{q.originPort} → {q.destPort}</td>
                      <td className="px-6 py-3 font-medium">${q.totalCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{new Date(q.createdAt).toLocaleDateString('es-CL')}</td>
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
