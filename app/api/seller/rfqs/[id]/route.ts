// GET /api/seller/rfqs/[id] — detalle de una RFQ pública para que el vendedor responda
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id, isSeller: true },
    select: { id: true },
  })
  if (!company) {
    return NextResponse.json({ error: 'Sin empresa vendedora' }, { status: 403 })
  }

  const rfq = await prisma.rfq.findFirst({
    where: {
      id: params.id,
      visibility: 'PUBLIC',
    },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          companies: {
            select: { razonSocial: true, rut: true, region: true, ciudad: true },
            take: 1,
          },
        },
      },
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          unit: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
      category: { select: { name: true, slug: true } },
      responses: {
        where: { sellerCompanyId: company.id },
        select: {
          id: true,
          pricePerUnit: true,
          totalPrice: true,
          leadTimeDays: true,
          notes: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!rfq) {
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ rfq, myCompanyId: company.id })
}
