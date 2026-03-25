'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardState, QuoteInput } from '@/types'

interface QuoteWizardStore extends WizardState {
  setStep: (step: WizardState['step']) => void
  updateData: (data: Partial<QuoteInput>) => void
  reset: () => void
}

const initialState: WizardState = {
  step: 1,
  data: {},
  result: undefined,
}

export const useQuoteWizard = create<QuoteWizardStore>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      updateData: (data) =>
        set((state) => ({ data: { ...state.data, ...data } })),
      reset: () => set(initialState),
    }),
    {
      name: 'imc-quote-wizard',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
