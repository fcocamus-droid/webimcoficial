'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type Company = {
  id: string
  slug: string
  razonSocial: string
  rut: string
  giro: string | null
  isSeller: boolean
  isBuyer: boolean
  verified: boolean
  verifiedAt: string | null
  logoUrl: string | null
  region: string | null
  comuna: string | null
  userEmail: string
  userName: string | null
  productsCount: number
  certificationsCount: number
  createdAt: string
}

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Sin verificar' },
  { value: 'verified', label: 'Verificadas' },
  { value: 'seller', label: 'Fabricantes' },
  { value: 'buyer', label: 'Compradores' },
]

export default function EmpresasClient({
  initial,
  currentFilter,
  currentQ,
}: {
  initial: Company[]
  currentFilter: string
  currentQ: string
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const [companies, setCompanies] = useState<Company[]>(initial)
  const [q, setQ] = useState(currentQ)
  const [busy, setBusy] = useState<string | null>(null)

  const toggleVerify = async (c: Company) => {
    const next = !c.verified
    if (
      !confirm(
        next
          ? `¿Marcar a "${c.razonSocial}" como VERIFICADA? El badge ✓ aparecerá en su perfil público.`
          : `¿Quitar verificación a "${c.razonSocial}"? Perderá el badge ✓.`
      )
    )
      return

    setBusy(c.id)
    setCompanies((arr) =>
      arr.map((x) => (x.id === c.id ? { ...x, verified: next } : x))
    )

    const res = await fetch(`/api/superadmin/companies/${c.id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: next }),
    })
    if (!res.ok) {
      // revertir
      setCompanies((arr) =>
        arr.map((x) => (x.id === c.id ? { ...x, verified: c.verified } : x))
      )
    }
    setBusy(null)
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(sp?.toString() || '')
    if (q) params.set('q', q)
    else params.delete('q')
    router.push(`/panel/superadmin/empresas?${params.toString()}`)
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Empresas registradas
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} en esta
          vista. Verifica manualmente las que tengan documentación correcta.
        </p>
      </div>

      {/* Filtros + búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const active = currentFilter === f.value
            const params = new URLSearchParams(sp?.toString() || '')
            if (f.value === 'all') params.delete('filter')
            else params.set('filter', f.value)
            return (
              <Link
                key={f.value}
                href={`/panel/superadmin/empresas?${params.toString()}`}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-navy-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
        <form onSubmit={onSearch} className="flex-1 flex gap-2 md:ml-auto">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-base flex-1"
            placeholder="Buscar razón social, RUT o email…"
          />
          <button type="submit" className="btn-secondary">
            Buscar
          </button>
        </form>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-sm text-slate-600">
            No hay empresas que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Catálogo</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {c.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.logoUrl}
                            alt={c.razonSocial}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-navy-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {c.razonSocial.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {c.razonSocial}
                          </p>
                          <p className="text-xs text-slate-500">
                            RUT {c.rut} · {c.userEmail}
                          </p>
                          {c.giro && (
                            <p className="text-xs text-slate-400 truncate">
                              {c.giro}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {c.isSeller && (
                          <span className="text-xs font-semibold text-navy-600 bg-navy-600/5 px-2 py-0.5 rounded inline-block w-fit">
                            🏭 Vendedor
                          </span>
                        )}
                        {c.isBuyer && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block w-fit">
                            🛒 Comprador
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900">{c.productsCount} prod.</p>
                      <p className="text-xs text-slate-500">
                        {c.certificationsCount} cert.
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.comuna || c.region ? (
                        <p className="text-xs">
                          {[c.comuna, c.region].filter(Boolean).join(', ')}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-verified-600 bg-verified-50 px-2 py-1 rounded">
                          ✓ Verificada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          ⏱ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Link
                          href={`/proveedores/${c.slug}`}
                          target="_blank"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400"
                        >
                          Ver perfil
                        </Link>
                        <button
                          onClick={() => toggleVerify(c)}
                          disabled={busy === c.id}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60 ${
                            c.verified
                              ? 'border border-red-300 text-red-600 hover:bg-red-50'
                              : 'bg-verified-500 text-white hover:bg-verified-600'
                          }`}
                        >
                          {busy === c.id
                            ? '…'
                            : c.verified
                              ? 'Quitar ✓'
                              : 'Verificar ✓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
