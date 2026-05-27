import Link from 'next/link'
import IMCLogo from '../components/IMCLogo'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Productos · IMC Cargo',
  description: 'Catálogo de productos importados desde USA — Amazon y eBay con entrega en Chile',
}

export default async function ProductosPage({ searchParams }: { searchParams: { c?: string; q?: string } }) {
  // Load categories with counts
  const categoriesRaw = await prisma.$queryRaw<Array<{ slug: string; name: string; icon: string; count: bigint }>>`
    SELECT c.slug, c.name, c.icon, COUNT(p.id) AS count
    FROM product_categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.available = true
    WHERE c.active = true
    GROUP BY c.id
    ORDER BY c.sort_order
  `
  const categories = categoriesRaw.map((c) => ({ ...c, count: Number(c.count) }))

  // Load products with filters
  const categoryFilter = searchParams.c
  const searchFilter = searchParams.q?.trim()

  let products: any[] = []
  if (searchFilter) {
    products = await prisma.$queryRaw`
      SELECT p.id, p.slug, p.title, p.price_clp AS "priceCLP", p.price_usd AS "priceUSD",
        p.source_marketplace AS marketplace, p.brand,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS thumbnail,
        c.name AS "categoryName", c.slug AS "categorySlug"
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.available = true AND (p.title ILIKE ${`%${searchFilter}%`} OR p.brand ILIKE ${`%${searchFilter}%`})
      ORDER BY p.featured DESC, p."createdAt" DESC
      LIMIT 60
    `
  } else if (categoryFilter) {
    products = await prisma.$queryRaw`
      SELECT p.id, p.slug, p.title, p.price_clp AS "priceCLP", p.price_usd AS "priceUSD",
        p.source_marketplace AS marketplace, p.brand,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS thumbnail,
        c.name AS "categoryName", c.slug AS "categorySlug"
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      WHERE p.available = true AND c.slug = ${categoryFilter}
      ORDER BY p.featured DESC, p."createdAt" DESC
      LIMIT 60
    `
  } else {
    products = await prisma.$queryRaw`
      SELECT p.id, p.slug, p.title, p.price_clp AS "priceCLP", p.price_usd AS "priceUSD",
        p.source_marketplace AS marketplace, p.brand,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS thumbnail,
        c.name AS "categoryName", c.slug AS "categorySlug"
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.available = true
      ORDER BY p.featured DESC, p."createdAt" DESC
      LIMIT 60
    `
  }

  const totalAll = categories.reduce((s, c) => s + c.count, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center"><IMCLogo size="md" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/#servicios" className="hover:text-[#F47920]">Servicios</Link>
            <Link href="/#cotizar" className="hover:text-[#F47920]">Cotizar</Link>
            <Link href="/productos" className="text-[#F47920] font-semibold">Productos</Link>
            <Link href="/#nosotros" className="hover:text-[#F47920]">Nosotros</Link>
            <Link href="/#contacto" className="hover:text-[#F47920]">Contacto</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/carrito" className="relative p-2 text-slate-600 hover:text-[#F47920]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </Link>
            <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-[#1B2A6B] hover:text-[#F47920] px-4 py-2">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2A6B] via-[#1F3174] to-[#0F1740] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#F47920]/20 border border-[#F47920]/30 text-[#F47920] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Tienda IMC</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Productos importados desde USA</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-base">Amazon · eBay · Otros marketplaces. Precio final con shipping a Chile incluido.</p>

          {/* Search */}
          <form action="/productos" method="get" className="max-w-xl mx-auto mt-6 relative">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              name="q"
              defaultValue={searchFilter || ''}
              placeholder="Buscar producto..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#F47920]/30 text-sm"
            />
          </form>
        </div>
      </section>

      {/* Categories chips */}
      <section className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <CategoryChip href="/productos" active={!categoryFilter && !searchFilter} label={`Todos (${totalAll})`} />
            {categories.filter((c) => c.count > 0).map((c) => (
              <CategoryChip
                key={c.slug}
                href={`/productos?c=${c.slug}`}
                active={categoryFilter === c.slug}
                label={`${c.icon} ${c.name} (${c.count})`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-10 bg-[#fafafa] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <div className="text-5xl mb-3">🛍️</div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">No hay productos disponibles</h3>
              <p className="text-slate-600 text-sm mb-4">{searchFilter ? `Sin resultados para "${searchFilter}"` : 'Volvemos pronto con nuevos productos.'}</p>
              <a href="https://wa.me/56990014375" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-5 py-2.5 rounded-lg font-semibold text-sm">
                💬 Pídelo por WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <Link key={p.id} href={`/productos/${p.slug}`} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#F47920]/40 hover:shadow-md transition-all">
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">📦</div>
                    )}
                  </div>
                  <div className="p-3">
                    {p.marketplace && (
                      <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mb-1.5 ${
                        p.marketplace === 'amazon' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.marketplace}
                      </span>
                    )}
                    <h3 className="text-sm font-medium text-slate-900 leading-tight line-clamp-2 mb-1.5">{p.title}</h3>
                    {p.brand && <p className="text-[10px] text-slate-500 mb-1.5">{p.brand}</p>}
                    {p.priceCLP ? (
                      <p className="text-base font-bold text-[#1B2A6B]">${Number(p.priceCLP).toLocaleString('es-CL')}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Consultar precio</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-[#F47920] to-[#e06810] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">¿No encuentras lo que buscas?</h2>
          <p className="mb-5 text-white/90">Pásanos el link del producto que quieres importar y te lo cotizamos en menos de 24 horas.</p>
          <a href="https://wa.me/56990014375" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-[#F47920] px-6 py-3 rounded-xl font-bold hover:bg-orange-50">
            💬 Cotizar por WhatsApp
          </a>
        </div>
      </section>

      <footer className="bg-[#0F1740] text-blue-100 py-10 text-center">
        <IMCLogo size="md" variant="mono-white" className="mx-auto mb-2" />
        <p className="text-xs text-blue-300">© {new Date().getFullYear()} IMC Cargo · Freight Forwarder</p>
      </footer>
    </div>
  )
}

function CategoryChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-[#1B2A6B] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-[#F47920]/40'
      }`}
    >
      {label}
    </Link>
  )
}
