import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { prisma } from '@/lib/prisma'
import { formatCLP } from '@/app/components/ProductCard'
import { withIva } from '@/lib/iva'
import ProductGallery from './ProductGallery'
import RfqCta from './RfqCta'
import FavoriteButton from '@/app/components/FavoriteButton'

const STOCK_LABEL: Record<string, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-verified-50 text-verified-600' },
  A_PEDIDO: { label: 'A pedido', cls: 'bg-amber-50 text-amber-700' },
  AGOTADO: { label: 'Agotado', cls: 'bg-slate-100 text-slate-500' },
}

const ORIGIN_LABEL: Record<string, string> = {
  CHILE: '🇨🇱 Chile',
  CHINA: '🇨🇳 China',
  USA: '🇺🇸 USA',
  EUROPA: '🇪🇺 Europa',
  LATAM: 'Latinoamérica',
  OTRO: 'Otro',
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { title: true, shortDescription: true },
  })
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.title} · IMC Industriales`,
    description: product.shortDescription ?? undefined,
  }
}

export default async function ProductoDetail({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: { select: { name: true, slug: true } },
      company: {
        select: {
          id: true,
          slug: true,
          razonSocial: true,
          giro: true,
          logoUrl: true,
          verified: true,
          region: true,
          ciudad: true,
          comuna: true,
          ratingAverage: true,
          ratingCount: true,
        },
      },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
      },
      pricingTiers: { orderBy: { minQuantity: 'asc' } },
    },
  })
  if (!product || !product.available) notFound()

  // Bump view count (fire-and-forget; no await)
  prisma.product
    .update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {})

  // Productos relacionados (misma categoría, otra empresa)
  const related = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          available: true,
          NOT: { id: product.id },
        },
        include: {
          category: { select: { name: true } },
          company: { select: { razonSocial: true, verified: true, slug: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        take: 4,
      })
    : []

  const stock = STOCK_LABEL[product.stockStatus]
  const specs =
    product.specs && typeof product.specs === 'object'
      ? Object.entries(product.specs as Record<string, unknown>)
      : []

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="container-base py-6">
          {/* Breadcrumbs */}
          <div className="text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-amber-600">
              Inicio
            </Link>
            {' / '}
            <Link href="/categorias" className="hover:text-amber-600">
              Categorías
            </Link>
            {product.category && (
              <>
                {' / '}
                <Link
                  href={`/categorias/${product.category.slug}`}
                  className="hover:text-amber-600"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            {' / '}
            <span className="text-slate-700">{product.title}</span>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
            {/* Galería */}
            <ProductGallery
              images={product.images.map((i) => ({
                id: i.id,
                url: i.url,
                alt: i.alt || product.title,
              }))}
              title={product.title}
            />

            {/* Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${stock.cls}`}
                >
                  {stock.label}
                </span>
                {product.featured && (
                  <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded">
                    ★ Destacado
                  </span>
                )}
                {product.brand && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {product.brand}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-navy-600">
                  {product.title}
                </h1>
                <FavoriteButton productId={product.id} variant="icon" />
              </div>

              {product.shortDescription && (
                <p className="text-slate-700 mb-5">{product.shortDescription}</p>
              )}

              {/* Precio */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
                {product.basePriceCLP ? (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Precio base · neto
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-navy-600">
                        {formatCLP(product.basePriceCLP)}
                      </p>
                      <p className="text-sm text-slate-500">/ {product.unit}</p>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      <span className="text-slate-500">+ IVA 19% =</span>{' '}
                      <strong className="text-slate-900">
                        {formatCLP(withIva(product.basePriceCLP))}
                      </strong>{' '}
                      <span className="text-xs text-slate-500">
                        / {product.unit} final
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      Precio referencial. Cotiza para volumen, plazos y
                      condiciones específicas.
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-slate-700">
                    Precio a consultar
                  </p>
                )}

                {/* Pricing tiers */}
                {product.pricingTiers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Descuentos por volumen (precios netos)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {product.pricingTiers.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center"
                        >
                          <p className="text-xs text-slate-500">
                            Desde {t.minQuantity} {product.unit}
                          </p>
                          <p className="font-bold text-navy-600">
                            {formatCLP(t.priceCLP)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            c/IVA {formatCLP(withIva(t.priceCLP))}
                          </p>
                          {t.label && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              {t.label}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Datos B2B */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Fact label="MOQ" value={`${product.moq} ${product.unit}`} />
                <Fact
                  label="Plazo de entrega"
                  value={
                    product.leadTimeDays
                      ? `${product.leadTimeDays} días`
                      : 'A consultar'
                  }
                />
                <Fact label="Unidad" value={product.unit} />
                <Fact
                  label="Origen"
                  value={ORIGIN_LABEL[product.origin] || product.origin}
                />
              </div>

              {/* Ficha técnica */}
              {product.datasheetUrl && (
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 flex items-center gap-3 bg-white border border-slate-200 hover:border-navy-600 rounded-xl p-3 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-navy-600">
                      Ficha técnica del producto
                    </p>
                    <p className="text-xs text-slate-500">
                      Documento oficial con specs completas
                    </p>
                  </div>
                  <span className="text-amber-600 text-sm font-medium">
                    Descargar →
                  </span>
                </a>
              )}

              {/* CTA cotización */}
              <RfqCta
                productId={product.id}
                productSlug={product.slug}
                productTitle={product.title}
              />
            </div>
          </div>

          {/* Descripción + ficha técnica + proveedor */}
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mt-10">
            <div className="space-y-6">
              {product.description && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-navy-600 mb-3">
                    Descripción
                  </h2>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </section>
              )}

              {specs.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-navy-600 mb-3">
                    Ficha técnica
                  </h2>
                  <dl className="divide-y divide-slate-100">
                    {specs.map(([k, v]) => (
                      <div
                        key={k}
                        className="grid grid-cols-[160px_1fr] py-2 text-sm"
                      >
                        <dt className="text-slate-500 capitalize">{k}</dt>
                        <dd className="text-slate-900 font-medium">
                          {String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>

            {/* Card proveedor */}
            <aside>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Proveedor
                </p>
                <div className="flex items-start gap-3 mb-4">
                  {product.company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.company.logoUrl}
                      alt={product.company.razonSocial}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-navy-600 text-white text-lg font-bold flex items-center justify-center">
                      {product.company.razonSocial.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">
                      {product.company.razonSocial}
                    </h3>
                    {product.company.giro && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {product.company.giro}
                      </p>
                    )}
                    {product.company.verified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-verified-600">
                        ✓ Verificado
                      </span>
                    )}
                  </div>
                </div>

                {(product.company.ciudad || product.company.region) && (
                  <p className="text-sm text-slate-600 mb-4">
                    📍{' '}
                    {[
                      product.company.ciudad,
                      product.company.comuna,
                      product.company.region,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}

                <Link
                  href={`/proveedores/${product.company.slug}`}
                  className="btn-secondary w-full text-sm py-2.5"
                >
                  Ver perfil del proveedor →
                </Link>
              </div>
            </aside>
          </div>

          {/* Relacionados */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-navy-600 mb-5">
                Productos similares
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {related.map((p) => (
                  <RelatedCard key={p.id} product={p as any} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-bold text-slate-900 text-sm">{value}</p>
    </div>
  )
}

function RelatedCard({
  product,
}: {
  product: {
    slug: string
    title: string
    basePriceCLP: number | null
    unit: string
    moq: number
    images: { url: string }[]
    company: { razonSocial: string; verified: boolean }
  }
}) {
  const img = product.images[0]?.url
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-navy-600 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-3xl">
            📦
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm group-hover:text-navy-600">
          {product.title}
        </h3>
        <div className="mt-2 text-sm">
          {product.basePriceCLP ? (
            <p className="font-bold text-navy-600">
              {formatCLP(product.basePriceCLP)}
            </p>
          ) : (
            <p className="text-slate-500 text-xs">A consultar</p>
          )}
        </div>
      </div>
    </Link>
  )
}
