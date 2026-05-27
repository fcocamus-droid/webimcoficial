/**
 * Dynamic USD/CLP exchange rate with daily refresh.
 *
 * Source: mindicador.cl (Chilean government economic indicators API, free, no auth)
 * - "dolar" = Dólar observado (Banco Central)
 *
 * Strategy:
 *  - Cache rate in DB (exchange_rates table)
 *  - If today's rate exists → return it
 *  - Otherwise → fetch from mindicador.cl and persist
 *
 * Returns CLP value of 1 USD.
 */

import { prisma } from '@/lib/prisma'

const FALLBACK_RATE = 950  // safety fallback if API down
const MINDICADOR_URL = 'https://mindicador.cl/api/dolar'

let memoryCache: { value: number; fetchedAt: number } | null = null
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000  // 6 hours in-memory

export async function getUsdToClpRate(): Promise<number> {
  // 1. In-memory cache (per server instance)
  if (memoryCache && Date.now() - memoryCache.fetchedAt < MEMORY_TTL_MS) {
    return memoryCache.value
  }

  // 2. DB cache for today
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const row = await prisma.exchangeRate.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: 'desc' },
    })
    if (row && row.usdToCLP > 0) {
      memoryCache = { value: row.usdToCLP, fetchedAt: Date.now() }
      return row.usdToCLP
    }
  } catch (e) {
    console.error('Exchange rate DB read error:', e)
  }

  // 3. Fetch from mindicador.cl
  try {
    const res = await fetch(MINDICADOR_URL, {
      // @ts-ignore Next.js fetch options
      cache: 'no-store',
      headers: { 'User-Agent': 'IMCCargo/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const valor = data?.serie?.[0]?.valor
    if (typeof valor === 'number' && valor > 0) {
      // Persist to DB
      try {
        await prisma.exchangeRate.create({ data: { usdToCLP: valor } })
      } catch (e) {
        console.error('Exchange rate DB write error:', e)
      }
      memoryCache = { value: valor, fetchedAt: Date.now() }
      return valor
    }
    throw new Error('Invalid response format')
  } catch (e) {
    console.error('mindicador.cl fetch error, using fallback:', e)
    return FALLBACK_RATE
  }
}

/**
 * Force-refresh from external API (useful for cron / admin trigger).
 */
export async function refreshExchangeRate(): Promise<{ ok: boolean; rate: number; source: string }> {
  try {
    const res = await fetch(MINDICADOR_URL, { cache: 'no-store' as any })
    const data = await res.json()
    const valor = data?.serie?.[0]?.valor
    if (typeof valor === 'number' && valor > 0) {
      await prisma.exchangeRate.create({ data: { usdToCLP: valor } })
      memoryCache = { value: valor, fetchedAt: Date.now() }
      return { ok: true, rate: valor, source: 'mindicador.cl' }
    }
    throw new Error('Bad data')
  } catch (e: any) {
    return { ok: false, rate: FALLBACK_RATE, source: 'fallback' }
  }
}
