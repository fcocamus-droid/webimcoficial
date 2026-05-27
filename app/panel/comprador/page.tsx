import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Resumen · Panel Comprador' }

export default async function ResumenComprador() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const [openRfqs, respondedRfqs, favorites, lastRfqs] = await Promise.all([
    prisma.rfq.count({ where: { buyerId: userId, status: 'OPEN' } }),
    prisma.rfq.count({
      where: { buyerId: userId, status: 'RESPONDED' },
    }),
    prisma.favorite.count({ where: { userId } }),
    prisma.rfq.findMany({
      where: { buyerId: userId },
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  return (
    <div className="max-w-5xl">
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="RFQs abiertas" value={openRfqs} accent="amber" />
        <Stat label="Con respuestas" value={respondedRfqs} accent="verified" />
        <Stat label="Favoritos" value={favorites} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Solicitar cotización
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Crea una RFQ y los fabricantes de la categoría recibirán tu
            solicitud para enviarte precios y plazos.
          </p>
          <Link
            href="/panel/comprador/rfqs/nueva"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            + Nueva cotización
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Encuentra proveedores
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Navega el directorio o explora por categoría industrial.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/categorias" className="btn-secondary">
              Categorías
            </Link>
            <Link href="/proveedores" className="btn-secondary">
              Proveedores
            </Link>
          </div>
        </div>
      </div>

      {lastRfqs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-600">
              Mis últimas cotizaciones
            </h2>
            <Link
              href="/panel/comprador/rfqs"
              className="text-sm text-amber-600 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {lastRfqs.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/panel/comprador/rfqs/${r.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-slate-500">
                      {r.number}
                    </p>
                    <p className="font-medium text-slate-900 truncate">
                      {r.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-slate-600">
                      {r._count.responses} resp.
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'amber' | 'verified'
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold ${
          accent === 'amber'
            ? 'text-amber-600'
            : accent === 'verified'
              ? 'text-verified-600'
              : 'text-navy-600'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN: { label: 'Abierta', cls: 'bg-amber-50 text-amber-700' },
    RESPONDED: { label: 'Con respuestas', cls: 'bg-verified-50 text-verified-600' },
    CLOSED: { label: 'Cerrada', cls: 'bg-slate-100 text-slate-500' },
    CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
  }
  const s = map[status] || map.OPEN
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded ${s.cls}`}
    >
      {s.label}
    </span>
  )
}
