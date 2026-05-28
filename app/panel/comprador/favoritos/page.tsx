import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/app/components/ProductCard'

export const metadata = { title: 'Favoritos · Panel Comprador' }

export default async function FavoritosPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const favorites = await prisma.favorite.findMany({
    where: { userId, productId: { not: null } },
    include: {
      product: {
        include: {
          category: { select: { name: true } },
          company: {
            select: { razonSocial: true, verified: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const products = favorites
    .map((f) => f.product)
    .filter((p): p is NonNullable<typeof p> => !!p && p.available)

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Productos favoritos
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {products.length} producto{products.length !== 1 ? 's' : ''} guardado
          {products.length !== 1 ? 's' : ''} para comparar y volver a comprar
        </p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Aún no tienes favoritos
          </h3>
          <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto">
            Cuando navegues productos en el marketplace, haz click en el
            corazón ❤️ para guardarlos aquí y compararlos cuando quieras.
          </p>
          <Link href="/categorias" className="btn-primary inline-block">
            Explorar categorías →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      )}
    </div>
  )
}
