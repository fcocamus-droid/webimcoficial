import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if ((session.user as { role?: string }).role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const executiveId = session.user.id as string

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit

  // Get assigned client IDs
  const assignments = await prisma.clientAssignment.findMany({
    where: { executiveId },
    select: { clientId: true },
  })

  const clientIds = assignments.map((a) => a.clientId)

  const [total, quotes] = await Promise.all([
    prisma.quote.count({
      where: { userId: { in: clientIds } },
    }),
    prisma.quote.findMany({
      where: { userId: { in: clientIds } },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, company: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    quotes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
