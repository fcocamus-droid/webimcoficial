'use client'

import { useState } from 'react'

type Stats = {
  hasUsers: boolean
  hasRates: boolean
  hasQuotes: boolean
  hasOperations: boolean
  hasResend: boolean
}

const STEPS = [
  {
    key: 'users',
    title: 'Clientes cargados',
    desc: '662 clientes IMC Box + 76 IMC Cargo migrados',
  },
  {
    key: 'rates',
    title: 'Tarifas configuradas',
    desc: '895 rutas LCL/FCL desde cargo-sys',
  },
  {
    key: 'quotes',
    title: 'Sistema de cotizaciones',
    desc: 'Wizard de 5 pasos en producción',
  },
  {
    key: 'operations',
    title: 'Pipeline de operaciones',
    desc: '5 etapas: Pendiente → Entregado',
  },
  {
    key: 'resend',
    title: 'Email transaccional (Resend)',
    desc: 'Configurar API key para envíos automáticos',
  },
]

export default function DashboardOnboarding({ firstName, stats }: { firstName: string; stats: Stats }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const completed = Object.values(stats).filter(Boolean).length
  const total = STEPS.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="relative bg-gradient-to-br from-[#1B2A6B] via-[#1F3174] to-[#0F1740] rounded-2xl p-6 md:p-8 text-white shadow-lg overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F47920]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-32 h-32 bg-[#F47920]/10 rounded-full blur-2xl pointer-events-none" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-white/40 hover:text-white text-xl leading-none"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 relative">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h2 className="text-xl md:text-2xl font-bold">¡Bienvenido, {firstName}!</h2>
          </div>
          <p className="text-sm text-blue-100/90 leading-relaxed mb-5 max-w-2xl">
            Tu plataforma IMC Cargo está lista. Estos son los componentes ya configurados.
            Lo único pendiente es activar el servicio de emails — cuando me pases el API key de Resend lo dejo funcionando.
          </p>

          {/* Progress */}
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-blue-100">{completed} de {total} componentes activos</span>
            <span className="font-bold text-[#F47920]">{pct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F47920] to-[#ffb56b] rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {STEPS.map((step) => {
            const done = stats[step.key as keyof Stats]
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  done ? 'bg-white/5 border-white/10' : 'bg-[#F47920]/10 border-[#F47920]/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-emerald-500' : 'bg-white/20 border border-white/30'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${done ? 'text-white/70 line-through' : 'text-white'}`}>
                    {step.title}
                  </p>
                  <p className={`text-xs ${done ? 'text-white/40' : 'text-blue-100/80'}`}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
