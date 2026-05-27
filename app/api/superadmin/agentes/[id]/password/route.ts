// POST /api/superadmin/agentes/[id]/password
// Resetea la contraseña de un agente creado por el superadmin actual.
// Si no se envía password en el body, se genera una temporal y se devuelve.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

const schema = z.object({
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const agent = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: 'SALES_AGENT',
      createdById: guard.user.id,
    },
    select: { id: true, email: true, name: true },
  })
  if (!agent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  let body: unknown = {}
  try {
    if (req.headers.get('content-length') !== '0') {
      body = await req.json()
    }
  } catch {
    body = {}
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supplied = parsed.data.password
  const newPassword =
    supplied && supplied.length >= 8 ? supplied : generateTempPassword()
  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: agent.id },
    data: { password: hashed },
  })

  return NextResponse.json({
    ok: true,
    agent: { id: agent.id, email: agent.email, name: agent.name },
    tempPassword: newPassword,
  })
}
