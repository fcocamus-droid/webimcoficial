// POST /api/seller/products/[id]/images
// Sube una imagen del producto a Supabase Storage + crea ProductImage.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const product = await prisma.product.findFirst({
    where: { id: params.id, company: { userId: guard.user.id } },
    include: { company: { select: { id: true } }, _count: { select: { images: true } } },
  })
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'FormData inválido' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Tamaño máximo 5MB' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type as any)) {
    return NextResponse.json(
      { error: 'Tipo no permitido. Usa JPG, PNG, WEBP o GIF.' },
      { status: 400 }
    )
  }

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const filename = `${Date.now()}.${ext}`
  const path = `${product.company.id}/${product.id}/${filename}`

  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('products')
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[product image] upload', uploadErr)
    return NextResponse.json(
      { error: 'No pudimos subir la imagen' },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('products').getPublicUrl(path)

  // Si es la primera imagen, marcarla como primaria.
  const isPrimary = product._count.images === 0
  const image = await prisma.productImage.create({
    data: {
      productId: product.id,
      url: publicUrl,
      isPrimary,
      sortOrder: product._count.images,
      alt: product.title,
    },
  })

  return NextResponse.json({ image }, { status: 201 })
}
