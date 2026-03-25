const round2 = (v: number): number => Math.round(v * 100) / 100

/** Default DAI rate for Chile (6%) */
const DEFAULT_DAI_RATE = 0.06

/** Chilean IVA rate (19%) */
const IVA_RATE = 0.19

/** Incoterms where freight must be added to cargo value to compute CIF */
const FREIGHT_INCLUSIVE_INCOTERMS = ['FOB', 'EXW', 'FCA', 'FAS']

export function calculateCustoms(
  input: { cargoValueUSD: number; freightCost: number; incoterm: string },
  daiRate?: number
): { dai: number; iva: number; total: number; cifValue: number; isEstimated: boolean } {
  const cargoValue = input.cargoValueUSD > 0 ? input.cargoValueUSD : 0
  const freightCost = input.freightCost > 0 ? input.freightCost : 0
  const incoterm = (input.incoterm ?? '').toUpperCase().trim()
  const effectiveDaiRate = daiRate ?? DEFAULT_DAI_RATE

  // Determine CIF value based on incoterm
  const needsFreight = FREIGHT_INCLUSIVE_INCOTERMS.includes(incoterm)
  const cifValue = round2(needsFreight ? cargoValue + freightCost : cargoValue)

  if (cifValue <= 0) {
    return { dai: 0, iva: 0, total: 0, cifValue: 0, isEstimated: true }
  }

  // DAI (Derechos Ad Valorem)
  const dai = round2(cifValue * effectiveDaiRate)

  // IVA applies on CIF + DAI
  const iva = round2((cifValue + dai) * IVA_RATE)

  const total = round2(dai + iva)

  return { dai, iva, total, cifValue, isEstimated: true }
}
