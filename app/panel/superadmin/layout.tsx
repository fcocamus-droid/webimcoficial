import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'

const tabs = [
  { href: '/panel/superadmin', label: 'Resumen' },
  { href: '/panel/superadmin/agentes', label: 'Agentes' },
]

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/superadmin')
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN') redirect('/')

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="bg-navy-gradient text-white py-8">
          <div className="container-base">
            <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
              Panel Superadmin
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              {session.user.name || session.user.email}
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Operaciones IMC · gestión total del marketplace
            </p>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
          <div className="container-base flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-amber-600 border-b-2 border-transparent hover:border-amber-500 transition-colors whitespace-nowrap"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="container-base py-8">{children}</div>
      </main>
      <Footer />
    </>
  )
}
