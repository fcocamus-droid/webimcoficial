import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import OperationPipeline, { OperationStage, STAGE_CONFIG } from '@/app/components/cargo/OperationPipeline'

export const dynamic = 'force-dynamic'

const ALL_STAGES: OperationStage[] = ['PENDING', 'IN_ORIGIN', 'IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED']

export default async function OperacionesPage({
  searchParams,
}: {
  searchParams: { stage?: string; q?: string; month?: string; year?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/operaciones')

  const userId = session.user.id
  const stageFilter = (searchParams.stage as OperationStage | undefined) ?? null
  const isValidStage = stageFilter && ALL_STAGES.includes(stageFilter)
  const search = (searchParams.q || '').trim()
  const month = parseInt(searchParams.month || '0', 10)
  const year = parseInt(searchParams.year || '0', 10)
  const page = parseInt(searchParams.page || '1', 10) || 1
  const pageSize = 20

  // Get counts by stage (always, regardless of filter)
  const stageCounts = await prisma.$queryRaw<Array<{ stage: string; count: bigint }>>`
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
  for (const r of stageCounts) {
    if (r.stage in counts) counts[r.stage as OperationStage] = Number(r.count)
  }
  const totalOps = Object.values(counts).reduce((a, b) => a + b, 0)

  // Build where clause
  const where: any = { userId }
  if (isValidStage) where.stage = stageFilter
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { quote: { number: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (month > 0 && year > 0) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    where.createdAt = { gte: start, lte: end }
  } else if (year > 0) {
    where.createdAt = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
  }

  // Fetch operations
  const [ops, total] = await Promise.all([
    prisma.$queryRaw<Array<any>>`
      SELECT
        o.id, o.code, o.stage::text AS stage, o."createdAt",
        o."etdOrigin", o."etaDestination",
        q.number AS "quoteNumber", q."originPort", q."destPort", q."shipmentType"::text AS "shipmentType",
        q."totalCostUSD"
      FROM operations o
      JOIN quotes q ON o."quoteId" = q.id
      WHERE o."userId" = ${userId}
        ${isValidStage ? `AND o.stage = '${stageFilter}'::"OperationStage"` : ''}
      ORDER BY o."createdAt" DESC
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `.catch(() => []),
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) AS total FROM operations WHERE "userId" = ${userId}
        ${isValidStage ? `AND stage = '${stageFilter}'::"OperationStage"` : ''}
    `.then(r => Number(r[0]?.total || 0)).catch(() => 0),
  ])

  const totalPages = Math.ceil((total as number) / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:text-[#F47920]">Servicios</Link>
          <span className="mx-1.5">/</span>
          <span>Mis Operaciones</span>
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F47920] rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Mis Operaciones</h1>
              <p className="text-sm text-slate-500">Gestiona y visualiza todas tus operaciones</p>
            </div>
          </div>
          <Link
            href="/cotizar"
            className="inline-flex items-center gap-2 border-2 border-[#F47920] text-[#F47920] hover:bg-[#F47920] hover:text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva cotización
          </Link>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-6">
        <OperationPipeline counts={counts} total={totalOps} showLink={false} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" method="get">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Por ID o n° de cotización"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/30 focus:border-[#F47920] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Mes</label>
            <select name="month" defaultValue={month || ''} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm">
              <option value="">Todos</option>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Año</label>
            <select name="year" defaultValue={year || ''} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm">
              <option value="">Todos</option>
              {[2026, 2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="flex-1 bg-[#1B2A6B] hover:bg-[#162253] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Filtrar
            </button>
            <Link href="/operaciones" className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Limpiar
            </Link>
          </div>
        </form>
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        <StageTab href="/operaciones" active={!isValidStage} label="Todas" />
        {ALL_STAGES.map((s) => {
          const cfg = STAGE_CONFIG[s]
          return (
            <StageTab
              key={s}
              href={`/operaciones?stage=${s}`}
              active={stageFilter === s}
              label={cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase()}
              dotColor={cfg.dotColor}
              count={counts[s]}
            />
          )
        })}
      </div>

      {/* Operations table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {ops.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-6xl mb-3">📦</div>
            <h3 className="font-semibold text-slate-900 mb-2">Aún no tienes operaciones</h3>
            <p className="text-slate-600 text-sm mb-5 max-w-md mx-auto">
              Cuando aceptes una cotización, se convertirá automáticamente en una operación activa con seguimiento punta a punta.
            </p>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-5 py-2.5 rounded-lg font-medium text-sm"
            >
              Crear primera cotización
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID Operación</th>
                  <th className="px-4 py-3 text-left font-medium">Cotización</th>
                  <th className="px-4 py-3 text-left font-medium">Operación</th>
                  <th className="px-4 py-3 text-left font-medium">Origen → Destino</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Etapa</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ops.map((o: any) => {
                  const cfg = STAGE_CONFIG[o.stage as OperationStage]
                  const opType = o.shipmentType === 'AIR' ? 'IMP-AER' : `IMP-MAR ${o.shipmentType.startsWith('FCL') ? 'FCL' : 'LCL'}`
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-[#1B2A6B] font-semibold">{o.code}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{o.quoteNumber}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wide px-2 py-1 rounded">
                          {opType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="font-medium">{o.originPort}</p>
                        <p className="text-xs text-slate-500">→ {o.destPort}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">US${(o.totalCostUSD || 0).toLocaleString('en-US')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg?.color || 'text-slate-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg?.dotColor || 'bg-slate-300'}`} />
                          {cfg?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('es-CL')}</td>
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
          <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageUrl(searchParams, page - 1)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildPageUrl(searchParams, page + 1)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StageTab({
  href,
  active,
  label,
  dotColor,
  count,
}: {
  href: string
  active: boolean
  label: string
  dotColor?: string
  count?: number
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }`}
    >
      {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>· {count}</span>
      )}
    </Link>
  )
}

function buildPageUrl(params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== 'page') sp.set(k, v)
  }
  sp.set('page', String(page))
  return `/operaciones?${sp.toString()}`
}
