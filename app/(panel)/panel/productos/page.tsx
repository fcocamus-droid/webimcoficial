import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PageHeader from '../../_components/PageHeader'
import ImportProductForm from './ImportProductForm'

export const dynamic = 'force-dynamic'

export default async function AdminProductosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/productos')
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') redirect('/no-autorizado')

  const products = await prisma.$queryRaw<Array<any>>`
    SELECT p.id, p.slug, p.title, p.source_marketplace AS marketplace,
      p.price_usd AS "priceUSD", p.price_clp AS "priceCLP",
      p.stock, p.available, p.featured, p."createdAt",
      c.name AS "categoryName", c.slug AS "categorySlug",
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS thumbnail
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    ORDER BY p."createdAt" DESC
    LIMIT 50
  `

  const categories = await prisma.$queryRaw<Array<{ slug: string; name: string; icon: string }>>`
    SELECT slug, name, icon FROM product_categories ORDER BY sort_order
  `

  const stats = {
    total: products.length,
    active: products.filter((p) => p.available).length,
    amazon: products.filter((p) => p.marketplace === 'amazon').length,
    ebay: products.filter((p) => p.marketplace === 'ebay').length,
  }

  return (
    <>
      <PageHeader title="Productos" breadcrumb={[{ label: 'Productos' }]} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Total" value={stats.total} />
        <KPI label="Activos" value={stats.active} accent />
        <KPI label="Amazon" value={stats.amazon} />
        <KPI label="eBay" value={stats.ebay} />
      </div>

      {/* Importar form */}
      <div className="mb-6">
        <ImportProductForm categories={categories} />
      </div>

      {/* Products table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Catálogo</h2>
          <span className="text-xs text-slate-500">{products.length} productos</span>
        </div>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🛍️</div>
            <h3 className="font-semibold text-slate-900 mb-1">Sin productos aún</h3>
            <p className="text-sm text-slate-500">Importa el primero pegando un URL de Amazon o eBay arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Producto</th>
                  <th className="px-4 py-2.5 font-semibold">Categoría</th>
                  <th className="px-4 py-2.5 font-semibold">Marketplace</th>
                  <th className="px-4 py-2.5 font-semibold text-right">USD</th>
                  <th className="px-4 py-2.5 font-semibold text-right">CLP</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">📦</div>
                        )}
                        <div className="min-w-0 max-w-[280px]">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.categoryName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.marketplace === 'amazon' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.marketplace}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{p.priceUSD ? `$${Number(p.priceUSD).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-[#1B2A6B]">
                      {p.priceCLP ? `$${Number(p.priceCLP).toLocaleString('es-CL')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="ml-2 text-xs">{p.available ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${accent ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-slate-200'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#F47920]' : 'text-[#1B2A6B]'}`}>{value}</p>
    </div>
  )
}
