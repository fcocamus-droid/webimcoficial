// Health check endpoint
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    const userCount = await prisma.user.count()
    const admin = await prisma.user.findUnique({
      where: { email: 'fcocamus@gmail.com' },
      select: { id: true, email: true, role: true, emailVerified: true, password: true },
    })
    let passwordMatch = false
    if (admin?.password) {
      passwordMatch = await compare('123456', admin.password)
    }
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      userCount,
      admin: admin ? { email: admin.email, role: admin.role, verified: !!admin.emailVerified, passwordMatch } : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: String(error) },
      { status: 500 }
    )
  }
}
