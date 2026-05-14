import fs from 'fs'
import path from 'path'

const REGISTRY_PATH = path.join(process.cwd(), '.runtime', 'phone-email.json')

type PhoneEmailMap = Record<string, string> // phone → email

function load(): PhoneEmailMap {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return {}
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function save(data: PhoneEmailMap): void {
  const dir = path.dirname(REGISTRY_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2))
}

export function getEmailByPhone(phone: string): string | null {
  return load()[phone] ?? null
}

export function registerPhoneEmail(phone: string, email: string): void {
  const data = load()
  data[phone] = email.toLowerCase().trim()
  save(data)
}

export function isPhoneRegistered(phone: string): boolean {
  return phone in load()
}
