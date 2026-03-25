import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  razonSocial: z.string().min(1).optional(),
  rut: z.string().min(1).optional(),
  giro: z.string().min(1).optional(),
  direccion: z.string().min(1).optional(),
  comuna: z.string().min(1).optional(),
  ciudad: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  telefono: z.string().optional(),
  emailFacturacion: z.string().email('El email de facturación no es válido').optional().or(z.literal('')),
})

async function checkAccess(userId: string, role: string, companyId: string) {
  if (role === 'SUPERADMIN') return true

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  })

  return user?.companyId === companyId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string
  const { id } = params

  const allowed = await checkAccess(userId, role, id)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, documents: true } },
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string
  const { id } = params

  const allowed = await checkAccess(userId, role, id)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // If changing RUT, check uniqueness against other companies
  if (data.rut) {
    const existing = await prisma.company.findFirst({
      where: { rut: data.rut, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una empresa con ese RUT' }, { status: 409 })
    }
  }

  const updatePayload: Record<string, unknown> = { ...data }
  if ('emailFacturacion' in updatePayload && updatePayload.emailFacturacion === '') {
    updatePayload.emailFacturacion = null
  }

  const company = await prisma.company.update({
    where: { id },
    data: updatePayload,
  })

  return NextResponse.json(company)
}
