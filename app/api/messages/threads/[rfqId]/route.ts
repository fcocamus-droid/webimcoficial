// GET /api/messages/threads/[rfqId]?with=[userId]
// Devuelve todos los mensajes entre el usuario actual y el `with`
// dentro del contexto de la RFQ indicada. Marca los recibidos como
// leídos al traer.

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { rfqId: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const url = new URL(req.url)
  const otherUserId = url.searchParams.get('with')
  if (!otherUserId) {
    return NextResponse.json(
      { error: 'Falta query param "with"' },
      { status: 400 }
    )
  }
  if (otherUserId === userId) {
    return NextResponse.json(
      { error: 'No puedes consultar conversación contigo mismo' },
      { status: 400 }
    )
  }

  // Validar acceso al hilo
  const rfq = await prisma.rfq.findUnique({
    where: { id: params.rfqId },
    select: {
      id: true,
      buyerId: true,
      number: true,
      title: true,
      status: true,
      product: { select: { slug: true, title: true } },
      responses: {
        select: {
          sellerCompany: {
            select: {
              userId: true,
              slug: true,
              razonSocial: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  })

  if (!rfq) {
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  }

  const sellerUserIds = rfq.responses.map((r) => r.sellerCompany.userId)
  const allowed = new Set<string>([rfq.buyerId, ...sellerUserIds])

  if (!allowed.has(userId) || !allowed.has(otherUserId)) {
    return NextResponse.json(
      { error: 'Sin acceso a este hilo' },
      { status: 403 }
    )
  }

  const messages = await prisma.message.findMany({
    where: {
      rfqId: params.rfqId,
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      fromUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // Marcar como leídos los recibidos
  await prisma.message.updateMany({
    where: {
      rfqId: params.rfqId,
      fromUserId: otherUserId,
      toUserId: userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  // Datos de la contraparte
  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
  })

  // Empresa de la contraparte (si aplica)
  const otherCompany = await prisma.company.findFirst({
    where: { userId: otherUserId },
    select: { razonSocial: true, slug: true, logoUrl: true, verified: true },
  })

  return NextResponse.json({
    rfq,
    other,
    otherCompany,
    messages,
  })
}
