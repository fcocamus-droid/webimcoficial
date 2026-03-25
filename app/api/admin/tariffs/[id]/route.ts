import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rate = await prisma.shippingRate.findUnique({
    where: { id: params.id },
    include: { carrier: true },
  })

  if (!rate) {
    return NextResponse.json({ error: 'Tarifa no encontrada' }, { status: 404 })
  }

  return NextResponse.json(rate)
}

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

    const rate = await prisma.shippingRate.update({
      where: { id: params.id },
      data: {
        carrierId: body.carrierId,
        originPort: body.originPort,
        destPort: body.destPort,
        shipmentType: body.shipmentType,
        ratePerCBM: body.ratePerCBM ?? null,
        ratePerTon: body.ratePerTon ?? null,
        minCBM: body.minCBM ?? null,
        rateContainer: body.rateContainer ?? null,
        ratePerKg: body.ratePerKg ?? null,
        minKg: body.minKg ?? null,
        currency: body.currency || 'USD',
        validFrom: new Date(body.validFrom),
        validTo: new Date(body.validTo),
        active: body.active ?? true,
      },
    })

    return NextResponse.json(rate)
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
    await prisma.shippingRate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 400 })
  }
}
