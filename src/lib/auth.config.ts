// Config Edge-safe — sem imports de Node.js
// Usado pelo middleware (Edge Runtime)

import type { NextAuthConfig } from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { NextResponse } from "next/server"
import { DEFAULT_PAGES, checkPagePermission } from "@/lib/user-pages"
import type { UserPages } from "@/lib/user-pages"

const SUPERADMIN_EMAILS = ["alan.moreira@netturbo.com.br"]

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/evolution/webhook",
  "/api/health",
  "/access-denied",
]

export const authConfig: NextAuthConfig = {
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
  },
}
