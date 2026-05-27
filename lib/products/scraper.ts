/**
 * Marketplace product scraper for Amazon and eBay.
 *
 * Strategy:
 * - Use realistic browser headers to avoid bot detection
 * - Prefer OpenGraph / JSON-LD structured data (most reliable)
 * - Fall back to site-specific selectors
 *
 * Returns normalized product data.
 */

export type ScrapedProduct = {
  marketplace: 'amazon' | 'ebay' | 'unknown'
  sourceId: string
  sourceUrl: string
  title: string
  description?: string
  brand?: string
  priceUSD?: number
  imageUrls: string[]
  specs: Record<string, string>
  rawHtml?: string
  raw: Record<string, any>
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Chromium";v="131", "Google Chrome";v="131"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
}

function detectMarketplace(url: string): 'amazon' | 'ebay' | 'unknown' {
  const u = url.toLowerCase()
  if (u.includes('amazon.')) return 'amazon'
  if (u.includes('ebay.')) return 'ebay'
  return 'unknown'
}

function extractAmazonId(url: string): string | null {
  // /dp/B0XXXXXX or /gp/product/B0XXXXXX
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  return m ? m[1] : null
}

function extractEbayId(url: string): string | null {
  // /itm/123456789012 or /itm/title/123456789012
  const m = url.match(/\/itm\/(?:[^/]+\/)?(\d{9,})/i)
  return m ? m[1] : null
}

// --- Generic helpers ---

function extractOpenGraph(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'))
  return m ? decodeEntities(m[1]) : null
}

function extractMetaName(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = html.match(re)
  return m ? decodeEntities(m[1]) : null
}

function extractJsonLd(html: string): any[] {
  const out: any[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim())
      out.push(parsed)
    } catch (e) {
      /* ignore */
    }
  }
  return out
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// --- Amazon scraper ---

