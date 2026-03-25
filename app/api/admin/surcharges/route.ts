import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const surcharges = await prisma.surcharge.findMany({
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(surcharges)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const surcharge = await prisma.surcharge.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description || null,
        amount: body.amount,
        currency: body.currency || 'USD',
        shipmentType: body.shipmentType || null,
        portCode: body.portCode || null,
        active: body.active ?? true,
      },
    })

    return NextResponse.json(surcharge, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear surcharge' }, { status: 400 })
  }
}
