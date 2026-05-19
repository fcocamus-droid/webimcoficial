import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGE_CONFIG, STAGE_ORDER, OperationStage } from '@/app/components/cargo/OperationPipeline'

export const dynamic = 'force-dynamic'

const SHIPMENT_LABELS: Record<string, string> = {
  LCL: 'LCL', FCL_20: "FCL 20'", FCL_40: "FCL 40'", FCL_40HC: "FCL 40'HC", AIR: 'Aéreo',
}

export default async function OperationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?callbackUrl=/operaciones/${params.id}`)

  const opRows = await prisma.$queryRaw<Array<any>>`
    SELECT o.*, o.stage::text AS stage,
      q.id AS "quoteId", q.number AS "quoteNumber", q."originPort", q."destPort",
      q."shipmentType"::text AS "shipmentType", q."totalCostUSD", q.incoterm::text AS incoterm,
      q.commodity, q."cargoValueUSD",
      u.name AS "userName", u.email AS "userEmail", u.company AS "userCompany"
    FROM operations o
    JOIN quotes q ON o."quoteId" = q.id
    JOIN users u ON o."userId" = u.id
    WHERE o.id = ${params.id}
    LIMIT 1
  `
  const op = opRows[0]
  if (!op) notFound()

  const role = (session.user as any).role
  if (op.userId !== session.user.id && role !== 'SUPERADMIN' && role !== 'EXECUTIVE') {
    redirect('/operaciones')
  }

  const events = await prisma.$queryRaw<Array<any>>`
    SELECT e.*, e.stage::text AS stage, u.name AS "userName"
    FROM operation_events e
    LEFT JOIN users u ON e."userId" = u.id
    WHERE e."operationId" = ${params.id}
    ORDER BY e."createdAt" DESC
  `

  const documents = await prisma.$queryRaw<Array<any>>`
    SELECT * FROM operation_documents WHERE "operationId" = ${params.id} ORDER BY "createdAt" DESC
  `

  const currentStageIdx = STAGE_ORDER.indexOf(op.stage as OperationStage)
  const cfg = STAGE_CONFIG[op.stage as OperationStage]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/dashboard" className="hover:text-[#F47920]">Servicios</Link>
        <span className="mx-1.5">/</span>
        <Link href="/operaciones" className="hover:text-[#F47920]">Operaciones</Link>
        <span className="mx-1.5">/</span>
        <span>{op.code}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/operaciones" className="inline-flex items-center gap-1.5 bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {op.code}
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 ${cfg?.color}`}>
                <span className={`w-2 h-2 rounded-full ${cfg?.dotColor}`} />
                {cfg?.label}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cotización <Link href={`/mis-cotizaciones/${op.quoteId}`} className="text-[#F47920] hover:underline">{op.quoteNumber}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Etapa actual</h2>
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 rounded-full" />
          <div
            className="absolute top-4 left-4 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `calc(${(currentStageIdx / (STAGE_ORDER.length - 1)) * 100}% - 16px)` }}
          />
          <div className="relative grid grid-cols-5 gap-2">
            {STAGE_ORDER.map((stage, idx) => {
              const sc = STAGE_CONFIG[stage]
              const reached = idx <= currentStageIdx
              return (
                <div key={stage} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    reached
                      ? `${sc.dotColor} border-white text-white shadow-md`
                      : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {reached ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <p className={`mt-2 text-[10px] md:text-xs font-semibold tracking-wide ${reached ? sc.color : 'text-slate-400'}`}>
                    {sc.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Operation data */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Datos de la operación</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DataField label="Cliente" value={op.userName || op.userEmail} />
              <DataField label="Empresa" value={op.userCompany || '—'} />
              <DataField label="Origen" value={op.originPort} />
              <DataField label="Destino" value={op.destPort} />
              <DataField label="Modalidad" value={SHIPMENT_LABELS[op.shipmentType] || op.shipmentType} />
              <DataField label="Incoterm" value={op.incoterm} />
              <DataField label="Vessel" value={op.vesselName || 'Por confirmar'} />
              <DataField label="Voyage" value={op.voyageNumber || '—'} />
              <DataField label="B/L" value={op.blnumber || '—'} mono />
              <DataField label="AWB" value={op.awbNumber || '—'} mono />
              <DataField label="ETD origen" value={op.etdOrigin ? new Date(op.etdOrigin).toLocaleDateString('es-CL') : '—'} />
              <DataField label="ETA destino" value={op.etaDestination ? new Date(op.etaDestination).toLocaleDateString('es-CL') : '—'} />
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Documentos</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Aún no hay documentos cargados. Tu ejecutivo subirá BL, factura, packing list y demás documentos aquí.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-200 group"
                  >
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">{doc.type}</p>
                    </div>
                    <span className="text-xs text-[#F47920] opacity-0 group-hover:opacity-100">Descargar →</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: pricing + timeline */}
        <div className="space-y-5">
          {/* Pricing card */}
          <div className="bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-2xl p-5 text-white">
            <p className="text-xs text-blue-200 uppercase tracking-wide mb-1">Valor operación</p>
            <p className="text-3xl font-bold text-[#F47920] mb-3">USD ${Number(op.totalCostUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-200">Pagado</span>
                <span className="font-mono">US${Number(op.totalPaid || 0).toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Pendiente</span>
                <span className="font-mono text-amber-200">US${Number(op.pendingPayment || 0).toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Timeline</h2>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sin eventos aún</p>
            ) : (
              <div className="space-y-3">
                {events.map((e: any, idx: number) => {
                  const ec = e.stage ? STAGE_CONFIG[e.stage as OperationStage] : null
                  return (
                    <div key={e.id} className="flex gap-3 relative">
                      {idx < events.length - 1 && (
                        <div className="absolute left-[14px] top-7 w-0.5 h-full bg-slate-200" />
                      )}
                      <div className={`w-7 h-7 rounded-full ${ec?.dotColor || 'bg-slate-300'} flex-shrink-0 flex items-center justify-center text-white relative z-10`}>
                        <span className="text-[10px]">●</span>
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <p className="text-sm font-medium text-slate-900">{e.title}</p>
                        {e.description && <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(e.createdAt).toLocaleString('es-CL')}
                          {e.userName && ` · ${e.userName}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DataField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className={`text-sm font-semibold text-slate-900 mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}
