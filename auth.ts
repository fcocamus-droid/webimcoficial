// auth.ts - NextAuth v5 configuration
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/signout',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            emailVerified: true,
          },
        })

        if (!user) return null
        if (!user.emailVerified) return null

        const isValid = await compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as any)?.role as 'CLIENT' | 'EXECUTIVE' | 'SUPERADMIN' | undefined

      // Permission matrix per route prefix
      // Each entry: { prefix, allowedRoles, exact? }
      const rules: Array<{ prefix: string; allowedRoles: Array<'CLIENT' | 'EXECUTIVE' | 'SUPERADMIN'>; exact?: boolean }> = [
        // SUPERADMIN-only routes
        { prefix: '/admin/usuarios', allowedRoles: ['SUPERADMIN'] },
        { prefix: '/admin/tarifas', allowedRoles: ['SUPERADMIN'] },
        { prefix: '/admin/surcharges', allowedRoles: ['SUPERADMIN'] },
        { prefix: '/admin/puertos', allowedRoles: ['SUPERADMIN'] },
        { prefix: '/admin/configuracion', allowedRoles: ['SUPERADMIN'] },
        { prefix: '/admin/box/embarques', allowedRoles: ['SUPERADMIN'] },
        // SUPERADMIN + EXECUTIVE
        { prefix: '/admin/cotizaciones', allowedRoles: ['SUPERADMIN', 'EXECUTIVE'] },
        { prefix: '/admin/operaciones', allowedRoles: ['SUPERADMIN', 'EXECUTIVE'] },
        { prefix: '/admin/empresas', allowedRoles: ['SUPERADMIN', 'EXECUTIVE'] },
        { prefix: '/admin/box/paquetes', allowedRoles: ['SUPERADMIN', 'EXECUTIVE'] },
        { prefix: '/admin/box/prealertas', allowedRoles: ['SUPERADMIN', 'EXECUTIVE'] },
        // /admin root (Centro de Control) — SUPERADMIN only
        { prefix: '/admin', allowedRoles: ['SUPERADMIN'], exact: true },
        // /ejecutivo — EXECUTIVE only (legacy panel)
        { prefix: '/ejecutivo', allowedRoles: ['EXECUTIVE', 'SUPERADMIN'] },
      ]

      // Find matching rule (longest prefix wins; exact match takes precedence)
      const matched = rules
        .filter((r) => (r.exact ? pathname === r.prefix : pathname.startsWith(r.prefix)))
        .sort((a, b) => b.prefix.length - a.prefix.length)[0]

      if (matched) {
        if (!isLoggedIn) return false
        if (!role || !matched.allowedRoles.includes(role)) {
          return Response.redirect(new URL('/no-autorizado', request.url))
        }
        return true
      }

      // Authenticated routes (any role)
      const protectedPaths = ['/mi-cuenta', '/cotizar', '/mis-cotizaciones', '/box', '/dashboard', '/operaciones']
      const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
      if (isProtected && !isLoggedIn) return false

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as "CLIENT" | "EXECUTIVE" | "SUPERADMIN"
      }
      return session
    },
  },
})
