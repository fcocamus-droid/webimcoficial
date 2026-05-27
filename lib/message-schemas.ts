// lib/message-schemas.ts — Zod schemas para mensajería
import { z } from 'zod'

export const messageCreateSchema = z.object({
  rfqId: z.string().min(1, 'RFQ requerida'),
  toUserId: z.string().min(1, 'Destinatario requerido'),
  body: z
    .string()
    .min(1, 'Mensaje vacío')
    .max(5000, 'Máximo 5000 caracteres'),
})

export type MessageCreate = z.infer<typeof messageCreateSchema>
