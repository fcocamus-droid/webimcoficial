// /api/seller/products/[id]
//   GET    → detalle de un producto propio
//   PATCH  → editar
//   DELETE → eliminar

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { productUpdateSchema } from '@/lib/product-schemas'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function ensureOwned(productId: string, userId: string) {
  return prisma.product.findFirst({
    where: { id: productId, company: { userId } },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const product = await prisma.product.findFirst({
    where: { id: params.id, company: { userId: guard.user.id } },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
      },
      pricingTiers: { orderBy: { minQuantity: 'asc' } },
    },
  })
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ product })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const existing = await ensureOwned(params.id, guard.user.id)
  if (!existing) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  if (data.categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })
    if (!cat) {
      return NextResponse.json(
        { error: 'Categoría no válida', field: 'categoryId' },
        { status: 400 }
      )
    }
  }

  const { pricingTiers, ...rest } = data
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id: existing.id },
      data: {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.categoryId !== undefined
          ? { categoryId: rest.categoryId }
          : {}),
        ...(rest.shortDescription !== undefined
          ? { shortDescription: rest.shortDescription || null }
          : {}),
        ...(rest.description !== undefined
          ? { description: rest.description || null }
          : {}),
        ...(rest.sku !== undefined ? { sku: rest.sku || null } : {}),
        ...(rest.brand !== undefined ? { brand: rest.brand || null } : {}),
        ...(rest.unit !== undefined ? { unit: rest.unit || 'unidad' } : {}),
        ...(rest.moq !== undefined ? { moq: rest.moq ?? 1 } : {}),
        ...(rest.leadTimeDays !== undefined
          ? { leadTimeDays: rest.leadTimeDays ?? null }
          : {}),
        ...(rest.stockStatus !== undefined
          ? { stockStatus: rest.stockStatus }
          : {}),
        ...(rest.origin !== undefined ? { origin: rest.origin } : {}),
        ...(rest.basePriceCLP !== undefined
          ? { basePriceCLP: rest.basePriceCLP ?? null }
          : {}),
        ...(rest.available !== undefined ? { available: rest.available } : {}),
        ...(rest.featured !== undefined ? { featured: rest.featured } : {}),
        ...(rest.specs !== undefined
          ? {
              specs:
                rest.specs && Object.keys(rest.specs).length > 0
                  ? rest.specs
                  : undefined,
            }
          : {}),
      },
    })

    if (pricingTiers !== undefined) {
      // Estrategia simple: reemplaza todos los tiers
      await tx.pricingTier.deleteMany({ where: { productId: existing.id } })
      if (pricingTiers.length > 0) {
        await tx.pricingTier.createMany({
          data: pricingTiers.map((t) => ({
            productId: existing.id,
            minQuantity: t.minQuantity,
            priceCLP: t.priceCLP,
            label: t.label || null,
          })),
        })
      }
    }

    return p
  })

  return NextResponse.json({ product: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const existing = await prisma.product.findFirst({
    where: { id: params.id, company: { userId: guard.user.id } },
    include: { images: { select: { url: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  // Borrar imágenes del bucket
  const paths = existing.images
    .map((i) => i.url.split('/products/')[1])
    .filter(Boolean) as string[]
  if (paths.length > 0) {
    await supabaseAdmin.storage.from('products').remove(paths)
  }

  await prisma.product.delete({ where: { id: existing.id } })
  return NextResponse.json({ ok: true })
}
