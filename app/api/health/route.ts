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
    // Check env vars
    const envCheck = {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      secretsMatch: process.env.AUTH_SECRET === process.env.NEXTAUTH_SECRET,
      authSecretPrefix: process.env.AUTH_SECRET?.substring(0, 5),
      nextauthSecretPrefix: process.env.NEXTAUTH_SECRET?.substring(0, 5),
    }
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      userCount,
      admin: admin ? { email: admin.email, role: admin.role, verified: !!admin.emailVerified, passwordMatch } : null,
      envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: String(error) },
      { status: 500 }
    )
  }
}
