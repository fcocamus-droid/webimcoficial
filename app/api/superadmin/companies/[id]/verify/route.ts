// PATCH /api/superadmin/companies/[id]/verify
// Body: { verified: boolean }
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

const schema = z.object({ verified: z.boolean() })

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

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

  const company = await prisma.company.update({
    where: { id: params.id },
    data: {
      verified: parsed.data.verified,
      verifiedAt: parsed.data.verified ? new Date() : null,
    },
    select: { id: true, verified: true, verifiedAt: true, razonSocial: true },
  })
  return NextResponse.json({ company })
}
