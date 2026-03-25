'use client'

import { useEffect, useState } from 'react'
import { useQuoteWizard } from '@/hooks/useQuoteWizard'

interface Port {
  id: string
  name: string
  code: string
  country: string
  type: string
}

interface GroupedPorts {
  [country: string]: Port[]
}

const INCOTERMS = [
  { value: 'EXW', label: 'EXW', desc: 'Ex Works - El comprador asume todos los costos desde fabrica' },
  { value: 'FOB', label: 'FOB', desc: 'Free On Board - El vendedor entrega en puerto de origen' },
  { value: 'CFR', label: 'CFR', desc: 'Cost and Freight - El vendedor paga el flete maritimo' },
  { value: 'CIF', label: 'CIF', desc: 'Cost, Insurance, Freight - Incluye seguro maritimo' },
  { value: 'DAP', label: 'DAP', desc: 'Delivered at Place - El vendedor entrega en destino' },
  { value: 'DDP', label: 'DDP', desc: 'Delivered Duty Paid - El vendedor asume todos los costos' },
]

export default function Step1Route() {
  const { data, updateData } = useQuoteWizard()
  const [ports, setPorts] = useState<GroupedPorts>({})
  const [chileanPorts, setChileanPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPorts() {
      try {
        const res = await fetch('/api/ports')
        if (!res.ok) throw new Error('Error al cargar puertos')
        const json = await res.json()
        const grouped: GroupedPorts = json.ports || {}
        setPorts(grouped)

        // Chilean ports are destination
        const cl = grouped['Chile'] || grouped['CL'] || []
        setChileanPorts(cl)
      } catch (err) {
        console.error('Error fetching ports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPorts()
  }, [])

  // Origin ports = all non-Chilean
  const originCountries = Object.entries(ports).filter(
    ([country]) => country !== 'Chile' && country !== 'CL'
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-1">Ruta de Envio</h2>
        <p className="text-sm text-gray-500">Define el origen, destino e incoterm de tu carga</p>
      </div>

      {/* Incoterm */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Incoterm
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INCOTERMS.map((inc) => (
            <div key={inc.value} className="relative">
              <button
                type="button"
                onClick={() => updateData({ incoterm: inc.value as any })}
                onMouseEnter={() => setTooltipOpen(inc.value)}
                onMouseLeave={() => setTooltipOpen(null)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  data.incoterm === inc.value
                    ? 'border-[#F47920] bg-[#F47920]/5 text-[#F47920]'
                    : 'border-gray-200 hover:border-[#1B2A6B]/30 text-gray-700'
                }`}
              >
                {inc.label}
              </button>
              {tooltipOpen === inc.value && (
                <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1B2A6B] text-white text-xs rounded-lg p-3 shadow-xl">
                  {inc.desc}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1B2A6B]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-[#1B2A6B] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Cargando puertos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Puerto de Origen
            </label>
            <select
              value={data.originPort || ''}
              onChange={(e) => updateData({ originPort: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm bg-white transition-all"
            >
              <option value="">Seleccionar puerto de origen</option>
              {originCountries.map(([country, countryPorts]) => (
                <optgroup key={country} label={country}>
                  {countryPorts.map((port) => (
                    <option key={port.id} value={port.code}>
                      {port.name} ({port.code})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Puerto de Destino (Chile)
            </label>
            <select
              value={data.destPort || ''}
              onChange={(e) => updateData({ destPort: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 outline-none text-sm bg-white transition-all"
            >
              <option value="">Seleccionar puerto de destino</option>
              {chileanPorts.map((port) => (
                <option key={port.id} value={port.code}>
                  {port.name} ({port.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selection summary */}
      {data.incoterm && data.originPort && data.destPort && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-[#1B2A6B]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>{data.incoterm}</strong> desde <strong>{data.originPort}</strong> hacia <strong>{data.destPort}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
