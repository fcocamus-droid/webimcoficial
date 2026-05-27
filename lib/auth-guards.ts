// lib/auth-guards.ts — helpers para chequear permisos en server actions / route handlers.
import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

export async function requireRole(...roles: UserRole[]) {
  const session = await auth()
  const user = session?.user as { id: string; role: UserRole } | undefined
  if (!user) return { ok: false as const, status: 401, error: 'No autenticado' }
  if (!roles.includes(user.role)) {
    return { ok: false as const, status: 403, error: 'Sin permisos' }
  }
  return { ok: true as const, user }
}
