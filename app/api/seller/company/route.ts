// /api/seller/company
//   GET   → datos de la empresa del seller
//   PATCH → actualizar campos editables (descripción, contacto, ubicación…)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { isValidClPhone, normalizeClPhone } from '@/lib/phone-cl'

const opt = (max: number) => z.string().max(max).optional().or(z.literal(''))

const patchSchema = z.object({
  giro: opt(200),
  description: opt(2000),
  websiteUrl: opt(300),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || v === '' || isValidClPhone(v),
      'Teléfono inválido'
    )
    .transform((v) => (v && v !== '' ? normalizeClPhone(v) : '')),
  region: opt(120),
  ciudad: opt(120),
  comuna: opt(120),
  address: opt(300),
})

export async function GET() {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id },
  })
  if (!company)
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
  return NextResponse.json({ company })
}

export async function PATCH(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const existing = await prisma.company.findFirst({
    where: { userId: guard.user.id },
  })
  if (!existing)
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

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

  const d = parsed.data
  const updated = await prisma.company.update({
    where: { id: existing.id },
    data: {
      ...(d.giro !== undefined ? { giro: d.giro || null } : {}),
      ...(d.description !== undefined
        ? { description: d.description || null }
        : {}),
      ...(d.websiteUrl !== undefined
        ? { websiteUrl: d.websiteUrl || null }
        : {}),
      ...(d.contactEmail !== undefined
        ? { contactEmail: d.contactEmail || null }
        : {}),
      ...(d.contactPhone !== undefined
        ? { contactPhone: d.contactPhone || null }
        : {}),
      ...(d.region !== undefined ? { region: d.region || null } : {}),
      ...(d.ciudad !== undefined ? { ciudad: d.ciudad || null } : {}),
      ...(d.comuna !== undefined ? { comuna: d.comuna || null } : {}),
      ...(d.address !== undefined ? { address: d.address || null } : {}),
    },
  })

  return NextResponse.json({ company: updated })
}
