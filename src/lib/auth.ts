// Config completo — Node.js only
// Usado por API routes e Server Components

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { registerLogin, getUserPages, getTokenVersion } from "@/lib/user-registry"
import type { UserPages } from "@/lib/user-pages"

const SUPERADMIN_EMAILS = ["alan.moreira@netturbo.com.br"]

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      const email = user.email ?? ''
      if (!email) return false
      const isSuperadmin = SUPERADMIN_EMAILS.includes(email)
      registerLogin({
        email,
        name: user.name ?? undefined,
        picture: user.image ?? undefined,
        role: isSuperadmin ? 'superadmin' : 'user',
      })
      return true
    },

    jwt({ token, account }) {
      const email = token.email ?? ''
      token.role = SUPERADMIN_EMAILS.includes(email) ? 'superadmin' : 'user'
      if (account && email) {
        token.pages = getUserPages(email)
        token.tokenVersion = getTokenVersion(email)
      }
      return token
    },

    session({ session, token }) {
      session.user.role = (token.role as string) ?? 'user'
      session.user.pages = token.pages as UserPages
      session.user.tokenVersion = (token.tokenVersion as number) ?? 0
      return session
    },
  },
})
