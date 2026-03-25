import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const shipmentType = searchParams.get('shipmentType')
  const carriersOnly = searchParams.get('carriers')

  // Return carriers list for form selects
  if (carriersOnly) {
    const carriers = await prisma.carrier.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(carriers)
  }

  const where: Record<string, unknown> = {}
  if (shipmentType && shipmentType !== 'Todos') {
    where.shipmentType = shipmentType
  }

  const rates = await prisma.shippingRate.findMany({
    where,
    include: { carrier: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(rates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const rate = await prisma.shippingRate.create({
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

    return NextResponse.json(rate, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear tarifa' }, { status: 400 })
  }
}
