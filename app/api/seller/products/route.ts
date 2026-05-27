// /api/seller/products
//   GET  → lista los productos de las empresas del SELLER actual
//   POST → crea un nuevo producto

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'
import { productCreateSchema } from '@/lib/product-schemas'
import { uniqueSlug } from '@/lib/slug'

async function getSellerCompany(userId: string) {
  return prisma.company.findFirst({
    where: { userId, isSeller: true },
    select: { id: true, razonSocial: true },
  })
}

export async function GET(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await getSellerCompany(guard.user.id)
  if (!company) {
    return NextResponse.json(
      { products: [], company: null },
      { status: 200 }
    )
  }

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || undefined
  const categoryId = url.searchParams.get('categoryId') || undefined
  const status = url.searchParams.get('status') // 'available' | 'unavailable'

  const products = await prisma.product.findMany({
    where: {
      companyId: company.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { brand: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(status === 'available'
        ? { available: true }
        : status === 'unavailable'
          ? { available: false }
          : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true, url: true, isPrimary: true },
      },
      _count: { select: { pricingTiers: true, rfqs: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ company, products })
}

export async function POST(req: Request) {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const company = await getSellerCompany(guard.user.id)
  if (!company) {
    return NextResponse.json(
      {
        error:
          'No tienes una empresa registrada como vendedor. Completa primero tu perfil.',
      },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = productCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  // Verificar que la categoría existe
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  })
  if (!category) {
    return NextResponse.json(
      { error: 'Categoría no válida', field: 'categoryId' },
      { status: 400 }
    )
  }

  const slug = await uniqueSlug(data.title, async (s) => {
    const dup = await prisma.product.findUnique({ where: { slug: s } })
    return !!dup
  })

  const created = await prisma.product.create({
    data: {
      slug,
      companyId: company.id,
      categoryId: data.categoryId,
      title: data.title,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      sku: data.sku || null,
      brand: data.brand || null,
      unit: data.unit || 'unidad',
      moq: data.moq ?? 1,
      leadTimeDays: data.leadTimeDays ?? null,
      stockStatus: data.stockStatus,
      origin: data.origin,
      basePriceCLP: data.basePriceCLP ?? null,
      available: data.available ?? true,
      featured: data.featured ?? false,
      specs: data.specs && Object.keys(data.specs).length > 0 ? data.specs : undefined,
      ...(data.pricingTiers && data.pricingTiers.length > 0
        ? {
            pricingTiers: {
              create: data.pricingTiers.map((t) => ({
                minQuantity: t.minQuantity,
                priceCLP: t.priceCLP,
                label: t.label || null,
              })),
            },
          }
        : {}),
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json(created, { status: 201 })
}
