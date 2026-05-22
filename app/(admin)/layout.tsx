// Layout del panel de administración (route group)
'use client'

import { SessionProvider } from 'next-auth/react'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
