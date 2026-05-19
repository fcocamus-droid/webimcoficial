/**
 * Visual 5-stage operations pipeline (inspired by Comexpoint)
 *
 * Renders the import workflow with counts per stage and colored
 * progress bars. Each stage is clickable and filters /operaciones.
 */

import Link from 'next/link'

export type OperationStage = 'PENDING' | 'IN_ORIGIN' | 'IN_TRANSIT' | 'AT_DESTINATION' | 'DELIVERED'

export interface PipelineStage {
  key: OperationStage
  label: string
  count: number
  color: string         // tailwind text color class
  barColor: string      // tailwind bg color class
  dotColor: string      // tailwind bg color class for the dot
}

export const STAGE_CONFIG: Record<OperationStage, Omit<PipelineStage, 'count'>> = {
  PENDING: {
    key: 'PENDING',
    label: 'PENDIENTE',
    color: 'text-amber-600',
    barColor: 'bg-amber-400',
    dotColor: 'bg-amber-500',
  },
  IN_ORIGIN: {
    key: 'IN_ORIGIN',
    label: 'EN ORIGEN',
    color: 'text-red-600',
    barColor: 'bg-red-500',
    dotColor: 'bg-red-500',
  },
  IN_TRANSIT: {
    key: 'IN_TRANSIT',
    label: 'EN TRÁNSITO',
    color: 'text-sky-600',
    barColor: 'bg-sky-500',
    dotColor: 'bg-sky-500',
  },
  AT_DESTINATION: {
    key: 'AT_DESTINATION',
    label: 'EN DESTINO',
    color: 'text-purple-600',
    barColor: 'bg-purple-500',
    dotColor: 'bg-purple-500',
  },
  DELIVERED: {
    key: 'DELIVERED',
    label: 'ENTREGADO',
    color: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
  },
}

export const STAGE_ORDER: OperationStage[] = [
  'PENDING',
  'IN_ORIGIN',
  'IN_TRANSIT',
  'AT_DESTINATION',
  'DELIVERED',
]

export default function OperationPipeline({
  counts,
  total,
  showLink = true,
}: {
  counts: Record<OperationStage, number>
  total?: number
  showLink?: boolean
}) {
  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base md:text-lg font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#F47920]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Pipeline de Operaciones
        </h2>
        {showLink && (
          <Link href="/operaciones" className="text-sm text-[#F47920] hover:underline font-medium">
            Ver todo
          </Link>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 md:gap-6">
        {STAGE_ORDER.map((stage) => {
          const cfg = STAGE_CONFIG[stage]
          const count = counts[stage] || 0
          const pct = Math.min(100, (count / maxCount) * 100)
          return (
            <Link
              key={stage}
              href={`/operaciones?stage=${stage}`}
              className="group block"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                  <span className={`text-[10px] md:text-xs font-semibold tracking-wide ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 group-hover:scale-105 transition-transform">
                  {count}
                </p>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {total !== undefined && (
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{total}</span> operación{total !== 1 ? 'es' : ''} en total
          </p>
        </div>
      )}
    </section>
  )
}
