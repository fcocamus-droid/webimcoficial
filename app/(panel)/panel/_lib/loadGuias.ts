import { prisma } from '@/lib/prisma'
import type { GuiaRow } from '../../_components/GuiasTable'

function mapStatusToVariant(status: string): GuiaRow['statusVariant'] {
  switch (status) {
    case 'ACCEPTED': return 'green'
    case 'SENT': return 'blue'
    case 'DRAFT': return 'slate'
    case 'REJECTED': return 'red'
    case 'EXPIRED': return 'amber'
    default: return 'slate'
  }
}

function statusLabel(status: string): string {
  return {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    ACCEPTED: 'Entregado',
    REJECTED: 'Rechazada',
    EXPIRED: 'Expirada',
  }[status] || status
}

/**
 * Load shipment "guías" filtered by shipment type.
 * Maps internal Prisma quote.shipmentType enum to Colinter-style categories.
 */
export async function loadGuias(userId: string, types: string[]): Promise<GuiaRow[]> {
  const quotes = await prisma.quote.findMany({
    where: { userId, shipmentType: { in: types as any } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      number: true,
      originPort: true,
      status: true,
      createdAt: true,
      cbm: true,
      weightKg: true,
      chargeableKg: true,
      containerQty: true,
      cargoValueUSD: true,
      freightCost: true,
      totalCostCLP: true,
      totalCostUSD: true,
    },
  })

  return quotes.map((q) => ({
    id: q.id,
    number: q.number,
    status: statusLabel(q.status),
    statusVariant: mapStatusToVariant(q.status),
    date: q.createdAt,
    expedidor: q.originPort,
    totalCargosCLP: q.totalCostCLP,
    piezas: q.containerQty,
    kilos: q.weightKg ?? q.chargeableKg,
    fleteUSD: q.freightCost,
    valorUSD: q.totalCostUSD,
  }))
}
