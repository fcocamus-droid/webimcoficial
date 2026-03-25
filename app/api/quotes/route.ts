import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Generate sequential quote number QTE-YYYY-NNNN
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `QTE-${year}-`

  const lastQuote = await prisma.quote.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  })

  let seq = 1
  if (lastQuote) {
    const parts = lastQuote.number.split('-')
    const lastSeq = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1
    }
  }

  return `${prefix}${seq.toString().padStart(4, '0')}`
}

// POST - Save a calculated quote to DB
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Debes iniciar sesion para guardar cotizaciones' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { input, result } = body

    if (!input || !result) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const number = await generateQuoteNumber()

    const validUntil = result.validUntil
      ? new Date(result.validUntil)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    const quote = await prisma.quote.create({
      data: {
        number,
        userId: session.user.id,
        shipmentType: input.shipmentType,
        incoterm: input.incoterm,
        originPort: input.originPort,
        destPort: input.destPort,
        commodity: input.commodity || '',
        hsCode: input.hsCode || null,
        cbm: input.cbm || null,
        weightKg: input.weightKg || null,
        containerQty: input.containerQty || null,
        chargeableKg: input.chargeableKg || null,
        cargoValueUSD: input.cargoValueUSD || null,
        freightCost: result.freightCost,
        originCost: result.originCost,
        destCost: result.destCost,
        customsCost: result.customsCost || null,
        insuranceCost: result.insuranceCost || null,
        totalCostUSD: result.totalCostUSD,
        totalCostCLP: result.totalCostCLP || null,
        usdClpRate: result.usdClpRate || null,
        validUntil,
        status: 'DRAFT',
        items: {
          create: (result.breakdown || []).map((item: any) => ({
            description: item.description,
            cost: item.cost,
            currency: item.currency || 'USD',
            type: item.type,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({
      id: quote.id,
      number: quote.number,
      status: quote.status,
    })
  } catch (error: any) {
    console.error('Save quote error:', error)
    return NextResponse.json(
      { error: 'Error al guardar la cotizacion' },
      { status: 500 }
    )
  }
}

// GET - List user's quotes with pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
      prisma.quote.count({
        where: { userId: session.user.id },
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
  } catch (error: any) {
    console.error('List quotes error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}
