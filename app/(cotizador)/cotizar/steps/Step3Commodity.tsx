'use client'

import { useQuoteWizard } from '@/hooks/useQuoteWizard'

export default function Step3Commodity() {
  const { data, updateData } = useQuoteWizard()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-1">Mercaderia</h2>
        <p className="text-sm text-gray-500">Describe tu carga y su valor declarado</p>
      </div>

      {/* Commodity description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Descripcion de la Mercaderia
        </label>
        <input
          type="text"
          value={data.commodity || ''}
          onChange={(e) => updateData({ commodity: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm transition-all"
          placeholder="Ej: Repuestos automotrices, textiles, electronica..."
        />
      </div>

      {/* HS Code */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Codigo Arancelario (HS Code)
          <span className="text-gray-400 font-normal ml-1">- Opcional</span>
        </label>
        <input
          type="text"
          value={data.hsCode || ''}
          onChange={(e) => updateData({ hsCode: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm transition-all"
          placeholder="Ej: 8708.99"
        />
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Si no lo conoces, dejalo vacio. Nuestro equipo lo determinara.
        </p>
      </div>

      {/* Cargo Value */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Valor Declarado de la Carga (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            US$
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={data.cargoValueUSD || ''}
            onChange={(e) => updateData({ cargoValueUSD: parseFloat(e.target.value) || 0 })}
            className="w-full pl-14 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Info box about value */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Por que necesitamos el valor?</p>
            <p className="text-amber-700 leading-relaxed">
              El valor declarado se utiliza para calcular los impuestos de internacion
              (derechos de aduana y IVA). Tambien determina el costo del seguro de carga
              si lo incluyes. Ingresa el valor segun la factura comercial.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.commodity && data.cargoValueUSD && data.cargoValueUSD > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-[#1B2A6B]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>{data.commodity}</strong>
              {data.hsCode && <span className="text-gray-500"> (HS: {data.hsCode})</span>}
              {' - '}Valor: <strong>US$ {data.cargoValueUSD.toLocaleString('es-CL')}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
