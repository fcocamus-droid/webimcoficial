// GET /api/buyer/favorites — lista de productos favoritos del usuario actual.
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const favorites = await prisma.favorite.findMany({
    where: { userId, productId: { not: null } },
    include: {
      product: {
        include: {
          category: { select: { name: true, slug: true } },
          company: {
            select: { slug: true, razonSocial: true, verified: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    favorites: favorites
      .filter((f) => f.product && f.product.available)
      .map((f) => f.product),
  })
}
