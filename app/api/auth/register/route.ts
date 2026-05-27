// POST /api/auth/register
// Registra usuario + empresa (rol SELLER o BUYER) en una sola transacción.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/auth-schemas'
import { uniqueSlug } from '@/lib/slug'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.flatten()
    return NextResponse.json(
      { error: 'Datos inválidos', issues: issues.fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Pre-checks: email + RUT únicos
  const [emailExists, rutExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email } }),
    prisma.company.findUnique({ where: { rut: data.rut } }),
  ])

  if (emailExists) {
    return NextResponse.json(
      { error: 'Este email ya está registrado', field: 'email' },
      { status: 409 }
    )
  }
  if (rutExists) {
    return NextResponse.json(
      { error: 'Este RUT ya está registrado', field: 'rut' },
      { status: 409 }
    )
  }

  const hashed = await bcrypt.hash(data.password, 10)
  const isSeller = data.tipo === 'fabricante'

  // Slug único basado en la razón social
  const slug = await uniqueSlug(data.razonSocial, async (s) => {
    const dup = await prisma.company.findUnique({ where: { slug: s } })
    return !!dup
  })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashed,
          name: data.name,
          phone: data.phone || null,
          role: isSeller ? 'SELLER' : 'BUYER',
        },
      })

      const company = await tx.company.create({
        data: {
          userId: user.id,
          slug,
          razonSocial: data.razonSocial,
          rut: data.rut,
          giro: data.giro || null,
          isSeller,
          isBuyer: !isSeller,
          contactEmail: data.email,
          contactPhone: data.contactPhone || null,
          address: data.address || null,
          comuna: data.comuna || null,
          region: data.region || null,
          ciudad: data.ciudad || null,
          ...(data.tipo === 'fabricante'
            ? {
                websiteUrl: data.websiteUrl || null,
                description: data.description || null,
              }
            : {}),
        },
      })

      return { userId: user.id, companyId: company.id, role: user.role }
    })

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[register]', err)
    return NextResponse.json(
      { error: 'No pudimos crear la cuenta. Intenta nuevamente.' },
      { status: 500 }
    )
  }
}
