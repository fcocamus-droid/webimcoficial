import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/app/components/ProductCard'
import { withIva } from '@/lib/iva'
import RfqActions from './RfqActions'
import AcceptResponseButton from './AcceptResponseButton'

export const metadata = { title: 'Detalle de cotización · Panel Comprador' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Abierta', cls: 'bg-amber-50 text-amber-700' },
  RESPONDED: { label: 'Con respuestas', cls: 'bg-verified-50 text-verified-600' },
  CLOSED: { label: 'Cerrada', cls: 'bg-slate-100 text-slate-500' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
}

export default async function RfqDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const rfq = await prisma.rfq.findFirst({
    where: { id: params.id, buyerId: userId },
    include: {
      product: { select: { id: true, slug: true, title: true, unit: true } },
      category: { select: { name: true, slug: true } },
      responses: {
        include: {
          sellerCompany: {
            select: {
              id: true,
              slug: true,
              razonSocial: true,
              logoUrl: true,
              verified: true,
              ratingAverage: true,
              ratingCount: true,
              userId: true,
            },
          },
        },
        orderBy: { pricePerUnit: 'asc' },
      },
    },
  })

  if (!rfq) notFound()

  const badge = STATUS_BADGE[rfq.status] || STATUS_BADGE.OPEN
  const activeResponses = rfq.responses.filter((r) => r.status !== 'WITHDRAWN')
  const minPrice = activeResponses.length
    ? Math.min(...activeResponses.map((r) => r.pricePerUnit))
    : null

  return (
    <div className="max-w-5xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link href="/panel/comprador/rfqs" className="hover:text-amber-600">
          ← Volver a mis cotizaciones
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="font-mono text-xs text-slate-500">{rfq.number}</p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}
              >
                {badge.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-navy-600">{rfq.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Creada{' '}
              {new Date(rfq.createdAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {rfq.expiresAt && (
                <>
                  {' · '}vence el{' '}
                  {new Date(rfq.expiresAt).toLocaleDateString('es-CL')}
                </>
              )}
            </p>
          </div>
          <RfqActions rfqId={rfq.id} status={rfq.status} />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 my-5">
          <Fact label="Cantidad" value={`${rfq.quantity} ${rfq.unit}`} />
          <Fact
            label="Presupuesto máx"
            value={
              rfq.budgetMaxCLP ? formatCLP(rfq.budgetMaxCLP) || '—' : 'No definido'
            }
          />
          <Fact
            label="Plazo de entrega"
            value={
              rfq.deliveryDeadline
                ? new Date(rfq.deliveryDeadline).toLocaleDateString('es-CL')
                : 'Flexible'
            }
          />
          <Fact
            label="Lugar de entrega"
            value={rfq.deliveryLocation || 'No definido'}
          />
        </div>

        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">
            Descripción
          </p>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {rfq.description}
          </p>
        </div>

        {rfq.product && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">
              Producto asociado
            </p>
            <Link
              href={`/productos/${rfq.product.slug}`}
              className="text-amber-600 hover:underline"
            >
              {rfq.product.title} →
            </Link>
          </div>
        )}
      </div>

      {/* Respuestas */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-navy-600">
          Respuestas recibidas ({activeResponses.length})
        </h2>
        {activeResponses.length > 1 && (
          <p className="text-sm text-slate-600 mt-1">
            Ordenadas por precio más bajo. Compara y elige.
          </p>
        )}
      </div>

      {activeResponses.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Esperando respuestas
          </h3>
          <p className="text-sm text-slate-600">
            Los fabricantes de la categoría están viendo tu solicitud. En cuanto
            te respondan aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeResponses.map((r) => {
            const isCheapest = minPrice !== null && r.pricePerUnit === minPrice
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border ${
                  isCheapest
                    ? 'border-2 border-verified-500 shadow-md'
                    : 'border-slate-200'
                } p-5`}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {r.sellerCompany.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.sellerCompany.logoUrl}
                      alt={r.sellerCompany.razonSocial}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-navy-600 text-white text-base font-bold flex items-center justify-center">
                      {r.sellerCompany.razonSocial.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900">
                        {r.sellerCompany.razonSocial}
                      </h3>
                      {r.sellerCompany.verified && (
                        <span className="text-xs font-semibold text-verified-600">
                          ✓ Verificado
                        </span>
                      )}
                      {isCheapest && activeResponses.length > 1 && (
                        <span className="text-xs font-bold bg-verified-500 text-white px-2 py-0.5 rounded">
                          MEJOR PRECIO
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs">
                      <Link
                        href={`/proveedores/${r.sellerCompany.slug}`}
                        className="text-amber-600 hover:underline"
                      >
                        Ver perfil →
                      </Link>
                      <Link
                        href={`/panel/mensajes?rfq=${rfq.id}&with=${r.sellerCompany.userId}`}
                        className="text-navy-600 hover:underline font-medium"
                      >
                        💬 Escribir al proveedor
                      </Link>
                    </div>
                    {r.notes && (
                      <p className="text-sm text-slate-700 mt-3 whitespace-pre-line">
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Precio unitario
                    </p>
                    <p className="text-xl font-bold text-navy-600">
                      {formatCLP(r.pricePerUnit) || '—'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      c/IVA {formatCLP(withIva(r.pricePerUnit))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Total neto
                    </p>
                    <p className="text-xl font-bold text-navy-600">
                      {formatCLP(r.totalPrice) || '—'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      c/IVA {formatCLP(withIva(r.totalPrice))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Plazo de entrega
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {r.leadTimeDays ? `${r.leadTimeDays} días` : 'A consultar'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Recibida
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {new Date(r.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>

                {/* Botón aceptar */}
                {rfq.status !== 'CLOSED' &&
                  rfq.status !== 'CANCELLED' &&
                  r.status === 'SENT' && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <AcceptResponseButton
                        rfqId={rfq.id}
                        responseId={r.id}
                        sellerName={r.sellerCompany.razonSocial}
                      />
                    </div>
                  )}
                {r.status === 'ACCEPTED' && (
                  <div className="mt-4 pt-4 border-t border-verified-200 flex items-center gap-2 text-sm">
                    <span className="text-2xl">🤝</span>
                    <p className="font-semibold text-verified-600">
                      Aceptaste esta cotización — el proveedor fue notificado.
                    </p>
                  </div>
                )}
                {r.status === 'REJECTED' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                    No elegiste esta cotización.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-bold text-slate-900 text-sm">{value || '—'}</p>
    </div>
  )
}
