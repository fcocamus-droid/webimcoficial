export interface CalcInput {
  shipmentType: 'LCL' | 'FCL_20' | 'FCL_40' | 'FCL_40HC' | 'AIR'
  incoterm: string
  originPort: string
  destPort: string
  // LCL
  cbm?: number
  weightKg?: number
  // FCL
  containerQty?: number
  // Air
  chargeableKg?: number
  grossWeightKg?: number
  volumeM3?: number
  // Value
  cargoValueUSD?: number
  hsCode?: string
  // Options
  includeInsurance?: boolean
  includeLastMile?: boolean
  lastMileRegion?: string
}

export interface RateData {
  ratePerCBM?: number
  ratePerTon?: number
  minCBM?: number
  rateContainer?: number
  ratePerKg?: number
  minKg?: number
  carrierName: string
}

export interface SurchargeData {
  code: string
  name: string
  amount: number
  currency: string
}

export interface LastMileData {
  region: string
  rateUSD: number
}

export interface CalcLineItem {
  description: string
  cost: number
  currency: string
  type: 'FREIGHT' | 'ORIGIN' | 'DESTINATION' | 'CUSTOMS' | 'INSURANCE' | 'LAST_MILE' | 'SURCHARGE'
}

export interface CalcResult {
  items: CalcLineItem[]
  freightCost: number
  originCost: number
  destCost: number
  customsCost: number
  insuranceCost: number
  lastMileCost: number
  totalUSD: number
  totalCLP: number
  usdClpRate: number
  carrier: string
  isEstimated: boolean
}
