import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/app/components/ProductCard'
import RespondForm from './RespondForm'

export const metadata = { title: 'Responder cotización · Panel Vendedor' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Abierta', cls: 'bg-amber-50 text-amber-700' },
  RESPONDED: { label: 'Con respuestas', cls: 'bg-verified-50 text-verified-600' },
  CLOSED: { label: 'Cerrada', cls: 'bg-slate-100 text-slate-500' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-50 text-red-600' },
}

export default async function SolicitudDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })
  if (!company) notFound()

  const rfq = await prisma.rfq.findFirst({
    where: { id: params.id, visibility: 'PUBLIC' },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          companies: {
            select: { razonSocial: true, region: true, ciudad: true },
            take: 1,
          },
        },
      },
      product: {
        select: {
          slug: true,
          title: true,
          unit: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
      category: { select: { name: true, slug: true } },
      _count: { select: { responses: true } },
    },
  })

  if (!rfq) notFound()

  const myResponse = await prisma.rfqResponse.findUnique({
    where: {
      rfqId_sellerCompanyId: {
        rfqId: rfq.id,
        sellerCompanyId: company.id,
      },
    },
  })

  const badge = STATUS_BADGE[rfq.status] || STATUS_BADGE.OPEN
  const isOpen = rfq.status === 'OPEN' || rfq.status === 'RESPONDED'
  const buyerCompany = rfq.buyer.companies[0]

  return (
    <div className="max-w-4xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link
          href="/panel/vendedor/solicitudes"
          className="hover:text-amber-600"
        >
          ← Volver a solicitudes
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="font-mono text-xs text-slate-500">{rfq.number}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-xs text-slate-500">
            · {rfq._count.responses} respuesta
            {rfq._count.responses !== 1 ? 's' : ''} de otros sellers
          </span>
        </div>
        <h1 className="text-2xl font-bold text-navy-600 mb-3">{rfq.title}</h1>

        {rfq.product && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
            {rfq.product.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rfq.product.images[0].url}
                alt={rfq.product.title}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-2xl">
                📦
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Producto solicitado
              </p>
              <Link
                href={`/productos/${rfq.product.slug}`}
                className="font-semibold text-slate-900 hover:text-navy-600"
              >
                {rfq.product.title}
              </Link>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 my-5">
          <Fact label="Cantidad" value={`${rfq.quantity} ${rfq.unit}`} />
          <Fact
            label="Presupuesto máx"
            value={rfq.budgetMaxCLP ? formatCLP(rfq.budgetMaxCLP) : 'No definido'}
          />
          <Fact
            label="Entrega"
            value={
              rfq.deliveryDeadline
                ? new Date(rfq.deliveryDeadline).toLocaleDateString('es-CL')
                : 'Flexible'
            }
          />
          <Fact label="Lugar" value={rfq.deliveryLocation || 'No definido'} />
        </div>

        <div className="mt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">
            Descripción
          </p>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {rfq.description}
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Comprador
            </p>
            <p className="text-slate-900 font-medium">
              {buyerCompany?.razonSocial || rfq.buyer.name}
            </p>
            {buyerCompany?.ciudad && (
              <p className="text-xs text-slate-500">
                {[buyerCompany.ciudad, buyerCompany.region]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {myResponse && (
              <Link
                href={`/panel/mensajes?rfq=${rfq.id}&with=${rfq.buyer.id}`}
                className="inline-block mt-2 text-xs text-amber-600 hover:underline font-medium"
              >
                💬 Conversar con el comprador →
              </Link>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Solicitud enviada
            </p>
            <p className="text-slate-900 font-medium">
              {new Date(rfq.createdAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Form de respuesta */}
      {isOpen ? (
        <RespondForm
          rfqId={rfq.id}
          quantity={rfq.quantity}
          unit={rfq.unit}
          initialResponse={
            myResponse
              ? {
                  pricePerUnit: myResponse.pricePerUnit,
                  totalPrice: myResponse.totalPrice,
                  leadTimeDays: myResponse.leadTimeDays ?? null,
                  notes: myResponse.notes ?? '',
                  status: myResponse.status,
                }
              : null
          }
        />
      ) : (
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-slate-600">
            Esta cotización ya no está abierta para nuevas respuestas.
          </p>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-slate-900 text-sm">{value || '—'}</p>
    </div>
  )
}
