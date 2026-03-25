import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalQuotes, totalUsers, activeRates, quotesThisMonth] = await Promise.all([
    prisma.quote.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.shippingRate.count({ where: { active: true } }),
    prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
  ])

  return NextResponse.json({
    totalQuotes,
    totalUsers,
    activeRates,
    quotesThisMonth,
  })
}
