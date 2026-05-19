import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true, company: true } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  // Authorization: owner or superadmin
  const role = (session.user as any).role
  if (quote.userId !== session.user.id && role !== 'SUPERADMIN' && role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Check if already has operation
  const operation = await prisma.$queryRaw<Array<{ id: string; code: string; stage: string }>>`
    SELECT id, code, stage::text AS stage FROM operations WHERE "quoteId" = ${params.id} LIMIT 1
  `

  return NextResponse.json({ ...quote, operation: operation[0] || null })
}
