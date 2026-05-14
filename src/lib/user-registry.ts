import fs from 'fs'
import path from 'path'

export interface UserPages {
  chat: boolean
  dashboards: false | 'view' | 'edit'
  monitoring: boolean
  zabbix: boolean
  whatsapp: boolean
  datalake: boolean
  rag: boolean
  netmeet: boolean
}

export interface RegistryUser {
  name: string
  email: string
  picture?: string
  role: 'superadmin' | 'user'
  firstLogin: string
  lastLogin: string
  pages: UserPages
}

export type UserRegistry = Record<string, RegistryUser>

const REGISTRY_PATH = path.join(process.cwd(), '.runtime', 'auth', 'users.json')

export const DEFAULT_PAGES: UserPages = {
  chat: true,
  dashboards: false,
  monitoring: false,
  zabbix: false,
  whatsapp: false,
  datalake: false,
  rag: false,
  netmeet: false,
}

export const SUPERADMIN_PAGES: UserPages = {
  chat: true,
  dashboards: 'edit',
  monitoring: true,
  zabbix: true,
  whatsapp: true,
  datalake: true,
  rag: true,
  netmeet: true,
}

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
