import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import QuoteDetailTabs from './QuoteDetailTabs'

export const dynamic = 'force-dynamic'

const SHIPMENT_LABELS: Record<string, string> = {
  LCL: 'LCL (Carga Suelta)',
  FCL_20: "FCL 20'",
  FCL_40: "FCL 40'",
  FCL_40HC: "FCL 40'HC",
  AIR: 'Aéreo',
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700' },
  SENT: { label: 'Abierta', cls: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'Confirmada', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rechazada', cls: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirada', cls: 'bg-orange-100 text-orange-700' },
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect(`/login?callbackUrl=/mis-cotizaciones/${params.id}`)

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true, company: true } },
    },
  })

  if (!quote) notFound()

  const role = (session.user as any).role
  if (quote.userId !== session.user.id && role !== 'SUPERADMIN' && role !== 'EXECUTIVE') {
    redirect('/mis-cotizaciones')
  }

  // Check if there's an associated operation
  const operations = await prisma.$queryRaw<Array<{ id: string; code: string; stage: string }>>`
    SELECT id, code, stage::text AS stage FROM operations WHERE "quoteId" = ${params.id} LIMIT 1
  `
  const operation = operations[0] || null

  const totalKg = quote.weightKg || quote.chargeableKg || 0
  const totalCBM = quote.cbm || 0
  const formattedDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('es-CL') : '—'

  const pill = STATUS_PILL[quote.status] || STATUS_PILL.DRAFT

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/dashboard" className="hover:text-[#F47920]">Servicios</Link>
        <span className="mx-1.5">/</span>
        <Link href="/mis-cotizaciones" className="hover:text-[#F47920]">Mis Cotizaciones</Link>
        <span className="mx-1.5">/</span>
        <span>Detalle</span>
      </nav>

      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/mis-cotizaciones"
            className="inline-flex items-center gap-1.5 bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#F47920]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Detalle Cotización</h1>
          </div>
        </div>
        {operation && (
          <Link
            href={`/operaciones/${operation.id}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
            </svg>
            Ver operación {operation.code} →
          </Link>
        )}
      </div>

      {/* 12-field grid (Comexpoint style) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <Field label="# ID Cotización" value={quote.number} mono />
          <Field label="📋 Cliente" value={quote.user?.name || quote.user?.email || '—'} />
          <Field label="📅 Fecha Creación" value={formattedDate(quote.createdAt)} />
          <Field
            label="ℹ️ Estado"
            value={
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${pill.cls}`}>
                {pill.label}
              </span>
            }
          />

          <Field label="🔄 Tipo Operación" value="IMPORTACIÓN" />
          <Field label="🚢 Tipo Transporte" value={quote.shipmentType === 'AIR' ? 'AÉREO' : 'MARÍTIMO'} />
          <Field label="📦 Tipo Embarque" value={SHIPMENT_LABELS[quote.shipmentType] || quote.shipmentType} />
          <Field label="⏰ Validez" value={formattedDate(quote.validUntil)} />

          <Field
            label="💼 Modalidad"
            value={quote.incoterm}
          />
          <Field
            label="💵 Valor Mercancía (USD)"
            value={quote.cargoValueUSD ? `US$${Number(quote.cargoValueUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            highlight
          />
          <Field
            label="📊 Total Operación (USD)"
            value={`US$${Number(quote.totalCostUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            highlight
          />
          <Field
            label="🔒 Monto Activación"
            value={operation ? 'Activada' : 'Pendiente'}
            highlight={!!operation}
          />

          <Field label="📍 Origen" value={quote.originPort} />
          <Field label="🏁 Destino" value={quote.destPort} />
          <Field label="⚖️ Peso Total" value={totalKg > 0 ? `${totalKg.toFixed(2)} kg` : '—'} />
          <Field label="📐 Volumen Total" value={totalCBM > 0 ? `${totalCBM.toFixed(3)} m³` : '—'} />
        </div>

        {/* Tabs */}
        <QuoteDetailTabs
          quote={{
            id: quote.id,
            number: quote.number,
            commodity: quote.commodity,
            hsCode: quote.hsCode,
            notes: quote.notes,
            status: quote.status,
            shipmentType: quote.shipmentType,
            incoterm: quote.incoterm,
            cbm: quote.cbm,
            weightKg: quote.weightKg,
            chargeableKg: quote.chargeableKg,
            containerQty: quote.containerQty,
            freightCost: quote.freightCost,
            originCost: quote.originCost,
            destCost: quote.destCost,
            customsCost: quote.customsCost,
            insuranceCost: quote.insuranceCost,
            totalCostUSD: quote.totalCostUSD,
            totalCostCLP: quote.totalCostCLP,
            usdClpRate: quote.usdClpRate,
            cargoValueUSD: quote.cargoValueUSD,
          }}
          items={quote.items.map((i) => ({
            id: i.id,
            description: i.description,
            cost: i.cost,
            currency: i.currency,
            type: i.type,
          }))}
          hasOperation={!!operation}
          operationCode={operation?.code || null}
        />
      </div>
    </div>
  )
}

function Field({ label, value, mono, highlight }: { label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50'}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-[#F47920]' : 'text-slate-900'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  )
}
