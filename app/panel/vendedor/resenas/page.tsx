import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Reseñas · Panel Vendedor' }

export default async function ResenasPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: {
      id: true,
      ratingAverage: true,
      ratingCount: true,
    },
  })

  if (!company) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-600 mb-2">Reseñas</h2>
        <p className="text-slate-600">Tu empresa aún no está marcada como vendedora.</p>
      </div>
    )
  }

  const reviews = await prisma.review.findMany({
    where: { toCompanyId: company.id },
    include: {
      fromUser: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
          companies: { select: { razonSocial: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Distribución por estrellas
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { star, count, percent }
  })

  const avg = company.ratingAverage ?? 0

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Reseñas de compradores
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Lo que dicen los compradores empresariales sobre tu servicio.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no tienes reseñas
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Cuando cierres ventas, los compradores podrán dejarte reseñas que
            aparecerán aquí y en tu perfil público.
          </p>
        </div>
      ) : (
        <>
          {/* Resumen general */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 grid md:grid-cols-[200px_1fr] gap-6">
            <div className="text-center md:text-left">
              <p className="text-5xl font-bold text-navy-600">
                {avg.toFixed(1)}
              </p>
              <Stars rating={avg} size="lg" />
              <p className="text-sm text-slate-600 mt-2">
                {reviews.length} reseña{reviews.length !== 1 ? 's' : ''} en total
              </p>
            </div>
            <div className="space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-700 w-8">{d.star}★</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de reseñas */}
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-start gap-3">
                  {r.fromUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.fromUser.avatarUrl}
                      alt={r.fromUser.name ?? ''}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-navy-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {(r.fromUser.name || r.fromUser.email)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.fromUser.companies[0]?.razonSocial ||
                            r.fromUser.name ||
                            r.fromUser.email}
                        </p>
                        <Stars rating={r.rating} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stars({
  rating,
  size = 'sm',
}: {
  rating: number
  size?: 'sm' | 'lg'
}) {
  const cls = size === 'lg' ? 'text-2xl' : 'text-sm'
  return (
    <div className={`${cls} text-amber-500 leading-none`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s}>{rating >= s ? '★' : '☆'}</span>
      ))}
    </div>
  )
}
