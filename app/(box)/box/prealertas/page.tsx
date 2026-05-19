import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  RECEIVED: { label: 'Recibido', color: 'bg-green-100 text-green-800' },
  DISCREPANCY: { label: 'Diferencia', color: 'bg-orange-100 text-orange-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600' },
}

export default async function PreAlertasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/box/prealertas')

  const preAlerts = await prisma.preAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { packageType: { select: { name: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A6B]">Pre-alertas</h1>
          <p className="text-slate-600 mt-1">
            Avísanos los paquetes que vienen en camino a Miami antes de que lleguen
          </p>
        </div>
        <Link
          href="/box/prealertas/nueva"
          className="bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva pre-alerta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
        {preAlerts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="text-5xl mb-3">🔔</div>
            <h3 className="font-semibold text-slate-900 mb-2">No tienes pre-alertas aún</h3>
            <p className="text-slate-600 text-sm mb-4 max-w-md mx-auto">
              Cuando compres en USA, créanos una pre-alerta con el tracking, valor y descripción del producto. Así podremos identificar y procesar tu paquete más rápido al llegar a Miami.
            </p>
            <Link
              href="/box/prealertas/nueva"
              className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              Crear primera pre-alerta
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Tienda</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-left font-medium">Tracking</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preAlerts.map((pa) => {
                  const status = STATUS_LABELS[pa.status] || { label: pa.status, color: 'bg-slate-100 text-slate-700' }
                  return (
                    <tr key={pa.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-[#1B2A6B] font-semibold">{pa.code}</td>
                      <td className="px-4 py-3 text-slate-700">{pa.store || '—'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-700">{pa.description}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{pa.tracking || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">USD ${pa.valueUSD.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(pa.createdAt).toLocaleDateString('es-CL')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
