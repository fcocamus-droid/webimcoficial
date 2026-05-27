// /api/seller/rfqs/[id]/response
//   POST  → envía o actualiza tu respuesta (upsert)
//   DELETE → retira (status WITHDRAWN — soft delete)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { rfqResponseSchema } from '@/lib/rfq-schemas'
import { appUrl, sendEmailAsync } from '@/lib/email'
import RfqResponseEmail from '@/emails/RfqResponseEmail'

function formatCLP(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export async function POST(
  req: Request,
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

  const rfq = await prisma.rfq.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, visibility: true, quantity: true },
  })
  if (!rfq || rfq.visibility !== 'PUBLIC') {
    return NextResponse.json({ error: 'RFQ no disponible' }, { status: 404 })
  }
  if (rfq.status !== 'OPEN') {
    return NextResponse.json(
      { error: 'Esta RFQ ya no está abierta' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = rfqResponseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data
  const totalPrice =
    data.totalPrice !== undefined && data.totalPrice > 0
      ? data.totalPrice
      : data.pricePerUnit * rfq.quantity

  // Detectamos si era update o create para personalizar el email
  const existingResponse = await prisma.rfqResponse.findUnique({
    where: {
      rfqId_sellerCompanyId: {
        rfqId: rfq.id,
        sellerCompanyId: company.id,
      },
    },
    select: { id: true },
  })
  const isUpdate = !!existingResponse

  const response = await prisma.rfqResponse.upsert({
    where: {
      rfqId_sellerCompanyId: {
        rfqId: rfq.id,
        sellerCompanyId: company.id,
      },
    },
    update: {
      pricePerUnit: data.pricePerUnit,
      totalPrice,
      leadTimeDays: data.leadTimeDays ?? null,
      notes: data.notes || null,
      attachmentUrl: data.attachmentUrl || null,
      status: 'SENT',
    },
    create: {
      rfqId: rfq.id,
      sellerCompanyId: company.id,
      pricePerUnit: data.pricePerUnit,
      totalPrice,
      leadTimeDays: data.leadTimeDays ?? null,
      notes: data.notes || null,
      attachmentUrl: data.attachmentUrl || null,
      status: 'SENT',
    },
  })

  // Marcar la RFQ como RESPONDED (status visible al buyer)
  await prisma.rfq.update({
    where: { id: rfq.id },
    data: { status: 'RESPONDED' },
  })

  // Email al buyer
  notifyBuyer(rfq.id, company.id, isUpdate).catch((e) =>
    console.error('[rfq notify buyer]', e)
  )

  return NextResponse.json({ response })
}

async function notifyBuyer(
  rfqId: string,
  sellerCompanyId: string,
  isUpdate: boolean
): Promise<void> {
  const rfq = await prisma.rfq.findUnique({
    where: { id: rfqId },
    include: {
      buyer: { select: { email: true } },
    },
  })
  if (!rfq?.buyer?.email) return

  const resp = await prisma.rfqResponse.findUnique({
    where: {
      rfqId_sellerCompanyId: { rfqId, sellerCompanyId },
    },
    include: {
      sellerCompany: { select: { razonSocial: true } },
    },
  })
  if (!resp) return

  sendEmailAsync({
    to: rfq.buyer.email,
    subject: `${isUpdate ? '🔄 Cotización actualizada' : '💸 Nueva respuesta'}: ${rfq.title}`,
    react: RfqResponseEmail({
      appUrl: appUrl(),
      rfqId: rfq.id,
      rfqNumber: rfq.number,
      rfqTitle: rfq.title,
      sellerCompany: resp.sellerCompany.razonSocial,
      pricePerUnit: formatCLP(resp.pricePerUnit),
      totalPrice: formatCLP(resp.totalPrice),
      unit: rfq.unit,
      leadTimeDays: resp.leadTimeDays,
      notes: resp.notes,
      isUpdate,
    }),
  })
}

export async function DELETE(
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

  const response = await prisma.rfqResponse.findUnique({
    where: {
      rfqId_sellerCompanyId: {
        rfqId: params.id,
        sellerCompanyId: company.id,
      },
    },
  })
  if (!response) {
    return NextResponse.json({ error: 'No tienes una respuesta' }, { status: 404 })
  }

  await prisma.rfqResponse.update({
    where: { id: response.id },
    data: { status: 'WITHDRAWN' },
  })
  return NextResponse.json({ ok: true })
}
