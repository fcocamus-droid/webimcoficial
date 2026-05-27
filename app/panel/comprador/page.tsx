import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Panel Comprador · IMC Industriales' }

export default async function PanelComprador() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/comprador')

  const userId = (session.user as any).id as string
  const [company, rfqsOpen, favorites] = await Promise.all([
    prisma.company.findFirst({ where: { userId } }),
    prisma.rfq.count({ where: { buyerId: userId, status: 'OPEN' } }),
    prisma.favorite.count({ where: { userId } }),
  ])

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-10">
        <div className="container-base max-w-5xl">
          <div className="mb-6">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">
              Panel Comprador
            </p>
            <h1 className="text-3xl font-bold text-navy-600">
              ¡Hola, {session.user.name}!
            </h1>
            <p className="text-slate-600 mt-1">
              {company?.razonSocial || 'Tu empresa'} · RUT {company?.rut || '—'}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                RFQ abiertas
              </p>
              <p className="text-3xl font-bold text-amber-600">{rfqsOpen}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Productos favoritos
              </p>
              <p className="text-3xl font-bold text-amber-600">{favorites}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Empresa
              </p>
              <p className="text-base font-semibold mt-2 truncate">
                {company?.razonSocial ?? '—'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-navy-600 mb-1">
              Próximos pasos
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Tu cuenta está creada. Estamos terminando el panel del comprador.
              Estas secciones estarán disponibles pronto:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>· Buscar productos por categoría</li>
              <li>· Solicitar cotizaciones (RFQ) a uno o varios proveedores</li>
              <li>· Comparar respuestas</li>
              <li>· Favoritos y proveedores frecuentes</li>
              <li>· Mensajería con vendedores</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link href="/categorias" className="btn-primary">
                Explorar categorías →
              </Link>
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
