'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuoteWizard } from '@/hooks/useQuoteWizard'
import Step1Route from './steps/Step1Route'
import Step2Cargo from './steps/Step2Cargo'
import Step3Commodity from './steps/Step3Commodity'
import Step4Services from './steps/Step4Services'
import Step5Result from './steps/Step5Result'

type StepNum = 1 | 2 | 3 | 4 | 5

const STEPS: Array<{
  number: StepNum
  label: string
  description: string
  icon: string
}> = [
  { number: 1, label: 'Ruta', description: 'Origen, destino e Incoterm', icon: '🗺️' },
  { number: 2, label: 'Carga', description: 'Modalidad y dimensiones', icon: '📦' },
  { number: 3, label: 'Mercadería', description: 'Producto y valor', icon: '🏷️' },
  { number: 4, label: 'Servicios', description: 'Aduana, seguro, última milla', icon: '⚙️' },
  { number: 5, label: 'Cotización', description: 'Resumen y desglose', icon: '💰' },
]

function canAdvance(step: number, data: Record<string, unknown>): boolean {
  switch (step) {
    case 1:
      return !!(data.incoterm && data.originPort && data.destPort)
    case 2: {
      const t = data.shipmentType as string | undefined
      if (!t) return false
      if (t === 'LCL') return !!(data.cbm && data.weightKg)
      if (t === 'AIR') return !!(data.chargeableKg)
      return !!(data.containerQty)
    }
    case 3:
      return !!(data.commodity && data.cargoValueUSD)
    case 4:
      if (data.includeLastMile && !data.lastMileRegion) return false
      return true
    default:
      return true
  }
}

function summaryForStep(step: StepNum, data: Record<string, any>): string | null {
  switch (step) {
    case 1:
      if (data.originPort && data.destPort) {
        return `${data.originPort} → ${data.destPort}${data.incoterm ? ' · ' + data.incoterm : ''}`
      }
      return null
    case 2: {
      const t = data.shipmentType
      if (!t) return null
      if (t === 'LCL' && data.cbm && data.weightKg) return `LCL · ${data.cbm} CBM · ${data.weightKg} kg`
      if (t === 'AIR' && data.chargeableKg) return `Aéreo · ${data.chargeableKg} kg`
      if (t?.startsWith('FCL') && data.containerQty) return `${t} × ${data.containerQty}`
      return t
    }
    case 3:
      if (data.commodity && data.cargoValueUSD) return `${data.commodity} · USD $${Number(data.cargoValueUSD).toLocaleString('en-US')}`
      return null
    case 4: {
      const extras: string[] = []
      if (data.includeInsurance) extras.push('Seguro')
      if (data.includeLastMile) extras.push(`Última milla ${data.lastMileRegion || ''}`)
      if (data.includeCustoms) extras.push('Aduana')
      return extras.length ? extras.join(' · ') : null
    }
    default:
      return null
  }
}

