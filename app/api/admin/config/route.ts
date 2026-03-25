import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Simple key-value store for settings using the ExchangeRate model + environment
// For company settings, we store them in a JSON file approach or we use the latest ExchangeRate record
// Here we use ExchangeRate for the rate value, and return static defaults for other settings

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Get latest exchange rate
  const latestRate = await prisma.exchangeRate.findFirst({
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({
    usdToCLP: latestRate?.usdToCLP || 950,
    quoteValidityDays: parseInt(process.env.QUOTE_VALIDITY_DAYS || '15'),
    companyName: process.env.COMPANY_NAME || 'IMC Cargo',
    companyRut: process.env.COMPANY_RUT || '',
    companyAddress: process.env.COMPANY_ADDRESS || '',
    companyPhone: process.env.COMPANY_PHONE || '',
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Upsert exchange rate
    if (body.usdToCLP) {
      await prisma.exchangeRate.create({
        data: {
          usdToCLP: body.usdToCLP,
          date: new Date(),
        },
      })
    }

    // Note: Company settings (companyName, companyRut, etc.) would ideally
    // be stored in a Settings model. For now, they are sourced from env vars.
    // A full implementation would create a Settings model in Prisma.

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar configuracion' }, { status: 400 })
  }
}
