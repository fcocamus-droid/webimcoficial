'use client'

import { useEffect, useState } from 'react'
import { useQuoteWizard } from '@/hooks/useQuoteWizard'
import type { QuoteResult, QuoteLineItem } from '@/types'

const SECTION_LABELS: Record<string, string> = {
  FREIGHT: 'FLETE',
  ORIGIN: 'GASTOS ORIGEN',
  DESTINATION: 'GASTOS DESTINO',
  CUSTOMS: 'ADUANA',
  INSURANCE: 'SEGURO',
  LAST_MILE: 'ULTIMA MILLA',
  SURCHARGE: 'RECARGOS',
}

const SECTION_ORDER = ['FREIGHT', 'SURCHARGE', 'ORIGIN', 'DESTINATION', 'CUSTOMS', 'INSURANCE', 'LAST_MILE']

function groupByType(items: QuoteLineItem[]): Record<string, QuoteLineItem[]> {
  const groups: Record<string, QuoteLineItem[]> = {}
  for (const item of items) {
    const key = item.type
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function sectionTotal(items: QuoteLineItem[]): number {
  return items.reduce((sum, item) => sum + item.cost, 0)
}

export default function Step5Result() {
  const { data, result, updateData, setStep, reset } = useQuoteWizard()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedNumber, setSavedNumber] = useState<string | null>(null)

  useEffect(() => {
    async function calculate() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/quotes/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.error || 'Error al calcular la cotizacion')
        }

        const result: QuoteResult = await res.json()
        setQuoteResult(result)
      } catch (err: any) {
        setError(err.message || 'Error inesperado')
      } finally {
        setLoading(false)
      }
    }
    calculate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveQuote() {
    if (!quoteResult) return
    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: data, result: quoteResult }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'Error al guardar la cotizacion')
      }
      const saved = await res.json()
      setSavedNumber(saved.number)
    } catch (err: any) {
      alert(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleNewQuote() {
    reset()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 border-4 border-[#1B2A6B] border-t-[#F47920] rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Calculando tu cotizacion...</p>
        <p className="text-sm text-gray-400 mt-1">Esto puede tomar unos segundos</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No pudimos calcular tu cotizacion</h3>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2.5 bg-[#1B2A6B] text-white rounded-xl text-sm font-medium hover:bg-[#152255] transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  if (!quoteResult) return null

  const grouped = groupByType(quoteResult.breakdown)
  const validUntil = new Date(quoteResult.validUntil)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1B2A6B]">Resultado de Cotizacion</h2>
          <p className="text-sm text-gray-500">Desglose completo de tu envio</p>
        </div>
        {quoteResult.carrier && quoteResult.carrier !== 'N/A' && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Naviera / Aerolinea</div>
            <div className="text-sm font-bold text-[#1B2A6B]">{quoteResult.carrier}</div>
          </div>
        )}
      </div>

      {/* Saved confirmation */}
      {savedNumber && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-800">
            Cotizacion <strong>{savedNumber}</strong> guardada exitosamente.
          </span>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B2A6B] text-white">
              <th className="text-left px-4 py-3 font-semibold">Concepto</th>
              <th className="text-right px-4 py-3 font-semibold">Costo (USD)</th>
            </tr>
          </thead>
          <tbody>
            {SECTION_ORDER.map((sectionKey) => {
              const items = grouped[sectionKey]
              if (!items || items.length === 0) return null

              return (
                <tbody key={sectionKey}>
                  {/* Section header */}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-4 py-2 text-xs font-bold text-[#1B2A6B] uppercase tracking-wide">
                      {SECTION_LABELS[sectionKey] || sectionKey}
                    </td>
                  </tr>
                  {/* Items */}
                  {items.map((item, idx) => (
                    <tr key={`${sectionKey}-${idx}`} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 text-gray-700 pl-8">{item.description}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                        $ {item.cost.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {/* Section subtotal */}
                  <tr className="border-t border-gray-200 bg-gray-50/50">
                    <td className="px-4 py-2 text-xs text-gray-500 text-right">
                      Subtotal {SECTION_LABELS[sectionKey]}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                      $ {sectionTotal(items).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              )
            })}
          </tbody>

          {/* Totals */}
          <tfoot>
            <tr className="border-t-2 border-[#1B2A6B] bg-[#1B2A6B]/5">
              <td className="px-4 py-3 font-bold text-[#1B2A6B] text-base">TOTAL USD</td>
              <td className="px-4 py-3 text-right font-bold text-[#1B2A6B] text-lg">
                US$ {quoteResult.totalCostUSD.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-[#F47920]/5 border-t border-[#F47920]/20">
              <td className="px-4 py-3 font-bold text-[#F47920] text-base">TOTAL CLP</td>
              <td className="px-4 py-3 text-right font-bold text-[#F47920] text-lg">
                CLP$ {quoteResult.totalCostCLP.toLocaleString('es-CL')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
        <div>
          Tipo de cambio: 1 USD = {quoteResult.usdClpRate.toLocaleString('es-CL')} CLP
        </div>
        <div>
          Valida hasta: {validUntil.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
        * Los impuestos de aduana son estimados y pueden variar segun la clasificacion arancelaria
        definitiva de tu mercaderia.
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#1B2A6B] text-[#1B2A6B] rounded-xl text-sm font-semibold hover:bg-[#1B2A6B]/5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </button>

        {!savedNumber && (
          <button
            onClick={handleSaveQuote}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#F47920] text-white rounded-xl text-sm font-semibold hover:bg-[#e06810] transition-colors shadow-lg shadow-[#F47920]/25 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Solicitar Cotizacion Formal
              </>
            )}
          </button>
        )}

        <button
          onClick={handleNewQuote}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nueva Cotizacion
        </button>
      </div>
    </div>
  )
}
