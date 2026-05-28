// lib/iva.ts — utilidades para cálculo de IVA chileno (19%)

export const IVA_RATE = 0.19

export function withIva(netoCLP: number): number {
  return Math.round(netoCLP * (1 + IVA_RATE))
}

export function ivaAmount(netoCLP: number): number {
  return Math.round(netoCLP * IVA_RATE)
}

export function formatCLP(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}
