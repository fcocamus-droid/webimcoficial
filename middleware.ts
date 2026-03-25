// middleware.ts - Protección de rutas
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const { pathname } = req.nextUrl

  // /admin/* — requires authentication AND SUPERADMIN role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url))
    }
    if (token.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/no-autorizado', req.url))
    }
  }

  // /cotizar/* and /mis-cotizaciones/* — requires authentication only
  const protectedClientPaths = ['/mi-cuenta', '/cotizar', '/mis-cotizaciones']
  const isProtectedClient = protectedClientPaths.some((p) => pathname.startsWith(p))

  if (isProtectedClient && !token) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*', '/cotizar/:path*', '/mis-cotizaciones/:path*'],
}
