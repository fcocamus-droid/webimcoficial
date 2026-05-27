import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const metadata = { title: 'Resumen · Panel Superadmin' }

export default async function SuperadminHome() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const [
    totalUsers,
    sellers,
    buyers,
    agents,
    companies,
    products,
    rfqsOpen,
    rfqsClosed,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'SELLER' } }),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.user.count({
      where: { role: 'SALES_AGENT', createdById: userId },
    }),
    prisma.company.count(),
    prisma.product.count(),
    prisma.rfq.count({ where: { status: 'OPEN' } }),
    prisma.rfq.count({ where: { status: 'CLOSED' } }),
  ])

  const stats = [
    { label: 'Usuarios totales', value: totalUsers, accent: 'navy' },
    { label: 'Fabricantes', value: sellers, accent: 'navy' },
    { label: 'Compradores', value: buyers, accent: 'amber' },
    { label: 'Mis agentes', value: agents, accent: 'verified' },
    { label: 'Empresas', value: companies, accent: 'navy' },
    { label: 'Productos', value: products, accent: 'navy' },
    { label: 'RFQs abiertas', value: rfqsOpen, accent: 'amber' },
    { label: 'RFQs cerradas', value: rfqsClosed, accent: 'navy' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p
              className={`text-3xl font-bold ${
                s.accent === 'amber'
                  ? 'text-amber-600'
                  : s.accent === 'verified'
                    ? 'text-verified-600'
                    : 'text-navy-600'
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Equipo comercial
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Crea y administra a tus agentes de ventas. Cada agente entra con su
            propio email y puede ayudar a onboardar fabricantes, hacer
            seguimiento de RFQs y dar soporte comercial.
          </p>
          <Link
            href="/panel/superadmin/agentes"
            className="inline-flex bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            Gestionar agentes →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Por construir
          </h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>· Verificación manual de empresas (RUT + certificaciones)</li>
            <li>· Asignación de agentes a categorías o sellers</li>
            <li>· Reportes de actividad de cada agente</li>
            <li>· Comisiones y métricas comerciales</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
