// lib/product-url-import.ts
// Descarga una página y extrae los datos del producto. Estrategia:
//   1. JSON-LD con @type: Product   (~80% de los e-commerce: Sodimac, Easy,
//      Mercado Libre, AliExpress, Shopify, WooCommerce)
//   2. Open Graph + product:* meta tags
//   3. Microdata schema.org/Product
//   4. Fallback: <title>, meta description, primer <h1>, og:image, primer
//      <img> grande
//
// Devuelve un objeto consistente listo para crear un Product en BD.

import * as cheerio from 'cheerio'

const FETCH_TIMEOUT_MS = 20_000
const MAX_HTML_BYTES = 5 * 1024 * 1024 // 5MB

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export type ExtractedProduct = {
  source: 'json-ld' | 'opengraph' | 'microdata' | 'fallback' | 'mixed'
  title: string
  brand: string | null
  sku: string | null
  shortDescription: string | null
  description: string | null
  priceCLP: number | null
  priceCurrency: string | null // CLP, USD, etc.
  imageUrls: string[]
  sourceUrl: string
  sourceHost: string
}

// ──────────────────────────────────────────────────────────────────
// SSRF: rechaza hosts privados / loopback. No es perfecto sin DNS
// lookup, pero filtra los ataques más obvios.
// ──────────────────────────────────────────────────────────────────
export function isUrlSafe(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'URL inválida' }
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, reason: 'Solo se aceptan URLs http o https' }
  }
  const host = url.hostname.toLowerCase()
  // Loopback / link-local / metadata
  const blocked = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254', // AWS / GCP metadata
    'metadata.google.internal',
  ]
  if (blocked.includes(host)) return { ok: false, reason: 'Host no permitido' }
  // Rangos privados IPv4 (rudimentario)
  if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    return { ok: false, reason: 'IP privada no permitida' }
  }
  return { ok: true, url }
}

// ──────────────────────────────────────────────────────────────────
// Descarga la página con timeout, max-size, content-type validation.
// ──────────────────────────────────────────────────────────────────
async function fetchHTML(url: URL): Promise<string> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url.toString(), {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      },
    })
  } catch (e: any) {
    clearTimeout(timeout)
    if (e?.name === 'AbortError') throw new Error('Timeout: el sitio no respondió en 20s')
    throw new Error('No se pudo conectar al sitio')
  }
  clearTimeout(timeout)

  if (!res.ok) {
    throw new Error(`El sitio respondió ${res.status} ${res.statusText}`)
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes('html')) {
    throw new Error(`No es una página HTML (${ct || 'desconocido'})`)
  }
  // Lectura con tope de bytes para evitar bombas
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_HTML_BYTES) {
    throw new Error('La página pesa más de 5MB')
  }
  // Detectar encoding: usar el del header si dice charset, sino utf-8
  const charsetMatch = ct.match(/charset=([\w-]+)/)
  const encoding = charsetMatch ? charsetMatch[1] : 'utf-8'
  try {
    return new TextDecoder(encoding as any, { fatal: false }).decode(buf)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(buf)
  }
}

// ──────────────────────────────────────────────────────────────────
// Resuelve URLs relativas a absolutas usando la URL base
// ──────────────────────────────────────────────────────────────────
function absoluteUrl(maybe: string | undefined | null, base: URL): string | null {
  if (!maybe) return null
  const trimmed = String(maybe).trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed, base).toString()
  } catch {
    return null
  }
}

function parsePrice(raw: any): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null
  // String: "$ 42.500", "42500", "42500.00", "USD 12.99"
  const s = String(raw).replace(/[^\d.,-]/g, '').trim()
  if (!s) return null
  // Si tiene punto Y coma, asumir formato es-CL: punto = miles, coma = decimal
  let n: number
  if (s.includes('.') && s.includes(',')) {
    n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  } else if (s.includes(',') && !s.includes('.')) {
    // Coma sola → asumir decimal si hay 1-2 dígitos después, sino miles
    const parts = s.split(',')
    n = parts[1] && parts[1].length <= 2 ? parseFloat(s.replace(',', '.')) : parseFloat(s.replace(/,/g, ''))
  } else {
    n = parseFloat(s.replace(/,/g, ''))
  }
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

// ──────────────────────────────────────────────────────────────────
// Strip HTML tags + collapse whitespace
// ──────────────────────────────────────────────────────────────────
function clean(text: string | undefined | null, maxLen?: number): string | null {
  if (!text) return null
  const $ = cheerio.load(`<div>${String(text)}</div>`)
  let s = $('div').text().replace(/\s+/g, ' ').trim()
  if (!s) return null
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…'
  return s
}

