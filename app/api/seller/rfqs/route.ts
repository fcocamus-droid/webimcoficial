// /api/seller/rfqs
// Lista de RFQs relevantes para el vendedor actual:
// - Visibility PUBLIC y status OPEN
// - Que apunten a un producto de su empresa, O a una categoría donde
//   tenga productos publicados.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

export async function GET(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id, isSeller: true },
    select: { id: true },
  })
  if (!company) {
    return NextResponse.json({ rfqs: [] })
  }

  // Categorías donde el seller tiene al menos un producto disponible
  const myCategories = await prisma.product.findMany({
    where: { companyId: company.id, available: true },
    distinct: ['categoryId'],
    select: { categoryId: true },
  })
  const categoryIds = myCategories
    .map((p) => p.categoryId)
    .filter((id): id is string => !!id)

  // RFQs apuntadas a productos del seller
  const myProductIds = (
    await prisma.product.findMany({
      where: { companyId: company.id },
      select: { id: true },
    })
  ).map((p) => p.id)

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'open'

  const rfqs = await prisma.rfq.findMany({
    where: {
      visibility: 'PUBLIC',
      ...(filter === 'responded'
        ? {
            responses: { some: { sellerCompanyId: company.id } },
          }
        : filter === 'open'
          ? {
              status: 'OPEN',
              responses: { none: { sellerCompanyId: company.id } },
            }
          : {}),
      OR: [
        ...(categoryIds.length > 0
          ? [{ categoryId: { in: categoryIds } }]
          : []),
        ...(myProductIds.length > 0
          ? [{ productId: { in: myProductIds } }]
          : []),
      ],
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      product: { select: { slug: true, title: true } },
      category: { select: { name: true } },
      _count: { select: { responses: true } },
      responses: {
        where: { sellerCompanyId: company.id },
        select: { id: true, status: true, pricePerUnit: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ companyId: company.id, rfqs })
}
