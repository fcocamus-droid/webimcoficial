// DELETE /api/seller/certifications/[id]
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const cert = await prisma.companyCertification.findFirst({
    where: { id: params.id, company: { userId: guard.user.id } },
  })
  if (!cert)
    return NextResponse.json(
      { error: 'Certificación no encontrada' },
      { status: 404 }
    )

  if (cert.fileUrl) {
    const path = cert.fileUrl.split('/certifications/')[1]
    if (path) await supabaseAdmin.storage.from('certifications').remove([path])
  }

  await prisma.companyCertification.delete({ where: { id: cert.id } })
  return NextResponse.json({ ok: true })
}
