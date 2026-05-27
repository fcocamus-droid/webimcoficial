import { redirect } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import CuentaClient from './CuentaClient'

export const metadata = { title: 'Mi cuenta · IMC Industriales' }

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  SALES_AGENT: 'Agente de ventas',
  ADMIN: 'Administrador',
  SELLER: 'Fabricante / Importador',
  BUYER: 'Comprador',
}

export default async function CuentaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/cuenta')

  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  })
  if (!user) redirect('/login')

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-10">
        <div className="container-base max-w-4xl">
          <div className="mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Mi cuenta
            </p>
            <h1 className="text-3xl font-bold text-navy-600">
              Configuración
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {ROLE_LABEL[user.role] || user.role} · miembro desde{' '}
              {new Date(user.createdAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <CuentaClient
            initial={{
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              avatarUrl: user.avatarUrl,
              role: user.role,
              roleLabel: ROLE_LABEL[user.role] || user.role,
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
