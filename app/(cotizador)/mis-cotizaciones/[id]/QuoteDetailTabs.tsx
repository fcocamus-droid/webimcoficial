'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Quote = {
  id: string
  number: string
  commodity: string
  hsCode: string | null
  notes: string | null
  status: string
  shipmentType: string
  incoterm: string
  cbm: number | null
  weightKg: number | null
  chargeableKg: number | null
  containerQty: number | null
  freightCost: number
  originCost: number
  destCost: number
  customsCost: number | null
  insuranceCost: number | null
  totalCostUSD: number
  totalCostCLP: number | null
  usdClpRate: number | null
  cargoValueUSD: number | null
}

type Item = {
  id: string
  description: string
  cost: number
  currency: string
  type: string
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  FREIGHT: 'Flete',
  ORIGIN: 'Origen',
  DESTINATION: 'Destino',
  CUSTOMS: 'Aduana',
  INSURANCE: 'Seguro',
  SURCHARGE: 'Recargo',
  LAST_MILE: 'Última milla',
}

const ITEM_TYPE_COLOR: Record<string, string> = {
  FREIGHT: 'bg-blue-100 text-blue-700',
  ORIGIN: 'bg-emerald-100 text-emerald-700',
  DESTINATION: 'bg-purple-100 text-purple-700',
  CUSTOMS: 'bg-amber-100 text-amber-700',
  INSURANCE: 'bg-cyan-100 text-cyan-700',
  SURCHARGE: 'bg-rose-100 text-rose-700',
  LAST_MILE: 'bg-slate-100 text-slate-700',
}

export default function QuoteDetailTabs({
  quote,
  items,
  hasOperation,
  operationCode,
}: {
  quote: Quote
  items: Item[]
  hasOperation: boolean
  operationCode: string | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'info' | 'desglose' | 'activacion'>('info')
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function activateOperation() {
    if (!confirm('¿Confirmar la cotización y activar la operación? Esto creará un seguimiento punta a punta.')) return
    setActivating(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al activar')
      router.push(`/operaciones/${data.operationId}`)
    } catch (e: any) {
      setError(e.message || 'Error desconocido')
    } finally {
      setActivating(false)
    }
  }

  // Group items by type
  const groupedItems = items.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  const itemTotals = Object.entries(groupedItems).map(([type, list]) => ({
    type,
    total: list.reduce((s, i) => s + i.cost, 0),
    items: list,
  }))

  return (
    <div className="border-t border-slate-100 pt-5">
      {/* Tabs nav */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
          Información de la carga
        </TabButton>
        <TabButton active={tab === 'desglose'} onClick={() => setTab('desglose')}>
          Desglose Cotización
        </TabButton>
        <TabButton active={tab === 'activacion'} onClick={() => setTab('activacion')}>
          Activación de la operación
        </TabButton>
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        <div className="grid md:grid-cols-2 gap-4">
          <InfoBlock label="Mercadería" value={quote.commodity || '—'} />
          <InfoBlock label="HS Code" value={quote.hsCode || '—'} />
          <InfoBlock label="Modalidad CV" value={quote.incoterm} />
          <InfoBlock label="Valor declarado" value={quote.cargoValueUSD ? `USD ${Number(quote.cargoValueUSD).toLocaleString('en-US')}` : '—'} />
          {quote.shipmentType === 'LCL' && (
            <>
              <InfoBlock label="Volumen" value={quote.cbm ? `${quote.cbm} CBM` : '—'} />
              <InfoBlock label="Peso físico" value={quote.weightKg ? `${quote.weightKg} kg` : '—'} />
            </>
          )}
          {quote.shipmentType === 'AIR' && (
            <InfoBlock label="Peso facturable" value={quote.chargeableKg ? `${quote.chargeableKg} kg` : '—'} />
          )}
          {quote.shipmentType?.startsWith('FCL') && (
            <InfoBlock label="Cantidad de contenedores" value={quote.containerQty ? String(quote.containerQty) : '—'} />
          )}
          {quote.notes && (
            <div className="md:col-span-2">
              <InfoBlock label="Notas" value={quote.notes} />
            </div>
          )}
        </div>
      )}

      {tab === 'desglose' && (
        <div>
          {items.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800">
                Tu cotización aún no está finalizada. Completa el proceso de cotización para ver el desglose de costos.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {itemTotals.map(({ type, total, items: typeItems }) => (
                  <div key={type} className="bg-slate-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${ITEM_TYPE_COLOR[type] || 'bg-slate-100 text-slate-700'}`}>
                        {ITEM_TYPE_LABELS[type] || type}
                      </span>
                      <span className="font-mono font-semibold text-sm">
                        USD ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {typeItems.map((item) => (
                        <div key={item.id} className="px-4 py-2 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{item.description}</span>
                          <span className="font-mono text-slate-900">
                            {item.currency} {item.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand total */}
              <div className="mt-5 bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-200 text-sm">Total cotización</span>
                  <span className="text-3xl font-bold text-[#F47920]">
                    USD ${quote.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {quote.totalCostCLP && quote.usdClpRate && (
                  <div className="flex items-center justify-between text-xs text-blue-200">
                    <span>Equivalente en CLP (TC: ${quote.usdClpRate})</span>
                    <span>CLP ${quote.totalCostCLP.toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'activacion' && (
        <div>
          {hasOperation ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="font-bold text-emerald-900 mb-2">Operación activada</h3>
              <p className="text-sm text-emerald-700 mb-4">
                Esta cotización ya fue convertida en operación.
                <br />Código: <strong className="font-mono">{operationCode}</strong>
              </p>
              <a
                href={`/operaciones`}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm"
              >
                Ver operación →
              </a>
            </div>
          ) : quote.status === 'REJECTED' || quote.status === 'EXPIRED' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-slate-600 text-sm">
                Esta cotización está {quote.status === 'EXPIRED' ? 'expirada' : 'rechazada'} y no puede activarse.
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚡</span> Activar operación
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Al activar la cotización, se crea una <strong>operación de seguimiento</strong> que pasará por las 5 etapas del pipeline:
                </p>
                <ol className="text-xs text-amber-800 space-y-1.5 mb-3">
                  <li><strong>1.</strong> 🟠 <strong>PENDIENTE</strong> — Activación + pago inicial</li>
                  <li><strong>2.</strong> 🔴 <strong>EN ORIGEN</strong> — Recepción de carga en bodega</li>
                  <li><strong>3.</strong> 🔵 <strong>EN TRÁNSITO</strong> — Embarque hacia Chile</li>
                  <li><strong>4.</strong> 🟣 <strong>EN DESTINO</strong> — Aduana e internación</li>
                  <li><strong>5.</strong> 🟢 <strong>ENTREGADO</strong> — Entregado al cliente</li>
                </ol>
                <p className="text-xs text-amber-700">
                  Te enviaremos notificaciones en cada cambio de etapa.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                onClick={activateOperation}
                disabled={activating}
                className="w-full bg-[#F47920] hover:bg-[#e06810] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-base font-bold shadow-lg shadow-[#F47920]/25 transition-all"
              >
                {activating ? 'Activando operación…' : `🚀 Activar operación (USD ${quote.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })})`}
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">
                Al activar, aceptas los términos de servicio y el monto cotizado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
        active
          ? 'text-[#F47920] border-[#F47920]'
          : 'text-slate-500 hover:text-slate-700 border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  )
}
