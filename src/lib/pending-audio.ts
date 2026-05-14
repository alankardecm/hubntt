import fs from 'fs'
import path from 'path'

const PENDING_PATH = path.join(process.cwd(), '.runtime', 'pending-audio.json')
const TTL_MS = 10 * 60 * 1000 // 10 minutos

type PendingItem = {
  instance: string
  item: object
  replyTo: string
  pushName: string
  timestamp: string
}

type PendingMap = Record<string, PendingItem>

function load(): PendingMap {
  try {
    if (!fs.existsSync(PENDING_PATH)) return {}
    return JSON.parse(fs.readFileSync(PENDING_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function save(data: PendingMap): void {
  const dir = path.dirname(PENDING_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(PENDING_PATH, JSON.stringify(data, null, 2))
}

export function savePendingAudio(phone: string, item: PendingItem): void {
  const data = load()
  data[phone] = item
  save(data)
}

export function getPendingAudio(phone: string): PendingItem | null {
  const data = load()
  const pending = data[phone]
  if (!pending) return null
  // Verifica TTL
  if (Date.now() - new Date(pending.timestamp).getTime() > TTL_MS) {
    delete data[phone]
    save(data)
    return null
  }
  return pending
}

export function clearPendingAudio(phone: string): void {
  const data = load()
  delete data[phone]
  save(data)
}
