import Link from 'next/link'

type Product = {
  id: string
  slug: string
  title: string
  shortDescription: string | null
  basePriceCLP: number | null
  moq: number
  unit: string
  stockStatus: 'DISPONIBLE' | 'A_PEDIDO' | 'AGOTADO'
  origin: string
  featured: boolean
  category: { name: string } | null
  company: { razonSocial: string; verified: boolean; slug: string }
  images: { url: string }[]
}

const STOCK_LABEL = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-verified-50 text-verified-600' },
  A_PEDIDO: { label: 'A pedido', cls: 'bg-amber-50 text-amber-700' },
  AGOTADO: { label: 'Agotado', cls: 'bg-slate-100 text-slate-500' },
} as const

export function formatCLP(n: number | null) {
  if (n === null || n === undefined) return null
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0]?.url
  const stock = STOCK_LABEL[product.stockStatus]
  const price = formatCLP(product.basePriceCLP)

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-navy-600 hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-4xl">
            📦
          </div>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${stock.cls}`}
        >
          {stock.label}
        </span>
        {product.featured && (
          <span className="absolute top-2 left-2 text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded">
            ★ Destacado
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {product.category?.name || 'Sin categoría'}
        </p>
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-navy-600 transition-colors">
          {product.title}
        </h3>
        {product.shortDescription && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between gap-2 mb-2">
            <div>
              {price ? (
                <p className="text-lg font-bold text-navy-600">{price}</p>
              ) : (
                <p className="text-sm font-semibold text-slate-500">
                  Precio a consultar
                </p>
              )}
              <p className="text-xs text-slate-500">
                MOQ {product.moq} {product.unit}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            {product.company.verified && (
              <span className="text-verified-600 font-bold">✓</span>
            )}
            {product.company.razonSocial}
          </p>
        </div>
      </div>
    </Link>
  )
}
