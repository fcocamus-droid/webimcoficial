import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Generates a fresh password reset token for a user (admin-only).
 * Returns the reset URL so superadmin can share it manually
 * (useful while Resend is not configured).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const resetToken = crypto.randomUUID()
    const resetExpires = new Date(Date.now() + 86400000)  // 24h

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { resetToken, resetExpires },
      select: { email: true, name: true, role: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://webimcoficial.vercel.app'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    return NextResponse.json({
      ok: true,
      email: user.email,
      resetUrl,
      expiresAt: resetExpires.toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al generar reset' }, { status: 400 })
  }
}
