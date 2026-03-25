'use client'

import { useEffect, useState } from 'react'

type Company = {
  id: string
  razonSocial: string
  rut: string
  ciudad: string
  region: string
  giro: string
  direccion: string
  comuna: string
  telefono: string | null
  emailFacturacion: string | null
  createdAt: string
  _count: {
    users: number
  }
}

type CompanyWithDocs = Company & {
  documents?: { id: string }[]
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      const res = await fetch('/api/companies?all=true')
      if (res.ok) {
        const data = await res.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    fetchCompanies()
  }, [])

  const filtered = companies.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.razonSocial.toLowerCase().includes(q) ||
      c.rut.toLowerCase().includes(q) ||
      c.ciudad.toLowerCase().includes(q)
    )
  })

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <span className="text-sm text-gray-500">{companies.length} empresa{companies.length !== 1 ? 's' : ''} registrada{companies.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por razón social, RUT o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]/30"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Razón Social</th>
                <th className="px-6 py-3 font-medium">RUT</th>
                <th className="px-6 py-3 font-medium">Ciudad</th>
                <th className="px-6 py-3 font-medium">Usuarios</th>
                <th className="px-6 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    {search ? 'No hay empresas que coincidan con la búsqueda' : 'No hay empresas registradas'}
                  </td>
                </tr>
              ) : filtered.map(c => (
                <>
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{c.razonSocial}</td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{c.rut}</td>
                    <td className="px-6 py-3 text-gray-600">{c.ciudad}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {c._count.users}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-[#1B2A6B] hover:text-blue-800">
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Giro</p>
                            <p className="font-medium text-gray-800">{c.giro}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Dirección</p>
                            <p className="font-medium text-gray-800">{c.direccion}, {c.comuna}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Región</p>
                            <p className="font-medium text-gray-800">{c.region}</p>
                          </div>
                          {c.telefono && (
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Teléfono</p>
                              <p className="font-medium text-gray-800">{c.telefono}</p>
                            </div>
                          )}
                          {c.emailFacturacion && (
                            <div>
                              <p className="text-gray-500 text-xs mb-0.5">Email Facturación</p>
                              <p className="font-medium text-gray-800">{c.emailFacturacion}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Registrada</p>
                            <p className="font-medium text-gray-800">
                              {new Date(c.createdAt).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
