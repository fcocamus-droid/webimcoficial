// /panel — redirige al panel correcto según el rol del usuario
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { UserRole } from '@prisma/client'

export default async function PanelIndex() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel')

  const role = (session.user as any).role as UserRole
  if (role === 'SUPERADMIN') redirect('/panel/superadmin')
  if (role === 'SALES_AGENT') redirect('/panel/agente')
  if (role === 'ADMIN') redirect('/panel/admin')
  if (role === 'SELLER') redirect('/panel/vendedor')
  if (role === 'BUYER') redirect('/panel/comprador')
  redirect('/')
}
