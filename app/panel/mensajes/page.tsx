import { redirect } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { auth } from '@/auth'
import MensajesClient from './MensajesClient'

export const metadata = { title: 'Mensajes · IMC Industriales' }

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: { rfq?: string; with?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel/mensajes')

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <div className="container-base py-6">
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Mensajes
            </p>
            <h1 className="text-2xl font-bold text-navy-600">
              Conversaciones
            </h1>
          </div>

          <MensajesClient
            currentUserId={(session.user as any).id}
            initialRfqId={searchParams.rfq}
            initialOtherUserId={searchParams.with}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
