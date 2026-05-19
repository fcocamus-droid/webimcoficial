import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import NewPreAlertForm from './NewPreAlertForm'

export const dynamic = 'force-dynamic'

export default async function NewPreAlertPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/box/prealertas/nueva')

  const types = await prisma.packageType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1B2A6B] mb-2">Nueva pre-alerta</h1>
        <p className="text-slate-600">Notifica que un paquete viene en camino a nuestra bodega Miami</p>
      </div>

      <NewPreAlertForm types={types} />
    </div>
  )
}
