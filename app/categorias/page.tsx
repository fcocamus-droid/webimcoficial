import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Categorías · IMC Industriales',
  description:
    'Explora todas las categorías del marketplace B2B industrial de Chile.',
}

export default async function CategoriasIndex() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: { where: { available: true } } },
      },
    },
  })

  return (
    <>
      <Header />
      <main>
        <section className="bg-navy-700 text-white py-14 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/img/hero-warehouse.png)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-700/95 via-navy-600/90 to-navy-800/95" aria-hidden="true" />
          <div className="container-base text-center relative">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Categorías industriales
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Encuentra fabricantes e importadores chilenos en las principales
              categorías B2B.
            </p>
          </div>
        </section>

        <section className="py-12 bg-slate-50">
          <div className="container-base">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categorias/${c.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-navy-600 hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-navy-600/5 group-hover:bg-navy-600 group-hover:text-white text-3xl rounded-2xl flex items-center justify-center transition-colors shrink-0">
                      {c.icon || '🏭'}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-navy-600 text-lg group-hover:text-navy-700">
                        {c.name}
                      </h2>
                      {c.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-3 font-medium">
                        {c._count.products} producto
                        {c._count.products !== 1 ? 's' : ''} disponible
                        {c._count.products !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
