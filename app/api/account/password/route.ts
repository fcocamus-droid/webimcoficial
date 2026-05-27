// /api/account/password — cambio de contraseña del usuario actual
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  current: z.string().min(1, 'Ingresa tu contraseña actual'),
  next: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  })
  if (!user || !user.password) {
    return NextResponse.json(
      { error: 'Cuenta sin contraseña configurada' },
      { status: 400 }
    )
  }

  const ok = await bcrypt.compare(parsed.data.current, user.password)
  if (!ok) {
    return NextResponse.json(
      { error: 'Tu contraseña actual no es correcta', field: 'current' },
      { status: 400 }
    )
  }

  // Evitar re-usar la misma contraseña
  const sameAsBefore = await bcrypt.compare(parsed.data.next, user.password)
  if (sameAsBefore) {
    return NextResponse.json(
      {
        error: 'La nueva contraseña debe ser distinta a la actual',
        field: 'next',
      },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(parsed.data.next, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  return NextResponse.json({ ok: true })
}
