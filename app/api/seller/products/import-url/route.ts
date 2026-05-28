// POST /api/seller/products/import-url
// Body: { url: string }
// Descarga la página, extrae datos del producto, crea un draft Product
// (available=false, sin categoría) + descarga hasta 3 imágenes.
// Devuelve { productId, slug, extracted, imagesUploaded, imagesFailed }
// para que el cliente redirija al editor.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { uniqueSlug } from '@/lib/slug'
import { extractProductFromUrl } from '@/lib/product-url-import'
import { fetchAndUploadImage } from '@/lib/product-images-fetch'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 min — incluye scraping + 3 imágenes

const bodySchema = z.object({
  url: z.string().trim().url('URL inválida'),
})

const MAX_IMAGES = 3

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id, isSeller: true },
    select: { id: true },
  })
  if (!company) {
    return NextResponse.json(
      { error: 'Empresa no encontrada' },
      { status: 404 }
    )
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.url?.[0] || 'Datos inválidos' },
      { status: 400 }
    )
  }

  // 1. EXTRAER datos de la página
  let extracted
  try {
    extracted = await extractProductFromUrl(parsed.data.url)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'No se pudo extraer información de esa URL' },
      { status: 400 }
    )
  }

  if (!extracted.title || extracted.title.length < 3) {
    return NextResponse.json(
      {
        error:
          'No pude detectar un título de producto. Verifica que la URL apunte a una página de producto, no a una lista.',
      },
      { status: 400 }
    )
  }

  // 2. CREAR draft product (sin categoría, oculto, para que el seller edite)
  const slug = await uniqueSlug(extracted.title, async (s) => {
    const dup = await prisma.product.findUnique({ where: { slug: s } })
    return !!dup
  })

  // Sanity-check: precio razonable para CLP (entre 1 y 100 millones)
  let priceCLP: number | null = extracted.priceCLP
  if (priceCLP !== null && (priceCLP < 1 || priceCLP > 100_000_000)) {
    priceCLP = null
  }

  const product = await prisma.product.create({
    data: {
      slug,
      companyId: company.id,
      categoryId: null, // el seller debe elegirla
      title: extracted.title,
      shortDescription: extracted.shortDescription || null,
      description: extracted.description || null,
      sku: extracted.sku || null,
      brand: extracted.brand || null,
      unit: 'unidad',
      moq: 1,
      stockStatus: 'DISPONIBLE',
      origin: 'CHILE',
      basePriceCLP: priceCLP,
      featured: false,
      available: false, // oculto hasta que el seller revise y publique
    },
    select: { id: true, slug: true },
  })

  // 3. DESCARGAR imágenes (max 3) en serie para no saturar
  let imagesUploaded = 0
  let imagesFailed = 0
  const imageErrors: string[] = []
  const imagesToTry = extracted.imageUrls.slice(0, MAX_IMAGES)

  for (let idx = 0; idx < imagesToTry.length; idx++) {
    const result = await fetchAndUploadImage(
      imagesToTry[idx],
      company.id,
      product.id,
      idx
    )
    if (result.ok) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: result.url,
          alt: extracted.title,
          isPrimary: imagesUploaded === 0,
          sortOrder: imagesUploaded,
        },
      })
      imagesUploaded++
    } else {
      imagesFailed++
      imageErrors.push(`Imagen ${idx + 1}: ${result.error}`)
    }
  }

  return NextResponse.json({
    productId: product.id,
    slug: product.slug,
    imagesUploaded,
    imagesFailed,
    imageErrors,
    extracted: {
      source: extracted.source,
      sourceHost: extracted.sourceHost,
      sourceUrl: extracted.sourceUrl,
      title: extracted.title,
      brand: extracted.brand,
      sku: extracted.sku,
      priceCLP: extracted.priceCLP,
      priceCurrency: extracted.priceCurrency,
    },
    // Campos que el seller AÚN debe completar
    needsAttention: {
      category: true,
      moq: true,
      unit: true,
      leadTime: true,
      origin: true,
      pricing: priceCLP === null,
    },
  })
}
