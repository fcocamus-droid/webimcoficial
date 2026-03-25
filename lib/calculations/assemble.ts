import type {
  CalcInput,
  CalcLineItem,
  CalcResult,
  LastMileData,
  RateData,
  SurchargeData,
} from './types'
import { calculateLCL } from './lcl'
import { calculateFCL } from './fcl'
import { calculateAir } from './air'
import { calculateCustoms } from './customs'
import { calculateInsurance } from './insurance'
import { calculateLastMile } from './last-mile'

const round2 = (v: number): number => Math.round(v * 100) / 100

interface AssembleParams {
  rate: RateData
  surcharges: SurchargeData[]
  zones: LastMileData[]
  usdClpRate: number
  daiRate?: number
}

export function assembleQuote(input: CalcInput, params: AssembleParams): CalcResult {
  const items: CalcLineItem[] = []
  let freightCost = 0
  let isEstimated = false

  // --- Freight calculation based on shipment type ---
  if (input.shipmentType === 'LCL') {
    const lcl = calculateLCL(
      { cbm: input.cbm ?? 0, weightKg: input.weightKg ?? 0 },
      params.rate
    )
    freightCost = lcl.freightCost
    items.push({
      description: `LCL Freight (${lcl.chargeableUnits} units, ${lcl.basis})`,
      cost: lcl.freightCost,
      currency: 'USD',
      type: 'FREIGHT',
    })
  } else if (
    input.shipmentType === 'FCL_20' ||
    input.shipmentType === 'FCL_40' ||
    input.shipmentType === 'FCL_40HC'
  ) {
    const fcl = calculateFCL(
      { containerQty: input.containerQty ?? 1, shipmentType: input.shipmentType },
      params.rate
    )
    freightCost = fcl.freightCost
    items.push({
      description: `${input.shipmentType} Freight (x${input.containerQty ?? 1})`,
      cost: fcl.freightCost,
      currency: 'USD',
      type: 'FREIGHT',
    })
  } else if (input.shipmentType === 'AIR') {
    const air = calculateAir(
      { grossWeightKg: input.grossWeightKg ?? 0, volumeM3: input.volumeM3 ?? 0 },
      params.rate
    )
    freightCost = air.freightCost
    items.push({
      description: `Air Freight (${air.chargeableKg} kg chargeable, vol: ${air.volumetricKg} kg)`,
      cost: air.freightCost,
      currency: 'USD',
      type: 'FREIGHT',
    })
  }

  // --- Surcharges ---
  let originCost = 0
  let destCost = 0
  for (const surcharge of params.surcharges) {
    const amount = surcharge.amount > 0 ? round2(surcharge.amount) : 0
    if (amount <= 0) continue

    items.push({
      description: `${surcharge.name} (${surcharge.code})`,
      cost: amount,
      currency: surcharge.currency || 'USD',
      type: 'SURCHARGE',
    })

    // Classify surcharges into origin/destination by code convention
    const code = surcharge.code.toUpperCase()
    if (code.startsWith('O') || code.includes('ORIG')) {
      originCost = round2(originCost + amount)
    } else if (code.startsWith('D') || code.includes('DEST')) {
      destCost = round2(destCost + amount)
    }
  }

  // --- Customs ---
  let customsCost = 0
  const cargoValueUSD = input.cargoValueUSD ?? 0

  if (cargoValueUSD > 0) {
    const customs = calculateCustoms(
      { cargoValueUSD, freightCost, incoterm: input.incoterm },
      params.daiRate
    )
    customsCost = customs.total
    isEstimated = customs.isEstimated

    items.push({
      description: `DAI (${((params.daiRate ?? 0.06) * 100).toFixed(1)}% of CIF $${customs.cifValue})`,
      cost: customs.dai,
      currency: 'USD',
      type: 'CUSTOMS',
    })
    items.push({
      description: `IVA (19% of CIF + DAI)`,
      cost: customs.iva,
      currency: 'USD',
      type: 'CUSTOMS',
    })
  }

  // --- Insurance ---
  let insuranceCost = 0
  if (input.includeInsurance) {
    // CIF for insurance: same logic as customs
    const incoterm = (input.incoterm ?? '').toUpperCase().trim()
    const needsFreight = ['FOB', 'EXW', 'FCA', 'FAS'].includes(incoterm)
    const cifForInsurance = needsFreight ? cargoValueUSD + freightCost : cargoValueUSD
    insuranceCost = calculateInsurance(cifForInsurance)

    items.push({
      description: 'Cargo Insurance (0.3% CIF)',
      cost: insuranceCost,
      currency: 'USD',
      type: 'INSURANCE',
    })
  }

  // --- Last Mile ---
  let lastMileCost = 0
  if (input.includeLastMile && input.lastMileRegion) {
    lastMileCost = calculateLastMile(input.lastMileRegion, params.zones)
    if (lastMileCost > 0) {
      items.push({
        description: `Last Mile Delivery (${input.lastMileRegion})`,
        cost: lastMileCost,
        currency: 'USD',
        type: 'LAST_MILE',
      })
    }
  }

  // --- Totals ---
  const surchargeTotal = params.surcharges.reduce(
    (sum, s) => sum + (s.amount > 0 ? s.amount : 0),
    0
  )
  const totalUSD = round2(
    freightCost + surchargeTotal + customsCost + insuranceCost + lastMileCost
  )
  const usdClpRate = params.usdClpRate > 0 ? params.usdClpRate : 0
  const totalCLP = Math.round(totalUSD * usdClpRate)

  return {
    items,
    freightCost: round2(freightCost),
    originCost: round2(originCost),
    destCost: round2(destCost),
    customsCost: round2(customsCost),
    insuranceCost: round2(insuranceCost),
    lastMileCost: round2(lastMileCost),
    totalUSD,
    totalCLP,
    usdClpRate,
    carrier: params.rate.carrierName || 'N/A',
    isEstimated,
  }
}
