// lib/product-bulk.ts — definición de columnas + parseo + validación
// para el import masivo de productos vía CSV o Excel.
//
// Soporta:
//   • CSV (UTF-8, separador coma)
//   • XLSX (Excel 2007+)
//   • Columnas opcionales imagen_1/2/3 con URLs públicas (se descargan al importar)
//   • Modo UPSERT por SKU (la lógica vive en el endpoint, acá solo el contrato)

import { z } from 'zod'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/** Columnas del CSV en orden. Estas son las cabeceras de la plantilla. */
export const BULK_COLUMNS = [
  'titulo',
  'categoria_slug',
  'descripcion_corta',
  'descripcion',
  'sku',
  'marca',
  'unidad',
  'moq',
  'lead_time_dias',
  'stock_status',
  'origen',
  'precio_neto_clp',
  'destacado',
  'visible',
  'imagen_1',
  'imagen_2',
  'imagen_3',
] as const

export type BulkColumn = (typeof BULK_COLUMNS)[number]

export const STOCK_VALUES = ['DISPONIBLE', 'A_PEDIDO', 'AGOTADO'] as const
export const ORIGIN_VALUES = [
  'CHILE',
  'CHINA',
  'USA',
  'EUROPA',
  'LATAM',
  'OTRO',
] as const

// URL pública o vacío. Acepta http(s).
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\/.+\..+/i.test(v),
    'URL inválida (debe empezar con http:// o https://)'
  )
  .optional()
  .or(z.literal(''))

/** Schema de UNA fila después de normalizada (post-parse). */
export const bulkRowSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  categoria_slug: z.string().min(1, 'Categoría requerida'),
  descripcion_corta: z
    .string()
    .max(280, 'Máximo 280 caracteres')
    .optional()
    .or(z.literal('')),
  descripcion: z
    .string()
    .max(5000, 'Máximo 5000 caracteres')
    .optional()
    .or(z.literal('')),
  sku: z.string().max(80).optional().or(z.literal('')),
  marca: z.string().max(80).optional().or(z.literal('')),
  unidad: z.string().max(40).default('unidad'),
  moq: z.coerce.number().int().min(1).default(1),
  lead_time_dias: z
    .coerce.number()
    .int()
    .min(0)
    .max(365)
    .optional()
    .nullable(),
  stock_status: z
    .enum(STOCK_VALUES)
    .default('DISPONIBLE'),
  origen: z.enum(ORIGIN_VALUES).default('CHILE'),
  precio_neto_clp: z.coerce.number().min(0).optional().nullable(),
  destacado: z.coerce
    .number()
    .transform((v) => v === 1)
    .default(0),
  visible: z.coerce
    .number()
    .transform((v) => v !== 0)
    .default(1),
  imagen_1: optionalUrl,
  imagen_2: optionalUrl,
  imagen_3: optionalUrl,
})

export type BulkRow = z.infer<typeof bulkRowSchema>

/**
 * Normaliza una fila cruda parseada del CSV (todas strings) a tipos
 * correctos antes de validar con Zod.
 */
export function normalizeRow(raw: Record<string, any>): Record<string, any> {
  const s = (v: any) => (v === undefined || v === null ? '' : String(v).trim())
  return {
    titulo: s(raw.titulo),
    categoria_slug: s(raw.categoria_slug).toLowerCase(),
    descripcion_corta: s(raw.descripcion_corta),
    descripcion: s(raw.descripcion),
    sku: s(raw.sku),
    marca: s(raw.marca),
    unidad: s(raw.unidad) || 'unidad',
    moq: s(raw.moq) || 1,
    lead_time_dias: s(raw.lead_time_dias) || null,
    stock_status: s(raw.stock_status).toUpperCase().replace(/\s+/g, '_') || 'DISPONIBLE',
    origen: s(raw.origen).toUpperCase() || 'CHILE',
    precio_neto_clp: s(raw.precio_neto_clp) || null,
    destacado: s(raw.destacado) || 0,
    visible: raw.visible !== undefined && s(raw.visible) !== '' ? s(raw.visible) : 1,
    imagen_1: s(raw.imagen_1),
    imagen_2: s(raw.imagen_2),
    imagen_3: s(raw.imagen_3),
  }
}

