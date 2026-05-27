// lib/product-schemas.ts — Zod schemas para productos
import { z } from 'zod'

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(''))

export const productCreateSchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(200),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  shortDescription: optionalText(280),
  description: optionalText(5000),
  sku: optionalText(80),
  brand: optionalText(80),
  unit: optionalText(40),
  moq: z.coerce.number().int().min(1).optional(),
  leadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  stockStatus: z
    .enum(['DISPONIBLE', 'A_PEDIDO', 'AGOTADO'])
    .default('DISPONIBLE'),
  origin: z
    .enum(['CHILE', 'CHINA', 'USA', 'EUROPA', 'LATAM', 'OTRO'])
    .default('CHILE'),
  basePriceCLP: z.coerce.number().min(0).optional(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  specs: z.record(z.string()).optional(),
  pricingTiers: z
    .array(
      z.object({
        minQuantity: z.coerce.number().int().min(1),
        priceCLP: z.coerce.number().min(0),
        label: optionalText(80),
      })
    )
    .optional(),
})

export const productUpdateSchema = productCreateSchema.partial()
export type ProductCreate = z.infer<typeof productCreateSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>
