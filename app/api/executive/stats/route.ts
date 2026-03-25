import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if ((session.user as { role?: string }).role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const executiveId = session.user.id as string

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get assigned client IDs
  const assignments = await prisma.clientAssignment.findMany({
    where: { executiveId },
    select: { clientId: true },
  })

  const clientIds = assignments.map((a) => a.clientId)
  const clientCount = clientIds.length

  const [totalQuotes, quotesThisMonth, recentQuotes] = await Promise.all([
    prisma.quote.count({
      where: { userId: { in: clientIds } },
    }),
    prisma.quote.count({
      where: {
        userId: { in: clientIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.quote.findMany({
      where: { userId: { in: clientIds } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, company: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    clientCount,
    totalQuotes,
    quotesThisMonth,
    recentQuotes,
  })
}
