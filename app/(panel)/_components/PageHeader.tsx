import Link from 'next/link'

export default function PageHeader({
  title,
  breadcrumb,
}: {
  title: string
  breadcrumb?: Array<{ label: string; href?: string }>
}) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="text-sm text-slate-500 mb-2 flex items-center gap-1.5">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {b.href ? (
                <Link href={b.href} className="hover:text-slate-700">{b.label}</Link>
              ) : (
                <span className="text-slate-600">{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
    </div>
  )
}