function firstSentence(text: string | null, maxLen = 280): string | null {
  if (!text) return null
  // Cortar en el primer ". " o "\n"
  const idx = text.search(/[.!?](\s|$)/)
  let s = idx > 30 ? text.slice(0, idx + 1) : text
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…'
  return s
}

// ──────────────────────────────────────────────────────────────────
// EXTRACTOR: JSON-LD con @type Product
// ──────────────────────────────────────────────────────────────────
type LDExtract = Partial<ExtractedProduct>

function flattenLD(node: any, out: any[] = []): any[] {
  if (!node) return out
  if (Array.isArray(node)) {
    for (const n of node) flattenLD(n, out)
    return out
  }
  if (node['@graph']) flattenLD(node['@graph'], out)
  out.push(node)
  return out
}

function extractFromJsonLD($: cheerio.CheerioAPI, base: URL): LDExtract | null {
  const blocks: any[] = []
  $('script[type="application/ld+json"]').each((_i, el) => {
    const txt = $(el).text()
    if (!txt) return
    try {
      const parsed = JSON.parse(txt)
      flattenLD(parsed, blocks)
    } catch {
      // ignore malformed
    }
  })
  const product = blocks.find((b) => {
    const t = b?.['@type']
    if (!t) return false
    if (Array.isArray(t)) return t.some((x) => String(x).toLowerCase() === 'product')
    return String(t).toLowerCase() === 'product'
  })
  if (!product) return null

  const offers = Array.isArray(product.offers)
    ? product.offers[0]
    : product.offers
  const lowPrice = offers?.lowPrice ?? offers?.price ?? offers?.priceSpecification?.price

  const brandName =
    typeof product.brand === 'string'
      ? product.brand
      : product.brand?.name || null

  const rawImages = product.image
  let imgs: string[] = []
  if (Array.isArray(rawImages)) {
    imgs = rawImages
      .map((i) => (typeof i === 'string' ? i : i?.url))
      .filter(Boolean)
  } else if (typeof rawImages === 'string') {
    imgs = [rawImages]
  } else if (rawImages?.url) {
    imgs = Array.isArray(rawImages.url) ? rawImages.url : [rawImages.url]
  }
  const imageUrls = imgs
    .map((u) => absoluteUrl(u, base))
    .filter((u): u is string => !!u)

  return {
    title: clean(product.name, 200) ?? '',
    brand: clean(brandName, 80),
    sku: clean(product.sku || product.mpn, 80),
    description: clean(product.description, 5000),
    priceCLP: parsePrice(lowPrice),
    priceCurrency: offers?.priceCurrency || null,
    imageUrls,
  }
}

// ──────────────────────────────────────────────────────────────────
// EXTRACTOR: Open Graph + product:* meta
// ──────────────────────────────────────────────────────────────────
function extractFromOG($: cheerio.CheerioAPI, base: URL): LDExtract {
  const meta = (sel: string): string | null =>
    $(sel).attr('content')?.trim() || null
  const title = meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]')
  const description = meta('meta[property="og:description"]') || meta('meta[name="description"]') || meta('meta[name="twitter:description"]')
  const image = meta('meta[property="og:image"]') || meta('meta[property="og:image:url"]') || meta('meta[name="twitter:image"]')
  const price =
    meta('meta[property="product:price:amount"]') ||
    meta('meta[property="og:price:amount"]') ||
    meta('meta[itemprop="price"]')
  const currency =
    meta('meta[property="product:price:currency"]') ||
    meta('meta[property="og:price:currency"]')
  const brand =
    meta('meta[property="product:brand"]') ||
    meta('meta[property="og:brand"]')
  const sku = meta('meta[property="product:retailer_item_id"]')

  return {
    title: clean(title, 200) ?? '',
    brand: clean(brand, 80),
    sku: clean(sku, 80),
    description: clean(description, 5000),
    priceCLP: parsePrice(price),
    priceCurrency: currency,
    imageUrls: image ? [absoluteUrl(image, base)].filter((u): u is string => !!u) : [],
  }
}

