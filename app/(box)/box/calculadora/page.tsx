import { prisma } from '@/lib/prisma'
import CalculadoraClient from './CalculadoraClient'

export const dynamic = 'force-dynamic'

export default async function CalculadoraPage() {
  // Load rates and factors server-side
  const [rates, factors, types] = await Promise.all([
    prisma.boxRate.findMany({ where: { active: true }, orderBy: { minKg: 'asc' } }),
    prisma.boxFactor.findMany({ where: { active: true } }),
    prisma.packageType.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ])

  const factorsMap: Record<string, number> = {}
  for (const f of factors) factorsMap[f.key] = f.value

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1B2A6B] mb-2">Calculadora IMC Box</h1>
        <p className="text-slate-600">
          Simula el costo total de tu paquete puesto en Chile, incluyendo flete, manejo, aduana e IVA.
        </p>
      </div>

      <CalculadoraClient
        rates={rates.map((r) => ({
          id: r.id,
          minKg: r.minKg,
          maxKg: r.maxKg,
          ratePerKg: r.ratePerKg,
          minimumCharge: r.minimumCharge,
          isAmazon: r.isAmazon,
          isUsed: r.isUsed,
        }))}
        factors={factorsMap}
        types={types.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          daiRate: t.daiRate,
          ivaRate: t.ivaRate,
        }))}
      />
    </div>
  )
}
