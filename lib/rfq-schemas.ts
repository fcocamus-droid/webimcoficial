// lib/rfq-schemas.ts — Zod schemas para RFQ y respuestas
import { z } from 'zod'

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(''))

export const rfqCreateSchema = z.object({
  title: z.string().min(5, 'Resume tu solicitud').max(200),
  description: z
    .string()
    .min(20, 'Describe la solicitud con un poco más de detalle')
    .max(5000),
  quantity: z.coerce.number().int().min(1, 'Cantidad mínima 1'),
  unit: z.string().min(1, 'Indica la unidad').max(40),
  productId: z.string().optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  budgetMaxCLP: z.coerce.number().min(0).optional(),
  deliveryDeadline: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? new Date(v) : undefined))
    .refine(
      (v) => v === undefined || !isNaN(v.getTime()),
      'Fecha inválida'
    ),
  deliveryLocation: optionalText(200),
  visibility: z.enum(['PUBLIC', 'TARGETED']).default('PUBLIC'),
})
export type RfqCreate = z.infer<typeof rfqCreateSchema>

export const rfqPatchSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
})

export const rfqResponseSchema = z.object({
  pricePerUnit: z.coerce.number().min(0, 'Precio inválido'),
  totalPrice: z.coerce.number().min(0).optional(),
  leadTimeDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: optionalText(2000),
  attachmentUrl: optionalText(500),
})
