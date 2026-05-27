import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductForm, { emptyProduct } from '../ProductForm'

export const metadata = { title: 'Nuevo producto · Panel Vendedor' }

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-4xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link href="/panel/vendedor/productos" className="hover:text-amber-600">
          ← Volver al catálogo
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">Crear nuevo producto</h2>
        <p className="text-sm text-slate-600 mt-1">
          Empieza con los datos básicos. En el siguiente paso podrás subir
          imágenes.
        </p>
      </div>

      <ProductForm
        mode="create"
        initialValues={emptyProduct}
        categories={categories}
      />
    </div>
  )
}
