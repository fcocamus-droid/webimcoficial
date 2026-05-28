// lib/product-bulk.ts — definición de columnas + parseo + validación
// para el import masivo de productos vía CSV.

import { z } from 'zod'

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
})

export type BulkRow = z.infer<typeof bulkRowSchema>

/**
 * Normaliza una fila cruda parseada del CSV (todas strings) a tipos
 * correctos antes de validar con Zod.
 */
export function normalizeRow(raw: Record<string, string>): Record<string, any> {
  return {
    titulo: (raw.titulo || '').trim(),
    categoria_slug: (raw.categoria_slug || '').trim().toLowerCase(),
    descripcion_corta: (raw.descripcion_corta || '').trim(),
    descripcion: (raw.descripcion || '').trim(),
    sku: (raw.sku || '').trim(),
    marca: (raw.marca || '').trim(),
    unidad: (raw.unidad || 'unidad').trim() || 'unidad',
    moq: raw.moq ? raw.moq : 1,
    lead_time_dias: raw.lead_time_dias ? raw.lead_time_dias : null,
    stock_status: (raw.stock_status || 'DISPONIBLE')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_'),
    origen: (raw.origen || 'CHILE').trim().toUpperCase(),
    precio_neto_clp: raw.precio_neto_clp ? raw.precio_neto_clp : null,
    destacado: raw.destacado ? raw.destacado : 0,
    visible: raw.visible !== undefined && raw.visible !== '' ? raw.visible : 1,
  }
}

/** CSV de la plantilla con ejemplos. */
export function buildTemplateCSV(): string {
  const header = BULK_COLUMNS.join(',')
  // 2 filas de ejemplo
  const sample1 =
    'Soda cáustica granulada 99%,quimicos,Soda cáustica grado industrial en sacos de 25kg,"Producto industrial para tratamiento de aguas e industria química. Pureza 99%, presentación granulada.",SC-99-25K,Solvay,saco,10,7,DISPONIBLE,CHILE,42500,1,1'
  const sample2 =
    'Cemento Portland Tipo 1 — 25kg,construccion,Cemento gris para construcción uso general,"Cemento Portland Tipo 1 de alta calidad. Apto para hormigones estructurales, morteros y obras menores.",CMT-PT1-25,Polpaico,saco,50,3,DISPONIBLE,CHILE,4200,0,1'
  return [header, sample1, sample2].join('\n')
}
