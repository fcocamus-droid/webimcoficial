// POST /api/seller/products/bulk/preview
// Recibe FormData con file CSV. Parsea, normaliza, valida cada fila,
// devuelve el resultado para mostrar en pantalla antes de importar.

import { NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import {
  BULK_COLUMNS,
  bulkRowSchema,
  normalizeRow,
} from '@/lib/product-bulk'

export const runtime = 'nodejs'

const MAX_ROWS = 500

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0)
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Máximo 2MB' }, { status: 400 })

  const text = (await file.text()).replace(/^﻿/, '') // quitar BOM
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: `Error al parsear CSV: ${parsed.errors[0].message}`,
      },
      { status: 400 }
    )
  }

  const rows = parsed.data
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

  // Validar fila por fila
  type RowResult = {
    rowNumber: number
    ok: boolean
    data: any
    error?: string
    categoryName?: string
  }
  const results: RowResult[] = []

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
      results.push({
        rowNumber,
        ok: true,
        data: parsedRow.data,
        categoryName: cat.name,
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

  return NextResponse.json({
    total: results.length,
    validCount,
    invalidCount,
    rows: results,
    validCategories: categories.map((c) => ({ slug: c.slug, name: c.name })),
  })
}
