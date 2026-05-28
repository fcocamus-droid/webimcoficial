// POST /api/seller/products/bulk/import
// Recibe el mismo CSV que el preview. Crea los productos válidos.
// Devuelve el conteo de creados y los errores que no se pudieron crear.

import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { bulkRowSchema, normalizeRow } from '@/lib/product-bulk'
import { uniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const maxDuration = 60 // segundos

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
  if (!company)
    return NextResponse.json(
      { error: 'Empresa no encontrada' },
      { status: 404 }
    )

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0 || file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Tamaño inválido' }, { status: 400 })

  const text = (await file.text()).replace(/^﻿/, '')
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  const rows = parsed.data
  if (rows.length === 0 || rows.length > MAX_ROWS)
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  })
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]))

  let created = 0
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

      const slug = await uniqueSlug(parsedRow.data.titulo, async (s) => {
        const dup = await prisma.product.findUnique({ where: { slug: s } })
        return !!dup
      })

      await prisma.product.create({
        data: {
          slug,
          companyId: company.id,
          categoryId,
          title: parsedRow.data.titulo,
          shortDescription: parsedRow.data.descripcion_corta || null,
          description: parsedRow.data.descripcion || null,
          sku: parsedRow.data.sku || null,
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
      created++
    } catch (e: any) {
      errors.push({
        rowNumber,
        error: e?.message || 'Error inesperado',
      })
    }
  }

  return NextResponse.json({ created, errors })
}
