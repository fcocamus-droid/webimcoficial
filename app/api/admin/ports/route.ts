import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ports = await prisma.port.findMany({
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(ports)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const port = await prisma.port.create({
      data: {
        code: body.code,
        name: body.name,
        country: body.country,
        type: body.type,
        active: body.active ?? true,
      },
    })

    return NextResponse.json(port, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear puerto' }, { status: 400 })
  }
}
