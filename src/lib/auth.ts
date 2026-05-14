import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

const SUPERADMIN_EMAILS = ["alan.moreira@netturbo.com.br"]

const PUBLIC_PATHS = [
  "/api/auth",
  "/api/evolution/webhook",
  "/api/health",
]

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
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
      if (isPublic) return true
      return !!session
    },
    jwt({ token }) {
      if (token.email) {
        token.role = SUPERADMIN_EMAILS.includes(token.email) ? "superadmin" : "user"
      }
      return token
    },
    session({ session, token }) {
      session.user.role = (token.role as string) ?? "user"
      return session
    },
  },
})
