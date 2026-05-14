import fs from 'fs'
import path from 'path'
import type { UserPages } from '@/lib/user-pages'
import { DEFAULT_PAGES, SUPERADMIN_PAGES } from '@/lib/user-pages'

export type { UserPages }

export interface RegistryUser {
  name: string
  email: string
  picture?: string
  role: 'superadmin' | 'user'
  firstLogin: string
  lastLogin: string
  pages: UserPages
  tokenVersion: number
}

export type UserRegistry = Record<string, RegistryUser>

const REGISTRY_PATH = path.join(process.cwd(), '.runtime', 'auth', 'users.json')

export function loadRegistry(): UserRegistry {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return {}
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function saveRegistry(registry: UserRegistry): void {
  const dir = path.dirname(REGISTRY_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2))
}

export function registerLogin(params: {
  email: string
  name?: string
  picture?: string
  role: 'superadmin' | 'user'
}): RegistryUser {
  const registry = loadRegistry()
  const now = new Date().toISOString()
  const existing = registry[params.email]

  const user: RegistryUser = {
    name: params.name ?? existing?.name ?? params.email,
    email: params.email,
    picture: params.picture ?? existing?.picture,
    role: params.role,
    firstLogin: existing?.firstLogin ?? now,
    lastLogin: now,
    pages: existing?.pages ?? (params.role === 'superadmin' ? SUPERADMIN_PAGES : DEFAULT_PAGES),
    tokenVersion: existing?.tokenVersion ?? 0,
  }

  registry[params.email] = user
  saveRegistry(registry)
  return user
}

export function getUserPages(email: string): UserPages {
  return loadRegistry()[email]?.pages ?? DEFAULT_PAGES
}

export function updateUserPages(email: string, update: Partial<UserPages>): boolean {
  const registry = loadRegistry()
  if (!registry[email]) return false
  registry[email].pages = { ...registry[email].pages, ...update }
  saveRegistry(registry)
  return true
}

export function forceLogout(email: string): boolean {
  const registry = loadRegistry()
  if (!registry[email]) return false
  registry[email].tokenVersion = (registry[email].tokenVersion ?? 0) + 1
  saveRegistry(registry)
  return true
}

export function getTokenVersion(email: string): number {
  return loadRegistry()[email]?.tokenVersion ?? 0
}

// Retorna 'all' para superadmin, lista de tabelas para user, [] se sem acesso
export function getUserAllowedTables(email: string): string[] | 'all' {
  const user = loadRegistry()[email]
  if (!user) return []
  if (user.role === 'superadmin') return 'all'
  if (!user.pages.dashboards) return []
  return user.pages.dashboardTables ?? []
}

export function updateUserTables(email: string, tables: string[]): boolean {
  const registry = loadRegistry()
  if (!registry[email]) return false
  registry[email].pages.dashboardTables = tables
  saveRegistry(registry)
  return true
}
