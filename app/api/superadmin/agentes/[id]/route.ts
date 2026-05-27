// /api/superadmin/agentes/[id]
//   PATCH → activa o desactiva un agente (no se borra para preservar historial)
//   DELETE → elimina por completo (usar con cuidado)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
})

async function ensureOwned(id: string, superadminId: string) {
  const agent = await prisma.user.findFirst({
    where: { id, role: 'SALES_AGENT', createdById: superadminId },
  })
  return agent
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const agent = await ensureOwned(params.id, guard.user.id)
  if (!agent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(typeof data.active === 'boolean' ? { active: data.active } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
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

  return NextResponse.json({ agent: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const agent = await ensureOwned(params.id, guard.user.id)
  if (!agent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