// ──────────────────────────────────────────────────────────────────
// EXTRACTOR: Microdata schema.org/Product
// ──────────────────────────────────────────────────────────────────
function extractFromMicrodata($: cheerio.CheerioAPI, base: URL): LDExtract | null {
  const scope = $('[itemtype*="schema.org/Product"]').first()
  if (!scope.length) return null
  const grab = (prop: string): string | null => {
    const el = scope.find(`[itemprop="${prop}"]`).first()
    if (!el.length) return null
    return (
      el.attr('content') ||
      el.attr('href') ||
      el.attr('src') ||
      el.text().trim() ||
      null
    )
  }
  const price =
    scope.find('[itemprop="price"]').attr('content') ||
    scope.find('[itemprop="price"]').text() ||
    null

  const imgs: string[] = []
  scope.find('[itemprop="image"]').each((_i, el) => {
    const url =
      $(el).attr('content') ||
      $(el).attr('href') ||
      $(el).attr('src') ||
      null
    const abs = absoluteUrl(url, base)
    if (abs) imgs.push(abs)
  })

  return {
    title: clean(grab('name'), 200) ?? '',
    brand: clean(grab('brand'), 80),
    sku: clean(grab('sku') || grab('mpn'), 80),
    description: clean(grab('description'), 5000),
    priceCLP: parsePrice(price),
    priceCurrency: grab('priceCurrency'),
    imageUrls: imgs,
  }
}

// ──────────────────────────────────────────────────────────────────
// EXTRACTOR: fallback genérico
// ──────────────────────────────────────────────────────────────────
function extractFallback($: cheerio.CheerioAPI, base: URL): LDExtract {
  const title =
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    ''
  const description =
    $('meta[name="description"]').attr('content') ||
    $('article p').first().text() ||
    $('main p').first().text() ||
    $('p').first().text() ||
    null
  const imageCandidates: string[] = []
  // OG image siempre primero si existe
  const og = $('meta[property="og:image"]').attr('content')
  if (og) {
    const abs = absoluteUrl(og, base)
    if (abs) imageCandidates.push(abs)
  }
  // Imágenes grandes dentro de main/article
  $('main img, article img, [class*="product"] img, [id*="product"] img').each(
    (_i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src')
      const abs = absoluteUrl(src, base)
      if (abs && !imageCandidates.includes(abs)) imageCandidates.push(abs)
    }
  )

  return {
    title: clean(title, 200) ?? '',
    brand: null,
    sku: null,
    description: clean(description, 5000),
    priceCLP: null,
    priceCurrency: null,
    imageUrls: imageCandidates,
  }
}

// ──────────────────────────────────────────────────────────────────
// Función pública: extrae todo lo que pueda de la URL
// ──────────────────────────────────────────────────────────────────
export async function extractProductFromUrl(
  rawUrl: string
): Promise<ExtractedProduct> {
  const safe = isUrlSafe(rawUrl)
  if (!safe.ok) throw new Error(safe.reason)
  const html = await fetchHTML(safe.url)
  const $ = cheerio.load(html)

  const ld = extractFromJsonLD($, safe.url)
  const md = extractFromMicrodata($, safe.url)
  const og = extractFromOG($, safe.url)
  const fb = extractFallback($, safe.url)

  // Mergeamos en orden de confianza: ld > md > og > fallback
  // Para cada campo tomamos el primero que tenga valor.
  const pick = <K extends keyof LDExtract>(k: K): LDExtract[K] => {
    for (const src of [ld, md, og, fb]) {
      if (!src) continue
      const v = src[k]
      if (v !== null && v !== undefined && v !== '') return v
    }
    return undefined as any
  }

  // Imágenes: combinamos preservando orden de fuente y eliminando duplicados
  const imageUrls: string[] = []
  for (const src of [ld, md, og, fb]) {
    if (!src?.imageUrls) continue
    for (const u of src.imageUrls) {
      if (!imageUrls.includes(u)) imageUrls.push(u)
    }
  }

  // Determinar fuente principal para reporting
  let source: ExtractedProduct['source'] = 'fallback'
  if (ld) source = 'json-ld'
  else if (md) source = 'microdata'
  else if (og.title) source = 'opengraph'
  // Si combinamos fuentes (ej. ld + og para imagen extra), marcar mixed
  const sourcesUsed = [ld, md, og].filter(Boolean).length
  if (sourcesUsed > 1) source = 'mixed'

  const description = pick('description') ?? null
  const shortDescription = firstSentence(description, 280)

  // Precio: solo lo aceptamos como CLP si:
  //   - currency es CLP, o
  //   - no hay currency y el número es > 100 (asumimos CLP por contexto chileno)
  let priceCLP = pick('priceCLP') ?? null
  const priceCurrency = pick('priceCurrency') ?? null
  if (priceCLP && priceCurrency && priceCurrency.toUpperCase() !== 'CLP') {
    // No convertimos automáticamente — dejamos vacío para no engañar al seller
    priceCLP = null
  }

  return {
    source,
    title: pick('title') ?? '',
    brand: pick('brand') ?? null,
    sku: pick('sku') ?? null,
    shortDescription,
    description,
    priceCLP,
    priceCurrency,
    imageUrls: imageUrls.slice(0, 5),
    sourceUrl: safe.url.toString(),
    sourceHost: safe.url.hostname,
  }
}
