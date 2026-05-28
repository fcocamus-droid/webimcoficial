import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PerfilEmpresaClient from './PerfilEmpresaClient'

export const metadata = { title: 'Perfil de empresa · Panel Vendedor' }

export default async function PerfilEmpresaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await prisma.company.findFirst({
    where: { userId: (session.user as any).id },
  })
  if (!company) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-600 mb-2">
          Perfil de empresa
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-600">
            No tienes una empresa asociada a tu cuenta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-600">
          Perfil de empresa
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Estos datos se muestran en tu perfil público{' '}
          <a
            href={`/proveedores/${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            /proveedores/{company.slug}
          </a>
        </p>
      </div>

      <PerfilEmpresaClient
        initial={{
          slug: company.slug,
          razonSocial: company.razonSocial,
          rut: company.rut,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          giro: company.giro,
          description: company.description,
          websiteUrl: company.websiteUrl,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          region: company.region,
          ciudad: company.ciudad,
          comuna: company.comuna,
          address: company.address,
          verified: company.verified,
        }}
      />
    </div>
  )
}
