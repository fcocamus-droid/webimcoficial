// /api/account/avatar — upload + delete de avatar
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'FormData inválido' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No se recibió ningún archivo' },
      { status: 400 }
    )
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Tamaño máximo 2MB' },
      { status: 400 }
    )
  }
  if (!ALLOWED.includes(file.type as any)) {
    return NextResponse.json(
      { error: 'Tipo no permitido. Usa JPG, PNG, WEBP o GIF.' },
      { status: 400 }
    )
  }

  // Path: userId/timestamp-name.ext — evitamos colisión + permite varios history
  const ext = file.type.split('/')[1] || 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `${userId}/${filename}`

  // Buffer del archivo
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('avatars')
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadErr) {
    console.error('[avatar] upload error', uploadErr)
    return NextResponse.json(
      { error: 'No pudimos subir el archivo' },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('avatars').getPublicUrl(path)

  // Borrar el avatar anterior (si había)
  const prev = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  })
  if (prev?.avatarUrl) {
    const prevPath = prev.avatarUrl.split('/avatars/')[1]
    if (prevPath) {
      await supabaseAdmin.storage.from('avatars').remove([prevPath])
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: publicUrl },
    select: { avatarUrl: true },
  })

  return NextResponse.json({ avatarUrl: updated.avatarUrl })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const prev = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  })

  if (prev?.avatarUrl) {
    const prevPath = prev.avatarUrl.split('/avatars/')[1]
    if (prevPath) {
      await supabaseAdmin.storage.from('avatars').remove([prevPath])
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  })

  return NextResponse.json({ ok: true })
}