function scrapeAmazon(html: string, url: string): Partial<ScrapedProduct> {
  const data: Partial<ScrapedProduct> = { marketplace: 'amazon', sourceUrl: url, imageUrls: [], specs: {} }
  const raw: Record<string, any> = {}

  // ----- TITLE -----
  let title = ''
  const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]*?)<\/span>/i)
  if (titleMatch) title = decodeEntities(titleMatch[1].trim())
  if (!title) title = extractOpenGraph(html, 'title') || ''
  data.title = title

  // ----- DESCRIPTION -----
  data.description = extractMetaName(html, 'description') || extractOpenGraph(html, 'description') || ''

  // ----- IMAGES -----
  // 1) og:image (always present)
  const ogImage = extractOpenGraph(html, 'image')
  if (ogImage) data.imageUrls!.push(ogImage)

  // 2) landingImage with data-a-dynamic-image (modern Amazon main image carousel)
  const dynImgMatches = html.matchAll(/data-a-dynamic-image=["']\{([^"']+)["']/gi)
  for (const m of dynImgMatches) {
    try {
      // The attribute value is JSON-like: {"https://..jpg":[width,height], ...}
      const decoded = m[1].replace(/&quot;/g, '"').replace(/&#34;/g, '"')
      const json = '{' + decoded + '}'
      const obj = JSON.parse(json)
      for (const imgUrl of Object.keys(obj)) {
        if (!data.imageUrls!.includes(imgUrl)) data.imageUrls!.push(imgUrl)
      }
    } catch {}
  }

  // 3) imageBlock JSON ('colorImages' variant)
  const imgScriptMatch = html.match(/'colorImages':\s*\{\s*'initial':\s*(\[[\s\S]*?\])\s*\}/)
  if (imgScriptMatch) {
    try {
      const jsLike = imgScriptMatch[1].replace(/'/g, '"')
      const arr = JSON.parse(jsLike)
      arr.forEach((img: any) => {
        if (img.hiRes && !data.imageUrls!.includes(img.hiRes)) data.imageUrls!.push(img.hiRes)
        else if (img.large && !data.imageUrls!.includes(img.large)) data.imageUrls!.push(img.large)
      })
    } catch {}
  }

  // 4) landingImage element src as fallback
  if (data.imageUrls!.length === 0) {
    const landingImg = html.match(/id="landingImage"[^>]*\s+src="([^"]+)"/i)
    if (landingImg) data.imageUrls!.push(landingImg[1])
  }

  // 5) Final fallback: any *.media-amazon.com image inside main #imageBlock area
  if (data.imageUrls!.length === 0) {
    const re = /https?:\/\/[a-z0-9.-]*media-amazon\.com\/images\/I\/[\w-]+\._[A-Z0-9_]+_\.(?:jpg|png|jpeg)/gi
    const all = html.match(re) || []
    all.slice(0, 4).forEach((u) => { if (!data.imageUrls!.includes(u)) data.imageUrls!.push(u) })
  }

  // ----- PRICE -----
  const priceCandidates: Array<{ pattern: RegExp; label: string }> = [
    // 1) Modern accessibility a-offscreen (most reliable)
    { pattern: /<span[^>]+class="[^"]*a-offscreen[^"]*"[^>]*>\s*\$\s*([\d,]+\.?\d*)\s*</i, label: 'a-offscreen' },
    // 2) Apex price display data
    { pattern: /"displayPrice"\s*:\s*"\$\s*([\d,]+\.?\d*)"/i, label: 'displayPrice' },
    // 3) priceToPay JSON-LD
    { pattern: /"priceToPay"[^"]*"[\s\S]*?"amount":\s*"?([\d.]+)"?/i, label: 'priceToPay' },
    // 4) a-price-whole + fraction (legacy)
    { pattern: /<span[^>]+class="a-price-whole"[^>]*>([\d,]+)/i, label: 'a-price-whole' },
    // 5) Hidden priceblock_ourprice (old)
    { pattern: /<span[^>]+id="priceblock_ourprice"[^>]*>\s*\$?([\d,]+\.?\d*)/i, label: 'priceblock_ourprice' },
    // 6) Apex desktop block
    { pattern: /<span[^>]+id="apex_desktop"[^>]*>[\s\S]*?\$\s*([\d,]+\.?\d*)/i, label: 'apex_desktop' },
    // 7) Buybox saving JSON
    { pattern: /"buyingOptionType"[\s\S]{0,300}?"price"[\s\S]{0,100}?"amount":\s*([\d.]+)/i, label: 'buyingOption' },
    // 8) Open Graph price (rare on Amazon but try)
    { pattern: /<meta[^>]+property="og:price:amount"[^>]+content="([\d.]+)"/i, label: 'og:price' },
    // 9) JSON-LD Product offers
    { pattern: /"@type"\s*:\s*"Product"[\s\S]*?"price"\s*:\s*"?([\d.]+)/i, label: 'json-ld' },
  ]

  raw.priceDebug = []
  for (const { pattern, label } of priceCandidates) {
    const m = html.match(pattern)
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''))
      raw.priceDebug.push({ label, raw: m[1], parsed: num })
      if (num > 0 && num < 1_000_000 && !data.priceUSD) {
        data.priceUSD = num
      }
    }
  }

  // ----- BRAND -----
  const brandMatch = html.match(/<a[^>]+id="bylineInfo"[^>]*>([^<]+)<\/a>/i)
  if (brandMatch) {
    data.brand = decodeEntities(brandMatch[1].trim())
      .replace(/^(Visit the |Brand: )/, '')
      .replace(/ Store$/, '')
  }

  data.sourceId = extractAmazonId(url) || ''
  raw.imageCount = data.imageUrls!.length
  data.raw = raw

  return data
}

// --- eBay scraper ---

