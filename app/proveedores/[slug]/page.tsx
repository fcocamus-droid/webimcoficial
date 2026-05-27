import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import ProductCard from '@/app/components/ProductCard'
import { prisma } from '@/lib/prisma'

const CERT_LABEL: Record<string, string> = {
  ISO_9001: 'ISO 9001',
  ISO_14001: 'ISO 14001',
  HACCP: 'HACCP',
  BPM: 'BPM',
  GMP: 'GMP',
  KOSHER: 'Kosher',
  ORGANICO: 'Orgánico',
  FDA: 'FDA',
  OTRA: 'Otra',
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { razonSocial: true, description: true },
  })
  if (!company) return { title: 'Proveedor no encontrado' }
  return {
    title: `${company.razonSocial} · IMC Industriales`,
    description: company.description ?? undefined,
  }
}

export default async function ProveedorDetail({
  params,
}: {
  params: { slug: string }
}) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      certifications: {
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { products: { where: { available: true } } },
      },
    },
  })
  if (!company || !company.isSeller) notFound()

  const products = await prisma.product.findMany({
    where: { companyId: company.id, available: true },
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
    take: 60,
  })

  return (
    <>
      <Header />
      <main>
        {/* Banner / header de empresa */}
        <section
          className="relative bg-navy-gradient text-white"
          style={
            company.bannerUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(15,42,92,0.85),rgba(22,34,83,0.95)), url(${company.bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="container-base py-12">
            <div className="text-xs text-blue-200 mb-4">
              <Link href="/proveedores" className="hover:text-white">
                Proveedores
              </Link>
              {' / '}
              <span>{company.razonSocial}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-5">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.razonSocial}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white text-navy-600 text-3xl font-bold flex items-center justify-center border-4 border-white shadow-xl shrink-0">
                  {company.razonSocial.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {company.razonSocial}
                  </h1>
                  {company.verified && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold bg-verified-500/20 text-verified-400 px-3 py-1 rounded-full">
                      ✓ Verificado
                    </span>
                  )}
                </div>
                {company.giro && (
                  <p className="text-blue-100">{company.giro}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-100">
                  {(company.ciudad || company.region) && (
                    <span>
                      📍{' '}
                      {[company.ciudad, company.comuna, company.region]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                  <span>
                    📦 {company._count.products} producto
                    {company._count.products !== 1 ? 's' : ''} publicado
                    {company._count.products !== 1 ? 's' : ''}
                  </span>
                  {company.ratingCount > 0 && company.ratingAverage && (
                    <span>
                      ⭐ {company.ratingAverage.toFixed(1)} ({company.ratingCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-8 min-h-screen">
          <div className="container-base">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
              {/* Productos */}
              <div>
                <h2 className="text-2xl font-bold text-navy-600 mb-5">
                  Catálogo del proveedor
                </h2>
                {products.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
                    <p className="text-slate-600">
                      Este proveedor aún no tiene productos publicados.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p as any} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar empresa */}
              <aside className="space-y-4">
                {company.description && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-navy-600 uppercase tracking-wider mb-3">
                      Sobre la empresa
                    </h3>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {company.description}
                    </p>
                  </div>
                )}

                {company.certifications.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-navy-600 uppercase tracking-wider mb-3">
                      Certificaciones
                    </h3>
                    <div className="space-y-2">
                      {company.certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              cert.verified
                                ? 'bg-verified-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {cert.verified ? '✓' : '?'}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {CERT_LABEL[cert.type] || cert.type}
                            {cert.type === 'OTRA' && cert.customName
                              ? `: ${cert.customName}`
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(company.websiteUrl ||
                  company.contactEmail ||
                  company.contactPhone) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-navy-600 uppercase tracking-wider mb-3">
                      Contacto
                    </h3>
                    <div className="space-y-2 text-sm">
                      {company.websiteUrl && (
                        <a
                          href={company.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-amber-600 hover:underline truncate"
                        >
                          🌐 Sitio web
                        </a>
                      )}
                      {company.contactEmail && (
                        <p className="text-slate-700 truncate">
                          ✉️ {company.contactEmail}
                        </p>
                      )}
                      {company.contactPhone && (
                        <p className="text-slate-700">
                          📞 {company.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-amber-gradient text-white rounded-2xl p-5">
                  <p className="font-bold mb-1">Solicita una cotización</p>
                  <p className="text-white/90 text-sm mb-3">
                    Contacta directamente a este proveedor a través del
                    marketplace.
                  </p>
                  <Link
                    href="/registro?tipo=comprador"
                    className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-4 py-2 rounded-lg text-sm inline-block"
                  >
                    Crear cuenta de comprador →
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
