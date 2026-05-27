import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { scrapeProductUrl, calculateCLPPrice, slugify } from '@/lib/products/scraper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30  // allow longer scraping

const schema = z.object({
  url: z.string().url('URL inválida'),
  categorySlug: z.string().optional(),
  marginFactor: z.number().min(1).max(5).optional(),
  shippingUSD: z.number().min(0).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN' && role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }

    const { url, categorySlug, marginFactor, shippingUSD } = parsed.data

    // Check duplicates by source URL
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM products WHERE source_url = ${url} LIMIT 1
    `
    if (existing[0]) {
      return NextResponse.json({ error: 'Este producto ya está importado', productId: existing[0].id }, { status: 409 })
    }

    // Scrape
    const scraped = await scrapeProductUrl(url)

    // Resolve category
    let categoryId: string | null = null
    if (categorySlug) {
      const cat = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM product_categories WHERE slug = ${categorySlug} LIMIT 1
      `
      categoryId = cat[0]?.id || null
    }
    if (!categoryId) {
      // Default to 'otros'
      const cat = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM product_categories WHERE slug = 'otros' LIMIT 1
      `
      categoryId = cat[0]?.id || null
    }

    // Pricing
    const finalMargin = marginFactor || 1.30
    const finalShipping = shippingUSD || 0
    const priceCLP = scraped.priceUSD
      ? calculateCLPPrice({ priceUSD: scraped.priceUSD, shippingUSD: finalShipping, marginFactor: finalMargin })
      : null

    // Slug (ensure unique)
    let baseSlug = slugify(scraped.title)
    if (!baseSlug) baseSlug = `producto-${scraped.sourceId || Date.now()}`
    let finalSlug = baseSlug
    let counter = 1
    while (true) {
      const exists = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM products WHERE slug = ${finalSlug} LIMIT 1
      `
      if (!exists[0]) break
      counter++
      finalSlug = `${baseSlug}-${counter}`
      if (counter > 50) { finalSlug = `${baseSlug}-${Date.now()}`; break }
    }

    // Insert product
    const productRows = await prisma.$queryRaw<Array<{ id: string; slug: string }>>`
      INSERT INTO products (
        slug, title, description, source_url, source_marketplace, source_id, brand,
        category_id, price_usd, price_clp, shipping_cost_usd, margin_factor, raw_data
      ) VALUES (
        ${finalSlug},
        ${scraped.title.slice(0, 500)},
        ${scraped.description?.slice(0, 5000) || null},
        ${scraped.sourceUrl},
        ${scraped.marketplace},
        ${scraped.sourceId || null},
        ${scraped.brand || null},
        ${categoryId},
        ${scraped.priceUSD || null},
        ${priceCLP},
        ${finalShipping},
        ${finalMargin},
        ${JSON.stringify(scraped.raw)}::jsonb
      )
      RETURNING id, slug
    `

    const productId = productRows[0].id

    // Insert images
    if (scraped.imageUrls.length > 0) {
      const values = scraped.imageUrls.slice(0, 10).map((url, idx) =>
        `(gen_random_uuid()::text, '${productId}', '${url.replace(/'/g, "''")}', ${idx}, ${idx === 0})`
      ).join(',')
      await prisma.$executeRawUnsafe(
        `INSERT INTO product_images (id, product_id, url, sort_order, is_primary) VALUES ${values}`
      )
    }

    return NextResponse.json({
      ok: true,
      product: {
        id: productId,
        slug: finalSlug,
        title: scraped.title,
        priceUSD: scraped.priceUSD,
        priceCLP,
        marketplace: scraped.marketplace,
        imageCount: scraped.imageUrls.length,
      },
    })
  } catch (e: any) {
    console.error('Product import error:', e)
    return NextResponse.json({ error: e.message || 'Error al importar' }, { status: 500 })
  }
}
