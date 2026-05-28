import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/lib/iva'

export const metadata = { title: 'Resumen · Panel Vendedor' }

export default async function VendedorResumen() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId },
    include: {
      _count: {
        select: {
          products: true,
          rfqResponses: true,
          certifications: true,
          reviewsReceived: true,
        },
      },
    },
  })

  const [
    openRfqs,
    productsAvailable,
    acceptedResponses,
    latestRfqs,
    salesAgg,
  ] = await Promise.all([
    company
      ? prisma.rfq.count({
          where: {
            status: 'OPEN',
            visibility: 'PUBLIC',
            responses: { none: { sellerCompanyId: company.id } },
            OR: [
              {
                category: {
                  products: {
                    some: { companyId: company.id, available: true },
                  },
                },
              },
              {
                product: { companyId: company.id },
              },
            ],
          },
        })
      : Promise.resolve(0),
    company
      ? prisma.product.count({
          where: { companyId: company.id, available: true },
        })
      : Promise.resolve(0),
    company
      ? prisma.rfqResponse.count({
          where: { sellerCompanyId: company.id, status: 'ACCEPTED' },
        })
      : Promise.resolve(0),
    company
      ? prisma.rfq.findMany({
          where: {
            visibility: 'PUBLIC',
            OR: [
              {
                category: {
                  products: {
                    some: { companyId: company.id, available: true },
                  },
                },
              },
              { product: { companyId: company.id } },
            ],
          },
          include: {
            _count: { select: { responses: true } },
            responses: {
              where: { sellerCompanyId: company.id },
              select: { id: true, pricePerUnit: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : Promise.resolve([]),
    company
      ? prisma.rfqResponse.aggregate({
          where: { sellerCompanyId: company.id, status: 'ACCEPTED' },
          _sum: { totalPrice: true },
        })
      : Promise.resolve({ _sum: { totalPrice: 0 } }),
  ])

  const totalSales = salesAgg._sum?.totalPrice ?? 0

  return (
    <div className="max-w-6xl">
      {/* KPIs */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Productos publicados" value={company?._count.products ?? 0} />
        <Stat
          label="En stock disponible"
          value={productsAvailable}
          accent="verified"
        />
        <Stat label="RFQs por responder" value={openRfqs} accent="amber" />
        <Stat
          label="Ventas cerradas"
          value={acceptedResponses}
          accent="verified"
          subtitle={totalSales > 0 ? formatCLP(totalSales) : undefined}
        />
      </div>

      {/* Atajos a las secciones */}
      <h2 className="text-lg font-semibold text-navy-600 mb-4">
        Atajos a tu panel
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <ShortcutCard
          href="/panel/vendedor/productos/nuevo"
          icon="📦"
          title="Publicar producto"
          desc="Sube uno nuevo con fotos, MOQ, precio neto y ficha técnica."
          accent="navy"
        />
        <ShortcutCard
          href="/panel/vendedor/solicitudes"
          icon="📨"
          title={`Solicitudes RFQ${openRfqs > 0 ? ` · ${openRfqs} nuevas` : ''}`}
          desc="Responde cotizaciones de compradores activos."
          accent={openRfqs > 0 ? 'amber' : 'navy'}
        />
        <ShortcutCard
          href="/panel/mensajes"
          icon="💬"
          title="Mensajes"
          desc="Conversaciones con compradores sobre tus RFQs."
          accent="navy"
        />
        <ShortcutCard
          href="/panel/vendedor/certificaciones"
          icon="📜"
          title={`Certificaciones · ${company?._count.certifications ?? 0}`}
          desc="ISO, HACCP, BPM, GMP, FDA — refuerza tu confianza."
          accent="navy"
        />
        <ShortcutCard
          href="/panel/vendedor/estadisticas"
          icon="📊"
          title="Estadísticas"
          desc="Visitas, conversión, top productos y RFQs."
          accent="navy"
        />
        <ShortcutCard
          href="/panel/vendedor/perfil"
          icon="🏢"
          title="Perfil de empresa"
          desc="Logo, banner, contacto y ubicación de tu empresa."
          accent="navy"
        />
        <ShortcutCard
          href="/panel/vendedor/ventas"
          icon="💸"
          title={`Ventas cerradas · ${acceptedResponses}`}
          desc="Cotizaciones aceptadas por compradores."
          accent="verified"
        />
        <ShortcutCard
          href="/panel/vendedor/resenas"
          icon="⭐"
          title={`Reseñas · ${company?._count.reviewsReceived ?? 0}`}
          desc="Lo que dicen los compradores sobre tu servicio."
          accent="amber"
        />
      </div>

      {/* Actividad reciente */}
      {latestRfqs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-600">
              Actividad reciente · últimas RFQs en tu categoría
            </h2>
            <Link
              href="/panel/vendedor/solicitudes"
              className="text-sm text-amber-600 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {latestRfqs.map((r) => {
              const myResp = r.responses[0]
              return (
                <li key={r.id}>
                  <Link
                    href={`/panel/vendedor/solicitudes/${r.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-mono text-xs text-slate-500">
                          {r.number}
                        </p>
                        {myResp ? (
                          <span className="text-xs font-semibold bg-verified-50 text-verified-600 px-2 py-0.5 rounded">
                            Respondida {formatCLP(myResp.pricePerUnit)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                            ● Pendiente
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.quantity} {r.unit} · {r._count.responses} respuesta
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

function Stat({
  label,
  value,
  accent,
  subtitle,
}: {
  label: string
  value: number
  accent?: 'amber' | 'verified'
  subtitle?: string
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
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1 font-semibold">{subtitle}</p>
      )}
    </div>
  )
}

function ShortcutCard({
  href,
  icon,
  title,
  desc,
  accent,
}: {
  href: string
  icon: string
  title: string
  desc: string
  accent?: 'navy' | 'amber' | 'verified'
}) {
  const borderColor =
    accent === 'amber'
      ? 'hover:border-amber-500'
      : accent === 'verified'
        ? 'hover:border-verified-500'
        : 'hover:border-navy-600'
  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl border-2 border-slate-200 ${borderColor} hover:shadow-md transition-all p-5`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-navy-600 group-hover:text-navy-700">
            {title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-snug">{desc}</p>
        </div>
        <svg
          className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
