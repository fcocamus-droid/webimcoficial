import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Resumen · Panel Vendedor' }

export default async function VendedorResumen() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId },
    include: {
      _count: { select: { products: true, rfqResponses: true } },
    },
  })

  const [openRfqs, productsAvailable] = await Promise.all([
    company
      ? prisma.rfq.count({
          where: {
            status: 'OPEN',
            responses: { none: { sellerCompanyId: company.id } },
          },
        })
      : Promise.resolve(0),
    company
      ? prisma.product.count({
          where: { companyId: company.id, available: true },
        })
      : Promise.resolve(0),
  ])

  return (
    <div className="max-w-5xl">
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Productos publicados" value={company?._count.products ?? 0} />
        <Stat label="En stock disponible" value={productsAvailable} accent="verified" />
        <Stat label="RFQs por responder" value={openRfqs} accent="amber" />
        <Stat label="Cotizaciones enviadas" value={company?._count.rfqResponses ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Tu catálogo
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Publica tus productos con fotos, MOQ, tiempos de entrega y descuentos
            por volumen. Mientras más completo esté tu catálogo, más
            cotizaciones recibirás.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/panel/vendedor/productos"
              className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              Ver catálogo →
            </Link>
            <Link
              href="/panel/vendedor/productos/nuevo"
              className="btn-secondary"
            >
              + Nuevo producto
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-navy-600 mb-2">
            Por construir
          </h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>· Bandeja de solicitudes de cotización (RFQs)</li>
            <li>· Mensajería con compradores</li>
            <li>· Certificaciones de empresa (ISO, HACCP, BPM)</li>
            <li>· Estadísticas de tu tienda (vistas, conversión)</li>
          </ul>
        </div>
      </div>
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
