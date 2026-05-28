// POST /api/seller/company/image?type=logo|banner
// Sube logo o banner de la empresa a Supabase Storage y guarda la URL.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 3 * 1024 * 1024 // 3MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  if (type !== 'logo' && type !== 'banner') {
    return NextResponse.json(
      { error: 'type debe ser "logo" o "banner"' },
      { status: 400 }
    )
  }

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id },
  })
  if (!company)
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0)
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Tamaño máximo 3MB' }, { status: 400 })
  if (!ALLOWED.includes(file.type as any))
    return NextResponse.json(
      { error: 'Tipo no permitido. Usa JPG, PNG, WEBP o GIF.' },
      { status: 400 }
    )

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const filename = `${type}-${Date.now()}.${ext}`
  const path = `${company.id}/${filename}`

  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('company-assets')
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[company image]', uploadErr)
    return NextResponse.json({ error: 'No pudimos subir' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('company-assets').getPublicUrl(path)

  // Borrar el anterior si había
  const prevUrl = type === 'logo' ? company.logoUrl : company.bannerUrl
  if (prevUrl) {
    const prevPath = prevUrl.split('/company-assets/')[1]
    if (prevPath)
      await supabaseAdmin.storage.from('company-assets').remove([prevPath])
  }

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: type === 'logo' ? { logoUrl: publicUrl } : { bannerUrl: publicUrl },
  })

  return NextResponse.json({
    url: type === 'logo' ? updated.logoUrl : updated.bannerUrl,
  })
}

export async function DELETE(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  if (type !== 'logo' && type !== 'banner')
    return NextResponse.json(
      { error: 'type debe ser "logo" o "banner"' },
      { status: 400 }
    )

  const company = await prisma.company.findFirst({
    where: { userId: guard.user.id },
  })
  if (!company)
    return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const prevUrl = type === 'logo' ? company.logoUrl : company.bannerUrl
  if (prevUrl) {
    const prevPath = prevUrl.split('/company-assets/')[1]
    if (prevPath)
      await supabaseAdmin.storage.from('company-assets').remove([prevPath])
  }

  await prisma.company.update({
    where: { id: company.id },
    data: type === 'logo' ? { logoUrl: null } : { bannerUrl: null },
  })
  return NextResponse.json({ ok: true })
}
