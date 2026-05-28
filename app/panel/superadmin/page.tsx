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
    pendingCompanies,
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
    prisma.company.count({ where: { verified: false } }),
    prisma.product.count(),
    prisma.rfq.count({ where: { status: 'OPEN' } }),
    prisma.rfq.count({ where: { status: 'CLOSED' } }),
  ])

  const stats = [
    { label: 'Usuarios totales', value: totalUsers, accent: 'navy' },
    { label: 'Fabricantes', value: sellers, accent: 'navy' },
    { label: 'Compradores', value: buyers, accent: 'amber' },
    { label: 'Mis agentes', value: agents, accent: 'verified' },
    { label: 'Empresas registradas', value: companies, accent: 'navy' },
    {
      label: 'Por verificar',
      value: pendingCompanies,
      accent: pendingCompanies > 0 ? 'amber' : 'verified',
    },
    { label: 'Productos', value: products, accent: 'navy' },
    { label: 'RFQs abiertas', value: rfqsOpen, accent: 'amber' },
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
            Verificación de empresas
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            {pendingCompanies > 0
              ? `Tienes ${pendingCompanies} empresa${pendingCompanies !== 1 ? 's' : ''} esperando verificación. Revisa su RUT y certificaciones antes de aprobarlas.`
              : 'Todas las empresas están verificadas. ¡Excelente trabajo!'}
          </p>
          <Link
            href="/panel/superadmin/empresas?filter=pending"
            className="inline-flex bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            {pendingCompanies > 0
              ? `Revisar empresas pendientes →`
              : 'Ver todas las empresas →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
