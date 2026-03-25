import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const zones = await prisma.lastMileZone.findMany({
      where: { active: true },
      orderBy: { region: 'asc' },
    })

    return NextResponse.json({ zones })
  } catch (error: any) {
    console.error('Zones fetch error:', error)
    return NextResponse.json(
      { error: 'Error al obtener zonas' },
      { status: 500 }
    )
  }
}
