import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Catálogo · Panel Vendedor' }

const STOCK_LABEL = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-verified-50 text-verified-600' },
  A_PEDIDO: { label: 'A pedido', cls: 'bg-amber-50 text-amber-700' },
  AGOTADO: { label: 'Agotado', cls: 'bg-slate-100 text-slate-500' },
} as const

function formatCLP(n: number | null) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })

  const products = company
    ? await prisma.product.findMany({
        where: {
          companyId: company.id,
          ...(searchParams.q
            ? {
                OR: [
                  { title: { contains: searchParams.q, mode: 'insensitive' } },
                  { sku: { contains: searchParams.q, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(searchParams.status === 'available'
            ? { available: true }
            : searchParams.status === 'unavailable'
              ? { available: false }
              : {}),
        },
        include: {
          category: { select: { name: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    : []

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-600">Mi catálogo</h2>
          <p className="text-sm text-slate-600 mt-1">
            {products.length} producto{products.length !== 1 ? 's' : ''}{' '}
            {searchParams.q ? `que coinciden con "${searchParams.q}"` : 'publicados'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/panel/vendedor/productos/importar"
            className="inline-flex items-center gap-1.5 bg-white border border-navy-600 text-navy-700 hover:bg-navy-50 font-semibold px-4 py-2.5 rounded-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Importar masivo
          </Link>
          <Link
            href="/panel/vendedor/productos/nuevo"
            className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <form
        method="GET"
        className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="label-base">Buscar</label>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q || ''}
            className="input-base"
            placeholder="Nombre, SKU…"
          />
        </div>
        <div>
          <label className="label-base">Estado</label>
          <select
            name="status"
            defaultValue={searchParams.status || ''}
            className="input-base"
          >
            <option value="">Todos</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary h-[42px]">
          Filtrar
        </button>
        {(searchParams.q || searchParams.status) && (
          <Link href="/panel/vendedor/productos" className="btn-ghost text-sm">
            Limpiar
          </Link>
        )}
      </form>

      {!company ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Tu empresa aún no está marcada como vendedor
          </h3>
          <p className="text-sm text-slate-600">
            Contacta al equipo de IMC para activar tu cuenta como fabricante.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no tienes productos publicados
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            Crea tu primer producto para que los compradores puedan
            descubrirte y solicitarte cotizaciones.
          </p>
          <Link
            href="/panel/vendedor/productos/nuevo"
            className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg inline-block"
          >
            Crear primer producto →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const img = p.images[0]?.url
            const stock = STOCK_LABEL[p.stockStatus]
            return (
              <Link
                key={p.id}
                href={`/panel/vendedor/productos/${p.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-navy-600 hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100 relative">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                    </div>
                  )}
                  {!p.available && (
                    <span className="absolute top-2 left-2 text-xs font-bold uppercase bg-slate-900/80 text-white px-2 py-1 rounded">
                      Oculto
                    </span>
                  )}
                  <span
                    className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${stock.cls}`}
                  >
                    {stock.label}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {p.category?.name || 'Sin categoría'}
                  </p>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">
                    {p.title}
                  </h3>
                  <div className="mt-auto pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-navy-600">
                        {formatCLP(p.basePriceCLP)}
                      </p>
                      <p className="text-xs text-slate-500">
                        MOQ {p.moq} {p.unit}
                      </p>
                    </div>
                    {p.featured && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        ★ Destacado
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
