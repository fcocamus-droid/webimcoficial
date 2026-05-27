import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProductForm, {
  type ProductFormValues,
  type ProductImage,
} from '../ProductForm'

export const metadata = { title: 'Editar producto · Panel Vendedor' }

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const product = await prisma.product.findFirst({
    where: { id: params.id, company: { userId } },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      pricingTiers: { orderBy: { minQuantity: 'asc' } },
    },
  })
  if (!product) notFound()

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  const specsObj =
    product.specs && typeof product.specs === 'object'
      ? Object.fromEntries(
          Object.entries(product.specs as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ])
        )
      : {}

  const initialValues: ProductFormValues = {
    title: product.title,
    categoryId: product.categoryId || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    sku: product.sku || '',
    brand: product.brand || '',
    unit: product.unit || 'unidad',
    moq: product.moq,
    leadTimeDays: product.leadTimeDays ?? '',
    stockStatus: product.stockStatus,
    origin: product.origin,
    basePriceCLP: product.basePriceCLP ?? '',
    available: product.available,
    featured: product.featured,
    specs: specsObj,
    pricingTiers: product.pricingTiers.map((t) => ({
      minQuantity: t.minQuantity,
      priceCLP: t.priceCLP,
      label: t.label || '',
    })),
  }

  const images: ProductImage[] = product.images.map((i) => ({
    id: i.id,
    url: i.url,
    isPrimary: i.isPrimary,
    sortOrder: i.sortOrder,
  }))

  return (
    <div className="max-w-4xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link href="/panel/vendedor/productos" className="hover:text-amber-600">
          ← Volver al catálogo
        </Link>
      </div>
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-navy-600">{product.title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-mono">/{product.slug}</span>
            {' · '}
            Actualizado{' '}
            {new Date(product.updatedAt).toLocaleString('es-CL', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        </div>
        {!product.available && (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase bg-slate-100 text-slate-600 px-3 py-1.5 rounded">
            Oculto del marketplace
          </span>
        )}
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={initialValues}
        initialImages={images}
        categories={categories}
      />
    </div>
  )
}
