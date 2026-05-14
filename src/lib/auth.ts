import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { NextResponse } from "next/server"
import { registerLogin, getUserPages, DEFAULT_PAGES } from "@/lib/user-registry"
import type { UserPages } from "@/lib/user-registry"

const SUPERADMIN_EMAILS = ["alan.moreira@netturbo.com.br"]

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/evolution/webhook",
  "/api/health",
  "/access-denied",
]

function checkPagePermission(pathname: string, pages: UserPages): boolean {
  if (pathname.startsWith('/chat'))                    return pages.chat
  if (pathname.startsWith('/dashboards'))              return !!pages.dashboards
  if (pathname.startsWith('/dashboard/whatsapp'))      return pages.whatsapp
  if (pathname.startsWith('/dashboard/comunicacao'))   return pages.whatsapp
  if (pathname.startsWith('/dashboard/netmeet'))       return pages.netmeet
  if (pathname.startsWith('/dashboard/noc'))           return pages.monitoring
  if (pathname.startsWith('/dashboard/alertas'))       return pages.monitoring
  if (pathname.startsWith('/dashboard/status'))        return pages.monitoring
  if (pathname.startsWith('/monitoring/zabbix'))       return pages.zabbix
  if (pathname.startsWith('/monitoring'))              return pages.monitoring
  if (pathname.startsWith('/datalake'))                return pages.datalake
  if (pathname.startsWith('/rag'))                     return pages.rag
  return true
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname
      const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
      if (isPublic) return true
      if (!session) return false
      if (session.user.role === 'superadmin') return true

      const pages = (session.user.pages as UserPages) ?? DEFAULT_PAGES
      if (!checkPagePermission(pathname, pages)) {
        return NextResponse.redirect(new URL('/access-denied', request.url))
      }
      return true
    },

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
      }
      return token
    },

    session({ session, token }) {
      session.user.role = (token.role as string) ?? 'user'
      session.user.pages = token.pages as UserPages
      return session
    },
  },
})