/** Detecta si un File es Excel por nombre o tipo MIME. */
export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return true
  if (
    file.type === 'application/vnd.ms-excel' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return true
  return false
}

/**
 * Parsea un File (CSV o XLSX) y devuelve `{ rows, errors }`.
 * Las filas son objetos con las claves normalizadas a minúsculas.
 */
export async function parseBulkFile(file: File): Promise<{
  rows: Record<string, string>[]
  errors: string[]
}> {
  if (isExcelFile(file)) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return { rows: [], errors: ['El Excel no tiene hojas'] }
    const sheet = wb.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
      raw: false,
    })
    // Normalizar cabeceras a minúsculas trim
    const rows = json.map((r) => {
      const out: Record<string, string> = {}
      for (const k of Object.keys(r)) {
        out[k.trim().toLowerCase()] = String(r[k] ?? '').trim()
      }
      return out
    })
    return { rows, errors: [] }
  }

  // CSV
  const text = (await file.text()).replace(/^﻿/, '')
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  return {
    rows: parsed.data,
    errors: parsed.errors.map((e) => e.message),
  }
}

/** CSV de la plantilla con ejemplos. */
export function buildTemplateCSV(): string {
  const header = BULK_COLUMNS.join(',')
  // Filas de ejemplo. Las URLs son ilustrativas; el seller las cambia por las suyas.
  const sample1 =
    'Soda cáustica granulada 99%,quimicos,Soda cáustica grado industrial en sacos de 25kg,"Producto industrial para tratamiento de aguas e industria química. Pureza 99%, presentación granulada.",SC-99-25K,Solvay,saco,10,7,DISPONIBLE,CHILE,42500,1,1,,,'
  const sample2 =
    'Cemento Portland Tipo 1 — 25kg,construccion,Cemento gris para construcción uso general,"Cemento Portland Tipo 1 de alta calidad. Apto para hormigones estructurales, morteros y obras menores.",CMT-PT1-25,Polpaico,saco,50,3,DISPONIBLE,CHILE,4200,0,1,,,'
  return [header, sample1, sample2].join('\n')
}

/** Construye un CSV a partir de productos existentes (para exportar el catálogo). */
export function buildCatalogCSV(
  products: Array<{
    title: string
    categorySlug: string | null
    shortDescription: string | null
    description: string | null
    sku: string | null
    brand: string | null
    unit: string
    moq: number
    leadTimeDays: number | null
    stockStatus: string
    origin: string
    basePriceCLP: number | null
    featured: boolean
    available: boolean
    imageUrls: string[]
  }>
): string {
  const header = BULK_COLUMNS.join(',')
  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = products.map((p) => {
    const img = p.imageUrls.slice(0, 3)
    while (img.length < 3) img.push('')
    return [
      escape(p.title),
      escape(p.categorySlug ?? ''),
      escape(p.shortDescription ?? ''),
      escape(p.description ?? ''),
      escape(p.sku ?? ''),
      escape(p.brand ?? ''),
      escape(p.unit),
      escape(p.moq),
      escape(p.leadTimeDays ?? ''),
      escape(p.stockStatus),
      escape(p.origin),
      escape(p.basePriceCLP ?? ''),
      escape(p.featured ? 1 : 0),
      escape(p.available ? 1 : 0),
      escape(img[0]),
      escape(img[1]),
      escape(img[2]),
    ].join(',')
  })
  return [header, ...lines].join('\n')
}

/** Construye un CSV con las filas que fallaron (para descargar como reporte). */
export function buildErrorReportCSV(
  errors: Array<{ rowNumber: number; titulo?: string; error: string }>
): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const header = 'fila,titulo,error'
  const lines = errors.map(
    (e) => `${escape(e.rowNumber)},${escape(e.titulo ?? '')},${escape(e.error)}`
  )
  return [header, ...lines].join('\n')
}
