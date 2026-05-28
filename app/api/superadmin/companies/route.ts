// GET /api/superadmin/companies — lista de empresas con filtros
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guards'

export async function GET(req: Request) {
  const guard = await requireRole('SUPERADMIN')
  if (!guard.ok)
    return NextResponse.json({ error: guard.error }, { status: guard.status })

  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'all'
  const q = url.searchParams.get('q')?.trim() || ''

  const companies = await prisma.company.findMany({
    where: {
      ...(filter === 'verified' ? { verified: true } : {}),
      ...(filter === 'pending' ? { verified: false } : {}),
      ...(filter === 'seller' ? { isSeller: true } : {}),
      ...(filter === 'buyer' ? { isBuyer: true } : {}),
      ...(q
        ? {
            OR: [
              { razonSocial: { contains: q, mode: 'insensitive' } },
              { rut: { contains: q, mode: 'insensitive' } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { email: true, name: true } },
      _count: {
        select: {
          products: true,
          certifications: true,
        },
      },
    },
    orderBy: [{ verified: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return NextResponse.json({ companies })
}