export default function CotizarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { step, setStep, data, reset } = useQuoteWizard()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/cotizar')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1B2A6B] border-t-[#F47920] rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const currentStep = step
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 5

  function handleNext() {
    if (currentStep < 5) {
      setStep((currentStep + 1) as StepNum)
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      setStep((currentStep - 1) as StepNum)
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1: return <Step1Route />
      case 2: return <Step2Cargo />
      case 3: return <Step3Commodity />
      case 4: return <Step4Services />
      case 5: return <Step5Result />
      default: return null
    }
  }

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100
  const dataAny = data as Record<string, any>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Mobile: horizontal stepper at top */}
      <div className="lg:hidden mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Paso {currentStep} de {STEPS.length}</p>
            <p className="text-sm font-semibold text-[#1B2A6B]">{STEPS[currentStep - 1].label}</p>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#F47920] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* LEFT: Vertical stepper sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#F47920] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-blue-200">IMC Cargo</p>
                  <p className="font-semibold">Cotizador</p>
                </div>
              </div>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                Completa los pasos para obtener tu cotización de flete internacional.
              </p>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#F47920] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-blue-200 mt-2">Paso {currentStep} de {STEPS.length}</p>
            </div>

            {/* Vertical stepper */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2">
              {STEPS.map((s, idx) => {
                const isCompleted = s.number < currentStep
                const isActive = s.number === currentStep
                const canJump = isCompleted || (s.number <= currentStep)
                const summary = summaryForStep(s.number, dataAny)

                return (
                  <button
                    key={s.number}
                    onClick={() => canJump && setStep(s.number)}
                    disabled={!canJump}
                    className={`relative w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      isActive
                        ? 'bg-[#F47920]/10 ring-1 ring-[#F47920]/30'
                        : canJump
                        ? 'hover:bg-slate-50 cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    {/* Connector line */}
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`absolute left-[27px] top-12 w-0.5 h-[calc(100%-12px)] ${
                          isCompleted ? 'bg-[#1B2A6B]' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Number/check */}
                    <div
                      className={`relative z-10 shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#1B2A6B] text-white'
                          : isActive
                          ? 'bg-[#F47920] text-white ring-4 ring-[#F47920]/20'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.number
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <p className={`text-sm font-semibold ${isActive ? 'text-[#F47920]' : isCompleted ? 'text-[#1B2A6B]' : 'text-slate-600'}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                        {s.description}
                      </p>
                      {summary && !isActive && (
                        <p className={`text-xs mt-1.5 leading-tight ${isCompleted ? 'text-[#1B2A6B] font-medium' : 'text-slate-500'} truncate`}>
                          {summary}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Live summary card */}
            {(dataAny.originPort || dataAny.shipmentType || dataAny.commodity) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Resumen</p>
                <dl className="space-y-2 text-xs">
                  {dataAny.originPort && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Origen</dt>
                      <dd className="text-slate-900 font-medium text-right">{dataAny.originPort}</dd>
                    </div>
                  )}
                  {dataAny.destPort && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Destino</dt>
                      <dd className="text-slate-900 font-medium text-right">{dataAny.destPort}</dd>
                    </div>
                  )}
                  {dataAny.incoterm && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Incoterm</dt>
                      <dd className="text-slate-900 font-medium">{dataAny.incoterm}</dd>
                    </div>
                  )}
                  {dataAny.shipmentType && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Modalidad</dt>
                      <dd className="text-slate-900 font-medium">{dataAny.shipmentType}</dd>
                    </div>
                  )}
                  {dataAny.cbm && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Volumen</dt>
                      <dd className="text-slate-900 font-medium">{dataAny.cbm} CBM</dd>
                    </div>
                  )}
                  {dataAny.weightKg && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Peso</dt>
                      <dd className="text-slate-900 font-medium">{dataAny.weightKg} kg</dd>
                    </div>
                  )}
                  {dataAny.cargoValueUSD && (
                    <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                      <dt className="text-slate-500">Valor mercancía</dt>
                      <dd className="text-[#F47920] font-bold">USD ${Number(dataAny.cargoValueUSD).toLocaleString('en-US')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Reset link */}
            <button
              onClick={() => { if (confirm('¿Reiniciar la cotización? Perderás los datos ingresados.')) reset() }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2"
            >
              Reiniciar cotización
            </button>
          </div>
        </aside>

        {/* RIGHT: Form content */}
        <main>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-5">
            {/* Step header (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{STEPS[currentStep - 1].icon}</span>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Paso {currentStep}</p>
                  <h1 className="text-xl font-bold text-[#1B2A6B]">{STEPS[currentStep - 1].label}</h1>
                </div>
              </div>
              {isLastStep && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Listo
                </span>
              )}
            </div>

            {renderStep()}
          </div>

          {/* Navigation */}
          {!isLastStep && (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isFirstStep
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-[#1B2A6B] hover:bg-[#1B2A6B]/5 border border-[#1B2A6B]/20 hover:border-[#1B2A6B]/40 bg-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>

              <button
                onClick={handleNext}
                disabled={!canAdvance(currentStep, dataAny)}
                className={`inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  canAdvance(currentStep, dataAny)
                    ? 'bg-[#F47920] hover:bg-[#e06810] text-white shadow-lg shadow-[#F47920]/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentStep === 4 ? 'Calcular cotización' : 'Siguiente'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
