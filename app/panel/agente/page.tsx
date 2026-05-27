import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Panel Agente · IMC Industriales' }

export default async function PanelAgente() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/agente')

  const user = session.user as any
  if (user.role !== 'SALES_AGENT') redirect('/')

  // Stats globales del marketplace (los agentes ayudan a operar todo)
  const [companies, products, rfqsOpen, sellersPending] = await Promise.all([
    prisma.company.count(),
    prisma.product.count(),
    prisma.rfq.count({ where: { status: 'OPEN' } }),
    prisma.company.count({ where: { verified: false, isSeller: true } }),
  ])

  // Quien me creó (mi jefe operacional)
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    include: { createdBy: { select: { name: true, email: true } } },
  })

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="bg-amber-gradient text-white py-8">
          <div className="container-base">
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
              Agente de ventas
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              ¡Hola, {session.user.name || session.user.email}!
            </h1>
            {me?.createdBy && (
              <p className="text-white/90 text-sm mt-1">
                Reportas a {me.createdBy.name || me.createdBy.email}
              </p>
            )}
          </div>
        </div>

        <div className="container-base py-8 max-w-5xl">
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Empresas
              </p>
              <p className="text-3xl font-bold text-navy-600">{companies}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Productos
              </p>
              <p className="text-3xl font-bold text-navy-600">{products}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                RFQs abiertas
              </p>
              <p className="text-3xl font-bold text-amber-600">{rfqsOpen}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Sellers por verificar
              </p>
              <p className="text-3xl font-bold text-verified-600">
                {sellersPending}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-navy-600 mb-2">
              Tu trabajo en el marketplace
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Como agente de ventas ayudas a que el marketplace crezca. Tu panel
              está en construcción. Estas son las herramientas que vienen:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>· Onboarding de nuevos fabricantes / importadores</li>
              <li>· Verificación de empresas (RUT, certificaciones)</li>
              <li>· Seguimiento de RFQs abiertas y empuje a sellers</li>
              <li>· Soporte directo a compradores empresariales</li>
              <li>· Métricas personales de actividad y conversión</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link href="/" className="btn-secondary">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
