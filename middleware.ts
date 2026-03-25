// middleware.ts - NextAuth v5 uses auth() as middleware
export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*', '/cotizar/:path*', '/mis-cotizaciones/:path*'],
}
