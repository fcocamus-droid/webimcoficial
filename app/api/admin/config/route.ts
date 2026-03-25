import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Get latest exchange rate
  const latestRate = await prisma.exchangeRate.findFirst({
    orderBy: { date: 'desc' },
  })

  // Get all site_config rows
  const configRows = await prisma.siteConfig.findMany()
  const config: Record<string, string> = {}
  for (const row of configRows) {
    config[row.key] = row.value
  }

  return NextResponse.json({
    usdToCLP: latestRate?.usdToCLP || 950,
    quoteValidityDays: parseInt(config['quote_validity_days'] ?? '15'),
    companyName: config['company_name'] ?? 'IMC Cargo',
    companyRut: config['company_rut'] ?? '',
    companyAddress: config['company_address'] ?? '',
    companyPhone: config['company_phone'] ?? '',
    companyEmail: config['company_email'] ?? '',
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

    // Persist company settings and quote validity to site_config
    const settingsMap: Record<string, string | undefined> = {
      company_name: body.companyName,
      company_rut: body.companyRut,
      company_address: body.companyAddress,
      company_phone: body.companyPhone,
      company_email: body.companyEmail,
      quote_validity_days: body.quoteValidityDays != null
        ? String(body.quoteValidityDays)
        : undefined,
    }

    for (const [key, val] of Object.entries(settingsMap)) {
      if (val === undefined) continue
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar configuracion' }, { status: 400 })
  }
}
