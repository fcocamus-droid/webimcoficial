// lib/phone-cl.ts — utilidades para teléfono chileno.
// Formato: +56 9 XXXX XXXX (móvil) o +56 X XXXX XXXX (fijo).

/** Deja sólo dígitos. */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Devuelve los 9 dígitos del número (sin +56) o '' si vacío.
 * Si el usuario pegó algo con +56, se lo quita.
 */
export function extractClNumber(raw: string): string {
  let d = digitsOnly(raw)
  if (d.startsWith('56')) d = d.slice(2)
  return d.slice(0, 9)
}

/**
 * Formatea un número chileno como `+56 9 1234 5678` o `+56 2 2345 6789`.
 * Si tiene menos de 9 dígitos, lo deja parcial.
 */
export function formatClPhone(raw: string): string {
  const d = extractClNumber(raw)
  if (!d) return ''
  if (d.length <= 1) return `+56 ${d}`
  if (d.length <= 5) return `+56 ${d[0]} ${d.slice(1)}`
  return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5, 9)}`
}

/** Valida que el teléfono chileno tenga exactamente 9 dígitos después de +56. */
export function isValidClPhone(raw: string): boolean {
  const d = extractClNumber(raw)
  return d.length === 9
}

/** Devuelve el teléfono normalizado para guardar: `+56XXXXXXXXX`. */
export function normalizeClPhone(raw: string): string {
  const d = extractClNumber(raw)
  if (d.length !== 9) return ''
  return `+56${d}`
}
