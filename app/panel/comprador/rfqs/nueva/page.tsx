import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import NuevaRfqForm from './NuevaRfqForm'

export const metadata = { title: 'Nueva cotización · Panel Comprador' }

export default async function NuevaRfqPage({
  searchParams,
}: {
  searchParams: { productId?: string; categoryId?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  let preselectedProduct = null as null | {
    id: string
    title: string
    slug: string
    unit: string
    moq: number
    categoryId: string | null
    company: { razonSocial: string }
    image: string | null
  }

  if (searchParams.productId) {
    const p = await prisma.product.findUnique({
      where: { id: searchParams.productId },
      include: {
        company: { select: { razonSocial: true } },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { url: true },
        },
      },
    })
    if (p) {
      preselectedProduct = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        unit: p.unit,
        moq: p.moq,
        categoryId: p.categoryId,
        company: { razonSocial: p.company.razonSocial },
        image: p.images[0]?.url || null,
      }
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link href="/panel/comprador/rfqs" className="hover:text-amber-600">
          ← Volver a mis cotizaciones
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Nueva solicitud de cotización
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Describe lo que necesitas. Los fabricantes de la categoría recibirán
          tu solicitud y te enviarán precios y plazos.
        </p>
      </div>

      <NuevaRfqForm
        categories={categories}
        preselectedProduct={preselectedProduct}
        preselectedCategoryId={searchParams.categoryId || null}
      />
    </div>
  )
}
