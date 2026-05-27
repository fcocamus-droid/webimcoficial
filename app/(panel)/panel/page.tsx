import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function EscritorioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel')

  // KPIs
  const [activeQuotes, activeOps, pendingPayUSD, recentQuotes] = await Promise.all([
    prisma.quote.count({ where: { userId: session.user.id, status: { in: ['DRAFT', 'SENT'] } } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) FROM operations WHERE "userId" = ${session.user.id} AND stage != 'DELIVERED'
    `.then((r) => Number(r[0]?.count || 0)),
    prisma.$queryRaw<Array<{ total: number | null }>>`
      SELECT COALESCE(SUM("pendingPayment"),0)::float AS total FROM operations WHERE "userId" = ${session.user.id} AND stage != 'DELIVERED'
    `.then((r) => Number(r[0]?.total || 0)),
    prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, number: true, originPort: true, destPort: true, shipmentType: true, totalCostUSD: true, status: true, createdAt: true },
    }),
  ])

  const userName = session.user.name || 'Cliente'
  const userInitial = userName.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Escritorio</h1>

      {/* Welcome + summary cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Welcome card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Bienvenida/o</p>
              <p className="font-bold text-slate-900 truncate">{userName.toUpperCase()}</p>
            </div>
            <Link href="/api/auth/signout" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg">
              ↪ Salir
            </Link>
          </div>
        </div>

        {/* Pending payment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Total Pendiente</p>
          <p className="text-2xl font-bold text-[#1B2A6B]">USD ${pendingPayUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Cotizaciones activas + Operaciones en curso */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/panel/cotizaciones"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#F47920]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-500">Cotizaciones activas</span>
            <span className="text-[#F47920] text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeQuotes}</p>
          <p className="text-xs text-slate-500 mt-1">Borradores y enviadas</p>
        </Link>

        <Link
          href="/panel/operaciones"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#F47920]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-slate-500">Operaciones en curso</span>
            <span className="text-[#F47920] text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeOps}</p>
          <p className="text-xs text-slate-500 mt-1">No entregadas</p>
        </Link>
      </div>

      {/* Recent shipments */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Últimas guías</h2>
          <Link href="/panel/cotizaciones" className="text-sm text-[#F47920] hover:underline">Ver todas →</Link>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-500 text-sm mb-4">Aún no tienes guías registradas.</p>
            <Link href="/panel/cotizar" className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-semibold">
              + Crear primera cotización
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-2.5 font-medium">Número</th>
                <th className="px-5 py-2.5 font-medium">Origen → Destino</th>
                <th className="px-5 py-2.5 font-medium">Tipo</th>
                <th className="px-5 py-2.5 font-medium text-right">Valor</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-[#1B2A6B] font-semibold">{q.number}</td>
                  <td className="px-5 py-3 text-slate-700 text-xs">{q.originPort} → {q.destPort}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{q.shipmentType}</td>
                  <td className="px-5 py-3 text-right font-mono font-medium">USD ${q.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
    SENT: { label: 'Enviada', cls: 'bg-blue-50 text-blue-700' },
    ACCEPTED: { label: 'Aceptada', cls: 'bg-emerald-50 text-emerald-700' },
    REJECTED: { label: 'Rechazada', cls: 'bg-red-50 text-red-700' },
    EXPIRED: { label: 'Expirada', cls: 'bg-amber-50 text-amber-700' },
  }
  const v = map[status] || { label: status, cls: 'bg-slate-100 text-slate-700' }
  return <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium ${v.cls}`}>{v.label}</span>
}
