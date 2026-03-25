// middleware.ts - Protección de rutas
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  // Rutas del admin requieren autenticación y rol SUPERADMIN
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url))
    }
    if ((session?.user as any)?.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/no-autorizado', req.url))
    }
  }

  // Rutas del cliente requieren autenticación
  const protectedClientPaths = ['/mi-cuenta', '/cotizar', '/mis-cotizaciones']
  const isProtectedClient = protectedClientPaths.some((p) => nextUrl.pathname.startsWith(p))

  if (isProtectedClient) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*', '/cotizar/:path*', '/mis-cotizaciones/:path*'],
}
