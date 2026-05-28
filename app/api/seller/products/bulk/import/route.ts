// POST /api/seller/products/bulk/import
// Recibe el mismo CSV/XLSX que el preview. Crea o actualiza los productos
// válidos (según `mode`) y descarga las URLs de imágenes al storage.
// Devuelve el conteo de creados/actualizados y los errores.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import {
  bulkRowSchema,
  normalizeRow,
  parseBulkFile,
} from '@/lib/product-bulk'
import { uniqueSlug } from '@/lib/slug'
import { fetchAndUploadImage } from '@/lib/product-images-fetch'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — el download de imágenes puede tardar

const MAX_ROWS = 500

type ImportMode = 'create' | 'upsert'

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id, isSeller: true },
    select: { id: true },
  })
  if (!company)
    return NextResponse.json(
      { error: 'Empresa no encontrada' },
      { status: 404 }
    )

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const modeRaw = (form?.get('mode') ?? 'create').toString()
  const mode: ImportMode = modeRaw === 'upsert' ? 'upsert' : 'create'

  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0 || file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Tamaño inválido' }, { status: 400 })

  const { rows, errors: parseErrors } = await parseBulkFile(file)
  if (parseErrors.length > 0) {
    return NextResponse.json(
      { error: `Error al parsear archivo: ${parseErrors[0]}` },
      { status: 400 }
    )
  }
  if (rows.length === 0 || rows.length > MAX_ROWS)
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  })
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]))

  let created = 0
  let updated = 0
  let imagesUploaded = 0
  let imagesFailed = 0
  const errors: { rowNumber: number; titulo?: string; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const rowNumber = i + 2
    try {
      const normalized = normalizeRow(raw)
      const parsedRow = bulkRowSchema.safeParse(normalized)
      if (!parsedRow.success) {
        const fe = parsedRow.error.flatten().fieldErrors
        errors.push({
          rowNumber,
          titulo: normalized.titulo,
          error: Object.values(fe)[0]?.[0] ?? 'Datos inválidos',
        })
        continue
      }
      const categoryId = categoryBySlug.get(parsedRow.data.categoria_slug)
      if (!categoryId) {
        errors.push({
          rowNumber,
          titulo: parsedRow.data.titulo,
          error: `Categoría inválida: ${parsedRow.data.categoria_slug}`,
        })
        continue
      }

      const sku = parsedRow.data.sku?.trim() || null

      // ── UPSERT por SKU ────────────────────────────────────────
      let productId: string | null = null
      let wasUpdate = false

      if (mode === 'upsert' && sku) {
        const existing = await prisma.product.findFirst({
          where: { companyId: company.id, sku },
          select: { id: true },
        })
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              categoryId,
              title: parsedRow.data.titulo,
              shortDescription: parsedRow.data.descripcion_corta || null,
              description: parsedRow.data.descripcion || null,
              brand: parsedRow.data.marca || null,
              unit: parsedRow.data.unidad || 'unidad',
              moq: parsedRow.data.moq,
              leadTimeDays: parsedRow.data.lead_time_dias ?? null,
              stockStatus: parsedRow.data.stock_status,
              origin: parsedRow.data.origen,
              basePriceCLP: parsedRow.data.precio_neto_clp ?? null,
              featured: parsedRow.data.destacado,
              available: parsedRow.data.visible,
            },
          })
          productId = existing.id
          wasUpdate = true
          updated++
        }
      }

      // ── CREATE (si no hubo update) ────────────────────────────
      if (!productId) {
        const slug = await uniqueSlug(parsedRow.data.titulo, async (s) => {
          const dup = await prisma.product.findUnique({ where: { slug: s } })
          return !!dup
        })

        const newProd = await prisma.product.create({
          data: {
            slug,
            companyId: company.id,
            categoryId,
            title: parsedRow.data.titulo,
            shortDescription: parsedRow.data.descripcion_corta || null,
            description: parsedRow.data.descripcion || null,
            sku,
            brand: parsedRow.data.marca || null,
            unit: parsedRow.data.unidad || 'unidad',
            moq: parsedRow.data.moq,
            leadTimeDays: parsedRow.data.lead_time_dias ?? null,
            stockStatus: parsedRow.data.stock_status,
            origin: parsedRow.data.origen,
            basePriceCLP: parsedRow.data.precio_neto_clp ?? null,
            featured: parsedRow.data.destacado,
            available: parsedRow.data.visible,
          },
        })
        productId = newProd.id
        created++
      }

      // ── IMÁGENES desde URLs (sólo si productId está listo) ───
      const imageUrls = [
        parsedRow.data.imagen_1,
        parsedRow.data.imagen_2,
        parsedRow.data.imagen_3,
      ].filter((u): u is string => !!u && u !== '')

      if (imageUrls.length > 0 && productId) {
        // Si es update, ¿reemplazar imágenes? Política: solo añadir si no
        // tiene ninguna. Así el seller no pierde fotos al re-importar precios.
        const existingImgs = wasUpdate
          ? await prisma.productImage.count({ where: { productId } })
          : 0

        if (!wasUpdate || existingImgs === 0) {
          for (let idx = 0; idx < imageUrls.length; idx++) {
            const url = imageUrls[idx]
            const result = await fetchAndUploadImage(
              url,
              company.id,
              productId,
              idx
            )
            if (result.ok) {
              await prisma.productImage.create({
                data: {
                  productId,
                  url: result.url,
                  alt: parsedRow.data.titulo,
                  isPrimary: idx === 0 && existingImgs === 0,
                  sortOrder: existingImgs + idx,
                },
              })
              imagesUploaded++
            } else {
              imagesFailed++
              // No bloqueamos el producto por fallo de imagen, sólo lo anotamos.
              errors.push({
                rowNumber,
                titulo: parsedRow.data.titulo,
                error: `Imagen ${idx + 1} no se pudo descargar: ${result.error}`,
              })
            }
          }
        }
      }
    } catch (e: any) {
      errors.push({
        rowNumber,
        error: e?.message || 'Error inesperado',
      })
    }
  }

  return NextResponse.json({
    created,
    updated,
    imagesUploaded,
    imagesFailed,
    errors,
    mode,
  })
}
