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

  const assignments = await prisma.clientAssignment.findMany({
    where: { executiveId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          companyRef: {
            select: { razonSocial: true },
          },
          quotes: {
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  const clients = assignments.map((a) => ({
    id: a.client.id,
    name: a.client.name,
    email: a.client.email,
    company: a.client.company,
    companyRazonSocial: a.client.companyRef?.razonSocial ?? null,
    quoteCount: a.client.quotes.length,
    lastQuoteDate: a.client.quotes[0]?.createdAt ?? null,
  }))

  return NextResponse.json({ clients })
}
