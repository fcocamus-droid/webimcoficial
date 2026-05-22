/**
 * Returns the userIds that the current session is allowed to see data for.
 *
 * - SUPERADMIN: returns null (no filter, sees everything)
 * - EXECUTIVE: returns array of client IDs assigned to this executive
 * - CLIENT (or other): returns [session.user.id] (only themselves)
 */

import { prisma } from '@/lib/prisma'

export async function getUserScope(sessionUserId: string, role: string): Promise<string[] | null> {
  if (role === 'SUPERADMIN') return null

  if (role === 'EXECUTIVE') {
    const assignments = await prisma.clientAssignment.findMany({
      where: { executiveId: sessionUserId },
      select: { clientId: true },
    })
    return [sessionUserId, ...assignments.map((a) => a.clientId)]
  }

  return [sessionUserId]
}

/** Convenience: returns Prisma where filter for a `userId` column */
export function userIdFilter(scope: string[] | null) {
  if (scope === null) return {}
  return { userId: { in: scope } }
}
