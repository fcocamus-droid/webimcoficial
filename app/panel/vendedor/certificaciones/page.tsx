import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import CertificacionesClient from './CertificacionesClient'

export const metadata = { title: 'Certificaciones · Panel Vendedor' }

export default async function CertificacionesPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const company = await prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true },
  })

  const certs = company
    ? await prisma.companyCertification.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Certificaciones de empresa
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Sube tus certificados (ISO, HACCP, BPM, GMP, FDA, etc.) para
          demostrar trayectoria y calidad. Aparecerán en tu perfil público.
        </p>
      </div>

      <CertificacionesClient
        initial={certs.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        }))}
      />
    </div>
  )
}
