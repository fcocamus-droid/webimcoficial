import Link from 'next/link'
import Header from './components/Header'
import Footer from './components/Footer'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'IMC Industriales · Marketplace B2B Chile',
  description:
    'El marketplace B2B industrial de Chile. Construcción, EPP, herramientas, automatización, hidráulica, lubricantes, minería, químicos, packaging y más — directo del fabricante o importador.',
}

export default async function Home() {
  const [categories, totalCompanies, totalProducts] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { available: true } } } },
      },
    }),
    prisma.company.count({ where: { isSeller: true } }),
    prisma.product.count({ where: { available: true } }),
  ])

  // Mostramos 12 en la home (4 columnas x 3 filas) y un "Ver todas" si hay más
  const featuredCategories = categories.slice(0, 12)

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="bg-navy-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="container-base relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Marketplace B2B Industrial · Chile
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5">
              Compra y vende{' '}
              <span className="text-amber-500">insumos industriales</span>{' '}
              al por mayor en Chile
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-7 max-w-2xl">
              Conectamos fabricantes e importadores con empresas compradoras.
              Construcción, EPP, herramientas, automatización, hidráulica,
              minería, químicos y mucho más — directo del proveedor.
            </p>

            {/* Search bar */}
            <form
              action="/categorias"
              className="bg-white rounded-2xl p-2 shadow-2xl shadow-black/20 flex flex-col sm:flex-row gap-2 max-w-2xl"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <svg
                  className="w-5 h-5 text-slate-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Buscar productos, materias primas, proveedores..."
                  className="flex-1 py-2.5 text-slate-900 text-sm focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primary whitespace-nowrap px-6">
                Buscar
              </button>
            </form>

            {/* Quick links — términos industriales pesados */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-200">
              <span className="opacity-70">Popular:</span>
              {[
                'EPP',
                'Cemento',
                'Lubricantes',
                'Compresores',
                'Soldadoras',
                'Cables',
                'Bombas',
                'Soda cáustica',
              ].map((t) => (
                <Link
                  key={t}
                  href={`/categorias?q=${encodeURIComponent(t)}`}
                  className="hover:text-amber-400 underline-offset-2 hover:underline"
                >
                  {t}
                </Link>
              ))}
            </div>

            {/* Two role CTAs */}
            <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-2xl">
              <Link
                href="/registro?tipo=fabricante"
                className="group bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏭</span>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">
                      Soy Fabricante o Importador
                    </p>
                    <p className="text-xs text-blue-200 mt-0.5">
                      Publica tu catálogo y recibe pedidos B2B
                    </p>
                  </div>
                  <span className="text-amber-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </Link>
              <Link
                href="/registro?tipo=comprador"
                className="group bg-amber-500 hover:bg-amber-600 border border-amber-400 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🛒</span>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Soy Comprador</p>
                    <p className="text-xs text-amber-50 mt-0.5">
                      Encuentra proveedores verificados y cotiza
                    </p>
                  </div>
                  <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-slate-50 border-y border-slate-200 py-6">
        <div className="container-base">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Stat
              label="Proveedores activos"
              value={totalCompanies > 0 ? String(totalCompanies) : '—'}
              icon="🏢"
            />
            <Stat
              label="Productos publicados"
              value={totalProducts > 0 ? String(totalProducts) : '—'}
              icon="📦"
            />
            <Stat
              label="Categorías industriales"
              value={String(categories.length)}
              icon="🏷️"
            />
            <Stat label="Pedidos mensuales" value="—" icon="🤝" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categorias" className="py-16 bg-white">
        <div className="container-base">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">
                Catálogo
              </span>
              <h2 className="section-title mt-2">Explora por categoría</h2>
              <p className="text-sm text-slate-500 mt-1">
                {categories.length} categorías industriales cubriendo todo el
                supply B2B chileno
              </p>
            </div>
            <Link
              href="/categorias"
              className="hidden sm:inline-flex text-sm text-amber-600 hover:underline font-medium"
            >
              Ver todas →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="group bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl shrink-0">{cat.icon || '🏭'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-600 text-base leading-tight line-clamp-2">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                      {cat._count.products} producto
                      {cat._count.products !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {cat.description && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {categories.length > featuredCategories.length && (
            <div className="mt-8 text-center">
              <Link
                href="/categorias"
                className="inline-flex items-center gap-2 bg-navy-600 hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-xl"
              >
                Ver las {categories.length} categorías →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS — two columns */}
      <section className="py-16 bg-slate-50">
        <div className="container-base">
          <div className="text-center mb-10">
            <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">
              Cómo funciona
            </span>
            <h2 className="section-title mt-2">
              Dos lados, una sola plataforma
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Diseñado específicamente para el negocio industrial chileno
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sellers */}
            <div className="bg-white rounded-2xl border-2 border-navy-600 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-navy-600 text-white rounded-xl flex items-center justify-center text-2xl">
                  🏭
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy-600">
                    Para Fabricantes e Importadores
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publica y vende al mayor
                  </p>
                </div>
              </div>
              <ol className="space-y-3 mb-5">
                {[
                  {
                    n: 1,
                    t: 'Crea tu perfil verificado',
                    d: 'RUT, certificaciones (ISO, HACCP), bodega, contacto',
                  },
                  {
                    n: 2,
                    t: 'Publica tu catálogo',
                    d: 'Productos, precios por volumen, MOQ, lead times',
                  },
                  {
                    n: 3,
                    t: 'Recibe solicitudes de cotización',
                    d: 'Empresas compradoras te contactan directo',
                  },
                  {
                    n: 4,
                    t: 'Cierra negocios y crece',
                    d: 'Estadísticas, reseñas, ventas recurrentes',
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="w-7 h-7 shrink-0 bg-navy-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.t}</p>
                      <p className="text-xs text-slate-500">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/registro?tipo=fabricante"
                className="inline-flex w-full justify-center bg-navy-600 hover:bg-navy-700 text-white font-semibold py-2.5 rounded-lg text-sm"
              >
                Empezar a vender →
              </Link>
            </div>

            {/* Buyers */}
            <div className="bg-white rounded-2xl border-2 border-amber-500 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center text-2xl">
                  🛒
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-600">
                    Para Compradores Empresariales
                  </h3>
                  <p className="text-xs text-slate-500">
                    Encuentra y cotiza al por mayor
                  </p>
                </div>
              </div>
              <ol className="space-y-3 mb-5">
                {[
                  {
                    n: 1,
                    t: 'Regístrate gratis',
                    d: 'Solo necesitas tu RUT empresa y datos básicos',
                  },
                  {
                    n: 2,
                    t: 'Busca proveedores y productos',
                    d: 'Filtra por categoría, certificación, ubicación, MOQ',
                  },
                  {
                    n: 3,
                    t: 'Solicita cotizaciones',
                    d: 'Envía RFQ a múltiples proveedores en simultáneo',
                  },
                  {
                    n: 4,
                    t: 'Compara y compra',
                    d: 'Negocia directo, sin intermediarios',
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="w-7 h-7 shrink-0 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.t}</p>
                      <p className="text-xs text-slate-500">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/registro?tipo=comprador"
                className="inline-flex w-full justify-center btn-primary py-2.5 text-sm"
              >
                Empezar a comprar →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-16 bg-white">
        <div className="container-base">
          <div className="text-center mb-10">
            <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">
              Ventajas
            </span>
            <h2 className="section-title mt-2">¿Por qué IMC Industriales?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Feature
              icon="✓"
              title="Proveedores verificados"
              desc="Validamos RUT, certificaciones y trayectoria de cada fabricante e importador antes de publicarse."
            />
            <Feature
              icon="🇨🇱"
              title="100% mercado chileno"
              desc="Diseñado para PyMEs y empresas chilenas. Precios en CLP, tributación, RUT, regiones, despacho local."
            />
            <Feature
              icon="📋"
              title="Cotización en simultáneo"
              desc="Envía una sola solicitud a varios proveedores. Compáralos y negocia directo en la plataforma."
            />
            <Feature
              icon="🏢"
              title="Sin intermediarios"
              desc="Conexión directa fabricante–comprador. Tú decides con quién cierras el negocio."
            />
            <Feature
              icon="⚡"
              title="MOQ y precios por volumen"
              desc="Cada producto muestra pedido mínimo y descuentos por cantidad — pensado para negocios B2B."
            />
            <Feature
              icon="🤝"
              title="Relaciones de largo plazo"
              desc="Crea cartera de proveedores recurrentes. Historial de pedidos, favoritos y reseñas."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-amber-gradient text-white">
        <div className="container-base text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Crea tu cuenta gratis y empieza hoy
          </h2>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Sin costos de entrada. Sin contratos largos. Solo paga cuando
            cierres ventas.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/registro?tipo=fabricante"
              className="bg-navy-600 hover:bg-navy-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Quiero vender mis productos →
            </Link>
            <Link
              href="/registro?tipo=comprador"
              className="bg-white text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-xl font-bold"
            >
              Quiero comprar al por mayor →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold text-navy-600">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string
  title: string
  desc: string
}) {
  return (
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
      <div className="w-11 h-11 bg-amber-500 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-navy-600 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}
