// lib/product-images-fetch.ts
// Descarga una imagen desde una URL pública, valida tamaño + tipo,
// la sube al bucket "products" de Supabase Storage y devuelve la URL pública.

import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TIMEOUT_MS = 15_000 // 15s por imagen

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export type FetchedImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Descarga la imagen de `sourceUrl` y la sube a `companyId/productId/...`.
 * Devuelve la URL pública nueva o un error legible.
 */
export async function fetchAndUploadImage(
  sourceUrl: string,
  companyId: string,
  productId: string,
  index: number
): Promise<FetchedImageResult> {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: 'URL no válida' }
  }

  // 1. Descargar con timeout
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(sourceUrl, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        // Algunos CDNs bloquean fetch sin UA
        'User-Agent':
          'Mozilla/5.0 (compatible; IMC-Industriales-Bulk-Import/1.0)',
        Accept: 'image/*',
      },
    })
  } catch (e: any) {
    clearTimeout(timeout)
    return {
      ok: false,
      error: e?.name === 'AbortError' ? 'Timeout al descargar imagen' : 'No se pudo descargar',
    }
  }
  clearTimeout(timeout)

  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status} al descargar imagen` }
  }

  // 2. Validar Content-Type
  const ct = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim()
  if (!ALLOWED_TYPES.includes(ct)) {
    return {
      ok: false,
      error: `Tipo no soportado (${ct || 'desconocido'}). Usa JPG/PNG/WEBP/GIF`,
    }
  }

  // 3. Validar tamaño
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength === 0) {
    return { ok: false, error: 'Imagen vacía' }
  }
  if (buf.byteLength > MAX_BYTES) {
    return { ok: false, error: `Imagen > 5MB (${(buf.byteLength / 1024 / 1024).toFixed(1)}MB)` }
  }

  // 4. Subir a Supabase Storage
  const ext = EXT_BY_TYPE[ct] || 'jpg'
  const filename = `bulk-${Date.now()}-${index}.${ext}`
  const path = `${companyId}/${productId}/${filename}`
  const { error: upErr } = await supabaseAdmin.storage
    .from('products')
    .upload(path, buf, {
      contentType: ct,
      cacheControl: '3600',
      upsert: false,
    })
  if (upErr) {
    console.error('[bulk image upload]', upErr)
    return { ok: false, error: 'No se pudo subir a storage' }
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('products').getPublicUrl(path)
  return { ok: true, url: publicUrl }
}
