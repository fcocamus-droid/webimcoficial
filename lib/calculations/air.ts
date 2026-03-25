import type { RateData } from './types'

const round2 = (v: number): number => Math.round(v * 100) / 100

/** IATA volumetric conversion factor: 1 m3 = 167 kg */
const IATA_FACTOR = 167

export function calculateAir(
  input: { grossWeightKg: number; volumeM3: number },
  rate: RateData
): { freightCost: number; chargeableKg: number; volumetricKg: number } {
  const grossWeightKg = input.grossWeightKg > 0 ? input.grossWeightKg : 0
  const volumeM3 = input.volumeM3 > 0 ? input.volumeM3 : 0

  const volumetricKg = round2(volumeM3 * IATA_FACTOR)
  const chargeableKg = Math.max(grossWeightKg, volumetricKg)

  const ratePerKg = rate.ratePerKg ?? 0
  const minKg = rate.minKg ?? 0

  if (ratePerKg <= 0) {
    return { freightCost: 0, chargeableKg: round2(chargeableKg), volumetricKg }
  }

  // Apply minimum chargeable weight
  const billedKg = Math.max(chargeableKg, minKg)
  const freightCost = round2(billedKg * ratePerKg)

  return { freightCost, chargeableKg: round2(billedKg), volumetricKg }
}
