// POST /api/auth/recuperar
// Genera un token de reset y envía email al usuario.
// Anti-enumeración: siempre responde 200 OK, exista o no el email.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { appUrl, sendEmailAsync } from '@/lib/email'
import ResetPasswordEmail from '@/emails/ResetPasswordEmail'

const schema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
})

const RESET_TTL_MS = 60 * 60 * 1000 // 1 hora

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
    // Para evitar enumeración, devolvemos 200 OK con mensaje genérico
    // aunque el email sea inválido.
    return NextResponse.json({ ok: true })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  })

  if (user) {
    // Generamos token raw (lo enviamos en el email) y guardamos el hash en BD
    const rawToken = randomBytes(32).toString('hex')
    const hashed = hashToken(rawToken)
    const expires = new Date(Date.now() + RESET_TTL_MS)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashed,
        resetExpires: expires,
      },
    })

    sendEmailAsync({
      to: user.email,
      subject: '🔑 Restablece tu contraseña · IMC Industriales',
      react: ResetPasswordEmail({
        appUrl: appUrl(),
        name: user.name || user.email,
        token: rawToken,
      }),
    })
  }

  // Respuesta siempre exitosa para no revelar si el email existe
  return NextResponse.json({ ok: true })
}
