// lib/auth-schemas.ts — Zod schemas para registro y login

import { z } from 'zod'
import { isValidRut, cleanRut } from './rut'

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'Máximo 72 caracteres')

const baseFields = {
  email: z.string().email('Email inválido').toLowerCase(),
  password: passwordSchema,
  name: z.string().min(2, 'Ingresa tu nombre').max(120),
  phone: z.string().min(8, 'Teléfono inválido').max(20).optional().or(z.literal('')),
  razonSocial: z.string().min(2, 'Razón social requerida').max(200),
  rut: z
    .string()
    .min(8, 'RUT inválido')
    .max(20)
    .refine((v) => isValidRut(v), 'RUT inválido')
    .transform((v) => cleanRut(v)),
  giro: z.string().max(200).optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  region: z.string().max(120).optional().or(z.literal('')),
  ciudad: z.string().max(120).optional().or(z.literal('')),
  comuna: z.string().max(120).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos' }),
  }),
}

export const sellerRegisterSchema = z.object({
  tipo: z.literal('fabricante'),
  ...baseFields,
  websiteUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export const buyerRegisterSchema = z.object({
  tipo: z.literal('comprador'),
  ...baseFields,
  cargo: z.string().max(120).optional().or(z.literal('')),
  sector: z.string().max(120).optional().or(z.literal('')),
})

export const registerSchema = z.discriminatedUnion('tipo', [
  sellerRegisterSchema,
  buyerRegisterSchema,
])

export type RegisterPayload = z.infer<typeof registerSchema>

export const loginInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})
