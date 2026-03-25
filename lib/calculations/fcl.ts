import type { RateData } from './types'

const round2 = (v: number): number => Math.round(v * 100) / 100

export function calculateFCL(
  input: { containerQty: number; shipmentType: string },
  rate: RateData
): { freightCost: number } {
  const qty = input.containerQty > 0 ? input.containerQty : 1
  const ratePerContainer = rate.rateContainer ?? 0

  if (ratePerContainer <= 0) {
    return { freightCost: 0 }
  }

  const freightCost = round2(ratePerContainer * qty)

  return { freightCost }
}
