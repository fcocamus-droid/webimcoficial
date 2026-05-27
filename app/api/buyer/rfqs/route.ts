// /api/buyer/rfqs
//   GET  → lista de RFQs del comprador actual
//   POST → crear nueva RFQ

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { rfqCreateSchema } from '@/lib/rfq-schemas'
import { nextRfqNumber } from '@/lib/rfq-number'
import { appUrl, sendEmailAsync } from '@/lib/email'
import RfqNewEmail from '@/emails/RfqNewEmail'

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

    // Notificar a sellers relevantes en background
    notifyRelevantSellers(created.id).catch((e) =>
      console.error('[rfq notify sellers]', e)
    )

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

/**
 * Busca a los sellers cuya empresa publica productos en la categoría / producto
 * de la RFQ y les envía email. Cada email es fire-and-forget para no esperar
 * a Resend antes de responder al cliente.
 */
async function notifyRelevantSellers(rfqId: string): Promise<void> {
  const rfq = await prisma.rfq.findUnique({
    where: { id: rfqId },
    include: {
      buyer: {
        select: {
          name: true,
          companies: { select: { razonSocial: true }, take: 1 },
        },
      },
      product: { select: { title: true } },
      category: { select: { name: true } },
    },
  })
  if (!rfq || rfq.visibility !== 'PUBLIC') return

  // Sellers cuya empresa tiene productos en la categoría de la RFQ
  // O cuya empresa publica el producto específico (si productId está definido).
  const sellerCompanies = await prisma.company.findMany({
    where: {
      isSeller: true,
      products: {
        some: {
          available: true,
          ...(rfq.productId
            ? { id: rfq.productId }
            : rfq.categoryId
              ? { categoryId: rfq.categoryId }
              : {}),
        },
      },
    },
    select: {
      user: { select: { email: true } },
    },
    take: 200,
  })

  const emails = Array.from(
    new Set(
      sellerCompanies
        .map((c) => c.user?.email)
        .filter((e): e is string => !!e)
    )
  )
  if (emails.length === 0) return

  const buyerCompany = rfq.buyer.companies[0]?.razonSocial ?? null

  for (const email of emails) {
    sendEmailAsync({
      to: email,
      subject: `Nueva cotización: ${rfq.title} (${rfq.number})`,
      react: RfqNewEmail({
        appUrl: appUrl(),
        rfqId: rfq.id,
        rfqNumber: rfq.number,
        rfqTitle: rfq.title,
        rfqDescription: rfq.description,
        quantity: rfq.quantity,
        unit: rfq.unit,
        buyerName: rfq.buyer.name,
        buyerCompany,
        categoryName: rfq.category?.name ?? null,
        productTitle: rfq.product?.title ?? null,
        deliveryDeadline: rfq.deliveryDeadline
          ? new Date(rfq.deliveryDeadline).toLocaleDateString('es-CL')
          : null,
      }),
    })
  }
}
