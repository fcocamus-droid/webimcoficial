import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const executiveId = searchParams.get('executiveId')

  const assignments = await prisma.clientAssignment.findMany({
    where: executiveId ? { executiveId } : undefined,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      executive: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { executiveId?: string; clientId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { executiveId, clientId } = body
  if (!executiveId || !clientId) {
    return NextResponse.json({ error: 'executiveId y clientId son requeridos' }, { status: 400 })
  }

  // Validate executive exists and has correct role
  const executive = await prisma.user.findUnique({ where: { id: executiveId } })
  if (!executive || executive.role !== 'EXECUTIVE') {
    return NextResponse.json({ error: 'El ejecutivo no existe o no tiene el rol correcto' }, { status: 400 })
  }

  // Validate client exists and has correct role
  const client = await prisma.user.findUnique({ where: { id: clientId } })
  if (!client || client.role !== 'CLIENT') {
    return NextResponse.json({ error: 'El cliente no existe o no tiene el rol correcto' }, { status: 400 })
  }

  try {
    const assignment = await prisma.clientAssignment.create({
      data: { executiveId, clientId },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    })
    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Esta asignación ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Error al crear asignación' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { executiveId?: string; clientId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { executiveId, clientId } = body
  if (!executiveId || !clientId) {
    return NextResponse.json({ error: 'executiveId y clientId son requeridos' }, { status: 400 })
  }

  try {
    await prisma.clientAssignment.delete({
      where: { executiveId_clientId: { executiveId, clientId } },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'La asignación no existe' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Error al eliminar asignación' }, { status: 500 })
  }
}
