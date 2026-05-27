// PATCH /api/seller/products/[id]/images/[imageId] → editar (isPrimary, sortOrder, alt)
// DELETE → borrar imagen del bucket + DB

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

const patchSchema = z.object({
  isPrimary: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  alt: z.string().max(200).optional().or(z.literal('')),
})

async function ensureOwnedImage(
  productId: string,
  imageId: string,
  userId: string
) {
  return prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
      product: { company: { userId } },
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const image = await ensureOwnedImage(params.id, params.imageId, guard.user.id)
  if (!image) {
    return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Si pasamos isPrimary=true, desmarcamos las otras del mismo producto.
  const updated = await prisma.$transaction(async (tx) => {
    if (data.isPrimary === true) {
      await tx.productImage.updateMany({
        where: { productId: params.id, NOT: { id: params.imageId } },
        data: { isPrimary: false },
      })
    }
    return tx.productImage.update({
      where: { id: params.imageId },
      data: {
        ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.alt !== undefined ? { alt: data.alt || null } : {}),
      },
    })
  })

  return NextResponse.json({ image: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const image = await ensureOwnedImage(params.id, params.imageId, guard.user.id)
  if (!image) {
    return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }

  const path = image.url.split('/products/')[1]
  if (path) {
    await supabaseAdmin.storage.from('products').remove([path])
  }
  await prisma.productImage.delete({ where: { id: image.id } })

  // Si la imagen borrada era la primaria, promovemos otra (si existe)
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { sortOrder: 'asc' },
    })
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
