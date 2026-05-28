import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import BulkImportClient from './BulkImportClient'

export const metadata = { title: 'Importar productos · Panel Vendedor' }

export default async function ImportarProductosPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect('/login')

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })

  if (!company) {
    return (
      <div className="max-w-3xl">
        <div className="mb-4 text-sm text-slate-500">
          <Link
            href="/panel/vendedor/productos"
            className="hover:text-amber-600"
          >
            ← Volver al catálogo
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Tu empresa aún no está activada como vendedor
          </h3>
          <p className="text-sm text-slate-600">
            Contacta al equipo de IMC para activar tu cuenta como
            fabricante/importador.
          </p>
        </div>
      </div>
    )
  }

  // Pre-cargar categorías para mostrar la lista en el paso 1.
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, name: true },
  })

  return (
    <div className="max-w-5xl">
      <div className="mb-4 text-sm text-slate-500">
        <Link
          href="/panel/vendedor/productos"
          className="hover:text-amber-600"
        >
          ← Volver al catálogo
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Importar productos en masa
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Sube hasta 500 productos a la vez desde una planilla CSV. Ideal si ya
          tienes tu catálogo en Excel.
        </p>
      </div>

      <BulkImportClient categories={categories} />
    </div>
  )
}
