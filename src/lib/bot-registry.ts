import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const REGISTRY_FILE = join(process.cwd(), '.bot-registry.json');

function load(): Record<string, string> {
  try {
    if (existsSync(REGISTRY_FILE)) {
      return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8')) as Record<string, string>;
    }
  } catch { /* ignora arquivo corrompido */ }
  return {};
}

function save(data: Record<string, string>) {
  try {
    writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[BotRegistry] falha ao salvar:', e);
  }
}

export function registerLid(lid: string, phone: string) {
  const clean  = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;
  const data   = load();
  data[lid]    = number;
  save(data);
}

export function resolveReplyTarget(jid: string): string | null {
  if (!jid.includes('@lid')) return null;
  const lid = jid.split('@')[0];
  return load()[lid] ?? null;
}

export function isRegistered(jid: string): boolean {
  if (!jid.includes('@lid')) return true;
  return Boolean(load()[jid.split('@')[0]]);
}

// Verifica se o número resolvido está na whitelist (BOT_WHITELIST=55199...,55119...)
export function isWhitelisted(phone: string): boolean {
  const raw = process.env.BOT_WHITELIST ?? '';
  if (!raw.trim()) return true; // sem whitelist = aberto
  const allowed = raw.split(',').map(n => n.replace(/\D/g, '').trim());
  const clean   = phone.replace(/\D/g, '');
  return allowed.some(n => clean.endsWith(n) || n.endsWith(clean));
}
