import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const surcharge = await prisma.surcharge.update({
      where: { id: params.id },
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

    return NextResponse.json(surcharge)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await prisma.surcharge.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 400 })
  }
}
