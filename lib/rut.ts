// lib/rut.ts — validación y normalización de RUT chileno

/**
 * Normaliza un RUT eliminando puntos y guiones, dejando solo dígitos
 * y el dígito verificador (puede ser 'K').
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Formatea un RUT con puntos y guion. Ej: 12.345.678-9
 */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut)
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withDots}-${dv}`
}

/**
 * Calcula el dígito verificador esperado para el cuerpo de un RUT.
 */
function computeDv(body: string): string {
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const res = 11 - (sum % 11)
  if (res === 11) return '0'
  if (res === 10) return 'K'
  return String(res)
}

/**
 * Valida un RUT chileno (módulo 11).
 */
export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut)
  if (clean.length < 2) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!/^\d+$/.test(body)) return false
  return computeDv(body) === dv
}
