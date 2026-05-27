import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'SUPERADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.$executeRaw`DELETE FROM products WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
