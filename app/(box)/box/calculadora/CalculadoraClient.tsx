'use client'

import { useState, useMemo } from 'react'

type Rate = {
  id: string
  minKg: number
  maxKg: number | null
  ratePerKg: number
  minimumCharge: number | null
  isAmazon: boolean
  isUsed: boolean
}

type PkgType = {
  id: string
  name: string
  slug: string
  daiRate: number
  ivaRate: number
}

type Props = {
  rates: Rate[]
  factors: Record<string, number>
  types: PkgType[]
}

export default function CalculadoraClient({ rates, factors, types }: Props) {
  const [valueUSD, setValueUSD] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [length, setLength] = useState<string>('')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [typeSlug, setTypeSlug] = useState<string>('otros')
  const [isAmazon, setIsAmazon] = useState(false)
  const [isUsed, setIsUsed] = useState(false)
  const [insurance, setInsurance] = useState(false)

  const calc = useMemo(() => {
    const value = parseFloat(valueUSD) || 0
    const w = parseFloat(weightKg) || 0
    const L = parseFloat(length) || 0
    const W = parseFloat(width) || 0
    const H = parseFloat(height) || 0

    if (value <= 0 && w <= 0) return null

    const divisor = factors.VOLUMETRIC_DIVISOR_AIR || 5000
    const volumetricKg = (L * W * H) / divisor
    const billableKg = Math.max(w, volumetricKg, 0.5)  // min charge 0.5kg

    // Find applicable rate
    const applicable = rates.filter(r =>
      r.isAmazon === isAmazon &&
      billableKg >= r.minKg &&
      (r.maxKg == null || billableKg <= r.maxKg)
    )
    const rate = applicable[0]
    if (!rate) return { error: 'No hay tarifa para este peso' } as const

    let freight = billableKg * rate.ratePerKg
    if (rate.minimumCharge && freight < rate.minimumCharge) freight = rate.minimumCharge

    // Used item surcharge
    const usedMultiplier = isUsed ? (factors.USED_ITEM_SURCHARGE || 1.30) : 1
    const freightAdjusted = freight * usedMultiplier

    // Handling fee
    const handling = factors.HANDLING_FEE_USD || 5

    // Insurance
    const insuranceBase = factors.INSURANCE_BASE_USD || 500
    const insuranceRate = factors.INSURANCE_RATE || 0.015
    const insuranceCost = insurance && value > insuranceBase
      ? Math.ceil((value - insuranceBase) / 100) * insuranceRate * 100
      : 0

    // CIF for customs calculation
    const cif = value + freightAdjusted + insuranceCost

    // Customs (DAI + IVA)
    const selectedType = types.find(t => t.slug === typeSlug) || types[0]
    const daiRate = selectedType?.daiRate || 0.06
    const ivaRate = selectedType?.ivaRate || 0.19

    const dai = value > 500 ? cif * daiRate : 0
    const iva = (cif + dai) * ivaRate

    const totalUSD = freightAdjusted + handling + insuranceCost + dai + iva

    return {
      value,
      weight: w,
      volumetricKg,
      billableKg,
      ratePerKg: rate.ratePerKg,
      freight: freightAdjusted,
      handling,
      insurance: insuranceCost,
      dai,
      iva,
      totalUSD,
      typeName: selectedType?.name || '—',
    }
  }, [valueUSD, weightKg, length, width, height, typeSlug, isAmazon, isUsed, insurance, rates, factors, types])

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Datos del paquete</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Valor del producto (USD, incluye shipping USA + tax)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={valueUSD}
                onChange={(e) => setValueUSD(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Peso físico (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
              <select
                value={typeSlug}
                onChange={(e) => setTypeSlug(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920] bg-white"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Dimensiones (cm) — opcional</p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Largo"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
              />
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ancho"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
              />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Alto"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Usamos peso volumétrico (L×A×H/{factors.VOLUMETRIC_DIVISOR_AIR || 5000}) si es mayor al físico</p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAmazon} onChange={(e) => setIsAmazon(e.target.checked)} className="w-4 h-4 accent-[#F47920]" />
              <span className="text-sm text-slate-700">Compra Amazon / "Compra por mí"</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isUsed} onChange={(e) => setIsUsed(e.target.checked)} className="w-4 h-4 accent-[#F47920]" />
              <span className="text-sm text-slate-700">Producto usado (recargo {((factors.USED_ITEM_SURCHARGE || 1.3) - 1) * 100}%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} className="w-4 h-4 accent-[#F47920]" />
              <span className="text-sm text-slate-700">Seguro extra (cobertura sobre ${factors.INSURANCE_BASE_USD || 500})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-2">
        <div className="bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-2xl shadow-xl p-6 text-white sticky top-20">
          <h2 className="text-lg font-semibold mb-4">Cotización estimada</h2>

          {!calc || 'error' in calc ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-blue-100 text-sm">{(calc && 'error' in calc && calc.error) || 'Ingresa valor y peso para calcular'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-sm">
                <p className="text-blue-200 text-xs mb-1">Peso facturable</p>
                <p className="font-semibold">{calc.billableKg.toFixed(2)} kg @ USD ${calc.ratePerKg}/kg</p>
              </div>

              <Row label="Flete internacional" value={calc.freight} />
              <Row label="Handling (Miami)" value={calc.handling} />
              {calc.insurance > 0 && <Row label="Seguro adicional" value={calc.insurance} />}
              {calc.dai > 0 && <Row label="DAI (6%)" value={calc.dai} />}
              <Row label="IVA (19%)" value={calc.iva} />

              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-sm">Total estimado</span>
                  <span className="text-3xl font-bold text-[#F47920]">USD ${calc.totalUSD.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-blue-200 mt-3 leading-relaxed">
                ⚠️ Estimación. Los costos de aduana finales pueden variar según clasificación arancelaria definitiva.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-blue-100">{label}</span>
      <span className="font-mono font-medium">USD ${value.toFixed(2)}</span>
    </div>
  )
}
