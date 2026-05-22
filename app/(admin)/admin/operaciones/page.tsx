import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserScope } from '@/lib/admin-scope'
import { STAGE_CONFIG, STAGE_ORDER, OperationStage } from '@/app/components/cargo/OperationPipeline'
import OperationRowActions from './OperationRowActions'

export const dynamic = 'force-dynamic'

const SHIPMENT_LABEL: Record<string, string> = {
  LCL: 'LCL', FCL_20: "FCL 20'", FCL_40: "FCL 40'", FCL_40HC: "FCL HC", AIR: 'Aéreo',
}

export default async function AdminOperacionesPage({
  searchParams,
}: {
  searchParams: { stage?: string; q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/operaciones')

  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') redirect('/no-autorizado')

  const scope = await getUserScope(session.user.id, role)

  const page = parseInt(searchParams.page || '1') || 1
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const stageFilter = searchParams.stage && STAGE_ORDER.includes(searchParams.stage as OperationStage)
    ? (searchParams.stage as OperationStage)
    : null

  // Build SQL filters
  const scopeClause = scope === null ? '' : `AND o."userId" IN (${scope.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')})`
  const stageClause = stageFilter ? `AND o.stage = '${stageFilter}'::"OperationStage"` : ''
  const searchClause = searchParams.q
    ? `AND (o.code ILIKE '%${searchParams.q.replace(/'/g, "''")}%' OR q.number ILIKE '%${searchParams.q.replace(/'/g, "''")}%' OR u.name ILIKE '%${searchParams.q.replace(/'/g, "''")}%' OR u.email ILIKE '%${searchParams.q.replace(/'/g, "''")}%')`
    : ''

  const baseClause = `WHERE 1=1 ${scopeClause}`

  const [ops, totalRows, stageCountsRaw] = await Promise.all([
    prisma.$queryRawUnsafe<Array<any>>(`
      SELECT o.id, o.code, o.stage::text AS stage, o."createdAt", o."pendingPayment",
        o."etdOrigin", o."etaDestination", o."vesselName", o."blnumber", o."awbNumber",
        q.id AS "quoteId", q.number AS "quoteNumber", q."originPort", q."destPort",
        q."shipmentType"::text AS "shipmentType", q."totalCostUSD",
        u.id AS "userId", u.name AS "userName", u.email AS "userEmail", u.company AS "userCompany"
      FROM operations o
      JOIN quotes q ON o."quoteId" = q.id
      JOIN users u ON o."userId" = u.id
      ${baseClause} ${stageClause} ${searchClause}
      ORDER BY o."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${skip}
    `),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) AS count
      FROM operations o
      JOIN quotes q ON o."quoteId" = q.id
      JOIN users u ON o."userId" = u.id
      ${baseClause} ${stageClause} ${searchClause}
    `).then((r) => Number(r[0]?.count || 0)),
    prisma.$queryRawUnsafe<Array<{ stage: string; count: bigint }>>(`
      SELECT stage::text, COUNT(*) AS count
      FROM operations o ${baseClause.replace('o.', 'o.')}
      GROUP BY stage
    `),
  ])

  const stageCounts: Record<OperationStage, number> = { PENDING: 0, IN_ORIGIN: 0, IN_TRANSIT: 0, AT_DESTINATION: 0, DELIVERED: 0 }
  for (const r of stageCountsRaw) {
    if (r.stage in stageCounts) stageCounts[r.stage as OperationStage] = Number(r.count)
  }
  const totalOps = Object.values(stageCounts).reduce((a, b) => a + b, 0)
  const totalPages = Math.ceil(totalRows / pageSize)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operaciones</h1>
        <p className="text-sm text-slate-500">
          {role === 'EXECUTIVE' ? `Tu cartera · ${totalOps} en pipeline` : `Pipeline completo · ${totalOps} operaciones`}
        </p>
      </div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STAGE_ORDER.map((stage) => {
          const cfg = STAGE_CONFIG[stage]
          const isActive = stageFilter === stage
          return (
            <Link
              key={stage}
              href={`/admin/operaciones?stage=${stage}`}
              className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
                isActive ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stageCounts[stage]}</p>
            </Link>
          )
        })}
      </div>

      {/* Filter form */}
      <form className="bg-white rounded-xl border border-slate-200 p-4" method="get">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q || ''}
              placeholder="Código OPN, cliente, cotización…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920]"
            />
          </div>
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          <div className="flex items-end gap-2 md:col-span-2">
            <button type="submit" className="bg-[#1B2A6B] hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Filtrar</button>
            <Link href="/admin/operaciones" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Limpiar</Link>
            {stageFilter && (
              <Link
                href="/admin/operaciones"
                className="ml-auto inline-flex items-center gap-1.5 text-xs bg-[#F47920]/10 text-[#F47920] font-medium px-3 py-2 rounded-lg"
              >
                Etapa: {STAGE_CONFIG[stageFilter].label}
                <span>×</span>
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {ops.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-5xl mb-3">📦</div>
            <h3 className="font-semibold text-slate-900 mb-1">Sin operaciones</h3>
            <p className="text-slate-500 text-sm">No hay operaciones activas con estos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Operación</th>
                  <th className="px-5 py-2.5 font-semibold">Cotización</th>
                  <th className="px-5 py-2.5 font-semibold">Cliente</th>
                  <th className="px-5 py-2.5 font-semibold">Tipo</th>
                  <th className="px-5 py-2.5 font-semibold">Ruta</th>
                  <th className="px-5 py-2.5 font-semibold text-right">USD</th>
                  <th className="px-5 py-2.5 font-semibold">Etapa</th>
                  <th className="px-5 py-2.5 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ops.map((o: any) => {
                  const cfg = STAGE_CONFIG[o.stage as OperationStage]
                  const isDelivered = o.stage === 'DELIVERED'
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5">
                        <Link href={`/operaciones/${o.id}`} className="font-mono text-xs text-[#1B2A6B] font-semibold hover:underline">
                          {o.code}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link href={`/mis-cotizaciones/${o.quoteId}`} className="font-mono text-xs text-slate-600 hover:text-[#F47920]">
                          {o.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-900 text-sm">{o.userName || o.userEmail}</p>
                        {o.userCompany && <p className="text-xs text-slate-400">{o.userCompany}</p>}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wide px-2 py-1 rounded">
                          {SHIPMENT_LABEL[o.shipmentType] || o.shipmentType}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-600">
                        <p>{o.originPort}</p>
                        <p className="text-slate-400">→ {o.destPort}</p>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono font-semibold">${Number(o.totalCostUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg?.color}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg?.dotColor}`} />
                          {cfg?.label}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <OperationRowActions
                          operationId={o.id}
                          currentStage={o.stage}
                          disabled={isDelivered}
                        />
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
              <Link href={`/admin/operaciones?${new URLSearchParams({ ...searchParams, page: String(page - 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Anterior</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/operaciones?${new URLSearchParams({ ...searchParams, page: String(page + 1) } as any).toString()}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Siguiente</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
