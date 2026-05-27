// auth.ts — placeholder
// Auth scaffold will be reconfigured once we know the new business requirements.

import NextAuth from 'next-auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  session: { strategy: 'jwt' },
})
