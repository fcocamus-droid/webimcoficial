// GET /api/messages/threads
// Devuelve los hilos del usuario actual. Un hilo es una combinación única
// (rfqId, otherUserId). Por hilo: último mensaje + conteo de no leídos +
// snapshot de la RFQ y la contraparte.

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  // Traemos los últimos mensajes del usuario (enviados o recibidos) y
  // los agrupamos en memoria por (rfqId, otherUserId).
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
      rfqId: { not: null },
    },
    include: {
      rfq: {
        select: { id: true, number: true, title: true, status: true },
      },
      fromUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      toUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  type Thread = {
    rfqId: string
    rfqNumber: string
    rfqTitle: string
    rfqStatus: string
    otherUserId: string
    otherUserName: string | null
    otherUserAvatarUrl: string | null
    lastMessage: string
    lastFromMe: boolean
    lastAt: string
    unreadCount: number
  }

  const threadMap = new Map<string, Thread>()
  for (const m of messages) {
    if (!m.rfq) continue
    const isFromMe = m.fromUserId === userId
    const other = isFromMe ? m.toUser : m.fromUser
    const key = `${m.rfqId}__${other.id}`
    const existing = threadMap.get(key)
    const unreadIncrement = !isFromMe && !m.readAt ? 1 : 0

    if (!existing) {
      threadMap.set(key, {
        rfqId: m.rfq.id,
        rfqNumber: m.rfq.number,
        rfqTitle: m.rfq.title,
        rfqStatus: m.rfq.status,
        otherUserId: other.id,
        otherUserName: other.name,
        otherUserAvatarUrl: other.avatarUrl ?? null,
        lastMessage: m.body,
        lastFromMe: isFromMe,
        lastAt: m.createdAt.toISOString(),
        unreadCount: unreadIncrement,
      })
    } else {
      // El primer mensaje fue el más reciente; solo sumamos unread
      existing.unreadCount += unreadIncrement
    }
  }

  const threads = Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  )

  return NextResponse.json({ threads })
}
