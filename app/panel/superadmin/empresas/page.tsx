import { prisma } from '@/lib/prisma'
import EmpresasClient from './EmpresasClient'

export const metadata = { title: 'Empresas · Panel Superadmin' }

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: { filter?: string; q?: string }
}) {
  const filter = searchParams.filter || 'all'
  const q = searchParams.q?.trim() || ''

  const companies = await prisma.company.findMany({
    where: {
      ...(filter === 'verified' ? { verified: true } : {}),
      ...(filter === 'pending' ? { verified: false } : {}),
      ...(filter === 'seller' ? { isSeller: true } : {}),
      ...(filter === 'buyer' ? { isBuyer: true } : {}),
      ...(q
        ? {
            OR: [
              { razonSocial: { contains: q, mode: 'insensitive' } },
              { rut: { contains: q, mode: 'insensitive' } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { email: true, name: true } },
      _count: {
        select: { products: true, certifications: true },
      },
    },
    orderBy: [{ verified: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return (
    <EmpresasClient
      initial={companies.map((c) => ({
        id: c.id,
        slug: c.slug,
        razonSocial: c.razonSocial,
        rut: c.rut,
        giro: c.giro,
        isSeller: c.isSeller,
        isBuyer: c.isBuyer,
        verified: c.verified,
        verifiedAt: c.verifiedAt?.toISOString() ?? null,
        logoUrl: c.logoUrl,
        region: c.region,
        comuna: c.comuna,
        userEmail: c.user.email,
        userName: c.user.name,
        productsCount: c._count.products,
        certificationsCount: c._count.certifications,
        createdAt: c.createdAt.toISOString(),
      }))}
      currentFilter={filter}
      currentQ={q}
    />
  )
}
