import type { RateData } from './types'

const round2 = (v: number): number => Math.round(v * 100) / 100

export function calculateLCL(
  input: { cbm: number; weightKg: number },
  rate: RateData
): { freightCost: number; chargeableUnits: number; basis: string } {
  const cbm = input.cbm > 0 ? input.cbm : 0
  const weightTons = input.weightKg > 0 ? input.weightKg / 1000 : 0

  // W/M rule: chargeable units = max(cbm, weight in tons)
  const rawChargeable = Math.max(cbm, weightTons)
  const minCBM = rate.minCBM ?? 1
  const chargeableUnits = Math.max(rawChargeable, minCBM)

  const basis = cbm >= weightTons ? 'VOLUME (CBM)' : 'WEIGHT (W/M)'

  // Use whichever rate yields the higher freight
  const ratePerCBM = rate.ratePerCBM ?? 0
  const ratePerTon = rate.ratePerTon ?? 0
  const applicableRate = Math.max(ratePerCBM, ratePerTon)

  if (applicableRate <= 0) {
    return { freightCost: 0, chargeableUnits: round2(chargeableUnits), basis }
  }

  const freightCost = round2(chargeableUnits * applicableRate)

  return { freightCost, chargeableUnits: round2(chargeableUnits), basis }
}
