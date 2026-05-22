import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800' },
  RECEIVED: { text: 'Recibida', cls: 'bg-green-100 text-green-800' },
  DISCREPANCY: { text: 'Con discrepancia', cls: 'bg-orange-100 text-orange-800' },
  CANCELLED: { text: 'Cancelada', cls: 'bg-slate-100 text-slate-600' },
}

export default async function AdminPrealertasPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/box/prealertas')
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') redirect('/no-autorizado')

  const page = parseInt(searchParams.page || '1') || 1
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (searchParams.status && searchParams.status !== 'all') where.status = searchParams.status
  if (searchParams.q) {
    where.OR = [
      { code: { contains: searchParams.q, mode: 'insensitive' } },
      { tracking: { contains: searchParams.q, mode: 'insensitive' } },
      { store: { contains: searchParams.q, mode: 'insensitive' } },
      { description: { contains: searchParams.q, mode: 'insensitive' } },
      { user: { name: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { email: { contains: searchParams.q, mode: 'insensitive' } } },
    ]
  }

  const [prealerts, total, statusCounts] = await Promise.all([
    prisma.preAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        user: { select: { name: true, email: true, casillaNumber: true } },
        packageType: { select: { name: true } },
      },
    }),
    prisma.preAlert.count({ where }),
    prisma.preAlert.groupBy({ by: ['status'], _count: true }),
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pre-alertas</h1>
        <p className="text-sm text-slate-500">{total} pre-alertas registradas · {counts.PENDING || 0} pendientes</p>
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
              placeholder="Código, tracking, tienda, cliente…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920]"
            />
          </div>
          <input type="hidden" name="status" value={statusFilter} />
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Filtrar</button>
            <Link href="/admin/box/prealertas" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Limpiar</Link>
          </div>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/box/prealertas" active={statusFilter === 'all'} label="Todas" count={counts.ALL} />
        <StatusTab href="/admin/box/prealertas?status=PENDING" active={statusFilter === 'PENDING'} label="Pendientes" count={counts.PENDING || 0} highlight={counts.PENDING > 0} />
        <StatusTab href="/admin/box/prealertas?status=RECEIVED" active={statusFilter === 'RECEIVED'} label="Recibidas" count={counts.RECEIVED || 0} />
        <StatusTab href="/admin/box/prealertas?status=DISCREPANCY" active={statusFilter === 'DISCREPANCY'} label="Discrepancia" count={counts.DISCREPANCY || 0} />
        <StatusTab href="/admin/box/prealertas?status=CANCELLED" active={statusFilter === 'CANCELLED'} label="Canceladas" count={counts.CANCELLED || 0} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {prealerts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-slate-500 text-sm">Sin pre-alertas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Código</th>
                  <th className="px-4 py-2.5 font-semibold">Cliente</th>
                  <th className="px-4 py-2.5 font-semibold">Tienda</th>
                  <th className="px-4 py-2.5 font-semibold">Descripción</th>
                  <th className="px-4 py-2.5 font-semibold">Tracking</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Valor</th>
                  <th className="px-4 py-2.5 font-semibold">Categoría</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prealerts.map((pa) => {
                  const st = STATUS_LABEL[pa.status] || { text: pa.status, cls: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={pa.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B2A6B] font-semibold">{pa.code}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm">{pa.user?.name || pa.user?.email}</p>
                        {pa.user?.casillaNumber && <p className="text-[10px] font-mono text-[#F47920]">{pa.user.casillaNumber}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-sm">{pa.store || '—'}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate text-slate-700">{pa.description}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{pa.tracking || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono">USD ${pa.valueUSD.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{pa.packageType?.name || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(pa.createdAt).toLocaleDateString('es-CL')}</td>
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
            {page > 1 && <Link href={`/admin/box/prealertas?${new URLSearchParams({ ...searchParams, page: String(page - 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Anterior</Link>}
            {page < totalPages && <Link href={`/admin/box/prealertas?${new URLSearchParams({ ...searchParams, page: String(page + 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente</Link>}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusTab({ href, active, label, count, highlight }: { href: string; active: boolean; label: string; count: number; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-[#1B2A6B] text-white'
          : highlight
          ? 'bg-[#F47920]/10 text-[#F47920] border border-[#F47920]/30'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
      <span className={`text-xs ${active ? 'text-white/70' : 'opacity-60'}`}>· {count}</span>
    </Link>
  )
}
