// lib/rfq-number.ts — generador de número correlativo RFQ-YYYY-NNNN
import { prisma } from './prisma'

/**
 * Genera el siguiente número correlativo para una RFQ.
 * Formato: RFQ-YYYY-NNNN (ej: RFQ-2026-0001).
 * Llamar dentro de una transacción Prisma cuando sea posible para
 * evitar duplicados en alta concurrencia.
 */
export async function nextRfqNumber(
  tx: Pick<typeof prisma, '$queryRawUnsafe'> = prisma
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RFQ-${year}-`

  // Busca el último número del año actual y suma 1.
  const rows = (await tx.$queryRawUnsafe(
    `SELECT number FROM rfqs WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`,
    `${prefix}%`
  )) as { number: string }[]

  let seq = 1
  if (rows.length > 0) {
    const last = rows[0].number
    const parts = last.split('-')
    const lastSeq = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
