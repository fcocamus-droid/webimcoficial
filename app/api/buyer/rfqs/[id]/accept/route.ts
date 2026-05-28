// POST /api/buyer/rfqs/[id]/accept
// Body: { responseId: string }
// El buyer acepta una de las respuestas: la marca ACCEPTED, las demás
// quedan REJECTED, y la RFQ pasa a CLOSED. Notifica por email al seller
// aceptado.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { appUrl, sendEmailAsync } from '@/lib/email'
import AcceptedQuoteEmail from '@/emails/AcceptedQuoteEmail'
import { formatCLP } from '@/lib/iva'

const schema = z.object({ responseId: z.string().min(1) })

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('BUYER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  // Verificar que la RFQ pertenece al buyer y está abierta
  const rfq = await prisma.rfq.findFirst({
    where: { id: params.id, buyerId: guard.user.id },
  })
  if (!rfq)
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  if (rfq.status === 'CLOSED' || rfq.status === 'CANCELLED')
    return NextResponse.json(
      { error: 'Esta RFQ ya está cerrada' },
      { status: 400 }
    )

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  // Verificar que la respuesta existe y pertenece a esta RFQ
  const acceptedResp = await prisma.rfqResponse.findFirst({
    where: { id: parsed.data.responseId, rfqId: rfq.id },
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
      { error: 'Respuesta no encontrada' },
      { status: 404 }
    )

  // Transacción: marcar elegida como ACCEPTED, las otras como REJECTED,
  // RFQ a CLOSED.
  await prisma.$transaction([
    prisma.rfqResponse.update({
      where: { id: acceptedResp.id },
      data: { status: 'ACCEPTED' },
    }),
    prisma.rfqResponse.updateMany({
      where: {
        rfqId: rfq.id,
        NOT: { id: acceptedResp.id },
        status: 'SENT',
      },
      data: { status: 'REJECTED' },
    }),
    prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: 'CLOSED' },
    }),
  ])

  // Email al seller que ganó
  if (acceptedResp.sellerCompany.user?.email) {
    sendEmailAsync({
      to: acceptedResp.sellerCompany.user.email,
      subject: `🎉 Ganaste la cotización ${rfq.number}: ${rfq.title}`,
      react: AcceptedQuoteEmail({
        appUrl: appUrl(),
        rfqId: rfq.id,
        rfqNumber: rfq.number,
        rfqTitle: rfq.title,
        sellerName:
          acceptedResp.sellerCompany.user.name ||
          acceptedResp.sellerCompany.razonSocial,
        totalPrice: formatCLP(acceptedResp.totalPrice),
        quantity: rfq.quantity,
        unit: rfq.unit,
      }),
    })
  }

  return NextResponse.json({ ok: true })
}
