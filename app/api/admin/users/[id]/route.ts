import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
    const data: Record<string, unknown> = {}

    if (body.role) data.role = body.role
    if (typeof body.active === 'boolean') {
      // If deactivating, we can clear emailVerified; if activating, set it
      data.emailVerified = body.active ? new Date() : null
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar usuario' }, { status: 400 })
  }
}
