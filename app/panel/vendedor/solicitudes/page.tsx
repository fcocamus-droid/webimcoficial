import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/app/components/ProductCard'

export const metadata = { title: 'Solicitudes · Panel Vendedor' }

const FILTERS = [
  { value: 'open', label: 'Pendientes' },
  { value: 'responded', label: 'Respondidas' },
  { value: 'all', label: 'Todas' },
]

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })

  if (!company) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-600 mb-2">
          Solicitudes de cotización
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-600">
            Tu empresa aún no está marcada como vendedora.
          </p>
        </div>
      </div>
    )
  }

  // Categorías y productos del vendedor
  const myCategories = (
    await prisma.product.findMany({
      where: { companyId: company.id, available: true },
      distinct: ['categoryId'],
      select: { categoryId: true },
    })
  )
    .map((p) => p.categoryId)
    .filter((id): id is string => !!id)

  const myProductIds = (
    await prisma.product.findMany({
      where: { companyId: company.id },
      select: { id: true },
    })
  ).map((p) => p.id)

  const filter = searchParams.filter || 'open'

  const baseWhere = {
    visibility: 'PUBLIC' as const,
    OR: [
      ...(myCategories.length > 0
        ? [{ categoryId: { in: myCategories } }]
        : []),
      ...(myProductIds.length > 0
        ? [{ productId: { in: myProductIds } }]
        : []),
    ],
  }

  const rfqs = await prisma.rfq.findMany({
    where: {
      ...baseWhere,
      ...(filter === 'responded'
        ? { responses: { some: { sellerCompanyId: company.id } } }
        : filter === 'open'
          ? {
              status: 'OPEN',
              responses: { none: { sellerCompanyId: company.id } },
            }
          : {}),
    },
    include: {
      buyer: { select: { name: true, email: true } },
      product: { select: { slug: true, title: true } },
      category: { select: { name: true } },
      _count: { select: { responses: true } },
      responses: {
        where: { sellerCompanyId: company.id },
        select: { pricePerUnit: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Solicitudes de cotización
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {rfqs.length} solicitud{rfqs.length !== 1 ? 'es' : ''} en esta vista
        </p>
      </div>

      {/* Tabs filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-6 flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = (searchParams.filter || 'open') === f.value
          const href =
            f.value === 'open'
              ? '/panel/vendedor/solicitudes'
              : `/panel/vendedor/solicitudes?filter=${f.value}`
          return (
            <Link
              key={f.value}
              href={href}
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

      {myCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no recibes solicitudes
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Publica productos en tu catálogo y comenzarás a recibir solicitudes
            de cotización de los compradores en tu categoría.
          </p>
          <Link
            href="/panel/vendedor/productos/nuevo"
            className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg inline-block"
          >
            Crear un producto →
          </Link>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">📨</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Sin solicitudes en esta vista
          </h3>
          <p className="text-sm text-slate-600">
            Te avisaremos apenas un comprador envíe una RFQ en tus categorías.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rfqs.map((r) => {
              const myResp = r.responses[0]
              return (
                <li key={r.id}>
                  <Link
                    href={`/panel/vendedor/solicitudes/${r.id}`}
                    className="flex items-start gap-4 p-4 hover:bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-mono text-xs text-slate-500">
                          {r.number}
                        </p>
                        {myResp ? (
                          <span className="text-xs font-semibold bg-verified-50 text-verified-600 px-2 py-0.5 rounded">
                            ✓ Respondida
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                            ● Pendiente
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 truncate">
                        {r.title}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {r.category?.name || 'Sin categoría'} · {r.quantity}{' '}
                        {r.unit}
                        {r.deliveryDeadline && (
                          <>
                            {' · '}entrega{' '}
                            {new Date(r.deliveryDeadline).toLocaleDateString(
                              'es-CL'
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      {myResp && (
                        <p className="font-bold text-navy-600">
                          {formatCLP(myResp.pricePerUnit)}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {r._count.responses} respuesta
                        {r._count.responses !== 1 ? 's' : ''} total
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
