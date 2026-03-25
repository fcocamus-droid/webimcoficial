import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      rut: true,
      company: true,
      companyId: true,
      role: true,
      companyRef: {
        select: {
          id: true,
          razonSocial: true,
          rut: true,
          giro: true,
          direccion: true,
          comuna: true,
          ciudad: true,
          region: true,
          telefono: true,
          emailFacturacion: true,
          createdAt: true,
          updatedAt: true,
          documents: {
            select: {
              id: true,
              type: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' as const },
          },
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  let body: {
    name?: string
    phone?: string
    currentPassword?: string
    newPassword?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) {
    updateData.name = body.name
  }
  if (body.phone !== undefined) {
    updateData.phone = body.phone
  }

  // Password change flow
  if (body.currentPassword !== undefined || body.newPassword !== undefined) {
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Se requieren currentPassword y newPassword para cambiar la contraseña' },
        { status: 400 }
      )
    }

    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!userWithPassword) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const passwordValid = await compare(body.currentPassword, userWithPassword.password)
    if (!passwordValid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    }

    updateData.password = await hash(body.newPassword, 10)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      rut: true,
      company: true,
      companyId: true,
      role: true,
    },
  })

  return NextResponse.json(updated)
}
