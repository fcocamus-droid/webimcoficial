import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import DashboardOnboarding from './DashboardOnboarding'

export const dynamic = 'force-dynamic'

async function getStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalQuotes,
    quotesThisMonth,
    acceptedQuotes,
    sentQuotes,
    totalClients,
    activeBoxClients,
    totalExecutives,
    totalPackages,
    packagesInMiami,
    packagesInTransit,
    packagesDelivered,
    totalShipments,
    activeRates,
    pendingPreAlerts,
    recentQuotes,
    operationCounts,
  ] = await Promise.all([
    prisma.quote.count(),
    prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.quote.count({ where: { status: 'ACCEPTED' } }),
    prisma.quote.count({ where: { status: 'SENT' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { boxClientActive: true } }),
    prisma.user.count({ where: { role: 'EXECUTIVE' } }),
    prisma.package.count(),
    prisma.package.count({ where: { status: 'RECEIVED_MIAMI' } }),
    prisma.package.count({ where: { status: { in: ['IN_SHIPMENT', 'IN_TRANSIT', 'IN_CUSTOMS'] } } }),
    prisma.package.count({ where: { status: 'DELIVERED' } }),
    prisma.boxShipment.count(),
    prisma.shippingRate.count({ where: { active: true } }),
    prisma.preAlert.count({ where: { status: 'PENDING' } }),
    prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, company: true } } },
    }),
    prisma.$queryRaw<Array<{ stage: string; count: bigint }>>`
      SELECT stage::text, COUNT(*) AS count FROM operations GROUP BY stage
    `,
  ])

  const opStages = { PENDING: 0, IN_ORIGIN: 0, IN_TRANSIT: 0, AT_DESTINATION: 0, DELIVERED: 0 }
  for (const r of operationCounts) {
    if (r.stage in opStages) (opStages as any)[r.stage] = Number(r.count)
  }
  const totalOps = Object.values(opStages).reduce((a, b) => a + b, 0)
  const inProgressOps = totalOps - opStages.DELIVERED

  return {
    totalQuotes,
    quotesThisMonth,
    acceptedQuotes,
    sentQuotes,
    totalClients,
    activeBoxClients,
    totalExecutives,
    totalPackages,
    packagesInMiami,
    packagesInTransit,
    packagesDelivered,
    totalShipments,
    activeRates,
    pendingPreAlerts,
    recentQuotes,
    totalOps,
    inProgressOps,
    opStages,
  }
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
  SENT: { text: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { text: 'Aceptada', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { text: 'Expirada', cls: 'bg-amber-100 text-amber-700' },
}

export default async function AdminDashboard() {
  const session = await auth()
  const s = await getStats()
  const firstName = (session?.user?.name || 'Admin').split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola, {firstName}</h1>
          <p className="text-sm text-slate-500">Panel de SuperAdmin · Centro de Control IMC</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/cotizar"
            className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-[#F47920]/25"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Cotización
          </Link>
        </div>
      </div>

      {/* Welcome / Onboarding card */}
      <DashboardOnboarding
        firstName={firstName}
        stats={{
          hasUsers: s.totalClients > 0,
          hasRates: s.activeRates > 0,
          hasQuotes: s.totalQuotes > 0,
          hasOperations: s.totalOps > 0,
          hasResend: false,
        }}
      />

      {/* IMC Cargo stats */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-[#F47920] rounded-full" />
          <h2 className="text-sm font-bold text-slate-700">IMC Cargo · Cotizaciones</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={s.totalQuotes} accent="navy" trend={null} />
          <StatCard label="Este mes" value={s.quotesThisMonth} accent="orange" />
          <StatCard label="Enviadas" value={s.sentQuotes} accent="blue" />
          <StatCard label="Aceptadas" value={s.acceptedQuotes} accent="emerald" />
        </div>
      </section>

      {/* Operations Pipeline */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#F47920] rounded-full" />
            <h2 className="text-sm font-bold text-slate-700">Operaciones · Pipeline</h2>
          </div>
          <Link href="/operaciones" className="text-xs text-[#F47920] hover:underline font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <PipelineCard label="Pendiente" value={s.opStages.PENDING} color="amber" />
          <PipelineCard label="En Origen" value={s.opStages.IN_ORIGIN} color="red" />
          <PipelineCard label="En Tránsito" value={s.opStages.IN_TRANSIT} color="sky" />
          <PipelineCard label="En Destino" value={s.opStages.AT_DESTINATION} color="purple" />
          <PipelineCard label="Entregado" value={s.opStages.DELIVERED} color="emerald" />
        </div>
      </section>

      {/* IMC Box stats */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-[#F47920] rounded-full" />
          <h2 className="text-sm font-bold text-slate-700">IMC Box · Casilla Miami</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Clientes Box" value={s.activeBoxClients} accent="navy" />
          <StatCard label="Paquetes total" value={s.totalPackages} accent="orange" />
          <StatCard label="En Miami" value={s.packagesInMiami} accent="amber" highlight={s.packagesInMiami > 0} />
          <StatCard label="Entregados" value={s.packagesDelivered} accent="emerald" />
        </div>
      </section>

      {/* Team + Config */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-[#F47920] rounded-full" />
          <h2 className="text-sm font-bold text-slate-700">Equipo y Configuración</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            href="/admin/usuarios?role=CLIENT"
            label="Clientes"
            value={s.totalClients}
            description="Cartera total"
            iconColor="text-blue-600 bg-blue-50"
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
          />
          <ActionCard
            href="/admin/usuarios?role=EXECUTIVE"
            label="Ejecutivos"
            value={s.totalExecutives}
            description="Equipo comercial"
            iconColor="text-[#F47920] bg-orange-50"
            icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
          <ActionCard
            href="/admin/tarifas"
            label="Tarifas activas"
            value={s.activeRates}
            description="LCL · FCL · Aéreo"
            iconColor="text-emerald-600 bg-emerald-50"
            icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
          <ActionCard
            href="/admin/box/prealertas"
            label="Pre-alertas"
            value={s.pendingPreAlerts}
            description="Pendientes"
            iconColor="text-amber-600 bg-amber-50"
            icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            highlight={s.pendingPreAlerts > 0}
          />
        </div>
      </section>

      {/* Acciones Rápidas */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 bg-[#F47920] rounded-full" />
          <h2 className="text-sm font-bold text-slate-700">Acciones Rápidas</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction href="/admin/usuarios" icon="👥" title="Gestionar usuarios" desc="Roles y reset passwords" />
          <QuickAction href="/admin/tarifas/nueva" icon="💰" title="Agregar tarifa" desc="LCL/FCL/Aéreo" />
          <QuickAction href="/admin/operaciones" icon="📦" title="Operaciones activas" desc={`${s.inProgressOps} en curso`} />
          <QuickAction href="/cotizar" icon="📋" title="Nueva cotización" desc="Crear para cliente" />
        </div>
      </section>

      {/* Recent quotes */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Cotizaciones recientes</h2>
          <Link href="/admin/cotizaciones" className="text-xs text-[#F47920] hover:underline font-medium">
            Ver todas →
          </Link>
        </div>
        {s.recentQuotes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            Sin cotizaciones aún
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-2.5 font-semibold">N°</th>
                  <th className="px-5 py-2.5 font-semibold">Cliente</th>
                  <th className="px-5 py-2.5 font-semibold">Tipo</th>
                  <th className="px-5 py-2.5 font-semibold">Ruta</th>
                  <th className="px-5 py-2.5 font-semibold text-right">USD</th>
                  <th className="px-5 py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.recentQuotes.map((q) => {
                  const st = statusLabel[q.status] || { text: q.status, cls: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-mono text-xs text-[#1B2A6B] font-semibold">{q.number}</td>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-sm text-slate-900">{q.user?.name || q.user?.email || '—'}</p>
                        {q.user?.company && <p className="text-xs text-slate-400">{q.user.company}</p>}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600">{q.shipmentType}</td>
                      <td className="px-5 py-2.5 text-xs text-slate-600">{q.originPort} → {q.destPort}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-semibold">
                        ${q.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string
  value: number
  accent: 'navy' | 'orange' | 'blue' | 'emerald' | 'amber'
  highlight?: boolean
  trend?: any
}) {
  const colorMap = {
    navy: 'text-[#1B2A6B]',
    orange: 'text-[#F47920]',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <div className={`bg-white rounded-xl p-4 border transition-shadow ${
      highlight ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-slate-200'
    }`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[accent]}`}>{value.toLocaleString('es-CL')}</p>
    </div>
  )
}

function PipelineCard({ label, value, color }: { label: string; value: number; color: 'amber' | 'red' | 'sky' | 'purple' | 'emerald' }) {
  const dotColor = { amber: 'bg-amber-500', red: 'bg-red-500', sky: 'bg-sky-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500' }
  const textColor = { amber: 'text-amber-700', red: 'text-red-700', sky: 'text-sky-700', purple: 'text-purple-700', emerald: 'text-emerald-700' }
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor[color]}`} />
        <p className={`text-xs font-semibold ${textColor[color]}`}>{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ActionCard({
  href,
  label,
  value,
  description,
  iconColor,
  icon,
  highlight,
}: {
  href: string
  label: string
  value: number
  description: string
  iconColor: string
  icon: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl p-4 border transition-all hover:shadow-md hover:border-[#F47920]/40 ${
        highlight ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-[#1B2A6B] mt-0.5">{value.toLocaleString('es-CL')}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </Link>
  )
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl p-4 border border-slate-200 hover:border-[#F47920]/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-slate-500 truncate">{desc}</p>
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-[#F47920] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
