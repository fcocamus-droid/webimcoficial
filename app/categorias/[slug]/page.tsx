import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import ProductCard from '@/app/components/ProductCard'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const ORIGIN_OPTIONS = [
  { value: 'CHILE', label: 'Chile' },
  { value: 'CHINA', label: 'China' },
  { value: 'USA', label: 'USA' },
  { value: 'EUROPA', label: 'Europa' },
  { value: 'LATAM', label: 'LATAM' },
  { value: 'OTRO', label: 'Otro' },
]

const STOCK_FILTERS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'A_PEDIDO', label: 'A pedido' },
]

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  })
  if (!category) return { title: 'Categoría no encontrada' }
  return {
    title: `${category.name} · IMC Industriales`,
    description: category.description ?? undefined,
  }
}

export default async function CategoriaDetail({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: {
    q?: string
    origin?: string
    stock?: string
    verified?: string
  }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  })
  if (!category) notFound()

  const where: Prisma.ProductWhereInput = {
    categoryId: category.id,
    available: true,
    ...(searchParams.q
      ? {
          OR: [
            { title: { contains: searchParams.q, mode: 'insensitive' } },
            { brand: { contains: searchParams.q, mode: 'insensitive' } },
            {
              shortDescription: {
                contains: searchParams.q,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
    ...(searchParams.origin && ORIGIN_OPTIONS.some((o) => o.value === searchParams.origin)
      ? { origin: searchParams.origin as any }
      : {}),
    ...(searchParams.stock && STOCK_FILTERS.some((s) => s.value === searchParams.stock)
      ? { stockStatus: searchParams.stock as any }
      : {}),
    ...(searchParams.verified === '1'
      ? { company: { verified: true } }
      : {}),
  }

  const products = await prisma.product.findMany({
    where,
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
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    take: 60,
  })

  return (
    <>
      <Header />
      <main>
        <section className="bg-navy-gradient text-white py-10">
          <div className="container-base">
            <div className="text-xs text-blue-200 mb-2">
              <Link href="/categorias" className="hover:text-white">
                Categorías
              </Link>{' '}
              / <span>{category.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 text-4xl rounded-2xl flex items-center justify-center">
                {category.icon || '🏭'}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-blue-100 mt-1">{category.description}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-8">
          <div className="container-base">
            {/* Filtros */}
            <form
              method="GET"
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]"
            >
              <div>
                <label className="label-base text-xs">Buscar</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchParams.q || ''}
                  className="input-base"
                  placeholder="Nombre, marca…"
                />
              </div>
              <div>
                <label className="label-base text-xs">Origen</label>
                <select
                  name="origin"
                  defaultValue={searchParams.origin || ''}
                  className="input-base"
                >
                  <option value="">Cualquiera</option>
                  {ORIGIN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base text-xs">Stock</label>
                <select
                  name="stock"
                  defaultValue={searchParams.stock || ''}
                  className="input-base"
                >
                  <option value="">Cualquiera</option>
                  {STOCK_FILTERS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm self-end pb-2">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={searchParams.verified === '1'}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Solo verificados</span>
              </label>
              <button type="submit" className="btn-primary self-end">
                Filtrar
              </button>
            </form>

            <p className="text-sm text-slate-600 mb-4">
              {products.length} producto{products.length !== 1 ? 's' : ''}
              {Object.keys(searchParams).length > 0 && (
                <>
                  {' · '}
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="text-amber-600 hover:underline"
                  >
                    Limpiar filtros
                  </Link>
                </>
              )}
            </p>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Sin resultados
                </h3>
                <p className="text-sm text-slate-600">
                  Aún no hay productos publicados en esta categoría con esos
                  filtros. Vuelve pronto.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
