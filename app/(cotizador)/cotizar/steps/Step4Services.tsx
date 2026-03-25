'use client'

import { useEffect, useState } from 'react'
import { useQuoteWizard } from '@/hooks/useQuoteWizard'

interface Zone {
  id: string
  region: string
  description: string
  rateUSD: number
}

export default function Step4Services() {
  const { data, updateData } = useQuoteWizard()
  const [zones, setZones] = useState<Zone[]>([])
  const [loadingZones, setLoadingZones] = useState(false)

  useEffect(() => {
    async function fetchZones() {
      setLoadingZones(true)
      try {
        const res = await fetch('/api/zones')
        if (!res.ok) throw new Error('Error al cargar zonas')
        const json = await res.json()
        setZones(json.zones || [])
      } catch (err) {
        console.error('Error fetching zones:', err)
      } finally {
        setLoadingZones(false)
      }
    }
    fetchZones()
  }, [])

  const cargoValueUSD = data.cargoValueUSD || 0
  const insuranceEstimate = Math.max(cargoValueUSD * 0.003, 25)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-1">Servicios Adicionales</h2>
        <p className="text-sm text-gray-500">Selecciona los servicios que necesitas</p>
      </div>

      {/* Insurance */}
      <label className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm group ${
        data.includeInsurance ? 'border-[#F47920] bg-[#F47920]/5' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={!!data.includeInsurance}
            onChange={(e) => updateData({ includeInsurance: e.target.checked })}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            data.includeInsurance
              ? 'bg-[#F47920] border-[#F47920]'
              : 'border-gray-300 group-hover:border-gray-400'
          }`}>
            {data.includeInsurance && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Seguro de Carga</span>
            <span className="text-sm font-bold text-[#F47920]">
              ~US$ {insuranceEstimate.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Protege tu mercaderia durante el transporte. 0.3% del valor CIF (minimo US$ 25).
          </p>
        </div>
      </label>

      {/* Last Mile */}
      <div className={`rounded-xl border-2 transition-all ${
        data.includeLastMile ? 'border-[#F47920] bg-[#F47920]/5' : 'border-gray-200'
      }`}>
        <label className="flex items-start gap-4 p-5 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={!!data.includeLastMile}
              onChange={(e) => {
                updateData({
                  includeLastMile: e.target.checked,
                  lastMileRegion: e.target.checked ? data.lastMileRegion : undefined,
                })
              }}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              data.includeLastMile
                ? 'bg-[#F47920] border-[#F47920]'
                : 'border-gray-300 group-hover:border-gray-400'
            }`}>
              {data.includeLastMile && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-gray-800">Ultima Milla (Entrega en Destino)</span>
            <p className="text-xs text-gray-500 mt-1">
              Transporte terrestre desde el puerto de destino hasta tu bodega o domicilio.
            </p>
          </div>
        </label>

        {/* Region selector */}
        {data.includeLastMile && (
          <div className="px-5 pb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Region de Entrega
            </label>
            {loadingZones ? (
              <div className="text-xs text-gray-400">Cargando regiones...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => updateData({ lastMileRegion: zone.region })}
                    className={`p-3 rounded-lg border text-left transition-all text-sm ${
                      data.lastMileRegion === zone.region
                        ? 'border-[#1B2A6B] bg-[#1B2A6B]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-bold ${
                      data.lastMileRegion === zone.region ? 'text-[#1B2A6B]' : 'text-gray-700'
                    }`}>
                      {zone.region}
                    </div>
                    <div className="text-xs text-gray-500">{zone.description}</div>
                    <div className="text-xs font-semibold text-[#F47920] mt-1">
                      US$ {zone.rateUSD}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate of Origin */}
      <label className="flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm group border-gray-200 hover:border-gray-300">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={false}
            disabled
            className="sr-only"
          />
          <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Certificado de Origen</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Proximamente</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gestion del certificado de origen para acceder a preferencias arancelarias.
          </p>
        </div>
      </label>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Servicios</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            {data.includeInsurance ? (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Seguro de carga
            {data.includeInsurance && (
              <span className="text-xs text-gray-400 ml-auto">~US$ {insuranceEstimate.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            {data.includeLastMile ? (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Ultima milla
            {data.includeLastMile && data.lastMileRegion && (
              <span className="text-xs text-gray-400 ml-auto">Region {data.lastMileRegion}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
