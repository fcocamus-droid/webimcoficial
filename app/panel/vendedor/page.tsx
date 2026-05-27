import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Panel Vendedor · IMC Industriales' }

export default async function PanelVendedor() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/vendedor')

  const userId = (session.user as any).id as string
  const company = await prisma.company.findFirst({
    where: { userId },
    include: {
      _count: { select: { products: true, rfqResponses: true } },
    },
  })

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-10">
        <div className="container-base max-w-5xl">
          <div className="mb-6">
            <p className="text-xs text-navy-600 font-bold uppercase tracking-wider">
              Panel Vendedor
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
                Productos publicados
              </p>
              <p className="text-3xl font-bold text-navy-600">
                {company?._count.products ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Cotizaciones enviadas
              </p>
              <p className="text-3xl font-bold text-navy-600">
                {company?._count.rfqResponses ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Estado de perfil
              </p>
              <p className="text-base font-semibold mt-2">
                {company?.verified ? (
                  <span className="text-verified-600">✓ Verificado</span>
                ) : (
                  <span className="text-amber-600">Pendiente</span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-navy-600 mb-1">
              Próximos pasos
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Tu cuenta está creada. Estamos terminando el panel del vendedor.
              Estas secciones estarán disponibles pronto:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>· Mi catálogo (publicar y editar productos)</li>
              <li>· Solicitudes de cotización (RFQs) recibidas</li>
              <li>· Mensajería con compradores</li>
              <li>· Certificaciones (ISO, HACCP, BPM)</li>
              <li>· Estadísticas de mi tienda</li>
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
