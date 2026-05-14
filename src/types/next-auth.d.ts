import { DefaultSession } from "next-auth"
import "next-auth/jwt"
import type { UserPages } from "@/lib/user-registry"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      pages?: UserPages
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    pages?: UserPages
  }
}
