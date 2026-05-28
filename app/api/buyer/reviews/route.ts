// POST /api/buyer/reviews
// El buyer deja una reseña sobre un seller después de aceptar su cotización.
// Validaciones:
// - Debe existir una RfqResponse ACCEPTED del buyer hacia ese seller en esa RFQ.
// - No puede haber otra review del mismo buyer hacia ese seller en la misma RFQ.
// Actualiza el ratingAverage / ratingCount denormalizado de la Company.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { appUrl, sendEmailAsync } from '@/lib/email'
import NewReviewEmail from '@/emails/NewReviewEmail'

const schema = z.object({
  toCompanyId: z.string().min(1),
  rfqId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal('')),
})

export async function POST(req: Request) {
  const guard = await requireRole('BUYER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )

  const { toCompanyId, rfqId, rating, comment } = parsed.data

  // Validar que el buyer es dueño de la RFQ
  const rfq = await prisma.rfq.findFirst({
    where: { id: rfqId, buyerId: guard.user.id },
  })
  if (!rfq)
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })

  // Validar que hay una respuesta ACEPTADA del buyer hacia esa empresa en esa RFQ
  const acceptedResp = await prisma.rfqResponse.findFirst({
    where: {
      rfqId,
      sellerCompanyId: toCompanyId,
      status: 'ACCEPTED',
    },
    include: {
      sellerCompany: {
        select: {
          id: true,
          razonSocial: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  })
  if (!acceptedResp)
    return NextResponse.json(
      {
        error:
          'Solo puedes reseñar a proveedores cuya cotización aceptaste.',
      },
      { status: 403 }
    )

  // Evitar duplicado: una review por (buyer, seller, rfq)
  const existing = await prisma.review.findFirst({
    where: {
      fromUserId: guard.user.id,
      toCompanyId,
      rfqId,
    },
  })
  if (existing)
    return NextResponse.json(
      { error: 'Ya dejaste una reseña para esta venta', field: 'rating' },
      { status: 409 }
    )

  // Crear review + recalcular agregados de la empresa en una transacción
  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        fromUserId: guard.user.id,
        toCompanyId,
        rating,
        comment: comment || null,
        rfqId,
      },
    })

    const agg = await tx.review.aggregate({
      where: { toCompanyId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await tx.company.update({
      where: { id: toCompanyId },
      data: {
        ratingAverage: agg._avg.rating ?? null,
        ratingCount: agg._count.rating,
      },
    })

    return review
  })

  // Email al seller (no bloqueante)
  if (acceptedResp.sellerCompany.user?.email) {
    const buyer = await prisma.user.findUnique({
      where: { id: guard.user.id },
      select: {
        name: true,
        companies: {
          select: { razonSocial: true },
          take: 1,
        },
      },
    })
    sendEmailAsync({
      to: acceptedResp.sellerCompany.user.email,
      subject: `⭐ Recibiste una reseña ${rating}/5 — ${rfq.number}`,
      react: NewReviewEmail({
        appUrl: appUrl(),
        sellerName:
          acceptedResp.sellerCompany.user.name ||
          acceptedResp.sellerCompany.razonSocial,
        buyerName:
          buyer?.companies[0]?.razonSocial || buyer?.name || 'Un comprador',
        rfqNumber: rfq.number,
        rfqTitle: rfq.title,
        rating,
        comment: comment || null,
      }),
    })
  }

  return NextResponse.json({ review: created }, { status: 201 })
}
