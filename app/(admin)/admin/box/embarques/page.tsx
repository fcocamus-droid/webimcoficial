import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
  LOADING: { text: 'Cargando', cls: 'bg-amber-100 text-amber-800' },
  IN_TRANSIT: { text: 'En tránsito', cls: 'bg-yellow-100 text-yellow-800' },
  IN_CUSTOMS: { text: 'En aduana', cls: 'bg-orange-100 text-orange-800' },
  CLEARED: { text: 'Lista', cls: 'bg-emerald-100 text-emerald-800' },
  DELIVERED: { text: 'Entregada', cls: 'bg-green-100 text-green-800' },
  CLOSED: { text: 'Cerrada', cls: 'bg-slate-100 text-slate-600' },
}

export default async function AdminEmbarquesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/box/embarques')
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN') redirect('/no-autorizado')

  const page = parseInt(searchParams.page || '1') || 1
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (searchParams.status && searchParams.status !== 'all') where.status = searchParams.status
  if (searchParams.q) {
    where.OR = [
      { code: { contains: searchParams.q, mode: 'insensitive' } },
      { notes: { contains: searchParams.q, mode: 'insensitive' } },
    ]
  }

  const [shipments, total, statusCounts] = await Promise.all([
    prisma.boxShipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: { _count: { select: { packages: true } } },
    }),
    prisma.boxShipment.count({ where }),
    prisma.boxShipment.groupBy({ by: ['status'], _count: true }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const counts: Record<string, number> = { ALL: 0 }
  for (const s of statusCounts) {
    counts[s.status] = s._count
    counts.ALL += s._count
  }
  const statusFilter = searchParams.status || 'all'

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Embarques consolidados</h1>
          <p className="text-sm text-slate-500">{total} embarques · {counts.LOADING || 0} cargando</p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-[#F47920]/60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg cursor-not-allowed"
          title="Próximamente"
        >
          + Crear embarque
        </button>
      </div>

      {/* Filter */}
      <form className="bg-white rounded-xl border border-slate-200 p-4" method="get">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q || ''}
              placeholder="Código EM, notas…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30"
            />
          </div>
          <input type="hidden" name="status" value={statusFilter} />
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Filtrar</button>
            <Link href="/admin/box/embarques" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Limpiar</Link>
          </div>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/box/embarques" active={statusFilter === 'all'} label="Todos" count={counts.ALL} />
        <StatusTab href="/admin/box/embarques?status=LOADING" active={statusFilter === 'LOADING'} label="Cargando" count={counts.LOADING || 0} />
        <StatusTab href="/admin/box/embarques?status=IN_TRANSIT" active={statusFilter === 'IN_TRANSIT'} label="En tránsito" count={counts.IN_TRANSIT || 0} />
        <StatusTab href="/admin/box/embarques?status=DELIVERED" active={statusFilter === 'DELIVERED'} label="Entregadas" count={counts.DELIVERED || 0} />
        <StatusTab href="/admin/box/embarques?status=CLOSED" active={statusFilter === 'CLOSED'} label="Cerradas" count={counts.CLOSED || 0} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {shipments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-5xl mb-3">🚢</div>
            <p className="text-slate-500 text-sm">Sin embarques</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-4 py-2.5 font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 font-semibold">Ruta</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Paquetes</th>
                  <th className="px-4 py-2.5 font-semibold">Salida</th>
                  <th className="px-4 py-2.5 font-semibold">Llegada</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s) => {
                  const st = STATUS_LABEL[s.status] || { text: s.status, cls: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B2A6B] font-semibold">{s.code}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {s.originPort} → {s.destPort}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block bg-[#F47920]/10 text-[#F47920] font-bold px-2 py-0.5 rounded text-xs">
                          {s._count.packages}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {s.departureDate ? new Date(s.departureDate).toLocaleDateString('es-CL') : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {s.arrivalDate ? new Date(s.arrivalDate).toLocaleDateString('es-CL') : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-4 py-2.5 max-w-[160px] truncate text-xs text-slate-500">{s.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/box/embarques?${new URLSearchParams({ ...searchParams, page: String(page - 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Anterior</Link>}
            {page < totalPages && <Link href={`/admin/box/embarques?${new URLSearchParams({ ...searchParams, page: String(page + 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente</Link>}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusTab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
    }`}>
      {label}<span className={`text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>· {count}</span>
    </Link>
  )
}
