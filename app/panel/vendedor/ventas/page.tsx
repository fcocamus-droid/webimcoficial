import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP, withIva } from '@/lib/iva'

export const metadata = { title: 'Ventas cerradas · Panel Vendedor' }

export default async function VentasPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })

  if (!company) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-600 mb-2">Ventas cerradas</h2>
        <p className="text-slate-600">Tu empresa aún no está marcada como vendedora.</p>
      </div>
    )
  }

  const responses = await prisma.rfqResponse.findMany({
    where: { sellerCompanyId: company.id, status: 'ACCEPTED' },
    include: {
      rfq: {
        include: {
          buyer: {
            select: {
              name: true,
              email: true,
              companies: {
                select: { razonSocial: true, region: true, ciudad: true },
                take: 1,
              },
            },
          },
          product: { select: { title: true, slug: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const totalNeto = responses.reduce((sum, r) => sum + r.totalPrice, 0)
  const totalConIva = withIva(totalNeto)

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">Ventas cerradas</h2>
        <p className="text-sm text-slate-600 mt-1">
          Cotizaciones que aceptaron los compradores y se transformaron en
          ventas.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Ventas cerradas" value={String(responses.length)} icon="🤝" />
        <Stat
          label="Total transado (neto)"
          value={responses.length > 0 ? formatCLP(totalNeto) : '—'}
          icon="💸"
          accent="navy"
        />
        <Stat
          label="Con IVA 19%"
          value={responses.length > 0 ? formatCLP(totalConIva) : '—'}
          icon="📊"
          accent="verified"
        />
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no tienes ventas cerradas
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Cuando un comprador acepte una de tus cotizaciones, aparecerá aquí
            como venta cerrada con todo su detalle.
          </p>
          <Link
            href="/panel/vendedor/solicitudes"
            className="btn-primary inline-block mt-5"
          >
            Ver solicitudes pendientes →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">RFQ</th>
                  <th className="px-5 py-3">Comprador</th>
                  <th className="px-5 py-3">Cantidad</th>
                  <th className="px-5 py-3">Total neto</th>
                  <th className="px-5 py-3">Aceptada</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((r) => {
                  const buyerCompany = r.rfq.buyer.companies[0]
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs text-slate-500">
                          {r.rfq.number}
                        </p>
                        <p className="font-medium text-slate-900 truncate max-w-[280px]">
                          {r.rfq.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.rfq.category?.name || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-900">
                          {buyerCompany?.razonSocial || r.rfq.buyer.name}
                        </p>
                        {buyerCompany?.ciudad && (
                          <p className="text-xs text-slate-500">
                            {buyerCompany.ciudad}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {r.rfq.quantity} {r.rfq.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-navy-600">
                          {formatCLP(r.totalPrice)}
                        </p>
                        <p className="text-xs text-slate-500">
                          c/IVA {formatCLP(withIva(r.totalPrice))}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {new Date(r.updatedAt).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/panel/vendedor/solicitudes/${r.rfqId}`}
                          className="text-xs font-medium text-amber-600 hover:underline"
                        >
                          Ver detalle →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: string
  accent?: 'navy' | 'verified'
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
      <p
        className={`text-2xl font-bold ${
          accent === 'verified' ? 'text-verified-600' : 'text-navy-600'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
