import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/app/components/ProductCard'

export const metadata = { title: 'Estadísticas · Panel Vendedor' }

export default async function EstadisticasPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true, ratingAverage: true, ratingCount: true },
  })

  if (!company) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-600 mb-2">Estadísticas</h2>
        <p className="text-slate-600">Tu empresa aún no está marcada como vendedor.</p>
      </div>
    )
  }

  const [
    totalProducts,
    availableProducts,
    featuredProducts,
    totalsAgg,
    topByViews,
    topByRfqs,
    rfqsReceived,
    rfqsResponded,
    rfqsAccepted,
  ] = await Promise.all([
    prisma.product.count({ where: { companyId: company.id } }),
    prisma.product.count({
      where: { companyId: company.id, available: true },
    }),
    prisma.product.count({
      where: { companyId: company.id, featured: true },
    }),
    prisma.product.aggregate({
      where: { companyId: company.id },
      _sum: { viewCount: true, rfqCount: true },
    }),
    prisma.product.findMany({
      where: { companyId: company.id },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        viewCount: true,
        basePriceCLP: true,
        unit: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.product.findMany({
      where: { companyId: company.id, rfqCount: { gt: 0 } },
      orderBy: { rfqCount: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        rfqCount: true,
        viewCount: true,
        basePriceCLP: true,
        unit: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.rfq.count({
      where: {
        OR: [
          {
            product: { companyId: company.id },
          },
          {
            category: {
              products: { some: { companyId: company.id, available: true } },
            },
            visibility: 'PUBLIC',
          },
        ],
      },
    }),
    prisma.rfqResponse.count({
      where: { sellerCompanyId: company.id, status: 'SENT' },
    }),
    prisma.rfqResponse.count({
      where: { sellerCompanyId: company.id, status: 'ACCEPTED' },
    }),
  ])

  const totalViews = totalsAgg._sum?.viewCount ?? 0
  const totalRfqMentions = totalsAgg._sum?.rfqCount ?? 0
  const responseRate =
    rfqsReceived > 0 ? Math.round((rfqsResponded / rfqsReceived) * 100) : 0

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Estadísticas de tu tienda
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Datos en vivo sobre el rendimiento de tu catálogo y solicitudes.
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Productos publicados" value={totalProducts} icon="📦" />
        <Stat
          label="Visitas totales"
          value={totalViews}
          icon="👁️"
          accent="navy"
        />
        <Stat
          label="Cotizaciones enviadas"
          value={rfqsResponded}
          icon="💸"
          accent="verified"
        />
        <Stat
          label="Tasa de respuesta"
          value={`${responseRate}%`}
          icon="⚡"
          accent="amber"
          subtitle={`${rfqsResponded} de ${rfqsReceived} RFQs vistas`}
        />
      </div>

      {/* Segunda fila */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="En stock disponible" value={availableProducts} icon="✓" />
        <Stat label="Destacados" value={featuredProducts} icon="⭐" />
        <Stat label="Cotizaciones aceptadas" value={rfqsAccepted} icon="🤝" />
        <Stat
          label="Rating"
          value={
            company.ratingCount > 0
              ? `${(company.ratingAverage ?? 0).toFixed(1)}/5`
              : '—'
          }
          icon="⭐"
          subtitle={
            company.ratingCount > 0
              ? `${company.ratingCount} reseña${company.ratingCount !== 1 ? 's' : ''}`
              : 'Sin reseñas aún'
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top vistas */}
        <RankingCard
          title="Top 5 productos más vistos"
          icon="👁️"
          items={topByViews.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            image: p.images[0]?.url,
            metric: `${p.viewCount} visitas`,
            sub: p.basePriceCLP
              ? `${formatCLP(p.basePriceCLP)} / ${p.unit}`
              : `MOQ ${p.unit}`,
          }))}
          empty="Aún nadie ha visto tus productos. Comparte tu perfil para empezar a generar vistas."
        />

        {/* Top cotizados */}
        <RankingCard
          title="Top 5 productos más cotizados"
          icon="💸"
          items={topByRfqs.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            image: p.images[0]?.url,
            metric: `${p.rfqCount} cotizaciones`,
            sub: `${p.viewCount} visitas totales`,
          }))}
          empty="Aún no recibes cotizaciones sobre productos específicos. Mantén tu catálogo activo y verás resultados pronto."
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  accent,
  subtitle,
}: {
  label: string
  value: number | string
  icon: string
  accent?: 'navy' | 'amber' | 'verified'
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
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
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function RankingCard({
  title,
  icon,
  items,
  empty,
}: {
  title: string
  icon: string
  items: {
    id: string
    slug: string
    title: string
    image?: string
    metric: string
    sub: string
  }[]
  empty: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-navy-600 mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 italic">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {items.map((it, idx) => (
            <li key={it.id}>
              <Link
                href={`/panel/vendedor/productos/${it.id}`}
                className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg"
              >
                <span className="w-7 h-7 shrink-0 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {it.title}
                  </p>
                  <p className="text-xs text-slate-500">{it.sub}</p>
                </div>
                <p className="font-bold text-navy-600 text-sm shrink-0">
                  {it.metric}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
