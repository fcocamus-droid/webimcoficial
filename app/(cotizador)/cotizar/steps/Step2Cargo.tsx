'use client'

import { useQuoteWizard } from '@/hooks/useQuoteWizard'
import { useState, useEffect, useCallback } from 'react'

const SHIPMENT_TYPES = [
  {
    value: 'LCL' as const,
    label: 'LCL',
    desc: 'Carga suelta consolidada',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    value: 'FCL_20' as const,
    label: "FCL 20'",
    desc: 'Contenedor 20 pies',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 6v12a1 1 0 001 1h14a1 1 0 001-1V6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
    ),
  },
  {
    value: 'FCL_40' as const,
    label: "FCL 40'",
    desc: 'Contenedor 40 pies',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 6v12a1 1 0 001 1h14a1 1 0 001-1V6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
    ),
  },
  {
    value: 'FCL_40HC' as const,
    label: "FCL 40'HC",
    desc: 'Contenedor 40 High Cube',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 6v12a1 1 0 001 1h14a1 1 0 001-1V6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2M12 10v4" />
      </svg>
    ),
  },
  {
    value: 'AIR' as const,
    label: 'Aereo',
    desc: 'Carga aerea',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19V5m0 0l-4 4m4-4l4 4M3 15h4l2 4h6l2-4h4" />
      </svg>
    ),
  },
]

interface PackageDim {
  length: number
  width: number
  height: number
  qty: number
  weight: number
}

