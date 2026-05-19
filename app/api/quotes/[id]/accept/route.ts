import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Accepts a quote and creates an Operation (active shipment).
 * The operation enters the pipeline at stage PENDING.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, number: true, status: true, totalCostUSD: true },
    })
    if (!quote) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })

    const role = (session.user as any).role
    if (quote.userId !== session.user.id && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Check if operation already exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM operations WHERE "quoteId" = ${params.id} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Esta cotización ya tiene una operación activa', operationId: existing[0].id }, { status: 400 })
    }

    // Generate next operation code OPN-YYYY-####
    const year = new Date().getFullYear()
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM operations WHERE code LIKE ${`OPN-${year}-%`}
    `
    const nextNum = Number(countResult[0]?.count || 0) + 1
    const opCode = `OPN-${year}-${String(nextNum).padStart(4, '0')}`

    // Create operation
    await prisma.$executeRaw`
      INSERT INTO operations (id, code, "quoteId", "userId", stage, "pendingPayment", notes, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${opCode},
        ${quote.id},
        ${quote.userId},
        'PENDING'::"OperationStage",
        ${quote.totalCostUSD || 0},
        ${'Operación creada desde cotización ' + quote.number},
        now(),
        now()
      )
    `

    // Update quote status to ACCEPTED
    await prisma.quote.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
    })

    // Get the created operation
    const op = await prisma.$queryRaw<Array<{ id: string; code: string }>>`
      SELECT id, code FROM operations WHERE "quoteId" = ${params.id} LIMIT 1
    `

    // Add initial event
    if (op[0]) {
      await prisma.$executeRaw`
        INSERT INTO operation_events (id, "operationId", stage, title, description, "userId", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${op[0].id},
          'PENDING'::"OperationStage",
          'Operación activada',
          ${'Cotización ' + quote.number + ' aceptada y operación creada'},
          ${session.user.id},
          now()
        )
      `
    }

    return NextResponse.json({
      ok: true,
      operationId: op[0]?.id,
      operationCode: op[0]?.code || opCode,
    })
  } catch (error: any) {
    console.error('Accept quote error:', error)
    return NextResponse.json({ error: error.message || 'Error al activar operación' }, { status: 500 })
  }
}
