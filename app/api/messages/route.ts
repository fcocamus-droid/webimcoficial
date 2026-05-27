// POST /api/messages — enviar mensaje en el contexto de una RFQ
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { messageCreateSchema } from '@/lib/message-schemas'
import { appUrl, sendEmailAsync } from '@/lib/email'
import NewMessageEmail from '@/emails/NewMessageEmail'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = messageCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Validar acceso al hilo: el usuario actual debe ser el buyer de la RFQ
  // O bien un seller de una empresa que tiene respuesta en esa RFQ.
  const rfq = await prisma.rfq.findUnique({
    where: { id: data.rfqId },
    select: {
      id: true,
      buyerId: true,
      number: true,
      title: true,
      responses: {
        select: {
          sellerCompany: {
            select: {
              userId: true,
              razonSocial: true,
            },
          },
        },
      },
    },
  })

  if (!rfq) {
    return NextResponse.json({ error: 'RFQ no encontrada' }, { status: 404 })
  }

  // Verificar que el usuario actual y el destinatario forman parte del hilo
  const sellerUserIds = rfq.responses.map((r) => r.sellerCompany.userId)
  const allowedUsers = new Set<string>([rfq.buyerId, ...sellerUserIds])

  if (!allowedUsers.has(userId) || !allowedUsers.has(data.toUserId)) {
    return NextResponse.json(
      { error: 'Sin acceso a este hilo' },
      { status: 403 }
    )
  }
  if (userId === data.toUserId) {
    return NextResponse.json(
      { error: 'No puedes enviarte mensajes a ti mismo' },
      { status: 400 }
    )
  }

  const message = await prisma.message.create({
    data: {
      rfqId: data.rfqId,
      fromUserId: userId,
      toUserId: data.toUserId,
      body: data.body,
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  })

  // Notificación email al destinatario (no bloquea)
  const recipient = await prisma.user.findUnique({
    where: { id: data.toUserId },
    select: { email: true, name: true },
  })
  if (recipient?.email) {
    sendEmailAsync({
      to: recipient.email,
      subject: `💬 ${message.fromUser.name || 'Alguien'} te escribió sobre ${rfq.number}`,
      react: NewMessageEmail({
        appUrl: appUrl(),
        rfqId: rfq.id,
        rfqNumber: rfq.number,
        rfqTitle: rfq.title,
        fromName: message.fromUser.name || message.fromUser.email,
        body: message.body,
      }),
    })
  }

  return NextResponse.json({ message }, { status: 201 })
}
