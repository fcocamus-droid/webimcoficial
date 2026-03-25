import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ports = await prisma.port.findMany({
      where: { active: true },
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    })

    // Group by country
    const grouped: Record<string, typeof ports> = {}
    for (const port of ports) {
      if (!grouped[port.country]) {
        grouped[port.country] = []
      }
      grouped[port.country].push(port)
    }

    return NextResponse.json({ ports: grouped })
  } catch (error: any) {
    console.error('Ports fetch error:', error)
    return NextResponse.json(
      { error: 'Error al obtener puertos' },
      { status: 500 }
    )
  }
}
