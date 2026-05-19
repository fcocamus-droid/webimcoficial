import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVED_MIAMI: { label: 'En Miami', color: 'bg-blue-100 text-blue-800' },
  IN_SHIPMENT: { label: 'En embarque', color: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { label: 'En tránsito', color: 'bg-yellow-100 text-yellow-800' },
  IN_CUSTOMS: { label: 'En aduana', color: 'bg-orange-100 text-orange-800' },
  CLEARED: { label: 'Aduana lista', color: 'bg-emerald-100 text-emerald-800' },
  OUT_FOR_DELIVERY: { label: 'En reparto', color: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
}

export default async function BoxDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/box')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      casillaNumber: true,
      legacyBoxCode: true,
      boxClientActive: true,
    },
  })

  if (!user) redirect('/login?callbackUrl=/box')

  // Get package stats
  const packages = await prisma.package.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      code: true,
      description: true,
      status: true,
      costUSD: true,
      weightLbs: true,
      tracking: true,
      createdAt: true,
      packageType: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const totalPackages = await prisma.package.count({ where: { userId: user.id } })
  const inMiami = await prisma.package.count({
    where: { userId: user.id, status: 'RECEIVED_MIAMI' },
  })
  const inTransit = await prisma.package.count({
    where: { userId: user.id, status: { in: ['IN_SHIPMENT', 'IN_TRANSIT', 'IN_CUSTOMS'] } },
  })
  const delivered = await prisma.package.count({
    where: { userId: user.id, status: 'DELIVERED' },
  })

  const pendingPreAlerts = await prisma.preAlert.count({
    where: { userId: user.id, status: 'PENDING' },
  })

  const casillaNumber = user.casillaNumber || `IMC${user.id.slice(-6).toUpperCase()}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome hero */}
      <div className="mb-8 bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-2xl shadow-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm mb-1">Bienvenido</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{user.name || 'Cliente IMC Box'}</h1>
            <p className="text-blue-100 text-sm">Tu casilla en Miami está activa y lista para recibir paquetes</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <p className="text-xs text-blue-200 uppercase tracking-wide mb-1">Tu Casilla</p>
            <p className="text-3xl font-bold text-[#F47920]">{casillaNumber}</p>
            <Link href="/box/casilla" className="inline-flex items-center gap-1 text-xs text-blue-200 hover:text-white mt-2">
              Ver dirección completa →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total paquetes" value={totalPackages} icon="📦" />
        <StatCard label="En Miami" value={inMiami} icon="🏢" highlight />
        <StatCard label="En tránsito" value={inTransit} icon="✈️" />
        <StatCard label="Entregados" value={delivered} icon="✅" />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/box/prealertas/nueva"
          className="bg-[#F47920] hover:bg-[#e06810] text-white rounded-xl p-5 transition-colors shadow-md hover:shadow-lg group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">🔔</div>
            <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">Crear Pre-alerta</h3>
          <p className="text-sm opacity-90">Avísanos que viene un paquete a Miami</p>
          {pendingPreAlerts > 0 && (
            <span className="inline-block mt-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {pendingPreAlerts} pendientes
            </span>
          )}
        </Link>

        <Link
          href="/box/calculadora"
          className="bg-white hover:bg-slate-50 rounded-xl p-5 transition-colors shadow-md hover:shadow-lg border border-slate-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">🧮</div>
            <svg className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Calcular costo</h3>
          <p className="text-sm text-slate-600">Estima cuánto te costará traer tu compra</p>
        </Link>

        <Link
          href="/box/casilla"
          className="bg-white hover:bg-slate-50 rounded-xl p-5 transition-colors shadow-md hover:shadow-lg border border-slate-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">📬</div>
            <svg className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Ver mi casilla</h3>
          <p className="text-sm text-slate-600">Dirección Miami para tus compras</p>
        </Link>
      </div>

      {/* Recent packages */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Paquetes recientes</h2>
          {totalPackages > 8 && (
            <Link href="/box/historial" className="text-sm text-[#F47920] hover:underline font-medium">
              Ver todos ({totalPackages}) →
            </Link>
          )}
        </div>

        {packages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-600 mb-4">Aún no tienes paquetes registrados</p>
            <Link
              href="/box/prealertas/nueva"
              className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              Crear primera pre-alerta
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {packages.map((p) => {
              const status = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-700' }
              return (
                <div key={p.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#1B2A6B]">{p.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 truncate">{p.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.packageType?.name && <span>{p.packageType.name} · </span>}
                        {p.tracking && <span className="font-mono">{p.tracking.substring(0, 22)}{p.tracking.length > 22 ? '…' : ''}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {p.costUSD != null && (
                        <p className="font-semibold text-slate-900">USD ${p.costUSD.toFixed(2)}</p>
                      )}
                      {p.weightLbs != null && (
                        <p className="text-xs text-slate-500">{p.weightLbs.toFixed(2)} lb</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border ${highlight ? 'border-[#F47920]/30 ring-1 ring-[#F47920]/10' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-[#F47920]' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}
