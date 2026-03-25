import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function checkAccess(userId: string, role: string, companyId: string) {
  if (role === 'SUPERADMIN') return true
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  })
  return user?.companyId === companyId
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string
  const { id: companyId, docId } = params

  const allowed = await checkAccess(userId, role, companyId)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const document = await prisma.companyDocument.findUnique({
    where: { id: docId },
  })

  if (!document) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  if (document.companyId !== companyId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuración de almacenamiento incompleta' }, { status: 500 })
  }

  const storageUrl = `${supabaseUrl}/storage/v1/object/company-documents/${companyId}/${document.fileName}`

  const deleteRes = await fetch(storageUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })

  if (!deleteRes.ok) {
    const errText = await deleteRes.text()
    console.error('Supabase Storage delete error:', errText)
    // Continue to delete DB record even if storage deletion fails to avoid orphaned records
  }

  await prisma.companyDocument.delete({ where: { id: docId } })

  return NextResponse.json({ success: true })
}
