import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import AgentesClient from './AgentesClient'

export const metadata = { title: 'Agentes · Panel Superadmin' }

export default async function AgentesPage() {
  const session = await auth()
  const userId = (session!.user as any).id as string

  const agents = await prisma.user.findMany({
    where: { role: 'SALES_AGENT', createdById: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Serializamos createdAt a string para evitar problemas client/server
  const initialAgents = agents.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))

  return <AgentesClient initialAgents={initialAgents} />
}
