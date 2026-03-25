'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Port = { id: string; code: string; name: string; country: string; type: string }
type Carrier = { id: string; name: string; code: string; type: string }

const SHIPMENT_TYPES = ['LCL', 'FCL_20', 'FCL_40', 'FCL_40HC', 'AIR'] as const

export default function EditarTarifaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ports, setPorts] = useState<Port[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    carrierId: '',
    originPort: '',
    destPort: '',
    shipmentType: 'LCL' as string,
    ratePerCBM: '',
    ratePerTon: '',
    minCBM: '1',
    rateContainer: '',
    ratePerKg: '',
    minKg: '',
    currency: 'USD',
    validFrom: '',
    validTo: '',
    active: true,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ports').then(r => r.json()),
      fetch('/api/admin/tariffs?carriers=true').then(r => r.json()),
      fetch(`/api/admin/tariffs/${id}`).then(r => r.json()),
    ]).then(([portsData, carriersData, rate]) => {
      setPorts(portsData)
      if (Array.isArray(carriersData)) setCarriers(carriersData)
      setForm({
        carrierId: rate.carrierId || '',
        originPort: rate.originPort || '',
        destPort: rate.destPort || '',
        shipmentType: rate.shipmentType || 'LCL',
        ratePerCBM: rate.ratePerCBM?.toString() || '',
        ratePerTon: rate.ratePerTon?.toString() || '',
        minCBM: rate.minCBM?.toString() || '1',
        rateContainer: rate.rateContainer?.toString() || '',
        ratePerKg: rate.ratePerKg?.toString() || '',
        minKg: rate.minKg?.toString() || '',
        currency: rate.currency || 'USD',
        validFrom: rate.validFrom ? rate.validFrom.split('T')[0] : '',
        validTo: rate.validTo ? rate.validTo.split('T')[0] : '',
        active: rate.active ?? true,
      })
      setLoading(false)
    }).catch(() => {
      setError('Error al cargar datos')
      setLoading(false)
    })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body: Record<string, unknown> = {
      carrierId: form.carrierId,
      originPort: form.originPort,
      destPort: form.destPort,
      shipmentType: form.shipmentType,
      currency: form.currency,
      validFrom: form.validFrom,
      validTo: form.validTo,
      active: form.active,
    }

    if (form.shipmentType === 'LCL') {
      body.ratePerCBM = parseFloat(form.ratePerCBM) || 0
      body.ratePerTon = parseFloat(form.ratePerTon) || 0
      body.minCBM = parseFloat(form.minCBM) || 1
    } else if (form.shipmentType === 'AIR') {
      body.ratePerKg = parseFloat(form.ratePerKg) || 0
      body.minKg = parseFloat(form.minKg) || 0
    } else {
      body.rateContainer = parseFloat(form.rateContainer) || 0
    }

    const res = await fetch(`/api/admin/tariffs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/tarifas')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Error al guardar')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Cargando tarifa...</p>
      </div>
    )
  }

  const isLCL = form.shipmentType === 'LCL'
  const isAIR = form.shipmentType === 'AIR'
  const isFCL = !isLCL && !isAIR

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Tarifa</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Embarque</label>
          <select name="shipmentType" value={form.shipmentType} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent">
            {SHIPMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier / Naviera</label>
          <select name="carrierId" value={form.carrierId} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent">
            <option value="">Seleccionar carrier...</option>
            {carriers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto Origen</label>
            <select name="originPort" value={form.originPort} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {ports.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto Destino</label>
            <select name="destPort" value={form.destPort} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent">
              <option value="">Seleccionar...</option>
              {ports.map(p => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
            </select>
          </div>
        </div>

        {isLCL && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por CBM (USD)</label>
              <input type="number" step="0.01" name="ratePerCBM" value={form.ratePerCBM} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por Ton (USD)</label>
              <input type="number" step="0.01" name="ratePerTon" value={form.ratePerTon} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min CBM</label>
              <input type="number" step="0.01" name="minCBM" value={form.minCBM} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
          </div>
        )}

        {isFCL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por Contenedor (USD)</label>
            <input type="number" step="0.01" name="rateContainer" value={form.rateContainer} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
          </div>
        )}

        {isAIR && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por Kg (USD)</label>
              <input type="number" step="0.01" name="ratePerKg" value={form.ratePerKg} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Kg</label>
              <input type="number" step="0.01" name="minKg" value={form.minKg} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
          <select name="currency" value={form.currency} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent">
            <option value="USD">USD</option>
            <option value="CLP">CLP</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vigente Desde</label>
            <input type="date" name="validFrom" value={form.validFrom} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vigente Hasta</label>
            <input type="date" name="validTo" value={form.validTo} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-[#1B2A6B] focus:ring-[#1B2A6B]" />
          <span className="text-sm text-gray-700">Tarifa activa</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-[#1B2A6B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Actualizar Tarifa'}
          </button>
          <button type="button" onClick={() => router.push('/admin/tarifas')}
            className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm font-medium">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
