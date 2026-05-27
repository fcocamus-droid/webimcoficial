// lib/slug.ts — utilidades para generar slugs URL-friendly
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // espacios a guiones
    .replace(/-+/g, '-') // guiones duplicados
    .slice(0, 80)
}

/**
 * Genera un slug único probando con sufijos -2, -3, etc. si ya existe.
 * exists() debe devolver true si el slug ya está tomado.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || 'item'
  let candidate = root
  let n = 2
  while (await exists(candidate)) {
    candidate = `${root}-${n}`
    n++
    if (n > 100) {
      candidate = `${root}-${Date.now().toString(36)}`
      break
    }
  }
  return candidate
}
