// POST /api/auth/reset-password
// Valida el token enviado por email y guarda la nueva contraseña.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  token: z.string().min(40, 'Token inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
})

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { token, password } = parsed.data
  const hashed = hashToken(token)

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashed,
      resetExpires: { gt: new Date() },
    },
    select: { id: true, email: true },
  })

  if (!user) {
    return NextResponse.json(
      {
        error:
          'Link de recuperación inválido o expirado. Solicita uno nuevo desde /recuperar.',
      },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetToken: null,
      resetExpires: null,
    },
  })

  return NextResponse.json({ ok: true, email: user.email })
}

// GET /api/auth/reset-password?token=...
// Valida si un token está vigente (lo usa la página /recuperar/[token]
// para mostrar el form solo si el token es válido).
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token || token.length < 40) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }
  const hashed = hashToken(token)
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashed,
      resetExpires: { gt: new Date() },
    },
    select: { email: true },
  })
  return NextResponse.json({
    valid: !!user,
    email: user?.email ?? null,
  })
}
