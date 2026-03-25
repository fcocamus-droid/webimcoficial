import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assembleQuote } from '@/lib/calculations'
import type { CalcInput, SurchargeData, LastMileData } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      shipmentType,
      incoterm,
      originPort,
      destPort,
      cbm,
      weightKg,
      containerQty,
      chargeableKg,
      cargoValueUSD,
      hsCode,
      commodity,
      includeInsurance,
      includeLastMile,
      lastMileRegion,
    } = body

    if (!shipmentType || !incoterm || !originPort || !destPort) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: shipmentType, incoterm, originPort, destPort' },
        { status: 400 }
      )
    }

    // Find best rate for the route + shipment type
    const now = new Date()
    const rate = await prisma.shippingRate.findFirst({
      where: {
        originPort,
        destPort,
        shipmentType,
        active: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      include: { carrier: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!rate) {
      return NextResponse.json(
        { error: 'No se encontraron tarifas disponibles para esta ruta y tipo de envio. Contacta a nuestro equipo para una cotizacion personalizada.' },
        { status: 404 }
      )
    }

    // Get all active surcharges for this shipment type
    const surchargesRaw = await prisma.surcharge.findMany({
      where: {
        active: true,
        OR: [
          { shipmentType: null },
          { shipmentType },
        ],
      },
    })

    const surcharges: SurchargeData[] = surchargesRaw.map((s) => ({
      code: s.code,
      name: s.name,
      amount: s.amount,
      currency: s.currency,
    }))

    // Get last mile zones
    const zonesRaw = await prisma.lastMileZone.findMany({
      where: { active: true },
    })

    const zones: LastMileData[] = zonesRaw.map((z) => ({
      region: z.region,
      rateUSD: z.rateUSD,
    }))

    // Get latest exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { date: 'desc' },
    })

    const usdClpRate = exchangeRate?.usdToCLP ?? 900

    // Build calculation input
    // For AIR, convert chargeableKg from dimensional calc to grossWeightKg + volumeM3
    const calcInput: CalcInput = {
      shipmentType,
      incoterm,
      originPort,
      destPort,
      cbm,
      weightKg,
      containerQty,
      chargeableKg,
      grossWeightKg: shipmentType === 'AIR' ? (chargeableKg ?? 0) : undefined,
      volumeM3: 0,
      cargoValueUSD,
      hsCode,
      includeInsurance,
      includeLastMile,
      lastMileRegion,
    }

    // Assemble the full quote
    const result = assembleQuote(calcInput, {
      rate: {
        ratePerCBM: rate.ratePerCBM ?? undefined,
        ratePerTon: rate.ratePerTon ?? undefined,
        minCBM: rate.minCBM ?? undefined,
        rateContainer: rate.rateContainer ?? undefined,
        ratePerKg: rate.ratePerKg ?? undefined,
        minKg: rate.minKg ?? undefined,
        carrierName: rate.carrier.name,
      },
      surcharges,
      zones,
      usdClpRate,
    })

    // Map to QuoteResult shape for the frontend
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 15)

    return NextResponse.json({
      freightCost: result.freightCost,
      originCost: result.originCost,
      destCost: result.destCost,
      customsCost: result.customsCost,
      insuranceCost: result.insuranceCost,
      lastMileCost: result.lastMileCost,
      totalCostUSD: result.totalUSD,
      totalCostCLP: result.totalCLP,
      usdClpRate: result.usdClpRate,
      breakdown: result.items,
      carrier: result.carrier,
      validUntil: validUntil.toISOString(),
    })
  } catch (error: any) {
    console.error('Quote calculation error:', error)
    return NextResponse.json(
      { error: 'Error interno al calcular la cotizacion' },
      { status: 500 }
    )
  }
}
