import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Mis cotizaciones · Panel Comprador' }

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'OPEN', label: 'Abiertas' },
  { value: 'RESPONDED', label: 'Con respuestas' },
  { value: 'CLOSED', label: 'Cerradas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Abierta', cls: 'bg-amber-50 text-amber-700' },
  RESPONDED: { label: 'Con respuestas', cls: 'bg-verified-50 text-verified-600' },
  CLOSED: { label: 'Cerrada', cls: 'bg-slate-100 text-slate-500' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
}

export default async function RfqsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const rfqs = await prisma.rfq.findMany({
    where: {
      buyerId: userId,
      ...(searchParams.status &&
      ['OPEN', 'RESPONDED', 'CLOSED', 'CANCELLED'].includes(searchParams.status)
        ? { status: searchParams.status as any }
        : {}),
    },
    include: {
      product: { select: { title: true } },
      category: { select: { name: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-600">
            Mis cotizaciones
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {rfqs.length} solicitud{rfqs.length !== 1 ? 'es' : ''} de cotización
          </p>
        </div>
        <Link
          href="/panel/comprador/rfqs/nueva"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          + Nueva cotización
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-6 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => {
          const active = (searchParams.status || '') === f.value
          const href =
            f.value === ''
              ? '/panel/comprador/rfqs'
              : `/panel/comprador/rfqs?status=${f.value}`
          return (
            <Link
              key={f.value}
              href={href}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                active
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {rfqs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Sin solicitudes
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            Aún no has creado solicitudes de cotización. Empieza enviando una
            a uno o varios proveedores.
          </p>
          <Link
            href="/panel/comprador/rfqs/nueva"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg inline-block"
          >
            Crear primera cotización →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rfqs.map((r) => {
              const badge = STATUS_BADGE[r.status] || STATUS_BADGE.OPEN
              return (
                <li key={r.id}>
                  <Link
                    href={`/panel/comprador/rfqs/${r.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-xs text-slate-500">
                          {r.number}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate">
                        {r.title}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {r.product?.title ||
                          r.category?.name ||
                          'Solicitud general'}{' '}
                        · {r.quantity} {r.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-navy-600">
                        {r._count.responses}
                      </p>
                      <p className="text-xs text-slate-500">
                        respuesta{r._count.responses !== 1 ? 's' : ''}
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
