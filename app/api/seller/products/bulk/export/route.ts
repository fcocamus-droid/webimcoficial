// GET /api/seller/products/bulk/export
// Descarga el catálogo del vendedor como CSV con la misma estructura que
// la plantilla — para round-trip editing (descargar → editar en Excel → re-subir).

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { buildCatalogCSV } from '@/lib/product-bulk'

export const runtime = 'nodejs'

export async function GET() {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return new Response('Unauthorized', { status: guard.status })
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id, isSeller: true },
    select: { id: true },
  })
  if (!company) {
    return new Response('Empresa no encontrada', { status: 404 })
  }

  const products = await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      title: true,
      sku: true,
      brand: true,
      unit: true,
      moq: true,
      leadTimeDays: true,
      stockStatus: true,
      origin: true,
      basePriceCLP: true,
      featured: true,
      available: true,
      shortDescription: true,
      description: true,
      category: { select: { slug: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: { url: true },
        take: 3,
      },
    },
  })

  const csv =
    '﻿' +
    buildCatalogCSV(
      products.map((p) => ({
        title: p.title,
        categorySlug: p.category?.slug ?? null,
        shortDescription: p.shortDescription,
        description: p.description,
        sku: p.sku,
        brand: p.brand,
        unit: p.unit,
        moq: p.moq,
        leadTimeDays: p.leadTimeDays,
        stockStatus: p.stockStatus,
        origin: p.origin,
        basePriceCLP: p.basePriceCLP,
        featured: p.featured,
        available: p.available,
        imageUrls: p.images.map((i) => i.url),
      }))
    )

  const today = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mi-catalogo-imc-${today}.csv"`,
    },
  })
}
