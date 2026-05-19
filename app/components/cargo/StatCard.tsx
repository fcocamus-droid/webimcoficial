import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg?: string         // bg color class for icon container
  iconColor?: string      // text color class for icon
  href?: string
  highlight?: boolean
  trend?: { value: number; positive: boolean }
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-700',
  href,
  highlight,
  trend,
}: StatCardProps) {
  const Wrapper: any = href ? Link : 'div'
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`block bg-white rounded-2xl shadow-sm border p-5 transition-all ${
        href ? 'hover:shadow-md hover:border-[#F47920]/40 cursor-pointer' : ''
      } ${highlight ? 'border-[#F47920]/40 ring-1 ring-[#F47920]/10' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {href && (
        <p className="text-xs text-[#F47920] mt-3 font-medium inline-flex items-center gap-1">
          Ver detalles
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </p>
      )}
    </Wrapper>
  )
}
