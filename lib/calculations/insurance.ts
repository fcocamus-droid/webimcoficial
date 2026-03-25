const round2 = (v: number): number => Math.round(v * 100) / 100

/** Standard cargo insurance rate: 0.3% of CIF */
const INSURANCE_RATE = 0.003

/** Minimum insurance premium in USD */
const MIN_PREMIUM_USD = 25

export function calculateInsurance(cifValue: number): number {
  if (cifValue <= 0) {
    return MIN_PREMIUM_USD
  }

  const premium = cifValue * INSURANCE_RATE
  return round2(Math.max(premium, MIN_PREMIUM_USD))
}
