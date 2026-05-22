import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserScope } from '@/lib/admin-scope'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
  SENT: { text: 'Enviada', cls: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { text: 'Aceptada', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { text: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { text: 'Expirada', cls: 'bg-amber-100 text-amber-700' },
}

const SHIPMENT_LABEL: Record<string, string> = {
  LCL: 'LCL', FCL_20: "FCL 20'", FCL_40: "FCL 40'", FCL_40HC: "FCL HC", AIR: 'Aéreo',
}

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; type?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/cotizaciones')

  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') redirect('/no-autorizado')

  const scope = await getUserScope(session.user.id, role)

  const page = parseInt(searchParams.page || '1') || 1
  const pageSize = 25
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = {}
  if (scope !== null) where.userId = { in: scope }
  if (searchParams.status && searchParams.status !== 'all') where.status = searchParams.status
  if (searchParams.type && searchParams.type !== 'all') where.shipmentType = searchParams.type
  if (searchParams.q) {
    where.OR = [
      { number: { contains: searchParams.q, mode: 'insensitive' } },
      { commodity: { contains: searchParams.q, mode: 'insensitive' } },
      { user: { name: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { email: { contains: searchParams.q, mode: 'insensitive' } } },
    ]
  }

  const [quotes, total, statusCounts] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
      include: {
        user: { select: { id: true, name: true, email: true, company: true } },
      },
    }),
    prisma.quote.count({ where }),
    prisma.quote.groupBy({
      by: ['status'],
      where: scope !== null ? { userId: { in: scope } } : {},
      _count: true,
    }),
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="text-sm text-slate-500">
            {role === 'EXECUTIVE' ? `Tu cartera · ${total} cotizaciones` : `Todas las cotizaciones · ${total} en total`}
          </p>
        </div>
        <Link
          href="/cotizar"
          className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva cotización
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-white border border-slate-200 rounded-xl p-4" method="get">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q || ''}
              placeholder="N°, cliente, mercadería…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select name="type" defaultValue={searchParams.type || 'all'} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="all">Todos</option>
              <option value="LCL">LCL</option>
              <option value="FCL_20">FCL 20'</option>
              <option value="FCL_40">FCL 40'</option>
              <option value="FCL_40HC">FCL 40' HC</option>
              <option value="AIR">Aéreo</option>
            </select>
          </div>
          <input type="hidden" name="status" value={statusFilter} />
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Filtrar</button>
            <Link href="/admin/cotizaciones" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <StatusTab href="/admin/cotizaciones" active={statusFilter === 'all'} label="Todas" count={counts.ALL} />
        <StatusTab href="/admin/cotizaciones?status=DRAFT" active={statusFilter === 'DRAFT'} label="Borrador" count={counts.DRAFT || 0} color="slate" />
        <StatusTab href="/admin/cotizaciones?status=SENT" active={statusFilter === 'SENT'} label="Enviadas" count={counts.SENT || 0} color="blue" />
        <StatusTab href="/admin/cotizaciones?status=ACCEPTED" active={statusFilter === 'ACCEPTED'} label="Aceptadas" count={counts.ACCEPTED || 0} color="emerald" />
        <StatusTab href="/admin/cotizaciones?status=REJECTED" active={statusFilter === 'REJECTED'} label="Rechazadas" count={counts.REJECTED || 0} color="red" />
        <StatusTab href="/admin/cotizaciones?status=EXPIRED" active={statusFilter === 'EXPIRED'} label="Expiradas" count={counts.EXPIRED || 0} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-semibold text-slate-900 mb-1">Sin cotizaciones</h3>
            <p className="text-slate-500 text-sm">No hay cotizaciones que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">N°</th>
                  <th className="px-5 py-2.5 font-semibold">Cliente</th>
                  <th className="px-5 py-2.5 font-semibold">Tipo</th>
                  <th className="px-5 py-2.5 font-semibold">Ruta</th>
                  <th className="px-5 py-2.5 font-semibold">Mercadería</th>
                  <th className="px-5 py-2.5 font-semibold text-right">USD</th>
                  <th className="px-5 py-2.5 font-semibold">Estado</th>
                  <th className="px-5 py-2.5 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((q) => {
                  const st = STATUS_LABEL[q.status] || { text: q.status, cls: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-5 py-2.5">
                        <Link href={`/mis-cotizaciones/${q.id}`} className="font-mono text-xs text-[#1B2A6B] font-semibold hover:underline">
                          {q.number}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-900">{q.user?.name || q.user?.email || '—'}</p>
                        {q.user?.company && <p className="text-xs text-slate-400">{q.user.company}</p>}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wide px-2 py-1 rounded">
                          {SHIPMENT_LABEL[q.shipmentType] || q.shipmentType}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600">
                        <p>{q.originPort}</p>
                        <p className="text-slate-400">→ {q.destPort}</p>
                      </td>
                      <td className="px-5 py-2.5 max-w-[180px] truncate text-slate-700">{q.commodity}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-semibold">${q.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString('es-CL')}</td>
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
              <Link href={`/admin/cotizaciones?${new URLSearchParams({ ...searchParams, page: String(page - 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Anterior</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/cotizaciones?${new URLSearchParams({ ...searchParams, page: String(page + 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusTab({ href, active, label, count, color }: { href: string; active: boolean; label: string; count: number; color?: string }) {
  const dotColors: Record<string, string> = {
    slate: 'bg-slate-400',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  }
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {color && <span className={`w-2 h-2 rounded-full ${dotColors[color] || 'bg-slate-300'}`} />}
      {label}
      <span className={`text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>· {count}</span>
    </Link>
  )
}
