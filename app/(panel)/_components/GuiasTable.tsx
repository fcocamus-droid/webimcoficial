/**
 * Reusable shipment table (Colinter-style)
 * Used by Carga Directa, Couriers, FCL, LCL pages.
 */

import Link from 'next/link'

export type GuiaRow = {
  id: string
  number: string                  // HAWB####
  status: string                  // Entregado, En tránsito, etc.
  statusVariant: 'green' | 'amber' | 'blue' | 'slate' | 'red'
  date: Date | string
  expedidor: string
  totalCargosCLP?: number | null
  piezas?: number | null
  kilos?: number | null
  fleteUSD?: number | null
  valorUSD?: number | null
}

const VARIANT_CLS: Record<GuiaRow['statusVariant'], string> = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  blue:  'bg-blue-50 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
  red:   'bg-red-50 text-red-700',
}

const numCL = (n: number | null | undefined, decimals = 0) =>
  n == null ? '—' : n.toLocaleString('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const numUS = (n: number | null | undefined, decimals = 2) =>
  n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export default function GuiasTable({ rows }: { rows: GuiaRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M2.25 13.5V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.5" />
        </svg>
        <p className="text-slate-500 text-sm">Sin guías registradas para este tipo de envío</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Search bar */}
      <div className="px-5 py-4 flex items-center justify-end gap-3 border-b border-slate-100">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Buscar" className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-full focus:outline-none focus:border-[#F47920]/40 focus:ring-2 focus:ring-[#F47920]/10 w-64" />
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg" title="Configurar columnas">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-700 text-sm">
              <th className="px-5 py-3 font-semibold">Estatus</th>
              <th className="px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">Número<Caret /></span>
              </th>
              <th className="px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">Fecha<Caret /></span>
              </th>
              <th className="px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">Expedidor<Caret /></span>
              </th>
              <th className="px-5 py-3 font-semibold text-right">T. Cargos</th>
              <th className="px-5 py-3 font-semibold text-right">Piezas</th>
              <th className="px-5 py-3 font-semibold text-right">Klgrs.</th>
              <th className="px-5 py-3 font-semibold text-right">Flete</th>
              <th className="px-5 py-3 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 cursor-pointer">
                <td className="px-5 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${VARIANT_CLS[r.statusVariant]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-900 font-medium">{r.number}</td>
                <td className="px-5 py-4 text-slate-600">{new Date(r.date).toLocaleDateString('es-CL')}</td>
                <td className="px-5 py-4 text-slate-700">{r.expedidor}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-700">{numCL(r.totalCargosCLP)}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-700">{r.piezas ?? '—'}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-700">{numUS(r.kilos, 2)}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-700">{numUS(r.fleteUSD, 2)}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-900 font-medium">{numUS(r.valorUSD, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Caret() {
  return (
    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
