import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import ResetPasswordForm from './ResetPasswordForm'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Crear nueva contraseña · IMC Industriales',
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export default async function ResetTokenPage({
  params,
}: {
  params: { token: string }
}) {
  // Validamos el token server-side para mostrar mensaje claro si está expirado.
  const valid =
    params.token.length >= 40 &&
    (await prisma.user.findFirst({
      where: {
        resetToken: hashToken(params.token),
        resetExpires: { gt: new Date() },
      },
      select: { id: true },
    }))

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-12">
        <div className="container-base">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-navy-600 mb-1">
                Crear nueva contraseña
              </h1>
              {valid && (
                <p className="text-slate-600 text-sm">
                  Elige una contraseña segura para tu cuenta
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
              {valid ? (
                <ResetPasswordForm token={params.token} />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl">
                    ⚠
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Link inválido o expirado
                  </h2>
                  <p className="text-sm text-slate-600">
                    Este link de recuperación no es válido o ya pasó más de
                    1 hora desde que lo solicitaste. Por seguridad, los links
                    de reset expiran rápido.
                  </p>
                  <Link
                    href="/recuperar"
                    className="btn-primary inline-block"
                  >
                    Solicitar nuevo link →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
