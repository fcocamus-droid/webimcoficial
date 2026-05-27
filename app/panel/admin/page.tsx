import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Panel Admin · IMC Industriales' }

export default async function PanelAdmin() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/admin')
  if ((session.user as any).role !== 'ADMIN') redirect('/')

  const [users, companies, products, rfqs] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.product.count(),
    prisma.rfq.count(),
  ])

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-10">
        <div className="container-base max-w-5xl">
          <div className="mb-6">
            <p className="text-xs text-navy-600 font-bold uppercase tracking-wider">
              Panel Admin
            </p>
            <h1 className="text-3xl font-bold text-navy-600">
              Marketplace en vivo
            </h1>
          </div>

          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Usuarios', value: users },
              { label: 'Empresas', value: companies },
              { label: 'Productos', value: products },
              { label: 'RFQs', value: rfqs },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {s.label}
                </p>
                <p className="text-3xl font-bold text-navy-600">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-navy-600 mb-1">
              Por construir
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>· Verificación manual de empresas (RUT + certificaciones)</li>
              <li>· Moderación de productos y RFQs</li>
              <li>· Soporte y reportes</li>
            </ul>
            <div className="mt-6">
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
