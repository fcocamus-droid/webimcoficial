// lib/auth-schemas.ts — Zod schemas para registro y login

import { z } from 'zod'
import { isValidRut, cleanRut } from './rut'
import { normalizeClPhone, isValidClPhone } from './phone-cl'

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'Máximo 72 caracteres')

// Teléfono chileno: opcional, pero si se manda debe ser válido +56XXXXXXXXX
const clPhoneOptional = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (v) => !v || v === '' || isValidClPhone(v),
    'Teléfono inválido. Debe tener 9 dígitos después de +56.'
  )
  .transform((v) => (v && v !== '' ? normalizeClPhone(v) : ''))

const clPhoneRequired = z
  .string()
  .min(1, 'Teléfono requerido')
  .refine(
    (v) => isValidClPhone(v),
    'Teléfono inválido. Debe tener 9 dígitos después de +56.'
  )
  .transform((v) => normalizeClPhone(v))

const baseFields = {
  email: z.string().email('Email inválido').toLowerCase(),
  password: passwordSchema,
  name: z.string().min(2, 'Ingresa tu nombre').max(120),
  phone: clPhoneRequired,
  razonSocial: z.string().min(2, 'Razón social requerida').max(200),
  rut: z
    .string()
    .min(8, 'RUT inválido')
    .max(20)
    .refine((v) => isValidRut(v), 'RUT inválido')
    .transform((v) => cleanRut(v)),
  giro: z.string().max(200).optional().or(z.literal('')),
  contactPhone: clPhoneOptional,
  region: z.string().min(1, 'Selecciona una región').max(120),
  ciudad: z.string().max(120).optional().or(z.literal('')),
  comuna: z.string().min(1, 'Selecciona una comuna').max(120),
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
