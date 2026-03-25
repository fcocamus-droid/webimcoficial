import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const port = await prisma.port.update({
      where: { id: params.id },
      data: {
        code: body.code,
        name: body.name,
        country: body.country,
        type: body.type,
        active: body.active ?? true,
      },
    })

    return NextResponse.json(port)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await prisma.port.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 400 })
  }
}
