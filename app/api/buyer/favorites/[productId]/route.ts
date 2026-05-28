// POST   /api/buyer/favorites/[productId] — agregar producto a favoritos
// DELETE /api/buyer/favorites/[productId] — quitar
// GET    /api/buyer/favorites/[productId] — devuelve { favorite: true|false }
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function ensureBuyer() {
  const session = await auth()
  if (!session?.user) return { ok: false as const, status: 401 }
  return { ok: true as const, userId: (session.user as any).id as string }
}

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const g = await ensureBuyer()
  if (!g.ok)
    return NextResponse.json(
      { error: 'No autenticado', favorite: false },
      { status: g.status }
    )
  const fav = await prisma.favorite.findUnique({
    where: {
      userId_productId: { userId: g.userId, productId: params.productId },
    },
  })
  return NextResponse.json({ favorite: !!fav })
}

export async function POST(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const g = await ensureBuyer()
  if (!g.ok)
    return NextResponse.json({ error: 'No autenticado' }, { status: g.status })

  // Verificar que el producto existe
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { id: true },
  })
  if (!product) {
    return NextResponse.json(
      { error: 'Producto no encontrado' },
      { status: 404 }
    )
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: { userId: g.userId, productId: params.productId },
    },
    create: { userId: g.userId, productId: params.productId },
    update: {},
  })
  return NextResponse.json({ favorite: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const g = await ensureBuyer()
  if (!g.ok)
    return NextResponse.json({ error: 'No autenticado' }, { status: g.status })

  await prisma.favorite
    .delete({
      where: {
        userId_productId: { userId: g.userId, productId: params.productId },
      },
    })
    .catch(() => null) // ignorar si no existe
  return NextResponse.json({ favorite: false })
}
