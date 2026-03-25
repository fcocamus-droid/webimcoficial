import type { LastMileData } from './types'

export function calculateLastMile(region: string, zones: LastMileData[]): number {
  if (!region || !zones || zones.length === 0) {
    return 0
  }

  const normalizedRegion = region.toUpperCase().trim()
  const match = zones.find((z) => z.region.toUpperCase().trim() === normalizedRegion)

  if (!match) {
    return 0
  }

  return match.rateUSD > 0 ? Math.round(match.rateUSD * 100) / 100 : 0
}
