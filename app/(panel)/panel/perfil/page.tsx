import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PageHeader from '../../_components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/perfil')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, phone: true, rut: true, company: true,
      role: true, createdAt: true, emailVerified: true,
    },
  })

  return (
    <>
      <PageHeader title="Perfil" breadcrumb={[{ label: 'Perfil' }]} />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {(user?.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">{user?.name || '—'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#F47920] bg-[#F47920]/10 px-2 py-0.5 rounded">
              {user?.role}
            </span>
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="Nombre" value={user?.name || '—'} />
          <Field label="Email" value={user?.email || '—'} />
          <Field label="Teléfono" value={user?.phone || '—'} />
          <Field label="RUT" value={user?.rut || '—'} />
          <Field label="Empresa" value={user?.company || '—'} />
          <Field label="Cuenta creada" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CL') : '—'} />
        </dl>
      </div>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
      <dd className="text-slate-900 font-medium">{value}</dd>
    </div>
  )
}
