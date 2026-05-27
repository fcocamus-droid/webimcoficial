import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { refreshExchangeRate } from '@/lib/exchange-rate'

export const dynamic = 'force-dynamic'

/**
 * Refreshes the USD/CLP rate from mindicador.cl and optionally recalculates
 * all product prices with the new rate.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  try {
    const body = await req.json().catch(() => ({}))
    const { recalculateAll } = body

    const result = await refreshExchangeRate()
    if (!result.ok) {
      return NextResponse.json({ error: 'No se pudo obtener tipo de cambio', source: result.source }, { status: 500 })
    }

    let updated = 0
    if (recalculateAll) {
      // Recalculate all products with stored price_usd
      const products = await prisma.$queryRaw<Array<any>>`
        SELECT id, price_usd AS "priceUSD", shipping_cost_usd AS "shippingUSD", margin_factor AS "marginFactor"
        FROM products
        WHERE price_usd IS NOT NULL AND price_usd > 0
      `

      for (const p of products) {
        const newCLP = Math.round(
          (Number(p.priceUSD) + Number(p.shippingUSD || 0)) *
            Number(p.marginFactor || 1.3) *
            result.rate
        )
        await prisma.$executeRaw`
          UPDATE products SET price_clp = ${newCLP}, "updatedAt" = now() WHERE id = ${p.id}
        `
        updated++
      }
    }

    return NextResponse.json({
      ok: true,
      rate: result.rate,
      source: result.source,
      updated,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 })
  }
}

/**
 * GET — returns current USD/CLP rate without modifying anything.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { getUsdToClpRate } = await import('@/lib/exchange-rate')
  const rate = await getUsdToClpRate()
  return NextResponse.json({ rate })
}
