import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export const runtime = 'nodejs'

const { auth } = NextAuth(authConfig)
export { auth as proxy }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)"],
}
