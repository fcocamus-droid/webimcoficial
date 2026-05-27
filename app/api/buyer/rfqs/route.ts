// /api/buyer/rfqs
//   GET  → lista de RFQs del comprador actual
//   POST → crear nueva RFQ

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { rfqCreateSchema } from '@/lib/rfq-schemas'
import { nextRfqNumber } from '@/lib/rfq-number'

export async function GET(req: Request) {
  const guard = await requireRole('BUYER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const rfqs = await prisma.rfq.findMany({
    where: {
      buyerId: guard.user.id,
      ...(status === 'OPEN' || status === 'CLOSED' || status === 'CANCELLED'
        ? { status }
        : {}),
    },
    include: {
      product: { select: { slug: true, title: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ rfqs })
}

export async function POST(req: Request) {
  const guard = await requireRole('BUYER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = rfqCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Si viene productId, derivamos categoryId del producto.
  let categoryId: string | null = data.categoryId || null
  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, categoryId: true },
    })
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado', field: 'productId' },
        { status: 400 }
      )
    }
    categoryId = product.categoryId
  }

  // Validamos categoría si se pasó manualmente
  if (categoryId && !data.productId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!cat) {
      return NextResponse.json(
        { error: 'Categoría no válida', field: 'categoryId' },
        { status: 400 }
      )
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const number = await nextRfqNumber(tx as any)
      // Default: expira en 14 días desde ahora
      const defaultExpires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      return tx.rfq.create({
        data: {
          number,
          buyerId: guard.user.id,
          productId: data.productId || null,
          categoryId: categoryId || null,
          title: data.title,
          description: data.description,
          quantity: data.quantity,
          unit: data.unit,
          budgetMaxCLP: data.budgetMaxCLP ?? null,
          deliveryDeadline: data.deliveryDeadline ?? null,
          deliveryLocation: data.deliveryLocation || null,
          visibility: data.visibility,
          status: 'OPEN',
          expiresAt: defaultExpires,
        },
      })
    })

    // Bump rfqCount en el producto si aplica
    if (data.productId) {
      prisma.product
        .update({
          where: { id: data.productId },
          data: { rfqCount: { increment: 1 } },
        })
        .catch(() => {})
    }

    return NextResponse.json(
      { ok: true, id: created.id, number: created.number },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[rfq create]', err)
    return NextResponse.json(
      { error: 'No pudimos crear la RFQ. Intenta nuevamente.' },
      { status: 500 }
    )
  }
}
