import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const tabs = [
  { href: '/panel/comprador', label: 'Resumen' },
  { href: '/panel/comprador/rfqs', label: 'Mis cotizaciones' },
  { href: '/panel/comprador/favoritos', label: 'Favoritos' },
]

export default async function CompradorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/comprador')
  const role = (session.user as any).role
  if (role !== 'BUYER') redirect('/')

  const company = await prisma.company.findFirst({
    where: { userId: (session.user as any).id },
    select: { razonSocial: true, rut: true },
  })

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="bg-amber-gradient text-white py-8">
          <div className="container-base">
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
              Panel Comprador
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              {company?.razonSocial || session.user.name || session.user.email}
            </h1>
            {company?.rut && (
              <p className="text-white/90 text-sm mt-1">RUT {company.rut}</p>
            )}
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 sticky top-24 z-30">
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
