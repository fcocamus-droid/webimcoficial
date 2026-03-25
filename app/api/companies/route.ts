import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const companySchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  rut: z.string().min(1, 'El RUT es requerido'),
  giro: z.string().min(1, 'El giro es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  comuna: z.string().min(1, 'La comuna es requerida'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  region: z.string().min(1, 'La región es requerida'),
  telefono: z.string().optional(),
  emailFacturacion: z.string().email('El email de facturación no es válido').optional().or(z.literal('')),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string

  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'

  if (all && role === 'SUPERADMIN') {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(companies)
  }

  // Return the company the user belongs to
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  })

  if (!user?.companyId) {
    return NextResponse.json(null)
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  })

  return NextResponse.json(company)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const parsed = companySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Check RUT uniqueness
  const existing = await prisma.company.findUnique({ where: { rut: data.rut } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una empresa con ese RUT' }, { status: 409 })
  }

  const company = await prisma.company.create({
    data: {
      razonSocial: data.razonSocial,
      rut: data.rut,
      giro: data.giro,
      direccion: data.direccion,
      comuna: data.comuna,
      ciudad: data.ciudad,
      region: data.region,
      telefono: data.telefono,
      emailFacturacion: data.emailFacturacion || null,
    },
  })

  // Associate the current user with the new company
  await prisma.user.update({
    where: { id: userId },
    data: { companyId: company.id },
  })

  return NextResponse.json(company, { status: 201 })
}
