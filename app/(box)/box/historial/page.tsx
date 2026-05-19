import Link from 'next/link'
import { redirect } from 'next/navigation'
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

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/box/historial')

  const page = parseInt(searchParams.page || '1', 10) || 1
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: any = { userId: session.user.id }
  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status
  }

  const [packages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        packageType: { select: { name: true } },
        shipment: { select: { code: true } },
      },
    }),
    prisma.package.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const statusFilter = searchParams.status || 'all'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A6B]">Historial de paquetes</h1>
          <p className="text-slate-600 mt-1">{total} paquetes en total</p>
        </div>
        <Link href="/box/prealertas/nueva" className="bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nueva pre-alerta
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterButton href="/box/historial" active={statusFilter === 'all'}>Todos</FilterButton>
        <FilterButton href="/box/historial?status=RECEIVED_MIAMI" active={statusFilter === 'RECEIVED_MIAMI'}>En Miami</FilterButton>
        <FilterButton href="/box/historial?status=IN_TRANSIT" active={statusFilter === 'IN_TRANSIT'}>En tránsito</FilterButton>
        <FilterButton href="/box/historial?status=IN_CUSTOMS" active={statusFilter === 'IN_CUSTOMS'}>En aduana</FilterButton>
        <FilterButton href="/box/historial?status=DELIVERED" active={statusFilter === 'DELIVERED'}>Entregados</FilterButton>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
        {packages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-600">No hay paquetes con este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-left font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-right font-medium">Peso</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Embarque</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((p) => {
                  const status = STATUS_LABELS[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-[#1B2A6B] font-semibold">{p.code}</td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-slate-700">{p.description}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{p.packageType?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{p.costUSD != null ? `$${p.costUSD.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{p.weightLbs != null ? `${p.weightLbs.toFixed(2)} lb` : '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.shipment?.code || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('es-CL')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/box/historial?status=${statusFilter}&page=${page - 1}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/box/historial?status=${statusFilter}&page=${page + 1}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterButton({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </Link>
  )
}
