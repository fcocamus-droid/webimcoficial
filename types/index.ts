// Tipos globales del proyecto IMC Cargo

export type { ShipmentType, Incoterm, QuoteStatus, Role } from '@prisma/client'

export interface QuoteInput {
  shipmentType: 'LCL' | 'FCL_20' | 'FCL_40' | 'FCL_40HC' | 'AIR'
  incoterm: 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP'
  originPort: string
  destPort: string
  commodity: string
  hsCode?: string
  // LCL
  cbm?: number
  weightKg?: number
  // FCL
  containerQty?: number
  // Air
  chargeableKg?: number
  // Options
  cargoValueUSD?: number
  includeInsurance?: boolean
  includeLastMile?: boolean
  lastMileRegion?: string
}

export interface QuoteResult {
  freightCost: number
  originCost: number
  destCost: number
  customsCost: number
  insuranceCost?: number
  lastMileCost?: number
  totalCostUSD: number
  totalCostCLP: number
  usdClpRate: number
  breakdown: QuoteLineItem[]
  carrier: string
  validUntil: Date
}

export interface QuoteLineItem {
  description: string
  cost: number
  currency: string
  type: 'FREIGHT' | 'ORIGIN' | 'DESTINATION' | 'CUSTOMS' | 'INSURANCE' | 'LAST_MILE' | 'SURCHARGE'
}

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5
  data: Partial<QuoteInput>
  result?: QuoteResult
}
