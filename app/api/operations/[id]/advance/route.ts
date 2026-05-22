import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STAGE_ORDER = ['PENDING', 'IN_ORIGIN', 'IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED'] as const

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { targetStage, title, description, location } = body

    // Fetch current operation
    const rows = await prisma.$queryRaw<Array<{ stage: string; userId: string }>>`
      SELECT stage::text AS stage, "userId" FROM operations WHERE id = ${params.id} LIMIT 1
    `
    if (!rows[0]) return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 })

    const currentStage = rows[0].stage as typeof STAGE_ORDER[number]
    const currentIdx = STAGE_ORDER.indexOf(currentStage)
    if (currentIdx === -1) return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 })

    // Determine target stage
    let newStage = targetStage as typeof STAGE_ORDER[number] | undefined
    if (!newStage) {
      if (currentIdx >= STAGE_ORDER.length - 1) {
        return NextResponse.json({ error: 'Ya está en etapa final' }, { status: 400 })
      }
      newStage = STAGE_ORDER[currentIdx + 1]
    } else if (!STAGE_ORDER.includes(newStage)) {
      return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 })
    }

    // Update stage
    await prisma.$executeRawUnsafe(
      `UPDATE operations SET stage = $1::"OperationStage", "updatedAt" = now() WHERE id = $2`,
      newStage,
      params.id
    )

    // Insert event
    const eventTitle = title || `Etapa: ${stageLabel(newStage)}`
    await prisma.$executeRaw`
      INSERT INTO operation_events (id, "operationId", stage, title, description, location, "userId", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${params.id},
        ${newStage}::"OperationStage",
        ${eventTitle},
        ${description || null},
        ${location || null},
        ${session.user.id},
        now()
      )
    `

    return NextResponse.json({ ok: true, newStage })
  } catch (e: any) {
    console.error('Advance stage error:', e)
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}

function stageLabel(s: string) {
  return {
    PENDING: 'Pendiente',
    IN_ORIGIN: 'En origen',
    IN_TRANSIT: 'En tránsito',
    AT_DESTINATION: 'En destino',
    DELIVERED: 'Entregado',
  }[s] || s
}
