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

const STEPS = [
  { number: 1 as const, label: 'Ruta' },
  { number: 2 as const, label: 'Carga' },
  { number: 3 as const, label: 'Mercaderia' },
  { number: 4 as const, label: 'Servicios' },
  { number: 5 as const, label: 'Cotizacion' },
]

function StepIcon({ stepNum, current }: { stepNum: number; current: number }) {
  const isCompleted = stepNum < current
  const isActive = stepNum === current

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
        isCompleted
          ? 'bg-[#1B2A6B] text-white'
          : isActive
          ? 'bg-[#F47920] text-white ring-4 ring-[#F47920]/20'
          : 'bg-gray-200 text-gray-500'
      }`}
    >
      {isCompleted ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        stepNum
      )}
    </div>
  )
}

function canAdvance(step: number, data: Record<string, unknown>): boolean {
  switch (step) {
    case 1:
      return !!(data.incoterm && data.originPort && data.destPort)
    case 2: {
      const t = data.shipmentType as string | undefined
      if (!t) return false
      if (t === 'LCL') return !!(data.cbm && data.weightKg)
      if (t === 'AIR') return !!(data.chargeableKg)
      // FCL
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
      setStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5)
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5)
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <Step1Route />
      case 2:
        return <Step2Cargo />
      case 3:
        return <Step3Commodity />
      case 4:
        return <Step4Services />
      case 5:
        return <Step5Result />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A6B]">
          Cotizador de Flete Internacional
        </h1>
        <p className="text-gray-500 mt-1">
          Completa los pasos para obtener tu cotizacion
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          {/* Progress line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-[#1B2A6B] z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s) => (
            <div key={s.number} className="flex flex-col items-center relative z-10">
              <StepIcon stepNum={s.number} current={currentStep} />
              <span
                className={`mt-2 text-xs sm:text-sm font-medium ${
                  s.number === currentStep
                    ? 'text-[#F47920]'
                    : s.number < currentStep
                    ? 'text-[#1B2A6B]'
                    : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              isFirstStep
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-[#1B2A6B] hover:bg-[#1B2A6B]/5 border border-[#1B2A6B]/20 hover:border-[#1B2A6B]/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance(currentStep, data as Record<string, unknown>)}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
              canAdvance(currentStep, data as Record<string, unknown>)
                ? 'bg-[#F47920] hover:bg-[#e06810] text-white shadow-lg shadow-[#F47920]/25'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
