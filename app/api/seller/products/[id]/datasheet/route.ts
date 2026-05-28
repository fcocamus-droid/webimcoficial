// POST /api/seller/products/[id]/datasheet — sube/reemplaza PDF ficha técnica
// DELETE /api/seller/products/[id]/datasheet — elimina

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED = ['application/pdf'] as const

export const runtime = 'nodejs'

async function ensureOwned(productId: string, userId: string) {
  return prisma.product.findFirst({
    where: { id: productId, company: { userId } },
    include: { company: { select: { id: true } } },
  })
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const product = await ensureOwned(params.id, guard.user.id)
  if (!product)
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (file.size === 0)
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Tamaño máximo 10MB' }, { status: 400 })
  if (!ALLOWED.includes(file.type as any))
    return NextResponse.json(
      { error: 'Solo se aceptan archivos PDF' },
      { status: 400 }
    )

  const path = `${product.company.id}/${product.id}/datasheet-${Date.now()}.pdf`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('products')
    .upload(path, buf, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[datasheet upload]', uploadErr)
    return NextResponse.json({ error: 'No pudimos subir el PDF' }, { status: 500 })
  }
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('products').getPublicUrl(path)

  // Borrar el anterior si había
  if (product.datasheetUrl) {
    const prevPath = product.datasheetUrl.split('/products/')[1]
    if (prevPath) await supabaseAdmin.storage.from('products').remove([prevPath])
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { datasheetUrl: publicUrl },
    select: { datasheetUrl: true },
  })
  return NextResponse.json({ datasheetUrl: updated.datasheetUrl })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const product = await ensureOwned(params.id, guard.user.id)
  if (!product)
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  if (product.datasheetUrl) {
    const path = product.datasheetUrl.split('/products/')[1]
    if (path) await supabaseAdmin.storage.from('products').remove([path])
  }
  await prisma.product.update({
    where: { id: product.id },
    data: { datasheetUrl: null },
  })
  return NextResponse.json({ ok: true })
}
