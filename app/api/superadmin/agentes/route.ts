// /api/superadmin/agentes
//   GET  → lista los agentes creados por el superadmin actual
//   POST → crea un nuevo agente de ventas

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

const createSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(120),
  email: z.string().email('Email inválido').toLowerCase(),
  phone: z.string().max(20).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72)
    .optional()
    .or(z.literal('')),
})

function generateTempPassword() {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(14)
  let out = ''
  for (let i = 0; i < 14; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export async function GET() {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const agents = await prisma.user.findMany({
    where: { role: 'SALES_AGENT', createdById: guard.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ agents })
}

export async function POST(req: Request) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, email, phone, password } = parsed.data

  const dup = await prisma.user.findUnique({ where: { email } })
  if (dup) {
    return NextResponse.json(
      { error: 'Este email ya está registrado', field: 'email' },
      { status: 409 }
    )
  }

  const tempPassword = password && password.length > 0 ? password : generateTempPassword()
  const hashed = await bcrypt.hash(tempPassword, 10)

  const agent = await prisma.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      password: hashed,
      role: 'SALES_AGENT',
      active: true,
      createdById: guard.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  })

  // Devolvemos la contraseña UNA SOLA VEZ para que el superadmin se la pase al agente.
  return NextResponse.json(
    { agent, tempPassword },
    { status: 201 }
  )
}
