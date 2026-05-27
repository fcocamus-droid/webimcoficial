// /api/buyer/rfqs/[id]
//   GET   → detalle con respuestas
//   PATCH → cerrar / cancelar

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { rfqPatchSchema } from '@/lib/rfq-schemas'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('BUYER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const rfq = await prisma.rfq.findFirst({
    where: { id: params.id, buyerId: guard.user.id },
    include: {
      product: {
        select: { id: true, slug: true, title: true, unit: true },
      },
      category: { select: { name: true, slug: true } },
      responses: {
        include: {
          sellerCompany: {
            select: {
              id: true,
              slug: true,
              razonSocial: true,
              logoUrl: true,
              verified: true,
              ratingAverage: true,
              ratingCount: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!rfq) {
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  }
  return NextResponse.json({ rfq })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('BUYER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const existing = await prisma.rfq.findFirst({
    where: { id: params.id, buyerId: guard.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = rfqPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const updated = await prisma.rfq.update({
    where: { id: existing.id },
    data: { ...(parsed.data.status ? { status: parsed.data.status } : {}) },
  })
  return NextResponse.json({ rfq: updated })
}
