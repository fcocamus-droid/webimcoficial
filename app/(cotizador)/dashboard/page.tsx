import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import OperationPipeline, { OperationStage } from '@/app/components/cargo/OperationPipeline'
import StatCard from '@/app/components/cargo/StatCard'

export const dynamic = 'force-dynamic'

const QUOTE_STATUS_OPEN = ['DRAFT', 'SENT']

export default async function CargoDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/dashboard')

  const userId = session.user.id

  // Stats
  const activeQuotes = await prisma.quote.count({
    where: { userId, status: { in: ['DRAFT', 'SENT'] } },
  })

  // Operations counts by stage
  // For now since Operation table is empty, we derive from quotes ACCEPTED
  const acceptedQuotes = await prisma.quote.count({
    where: { userId, status: 'ACCEPTED' },
  })

  const operations = await prisma.$queryRaw<Array<{ stage: string; count: bigint }>>`
    SELECT stage::text, COUNT(*) AS count
    FROM operations
    WHERE "userId" = ${userId}
    GROUP BY stage
  `

  const counts: Record<OperationStage, number> = {
    PENDING: 0,
    IN_ORIGIN: 0,
    IN_TRANSIT: 0,
    AT_DESTINATION: 0,
    DELIVERED: 0,
  }
  for (const row of operations) {
    if (row.stage in counts) counts[row.stage as OperationStage] = Number(row.count)
  }
  const totalOperations = Object.values(counts).reduce((a, b) => a + b, 0)
  const inProgress = totalOperations - counts.DELIVERED

  // Recent quotes
  const recentQuotes = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      number: true,
      shipmentType: true,
      originPort: true,
      destPort: true,
      status: true,
      totalCostUSD: true,
      createdAt: true,
    },
  })

  // Calculate pending payment (placeholder — sum operation pending payments)
  const pendingPayment = await prisma.$queryRaw<Array<{ total: number | null }>>`
    SELECT COALESCE(SUM("pendingPayment"), 0)::float AS total
    FROM operations
    WHERE "userId" = ${userId} AND stage != 'DELIVERED'
  `
  const pendingUSD = Number(pendingPayment[0]?.total || 0)

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const userName = session.user.name || session.user.email || 'Usuario'
  const firstName = userName.split(' ')[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome hero */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Hola, <span className="text-[#1B2A6B]">{firstName}</span>
          </h1>
          <p className="text-slate-500 mt-1 capitalize">{dateStr}</p>
        </div>
        <Link
          href="/cotizar"
          className="inline-flex items-center gap-3 bg-white border-2 border-[#F47920] hover:bg-[#F47920] text-[#F47920] hover:text-white px-5 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md group"
        >
          <span className="w-10 h-10 bg-[#F47920] group-hover:bg-white text-white group-hover:text-[#F47920] rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13.5l9 4.5 9-4.5L12 9 3 13.5zM3 18l9 4.5 9-4.5M3 9l9-4.5L21 9" />
            </svg>
          </span>
          <span className="text-left">
            <span className="block font-semibold text-base">Nueva Cotización</span>
            <span className="block text-xs opacity-80">Importa con los mejores precios</span>
          </span>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Cotizaciones activas"
          value={activeQuotes}
          href="/mis-cotizaciones?status=open"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          label="Operaciones en curso"
          value={inProgress}
          href="/operaciones"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          highlight={inProgress > 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
        />
        <StatCard
          label="Pendiente por abonar"
          value={pendingUSD > 0 ? `US$${pendingUSD.toLocaleString('en-US')}` : 'US$0'}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
        />
      </div>

      {/* Pipeline */}
      <div className="mb-8">
        <OperationPipeline counts={counts} total={totalOperations} />
        {totalOperations === 0 && (
          <p className="text-center text-xs text-slate-500 mt-3">
            Aún no tienes operaciones activas. Cuando aceptes una cotización, aparecerá aquí.
          </p>
        )}
      </div>

      {/* Recent + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent quotes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Cotizaciones recientes</h2>
            <Link href="/mis-cotizaciones" className="text-sm text-[#F47920] hover:underline font-medium">
              Ver todas
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <div className="text-4xl mb-2">📋</div>
              No tienes cotizaciones aún.{' '}
              <Link href="/cotizar" className="text-[#F47920] hover:underline">Crea la primera</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuotes.map((q) => (
                <Link
                  key={q.id}
                  href={`/mis-cotizaciones/${q.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                      {q.shipmentType.startsWith('FCL') ? '📦' : q.shipmentType === 'AIR' ? '✈️' : '🚢'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{q.number}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {q.originPort} → {q.destPort}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-slate-900">US${(q.totalCostUSD || 0).toLocaleString('en-US')}</p>
                    <p className="text-xs text-slate-500">{statusLabel(q.status)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            <QuickAction
              href="/cotizar"
              icon="🚢"
              title="Nueva cotización"
              desc="Importación/exportación"
            />
            <QuickAction
              href="/operaciones"
              icon="📦"
              title="Mis operaciones"
              desc={`${totalOperations} en curso`}
            />
            <QuickAction
              href="/box"
              icon="📬"
              title="IMC Box"
              desc="Mi casilla Miami"
            />
            <QuickAction
              href="/mi-cuenta"
              icon="⚙️"
              title="Mi perfil"
              desc="Datos y empresas"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-slate-400 group-hover:text-[#F47920] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    EXPIRED: 'Expirada',
  }
  return map[s] || s
}
