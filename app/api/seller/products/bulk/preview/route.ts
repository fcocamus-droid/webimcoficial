// POST /api/seller/products/bulk/preview
// Recibe FormData con file CSV o XLSX. Parsea, normaliza, valida cada fila,
// devuelve el resultado para mostrar en pantalla antes de importar.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import {
  bulkRowSchema,
  normalizeRow,
  parseBulkFile,
} from '@/lib/product-bulk'

export const runtime = 'nodejs'

const MAX_ROWS = 500

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

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0)
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Máximo 2MB' }, { status: 400 })

  const { rows, errors: parseErrors } = await parseBulkFile(file)

  if (parseErrors.length > 0) {
    return NextResponse.json(
      {
        error: `Error al parsear archivo: ${parseErrors[0]}`,
      },
      { status: 400 }
    )
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'El archivo no contiene filas de datos' },
      { status: 400 }
    )
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ROWS} productos por import. Tu archivo tiene ${rows.length}.` },
      { status: 400 }
    )
  }

  // Validar que las cabeceras requeridas existen
  const headers = Object.keys(rows[0] ?? {})
  const missing = ['titulo', 'categoria_slug'].filter(
    (k) => !headers.includes(k)
  )
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Faltan columnas obligatorias: ${missing.join(', ')}. Descarga la plantilla otra vez.`,
      },
      { status: 400 }
    )
  }

  // Pre-cargar slugs válidos de categorías
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
  })
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))

  // Pre-cargar SKUs existentes del seller para detectar UPSERT vs CREATE
  const existingSkus = new Set(
    (
      await prisma.product.findMany({
        where: {
          companyId: company.id,
          sku: { not: null },
        },
        select: { sku: true },
      })
    ).map((p) => p.sku!)
  )

  // Validar fila por fila
  type RowResult = {
    rowNumber: number
    ok: boolean
    data: any
    error?: string
    categoryName?: string
    skuExists?: boolean
    imageCount?: number
  }
  const results: RowResult[] = []
  let totalImages = 0

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const rowNumber = i + 2 // +2 porque header es fila 1
    try {
      const normalized = normalizeRow(raw)
      const parsedRow = bulkRowSchema.safeParse(normalized)
      if (!parsedRow.success) {
        const fieldErrors = parsedRow.error.flatten().fieldErrors
        const firstError =
          Object.values(fieldErrors)[0]?.[0] ?? 'Datos inválidos'
        results.push({
          rowNumber,
          ok: false,
          data: normalized,
          error: firstError,
        })
        continue
      }
      // Validar categoría existe
      const cat = categoryBySlug.get(parsedRow.data.categoria_slug)
      if (!cat) {
        results.push({
          rowNumber,
          ok: false,
          data: normalized,
          error: `Categoría "${parsedRow.data.categoria_slug}" no existe. Ver lista en la plantilla.`,
        })
        continue
      }
      const images = [
        parsedRow.data.imagen_1,
        parsedRow.data.imagen_2,
        parsedRow.data.imagen_3,
      ].filter((u): u is string => !!u && u !== '')
      totalImages += images.length

      const sku = parsedRow.data.sku?.trim()
      const skuExists = !!sku && existingSkus.has(sku)

      results.push({
        rowNumber,
        ok: true,
        data: parsedRow.data,
        categoryName: cat.name,
        skuExists,
        imageCount: images.length,
      })
    } catch (e: any) {
      results.push({
        rowNumber,
        ok: false,
        data: raw,
        error: e?.message || 'Error inesperado',
      })
    }
  }

  const validCount = results.filter((r) => r.ok).length
  const invalidCount = results.length - validCount
  const upsertCount = results.filter((r) => r.ok && r.skuExists).length

  return NextResponse.json({
    total: results.length,
    validCount,
    invalidCount,
    upsertCount,
    totalImages,
    rows: results,
    validCategories: categories.map((c) => ({ slug: c.slug, name: c.name })),
  })
}