export default function Step2Cargo() {
  const { data, updateData } = useQuoteWizard()
  const shipmentType = data.shipmentType

  // LCL package dimensions
  const [packages, setPackages] = useState<PackageDim[]>([
    { length: 0, width: 0, height: 0, qty: 1, weight: 0 },
  ])

  // Air cargo
  const [airGrossWeight, setAirGrossWeight] = useState(0)
  const [airLength, setAirLength] = useState(0)
  const [airWidth, setAirWidth] = useState(0)
  const [airHeight, setAirHeight] = useState(0)

  // FCL
  const [containerQty, setContainerQty] = useState(data.containerQty || 1)

  // Calculate LCL CBM and weight
  const calcLCL = useCallback(() => {
    let totalCBM = 0
    let totalWeight = 0
    for (const pkg of packages) {
      const cbm = (pkg.length / 100) * (pkg.width / 100) * (pkg.height / 100) * pkg.qty
      totalCBM += cbm
      totalWeight += pkg.weight * pkg.qty
    }
    return {
      cbm: Math.round(totalCBM * 1000) / 1000,
      weightKg: Math.round(totalWeight * 100) / 100,
      wm: Math.max(totalCBM, totalWeight / 1000),
    }
  }, [packages])

  // Calculate Air volumetric weight
  const calcAir = useCallback(() => {
    const volumetricKg = (airLength * airWidth * airHeight) / 6000
    const chargeableKg = Math.max(airGrossWeight, volumetricKg)
    return {
      volumetricKg: Math.round(volumetricKg * 100) / 100,
      chargeableKg: Math.round(chargeableKg * 100) / 100,
    }
  }, [airGrossWeight, airLength, airWidth, airHeight])

  // Update store when LCL values change
  useEffect(() => {
    if (shipmentType === 'LCL') {
      const { cbm, weightKg } = calcLCL()
      updateData({ cbm, weightKg })
    }
  }, [shipmentType, calcLCL]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update store when Air values change
  useEffect(() => {
    if (shipmentType === 'AIR') {
      const { chargeableKg } = calcAir()
      updateData({ chargeableKg })
    }
  }, [shipmentType, calcAir]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update store when FCL qty changes
  useEffect(() => {
    if (
      shipmentType === 'FCL_20' ||
      shipmentType === 'FCL_40' ||
      shipmentType === 'FCL_40HC'
    ) {
      updateData({ containerQty })
    }
  }, [shipmentType, containerQty]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectShipmentType(type: typeof SHIPMENT_TYPES[number]['value']) {
    updateData({
      shipmentType: type,
      cbm: undefined,
      weightKg: undefined,
      containerQty: undefined,
      chargeableKg: undefined,
    })
  }

  function updatePackage(index: number, field: keyof PackageDim, value: number) {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  function addPackage() {
    setPackages([...packages, { length: 0, width: 0, height: 0, qty: 1, weight: 0 }])
  }

  function removePackage(index: number) {
    if (packages.length <= 1) return
    setPackages(packages.filter((_, i) => i !== index))
  }

  const lclCalc = calcLCL()
  const airCalc = calcAir()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-1">Tipo de Carga</h2>
        <p className="text-sm text-gray-500">Selecciona el tipo de envio y detalla tu carga</p>
      </div>

      {/* Shipment Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SHIPMENT_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => selectShipmentType(type.value)}
            className={`relative p-4 rounded-xl border-2 text-center transition-all ${
              shipmentType === type.value
                ? 'border-[#F47920] bg-[#F47920]/5 shadow-md'
                : 'border-gray-200 hover:border-[#1B2A6B]/30 hover:shadow-sm'
            }`}
          >
            <div
              className={`mx-auto mb-2 ${
                shipmentType === type.value ? 'text-[#F47920]' : 'text-gray-400'
              }`}
            >
              {type.icon}
            </div>
            <div
              className={`text-sm font-bold ${
                shipmentType === type.value ? 'text-[#F47920]' : 'text-gray-700'
              }`}
            >
              {type.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{type.desc}</div>
          </button>
        ))}
      </div>

      {/* Dynamic Fields */}
      {shipmentType === 'LCL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Detalle de Bultos</h3>
            <button
              type="button"
              onClick={addPackage}
              className="text-sm font-medium text-[#F47920] hover:text-[#e06810] transition-colors"
            >
              + Agregar bulto
            </button>
          </div>

          {packages.map((pkg, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Bulto {index + 1}
                </span>
                {packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePackage(index)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={pkg.qty || ''}
                    onChange={(e) => updatePackage(index, 'qty', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Largo (cm)</label>
                  <input
                    type="number"
                    min={0}
                    value={pkg.length || ''}
                    onChange={(e) => updatePackage(index, 'length', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    min={0}
                    value={pkg.width || ''}
                    onChange={(e) => updatePackage(index, 'width', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    min={0}
                    value={pkg.height || ''}
                    onChange={(e) => updatePackage(index, 'height', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={pkg.weight || ''}
                    onChange={(e) => updatePackage(index, 'weight', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* LCL Calculation Summary */}
          <div className="bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-[#1B2A6B] mb-3">Resumen de Carga</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#1B2A6B]">{lclCalc.cbm}</div>
                <div className="text-xs text-gray-500">CBM Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1B2A6B]">{lclCalc.weightKg}</div>
                <div className="text-xs text-gray-500">Peso Total (kg)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F47920]">
                  {Math.round(lclCalc.wm * 1000) / 1000}
                </div>
                <div className="text-xs text-gray-500">W/M (cobrable)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FCL Fields */}
      {(shipmentType === 'FCL_20' || shipmentType === 'FCL_40' || shipmentType === 'FCL_40HC') && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Cantidad de Contenedores</h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setContainerQty(Math.max(1, containerQty - 1))}
              className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#1B2A6B] hover:text-[#1B2A6B] transition-colors"
            >
              -
            </button>
            <div className="text-3xl font-bold text-[#1B2A6B] w-16 text-center">
              {containerQty}
            </div>
            <button
              type="button"
              onClick={() => setContainerQty(containerQty + 1)}
              className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#1B2A6B] hover:text-[#1B2A6B] transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {shipmentType === 'FCL_20' && 'Contenedor 20 pies: ~33 CBM, carga max ~28 ton'}
            {shipmentType === 'FCL_40' && 'Contenedor 40 pies: ~67 CBM, carga max ~26 ton'}
            {shipmentType === 'FCL_40HC' && 'Contenedor 40 HC: ~76 CBM, carga max ~26 ton'}
          </p>
        </div>
      )}

      {/* Air Fields */}
      {shipmentType === 'AIR' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Detalles Carga Aerea</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Peso Bruto (kg)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={airGrossWeight || ''}
                onChange={(e) => setAirGrossWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Largo (cm)</label>
              <input
                type="number"
                min={0}
                value={airLength || ''}
                onChange={(e) => setAirLength(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
              <input
                type="number"
                min={0}
                value={airWidth || ''}
                onChange={(e) => setAirWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
              <input
                type="number"
                min={0}
                value={airHeight || ''}
                onChange={(e) => setAirHeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Air Calculation Summary */}
          <div className="bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-[#1B2A6B] mb-3">Peso Cobrable</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-600">{airGrossWeight}</div>
                <div className="text-xs text-gray-500">Peso Bruto (kg)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{airCalc.volumetricKg}</div>
                <div className="text-xs text-gray-500">Peso Vol. (kg)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F47920]">{airCalc.chargeableKg}</div>
                <div className="text-xs text-gray-500">Cobrable (kg)</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Peso volumetrico = (L x A x H) / 6000
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