function scrapeEbay(html: string, url: string): Partial<ScrapedProduct> {
  const data: Partial<ScrapedProduct> = { marketplace: 'ebay', sourceUrl: url, imageUrls: [], specs: {} }
  const raw: Record<string, any> = {}

  // Title (eBay uses og:title)
  data.title = extractOpenGraph(html, 'title') || ''

  // Description
  data.description = extractMetaName(html, 'description') || extractOpenGraph(html, 'description') || ''

  // Image
  const ogImage = extractOpenGraph(html, 'image')
  if (ogImage) data.imageUrls!.push(ogImage)

  // JSON-LD
  const jsonLd = extractJsonLd(html)
  for (const block of jsonLd) {
    const items = Array.isArray(block) ? block : [block]
    for (const item of items) {
      if (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') {
        if (item.name && !data.title) data.title = decodeEntities(item.name)
        if (item.description) data.description = decodeEntities(item.description)
        if (item.brand?.name) data.brand = item.brand.name
        if (item.image) {
          const imgs = Array.isArray(item.image) ? item.image : [item.image]
          imgs.forEach((u: string) => { if (!data.imageUrls!.includes(u)) data.imageUrls!.push(u) })
        }
        // Offers
        const offers = item.offers
        if (offers) {
          const offerList = Array.isArray(offers) ? offers : [offers]
          for (const o of offerList) {
            if (o.price && typeof o.price !== 'object') {
              const num = parseFloat(String(o.price).replace(/[^\d.]/g, ''))
              if (num > 0 && !data.priceUSD) data.priceUSD = num
            } else if (o.priceSpecification?.price) {
              const num = parseFloat(String(o.priceSpecification.price).replace(/[^\d.]/g, ''))
              if (num > 0 && !data.priceUSD) data.priceUSD = num
            }
          }
        }
      }
    }
  }

  // Fallback price from raw HTML
  if (!data.priceUSD) {
    const priceMatch = html.match(/<span[^>]*itemprop="price"[^>]*content="?([\d.]+)/i)
      || html.match(/"price":\s*"?\$?([\d.]+)/i)
      || html.match(/US\s*\$\s*([\d,]+\.?\d*)/i)
    if (priceMatch) {
      const num = parseFloat(priceMatch[1].replace(/,/g, ''))
      if (num > 0) data.priceUSD = num
    }
  }

  data.sourceId = extractEbayId(url) || ''
  data.raw = raw

  return data
}

// --- Main entry ---

export async function scrapeProductUrl(url: string): Promise<ScrapedProduct> {
  const marketplace = detectMarketplace(url)
  if (marketplace === 'unknown') {
    throw new Error('URL no soportada. Solo Amazon o eBay por ahora.')
  }

  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    // @ts-ignore Next.js fetch options
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Error al obtener producto (${res.status}). El marketplace puede estar bloqueando.`)
  }

  const html = await res.text()

  let result: Partial<ScrapedProduct>
  if (marketplace === 'amazon') result = scrapeAmazon(html, url)
  else result = scrapeEbay(html, url)

  if (!result.title || result.title.trim().length === 0) {
    throw new Error('No se pudo extraer el título del producto. El marketplace puede haber bloqueado el scraping.')
  }

  return {
    marketplace,
    sourceId: result.sourceId || '',
    sourceUrl: url,
    title: result.title!,
    description: result.description,
    brand: result.brand,
    priceUSD: result.priceUSD,
    imageUrls: result.imageUrls || [],
    specs: result.specs || {},
    raw: result.raw || {},
  } as ScrapedProduct
}

// --- Pricing utility ---

/**
 * Calculates final CLP price from USD product price.
 * Formula: (price + shipping) * margin_factor * usd_to_clp_rate
 *
 * Note: usdToClpRate is now obtained dynamically — see lib/exchange-rate.ts
 * Use that and pass the value here.
 */
export function calculateCLPPrice(opts: {
  priceUSD: number
  shippingUSD?: number
  marginFactor?: number
  usdToClpRate?: number
}): number {
  const price = opts.priceUSD || 0
  const shipping = opts.shippingUSD || 0
  const margin = opts.marginFactor || 1.30  // 30% markup default
  const rate = opts.usdToClpRate || 950
  return Math.round((price + shipping) * margin * rate)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
