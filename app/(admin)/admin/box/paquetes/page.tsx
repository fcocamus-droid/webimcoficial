import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  RECEIVED_MIAMI: { text: 'En Miami', cls: 'bg-blue-100 text-blue-800' },
  IN_SHIPMENT: { text: 'En embarque', cls: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { text: 'En tránsito', cls: 'bg-yellow-100 text-yellow-800' },
  IN_CUSTOMS: { text: 'En aduana', cls: 'bg-orange-100 text-orange-800' },
  CLEARED: { text: 'Aduana lista', cls: 'bg-emerald-100 text-emerald-800' },
  OUT_FOR_DELIVERY: { text: 'En reparto', cls: 'bg-purple-100 text-purple-800' },
  DELIVERED: { text: 'Entregado', cls: 'bg-green-100 text-green-800' },
}

export default async function AdminPaquetesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/box/paquetes')
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') redirect('/no-autorizado')

  const page = parseInt(searchParams.page || '1') || 1
  const pageSize = 30
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (searchParams.status && searchParams.status !== 'all') where.status = searchParams.status
  if (searchParams.q) {
    where.OR = [
      { code: { contains: searchParams.q, mode: 'insensitive' } },
      { tracking: { contains: searchParams.q, mode: 'insensitive' } },
      { whr: { contains: searchParams.q, mode: 'insensitive' } },
      { description: { contains: searchParams.q, mode: 'insensitive' } },
      { user: { name: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { email: { contains: searchParams.q, mode: 'insensitive' } } },
    ]
  }

  const [packages, total, statusCounts] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        user: { select: { id: true, name: true, email: true, casillaNumber: true } },
        packageType: { select: { name: true } },
        shipment: { select: { code: true } },
      },
    }),
    prisma.package.count({ where }),
    prisma.package.groupBy({ by: ['status'], _count: true }),
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
          <h1 className="text-2xl font-bold text-slate-900">Paquetes Miami</h1>
          <p className="text-sm text-slate-500">{total} paquetes registrados</p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-[#F47920]/60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg cursor-not-allowed"
          title="Próximamente"
        >
          + Recibir paquete
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
              placeholder="Código IMC, tracking USPS, WHR, cliente, descripción…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920]"
            />
          </div>
          <input type="hidden" name="status" value={statusFilter} />
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Filtrar</button>
            <Link href="/admin/box/paquetes" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Limpiar</Link>
          </div>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/box/paquetes" active={statusFilter === 'all'} label="Todos" count={counts.ALL} />
        <StatusTab href="/admin/box/paquetes?status=RECEIVED_MIAMI" active={statusFilter === 'RECEIVED_MIAMI'} label="En Miami" count={counts.RECEIVED_MIAMI || 0} />
        <StatusTab href="/admin/box/paquetes?status=IN_SHIPMENT" active={statusFilter === 'IN_SHIPMENT'} label="En embarque" count={counts.IN_SHIPMENT || 0} />
        <StatusTab href="/admin/box/paquetes?status=IN_TRANSIT" active={statusFilter === 'IN_TRANSIT'} label="En tránsito" count={counts.IN_TRANSIT || 0} />
        <StatusTab href="/admin/box/paquetes?status=IN_CUSTOMS" active={statusFilter === 'IN_CUSTOMS'} label="En aduana" count={counts.IN_CUSTOMS || 0} />
        <StatusTab href="/admin/box/paquetes?status=DELIVERED" active={statusFilter === 'DELIVERED'} label="Entregados" count={counts.DELIVERED || 0} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {packages.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-slate-500 text-sm">Sin paquetes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-4 py-2.5 font-semibold">Cliente</th>
                  <th className="px-4 py-2.5 font-semibold">Descripción</th>
                  <th className="px-4 py-2.5 font-semibold">Tracking</th>
                  <th className="px-4 py-2.5 font-semibold">WHR</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Costo</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Peso</th>
                  <th className="px-4 py-2.5 font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 font-semibold">Embarque</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((p) => {
                  const st = STATUS_LABEL[p.status] || { text: p.status, cls: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B2A6B] font-semibold">{p.code}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm">{p.user?.name || p.user?.email || '—'}</p>
                        {p.user?.casillaNumber && <p className="text-[10px] font-mono text-[#F47920]">{p.user.casillaNumber}</p>}
                      </td>
                      <td className="px-4 py-2.5 max-w-[180px] truncate text-slate-700">{p.description}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{p.tracking || '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{p.whr || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{p.costUSD != null ? `$${p.costUSD.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">{p.weightLbs != null ? `${p.weightLbs.toFixed(2)} lb` : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{p.packageType?.name || '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{p.shipment?.code || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                      </td>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/box/paquetes?${new URLSearchParams({ ...searchParams, page: String(page - 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Anterior</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/box/paquetes?${new URLSearchParams({ ...searchParams, page: String(page + 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusTab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
      <span className={`text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>· {count}</span>
    </Link>
  )
}
