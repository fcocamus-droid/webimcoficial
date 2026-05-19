import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    totalQuotes,
    quotesThisMonth,
    quotesThisYear,
    acceptedQuotes,
    totalClients,
    activeBoxClients,
    totalExecutives,
    totalPackages,
    packagesInMiami,
    packagesInTransit,
    totalShipments,
    totalCompanies,
    activeRates,
    recentQuotes,
    topClients,
    pendingPreAlerts,
  ] = await Promise.all([
    prisma.quote.count(),
    prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.quote.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.quote.count({ where: { status: 'ACCEPTED' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { boxClientActive: true } }),
    prisma.user.count({ where: { role: 'EXECUTIVE' } }),
    prisma.package.count(),
    prisma.package.count({ where: { status: 'RECEIVED_MIAMI' } }),
    prisma.package.count({ where: { status: { in: ['IN_SHIPMENT', 'IN_TRANSIT', 'IN_CUSTOMS'] } } }),
    prisma.boxShipment.count(),
    prisma.company.count(),
    prisma.shippingRate.count({ where: { active: true } }),
    prisma.quote.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, company: true } } },
    }),
    prisma.$queryRaw<Array<{ userId: string; name: string | null; email: string; count: bigint }>>`
      SELECT u.id AS "userId", u.name, u.email, COUNT(p.id) AS count
      FROM users u
      JOIN packages p ON p."userId" = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY count DESC
      LIMIT 5
    `,
    prisma.preAlert.count({ where: { status: 'PENDING' } }),
  ])

  return {
    totalQuotes,
    quotesThisMonth,
    quotesThisYear,
    acceptedQuotes,
    totalClients,
    activeBoxClients,
    totalExecutives,
    totalPackages,
    packagesInMiami,
    packagesInTransit,
    totalShipments,
    totalCompanies,
    activeRates,
    recentQuotes,
    topClients,
    pendingPreAlerts,
  }
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  SENT: { text: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { text: 'Aceptada', cls: 'bg-green-100 text-green-700' },
  REJECTED: { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { text: 'Expirada', cls: 'bg-yellow-100 text-yellow-700' },
}

export default async function AdminDashboard() {
  const s = await getStats()

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Control</h1>
          <p className="text-sm text-gray-500">Panel del SuperAdmin Boss · Operaciones IMC</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/usuarios" className="px-4 py-2 bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium rounded-lg">
            👥 Usuarios y roles
          </Link>
          <Link href="/admin/tarifas" className="px-4 py-2 border border-[#1B2A6B] text-[#1B2A6B] hover:bg-[#1B2A6B] hover:text-white text-sm font-medium rounded-lg">
            💰 Tarifas
          </Link>
        </div>
      </div>

      {/* Section: IMC Cargo */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1B2A6B] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#F47920] rounded-full" />
          IMC Cargo · Freight Forwarder
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Cotizaciones (total)" value={s.totalQuotes} icon="📋" color="blue" />
          <KPICard label="Este mes" value={s.quotesThisMonth} icon="📅" color="orange" />
          <KPICard label="Aceptadas" value={s.acceptedQuotes} icon="✅" color="emerald" />
          <KPICard label="Empresas registradas" value={s.totalCompanies} icon="🏢" color="purple" />
        </div>
      </section>

      {/* Section: IMC Box */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1B2A6B] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#F47920] rounded-full" />
          IMC Box · Casilla Miami
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Clientes Box activos" value={s.activeBoxClients} icon="👤" color="blue" />
          <KPICard label="Paquetes totales" value={s.totalPackages} icon="📦" color="emerald" />
          <KPICard label="En Miami" value={s.packagesInMiami} icon="🏢" color="amber" highlight={s.packagesInMiami > 0} />
          <KPICard label="En tránsito" value={s.packagesInTransit} icon="✈️" color="purple" />
        </div>
      </section>

      {/* Section: Equipo + Operación */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1B2A6B] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#F47920] rounded-full" />
          Equipo y Operación
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Clientes registrados" value={s.totalClients} icon="👥" color="blue" href="/admin/usuarios?role=CLIENT" />
          <KPICard label="Ejecutivos" value={s.totalExecutives} icon="💼" color="orange" href="/admin/usuarios?role=EXECUTIVE" />
          <KPICard label="Tarifas activas" value={s.activeRates} icon="🏷️" color="emerald" href="/admin/tarifas" />
          <KPICard
            label="Pre-alertas pendientes"
            value={s.pendingPreAlerts}
            icon="🔔"
            color="amber"
            highlight={s.pendingPreAlerts > 0}
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent quotes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Cotizaciones recientes</h2>
            <Link href="/admin" className="text-xs text-[#F47920] hover:underline">Ver todas →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">N°</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Ruta</th>
                  <th className="px-4 py-2 font-medium text-right">USD</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {s.recentQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin cotizaciones aún</td>
                  </tr>
                ) : (
                  s.recentQuotes.map((q) => {
                    const st = statusLabel[q.status] || { text: q.status, cls: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-xs">{q.number}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-sm">{q.user?.name || q.user?.email || '—'}</p>
                          {q.user?.company && <p className="text-xs text-gray-400">{q.user.company}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{q.shipmentType}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{q.originPort} → {q.destPort}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">${q.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Top clientes IMC Box</h2>
            <p className="text-xs text-gray-500 mt-0.5">Por paquetes movidos</p>
          </div>
          <div className="divide-y divide-gray-100">
            {s.topClients.length === 0 ? (
              <p className="px-6 py-6 text-center text-gray-400 text-sm">Sin datos</p>
            ) : (
              s.topClients.map((c, idx) => (
                <div key={c.userId} className="px-6 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-700' : 'bg-slate-300'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name || c.email}</p>
                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  </div>
                  <span className="text-sm font-bold text-[#1B2A6B]">{Number(c.count)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  icon,
  color,
  href,
  highlight,
}: {
  label: string
  value: number
  icon: string
  color: 'blue' | 'orange' | 'emerald' | 'purple' | 'amber'
  href?: string
  highlight?: boolean
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-[#F47920]',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  const Wrapper: any = href ? Link : 'div'
  const props = href ? { href } : {}
  return (
    <Wrapper
      {...props}
      className={`block bg-white rounded-xl p-4 shadow-sm border transition-all ${
        href ? 'hover:shadow-md hover:border-[#F47920]/40 cursor-pointer' : ''
      } ${highlight ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-gray-100'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-xl font-bold text-[#1B2A6B]">{value.toLocaleString('es-CL')}</p>
        </div>
      </div>
    </Wrapper>
  )
}
