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

      const role = (auth?.user as any)?.role

      // Admin routes require SUPERADMIN role
      if (pathname.startsWith('/admin')) {
        if (!isLoggedIn) return false
        if (role !== 'SUPERADMIN') {
          return Response.redirect(new URL('/no-autorizado', request.url))
        }
        return true
      }

      // Executive routes require EXECUTIVE role
      if (pathname.startsWith('/ejecutivo')) {
        if (!isLoggedIn) return false
        if (role !== 'EXECUTIVE') {
          return Response.redirect(new URL('/no-autorizado', request.url))
        }
        return true
      }

      // Protected client routes (all authenticated users)
      const protectedPaths = ['/mi-cuenta', '/cotizar', '/mis-cotizaciones']
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
