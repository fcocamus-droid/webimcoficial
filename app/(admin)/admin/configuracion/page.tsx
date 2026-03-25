'use client'

import { useEffect, useState } from 'react'

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [config, setConfig] = useState({
    usdToCLP: '',
    quoteValidityDays: '15',
    companyName: 'IMC Cargo',
    companyRut: '',
    companyAddress: '',
    companyPhone: '',
  })

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        setConfig({
          usdToCLP: data.usdToCLP?.toString() || '',
          quoteValidityDays: data.quoteValidityDays?.toString() || '15',
          companyName: data.companyName || 'IMC Cargo',
          companyRut: data.companyRut || '',
          companyAddress: data.companyAddress || '',
          companyPhone: data.companyPhone || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usdToCLP: parseFloat(config.usdToCLP) || 0,
        quoteValidityDays: parseInt(config.quoteValidityDays) || 15,
        companyName: config.companyName,
        companyRut: config.companyRut,
        companyAddress: config.companyAddress,
        companyPhone: config.companyPhone,
      }),
    })

    if (res.ok) setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-gray-400">Cargando...</p></div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuracion General</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Configuracion guardada exitosamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exchange Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Cambio</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">USD a CLP</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">1 USD =</span>
              <input
                type="number" step="0.01"
                value={config.usdToCLP}
                onChange={e => setConfig({ ...config, usdToCLP: e.target.value })}
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                placeholder="950.00"
              />
              <span className="text-sm text-gray-500">CLP</span>
            </div>
          </div>
        </div>

        {/* Quote Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cotizaciones</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dias de validez de cotizacion</label>
            <input
              type="number"
              value={config.quoteValidityDays}
              onChange={e => setConfig({ ...config, quoteValidityDays: e.target.value })}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
            />
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Empresa</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={config.companyName} onChange={e => setConfig({ ...config, companyName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                <input value={config.companyRut} onChange={e => setConfig({ ...config, companyRut: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                  placeholder="12.345.678-9" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
              <input value={config.companyAddress} onChange={e => setConfig({ ...config, companyAddress: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input value={config.companyPhone} onChange={e => setConfig({ ...config, companyPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                placeholder="+56 9 1234 5678" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-[#1B2A6B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar Configuracion'}
        </button>
      </form>
    </div>
  )
}
