// POST /api/seller/certifications
// GET  /api/seller/certifications
// Crea / lista las certificaciones de la empresa del seller.
// El POST recibe FormData con el archivo + metadatos.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

const CERT_TYPES = [
  'ISO_9001',
  'ISO_14001',
  'HACCP',
  'BPM',
  'GMP',
  'KOSHER',
  'ORGANICO',
  'FDA',
  'OTRA',
] as const

export const runtime = 'nodejs'

export async function GET() {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id },
    select: { id: true },
  })
  if (!company) return NextResponse.json({ certifications: [] })

  const certifications = await prisma.companyCertification.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ certifications })
}

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id },
  })
  if (!company)
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const type = String(form.get('type') || '')
  const customName = String(form.get('customName') || '')
  const expiresAt = String(form.get('expiresAt') || '')
  const file = form.get('file')

  if (!CERT_TYPES.includes(type as any)) {
    return NextResponse.json(
      { error: 'Tipo de certificación inválido' },
      { status: 400 }
    )
  }

  let fileUrl: string | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'Máximo 10MB' }, { status: 400 })
    if (!ALLOWED.includes(file.type as any))
      return NextResponse.json(
        { error: 'Tipo no permitido. Usa JPG, PNG, WEBP o PDF.' },
        { status: 400 }
      )

    const ext = (file.type.split('/')[1] || 'pdf').replace('jpeg', 'jpg')
    const path = `${company.id}/${type}-${Date.now()}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('certifications')
      .upload(path, buf, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })
    if (uploadErr) {
      console.error('[cert upload]', uploadErr)
      return NextResponse.json(
        { error: 'No pudimos subir el archivo' },
        { status: 500 }
      )
    }
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('certifications').getPublicUrl(path)
    fileUrl = publicUrl
  }

  const created = await prisma.companyCertification.create({
    data: {
      companyId: company.id,
      type: type as any,
      customName: type === 'OTRA' && customName ? customName : null,
      fileUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      verified: false,
    },
  })
  return NextResponse.json({ certification: created }, { status: 201 })
}
