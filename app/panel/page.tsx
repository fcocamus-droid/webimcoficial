// /panel — redirige al panel correcto según el rol del usuario
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function PanelIndex() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/panel')

  const role = (session.user as any).role as 'ADMIN' | 'SELLER' | 'BUYER'
  if (role === 'SELLER') redirect('/panel/vendedor')
  if (role === 'BUYER') redirect('/panel/comprador')
  if (role === 'ADMIN') redirect('/panel/admin')
  redirect('/')
}
