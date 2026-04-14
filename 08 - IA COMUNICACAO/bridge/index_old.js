const path = require('path');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  Browsers,
  proto,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} = require('@whiskeysockets/baileys');

const { ALLOWED_GROUPS, EXCLUDED_GROUPS } = require('./config/groups.whitelist');
const { normalizeGroupKey } = require('../../src/lib/waGroups');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const logger = pino({
  level: 'info',
});

const HUB_API_URL = process.env.HUB_API_URL || 'http://localhost:4000';
const CAPTURE_TOKEN = process.env.WHATSAPP_CAPTURE_TOKEN || '';
const BRIDGE_NAME = process.env.BRIDGE_NAME || 'wa-intelligence-bridge';
const MONITOR_ALL_GROUPS = String(process.env.MONITOR_ALL_GROUPS || 'true').toLowerCase() === 'true';
const RESET_SESSION = String(process.env.WA_RESET_SESSION || 'false').toLowerCase() === 'true';
const SYNC_FULL_HISTORY = String(process.env.WA_SYNC_FULL_HISTORY || 'true').toLowerCase() !== 'false';
const BACKFILL_TIME_ZONE = process.env.WA_BACKFILL_TIME_ZONE || 'America/Sao_Paulo';
const BACKFILL_CHUNK_SIZE = Math.min(Math.max(Number(process.env.WA_BACKFILL_CHUNK_SIZE || 50) || 50, 1), 50);

const authDir = path.join(__dirname, 'auth_session');
const historyAnchorsFile = path.join(authDir, 'history_anchors.json');
let resetSessionApplied = false;
const seenMessageKeys = new Set();
const historyBackfillState = new Map();
let historyAnchorsLoaded = false;
const localDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BACKFILL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getLocalDayKey(timestampSeconds) {
  return localDayFormatter.format(new Date(Number(timestampSeconds) * 1000));
}

function getTodayLocalDayKey() {
  return localDayFormatter.format(new Date());
}

function normalizeJid(jid) {
  if (!jid) return '';
  return jidNormalizedUser(jid);
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMessageTimestampRaw(message) {
  const timestamp = message?.messageTimestamp;
  const parsed = Number(timestamp?.toString?.() || timestamp);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Date.now();
}

function normalizeTimestampToSeconds(rawTimestamp) {
  const raw = Number(rawTimestamp);
  if (!Number.isFinite(raw) || raw <= 0) return Math.floor(Date.now() / 1000);
  return raw > 1e12 ? Math.floor(raw / 1000) : raw;
}

function normalizeTimestampToMilliseconds(rawTimestamp) {
  const raw = Number(rawTimestamp);
  if (!Number.isFinite(raw) || raw <= 0) return Date.now();
  return raw > 1e12 ? raw : raw * 1000;
}

function getMessageKey(message) {
  return `${normalizeJid(message?.key?.remoteJid || '')}:${message?.key?.id || ''}`;
}

function shouldKeepHistoryMessage(message, todayKey = getTodayLocalDayKey()) {
  return getLocalDayKey(normalizeTimestampToSeconds(getMessageTimestampRaw(message))) === todayKey;
}

function isAllowedGroup(jid, groupName = '') {
  const normalizedJid = normalizeJid(jid);
  const normalizedName = normalizeGroupKey(groupName);
  const allowed = new Set(
    (ALLOWED_GROUPS || [])
      .map((item) => normalizeGroupKey(item))
      .filter(Boolean)
      .concat(parseList(process.env.ALLOWED_GROUPS).map((item) => normalizeGroupKey(item)))
  );
  const excluded = new Set(
    (EXCLUDED_GROUPS || [])
      .map((item) => normalizeGroupKey(item))
      .filter(Boolean)
      .concat(parseList(process.env.EXCLUDED_GROUPS).map((item) => normalizeGroupKey(item)))
  );

  if (excluded.has(normalizedJid) || excluded.has(normalizedName)) return false;
  if (!MONITOR_ALL_GROUPS && allowed.size === 0) return false;
  if (allowed.size === 0) return true;
  return allowed.has(normalizedJid) || allowed.has(normalizedName);
}

const groupTitleCache = new Map();

async function getGroupTitle(sock, groupJid) {
  if (groupTitleCache.has(groupJid)) {
    return groupTitleCache.get(groupJid);
  }

  try {
    const metadata = await sock.groupMetadata(groupJid);
    const title = String(metadata?.subject || groupJid).trim();
    groupTitleCache.set(groupJid, title);
    return title;
  } catch {
    return groupJid;
  }
}

function extractText(message) {
  if (!message) return '';
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  if (message.buttonsResponseMessage?.selectedDisplayText) return message.buttonsResponseMessage.selectedDisplayText;
  if (message.listResponseMessage?.title) return message.listResponseMessage.title;
  if (message.templateButtonReplyMessage?.selectedDisplayText) return message.templateButtonReplyMessage.selectedDisplayText;
  return '';
}

async function postToHub(payload) {
  if (!CAPTURE_TOKEN) {
    throw new Error('WHATSAPP_CAPTURE_TOKEN is missing');
  }

  const response = await fetch(`${HUB_API_URL.replace(/\/$/, '')}/api/wa-monitor/inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wa-capture-token': CAPTURE_TOKEN,
      'x-bridge-name': BRIDGE_NAME,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Hub returned HTTP ${response.status}`);
  }
  return data;
}

async function loadHubGroupAnchors() {
  try {
    const response = await fetch(`${HUB_API_URL.replace(/\/$/, '')}/api/wa-monitor/groups`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      logger.warn({ error: data?.error || `HTTP ${response.status}` }, 'Falha ao carregar grupos do hub para bootstrap de historico');
      return [];
    }
    return Array.isArray(data.groups) ? data.groups : [];
  } catch (error) {
    logger.warn({ error: String(error) }, 'Falha ao consultar grupos do hub para bootstrap de historico');
    return [];
  }
}

function loadPersistedAnchors() {
  if (historyAnchorsLoaded) return;
  historyAnchorsLoaded = true;

  if (!fs.existsSync(historyAnchorsFile)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(historyAnchorsFile, 'utf8'));
    for (const [groupJid, anchor] of Object.entries(parsed || {})) {
      if (!anchor?.messageId || !anchor?.timestampMs) continue;
      const state = getHistoryState(groupJid);
      state.oldestTimestampRaw = anchor.timestampRaw || anchor.timestampMs;
      state.oldestTimestampMs = anchor.timestampMs;
      state.oldestTimestampSeconds = normalizeTimestampToSeconds(anchor.timestampMs);
      state.oldestKey = {
        id: anchor.messageId,
        remoteJid: groupJid,
        fromMe: false,
      };
    }
    logger.info({ anchorCount: Object.keys(parsed || {}).length }, 'Historico persistido carregado');
  } catch (error) {
    logger.warn({ error: String(error) }, 'Falha ao ler historico persistido');
  }
}

let saveAnchorsTimer = null;
function persistHistoryAnchorsDebounced() {
  if (saveAnchorsTimer) clearTimeout(saveAnchorsTimer);
  saveAnchorsTimer = setTimeout(() => {
    const payload = {};
    for (const [groupJid, state] of historyBackfillState.entries()) {
      if (!state.oldestKey?.id || !state.oldestTimestampMs) continue;
      payload[groupJid] = {
        messageId: state.oldestKey.id,
        timestampMs: state.oldestTimestampMs,
        timestampRaw: state.oldestTimestampRaw || state.oldestTimestampMs,
      };
    }

    try {
      fs.writeFileSync(historyAnchorsFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (error) {
      logger.warn({ error: String(error) }, 'Falha ao salvar historico persistido');
    }
  }, 500);
}

async function requestFullHistorySync(sock) {
  if (!SYNC_FULL_HISTORY) return;

  const requestId = `${BRIDGE_NAME}-${Date.now()}`;
  try {
    const result = await sock.sendPeerDataOperationMessage({
      peerDataOperationRequestType: proto.Message.PeerDataOperationRequestType.FULL_HISTORY_SYNC_ON_DEMAND,
      fullHistorySyncOnDemandRequest: {
        requestMetadata: {
          requestId,
        },
        historySyncConfig: {
          storageQuotaMb: 10240,
          inlineInitialPayloadInE2EeMsg: true,
          supportCallLogHistory: false,
          supportBotUserAgentChatHistory: true,
          supportCagReactionsAndPolls: true,
          supportBizHostedMsg: true,
          supportRecentSyncChunkMessageCountTuning: true,
          supportHostedGroupMsg: true,
          supportFbidBotChatHistory: true,
          supportMessageAssociation: true,
        },
      },
    });
    logger.info({ requestId, result }, 'Solicitado full history sync on demand');
  } catch (error) {
    logger.warn({ error: String(error), requestId }, 'Falha ao solicitar full history sync on demand');
  }
}

function getHistoryState(groupJid) {
  if (!historyBackfillState.has(groupJid)) {
    historyBackfillState.set(groupJid, {
      oldestTimestampRaw: null,
      oldestTimestampMs: null,
      oldestKey: null,
      lastRequestedMessageId: null,
      lastRequestedTimestampMs: null,
      pending: false,
      finished: false,
    });
  }

  return historyBackfillState.get(groupJid);
}

function registerHistoryAnchor(groupJid, message) {
  const rawTimestamp = getMessageTimestampRaw(message);
  const timestampSeconds = normalizeTimestampToSeconds(rawTimestamp);
  const timestampMs = normalizeTimestampToMilliseconds(rawTimestamp);
  const state = getHistoryState(groupJid);
  if (state.finished) return;

  if (!state.oldestTimestampRaw || rawTimestamp < state.oldestTimestampRaw) {
    state.oldestTimestampRaw = rawTimestamp;
    state.oldestTimestampMs = timestampMs;
    state.oldestTimestampSeconds = timestampSeconds;
    state.oldestKey = {
      id: message?.key?.id,
      remoteJid: message?.key?.remoteJid,
      fromMe: Boolean(message?.key?.fromMe),
    };
    persistHistoryAnchorsDebounced();
  }
}

function registerFallbackHistoryAnchor(groupJid, timestampSeconds, reason = 'fallback') {
  const state = getHistoryState(groupJid);
  if (state.finished || state.oldestKey?.id) return false;

  const normalizedSeconds = normalizeTimestampToSeconds(timestampSeconds);
  const timestampMs = normalizeTimestampToMilliseconds(normalizedSeconds);
  state.oldestTimestampRaw = normalizedSeconds;
  state.oldestTimestampMs = timestampMs;
  state.oldestTimestampSeconds = normalizedSeconds;
  state.oldestKey = {
    id: `bootstrap:${groupJid}:${timestampMs}`,
    remoteJid: groupJid,
    fromMe: false,
  };

  logger.info(
    {
      groupJid,
      timestampSeconds: normalizedSeconds,
      timestampMs,
      reason,
    },
    'Ancora provisoria criada para historico'
  );
  persistHistoryAnchorsDebounced();
  return true;
}

function isSyntheticHistoryAnchor(messageId) {
  return String(messageId || '').startsWith('bootstrap:');
}

async function requestOlderHistory(sock, groupJid) {
  if (!SYNC_FULL_HISTORY) return;

  const state = getHistoryState(groupJid);
  if (state.finished || state.pending || !state.oldestKey || !state.oldestTimestampMs) return;
  if (!state.oldestKey.id) return;
  if (isSyntheticHistoryAnchor(state.oldestKey.id)) {
    logger.warn(
      {
        groupJid,
        oldestMessageId: state.oldestKey.id,
      },
      'Histórico ignorado porque a âncora ainda é sintética'
    );
    return;
  }

  if (getLocalDayKey(state.oldestTimestampSeconds || normalizeTimestampToSeconds(state.oldestTimestampRaw)) !== getTodayLocalDayKey()) {
    state.finished = true;
    return;
  }

  if (
    state.lastRequestedMessageId === state.oldestKey.id &&
    state.lastRequestedTimestampMs === state.oldestTimestampMs
  ) {
    return;
  }

  state.pending = true;
  state.lastRequestedMessageId = state.oldestKey.id;
  state.lastRequestedTimestampMs = state.oldestTimestampMs;

  try {
    logger.info(
      {
        groupJid,
        oldestMessageId: state.oldestKey.id,
        oldestTimestampMs: state.oldestTimestampMs,
        oldestTimestampRaw: state.oldestTimestampRaw,
      },
      'Solicitando historico adicional do grupo'
    );
    await sock.fetchMessageHistory(BACKFILL_CHUNK_SIZE, state.oldestKey, state.oldestTimestampMs);
  } catch (error) {
    logger.warn(
      {
        error: String(error),
        groupJid,
      },
      'Falha ao solicitar historico adicional do grupo'
    );
  } finally {
    state.pending = false;
  }
}

async function seedHistoryAnchorsFromChats(chats, sock) {
  if (!SYNC_FULL_HISTORY || !Array.isArray(chats) || chats.length === 0) return;

  let seeded = 0;
  for (const chat of chats) {
    const groupJid = normalizeJid(chat?.id);
    const groupName = String(chat?.name || groupJid || '').trim();
    if (!groupJid || !groupJid.endsWith('@g.us')) continue;
    if (!isAllowedGroup(groupJid, groupName)) continue;

    const state = getHistoryState(groupJid);
    if (state.oldestKey?.id || state.pending || state.finished) continue;

    const candidateTimestamp = normalizeTimestampToSeconds(
      chat?.lastMessageRecvTimestamp || chat?.conversationTimestamp || Math.floor(Date.now() / 1000)
    );

    if (registerFallbackHistoryAnchor(groupJid, candidateTimestamp, 'chats.upsert')) {
      seeded += 1;
    }
  }

  if (seeded > 0) {
    logger.info({ seededGroups: seeded }, 'Bootstrap de historico reforcado a partir da lista de chats');
  }
}

async function seedHistoryAnchorsFromParticipatingGroups(sock) {
  if (!SYNC_FULL_HISTORY) return;

  let groups = {};
  try {
    groups = await sock.groupFetchAllParticipating();
  } catch (error) {
    logger.warn({ error: String(error) }, 'Falha ao listar grupos participantes para bootstrap de historico');
    return;
  }

  const hubGroups = await loadHubGroupAnchors();
  const hubGroupsByJid = new Map(
    hubGroups.map((group) => [normalizeJid(group?.whatsapp_jid || ''), group])
  );
  let seeded = 0;

  for (const group of Object.values(groups || {})) {
    const groupJid = normalizeJid(group?.id);
    const groupName = String(group?.subject || groupJid || '').trim();
    if (!groupJid || !isAllowedGroup(groupJid, groupName)) continue;

    const state = getHistoryState(groupJid);
    if (state.pending || state.finished || state.oldestKey?.id) continue;

    groupTitleCache.set(groupJid, groupName || groupJid);

    const hubGroup = hubGroupsByJid.get(groupJid);
    const latestMessage = hubGroup?.latest_message;
    if (latestMessage?.external_message_id && latestMessage?.msg_timestamp) {
      state.oldestTimestampRaw = latestMessage.msg_timestamp;
      state.oldestTimestampMs = normalizeTimestampToMilliseconds(latestMessage.msg_timestamp);
      state.oldestTimestampSeconds = normalizeTimestampToSeconds(latestMessage.msg_timestamp);
      state.oldestKey = {
        id: latestMessage.external_message_id,
        remoteJid: groupJid,
        fromMe: false,
      };
      seeded += 1;
    }
  }

  logger.info(
    {
      seededGroups: seeded,
    },
    'Bootstrap de historico iniciado para grupos permitidos'
  );

  for (const groupJid of historyBackfillState.keys()) {
    await requestOlderHistory(sock, groupJid);
  }
}

function scheduleHistorySweep(sock, delayMs = 2500) {
  if (!SYNC_FULL_HISTORY) return;

  setTimeout(async () => {
    for (const groupJid of historyBackfillState.keys()) {
      try {
        await requestOlderHistory(sock, groupJid);
      } catch (error) {
        logger.warn(
          {
            error: String(error),
            groupJid,
          },
          'Falha ao executar varredura de historico'
        );
      }
    }
  }, delayMs);
}

async function processCapturedMessage(sock, message, source = 'live') {
  if (!message?.message) return;
  if (message.key?.fromMe) return;
  if (!message.key?.remoteJid || !String(message.key.remoteJid).endsWith('@g.us')) return;

  const groupJid = normalizeJid(message.key.remoteJid);
  const groupName = await getGroupTitle(sock, groupJid);
  const senderJid = normalizeJid(message.key.participant || message.key.remoteJid);
  const senderName = message.pushName || senderJid;

  if (!isAllowedGroup(groupJid, groupName)) {
    return;
  }

  registerHistoryAnchor(groupJid, message);

  if (source === 'history' && !shouldKeepHistoryMessage(message)) {
    return;
  }

  const text = extractText(message.message).trim();
  if (!text) return;

  const dedupeKey = getMessageKey(message);
  if (seenMessageKeys.has(dedupeKey)) return;
  seenMessageKeys.add(dedupeKey);

  const rawTimestamp = getMessageTimestampRaw(message);
  const payload = {
    source_type: source === 'history' ? 'whatsapp_group_history' : 'whatsapp_group',
    bridge_name: BRIDGE_NAME,
    group_jid: groupJid,
    group_name: groupName,
    sender_jid: senderJid,
    sender_name: senderName,
    message_text: text,
    msg_timestamp: normalizeTimestampToSeconds(rawTimestamp),
    message_id: message.key.id,
    message_type: Object.keys(message.message)[0] || 'unknown',
  };

  if (source === 'history') {
    registerHistoryAnchor(groupJid, message);
  }

  logger.info(
    {
      groupName,
      groupJid,
      senderName,
      senderJid,
      messageId: message.key.id,
      source,
    },
    'Mensagem capturada do grupo'
  );

  let result;
  try {
    result = await postToHub(payload);
  } catch (error) {
    seenMessageKeys.delete(dedupeKey);
    throw error;
  }

  logger.info(
    {
      groupName,
      groupJid,
      senderName,
      senderJid,
      messageId: message.key.id,
      source,
      sentiment: result?.analysis?.sentiment,
      keywords: result?.analysis?.keywords || [],
    },
    'Mensagem enviada ao hub'
  );

  if (source !== 'history') {
    await requestOlderHistory(sock, groupJid);
  }
}

async function processHistoryChat(sock, chat) {
  const groupJid = normalizeJid(chat?.id);
  const groupName = String(chat?.name || groupJid || '').trim();
  if (!groupJid || !groupJid.endsWith('@g.us')) return;
  if (!isAllowedGroup(groupJid, groupName)) return;

  const historyMessage = chat?.messages?.[0]?.message;
  if (historyMessage?.key?.id) {
    const state = getHistoryState(groupJid);
    if (!state.oldestKey?.id) {
      registerHistoryAnchor(groupJid, historyMessage);
      await requestOlderHistory(sock, groupJid);
      return;
    }
  }
}

async function start() {
  if (RESET_SESSION && !resetSessionApplied) {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    resetSessionApplied = true;
  }

  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  loadPersistedAnchors();

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    markOnlineOnConnect: false,
    syncFullHistory: SYNC_FULL_HISTORY,
    shouldSyncHistoryMessage: () => SYNC_FULL_HISTORY,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info({ bridge: BRIDGE_NAME }, 'QR code gerado. Escaneie com o WhatsApp Business da empresa.');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn({ statusCode, shouldReconnect }, 'Conexao encerrada');
      if (shouldReconnect) {
        start().catch((error) => logger.error({ error }, 'Falha ao reiniciar o bridge'));
      }
    }

    if (connection === 'open') {
      logger.info({ bridge: BRIDGE_NAME, syncFullHistory: SYNC_FULL_HISTORY }, 'Conexao estabelecida');
      requestFullHistorySync(sock).catch((error) => {
        logger.warn({ error: String(error) }, 'Falha ao disparar full history sync');
      });
      seedHistoryAnchorsFromParticipatingGroups(sock).catch((error) => {
        logger.warn({ error: String(error) }, 'Falha no bootstrap de historico');
      });
      scheduleHistorySweep(sock, 3500);
      scheduleHistorySweep(sock, 12000);
    }
  });

  sock.ev.on('chats.upsert', async (chats) => {
    try {
      await seedHistoryAnchorsFromChats(chats, sock);
    } catch (error) {
      logger.warn({ error: String(error) }, 'Falha ao reforcar bootstrap de historico pelos chats');
    }
  });

  sock.ev.on('messaging-history.set', async (event) => {
    const messages = event.messages || [];
    const chats = event.chats || [];
    const todayKey = getTodayLocalDayKey();
    const seenGroups = new Set();

    logger.info(
      {
        bridge: BRIDGE_NAME,
        messageCount: messages.length,
        chatCount: chats.length,
        isLatest: event.isLatest,
        progress: event.progress,
        syncType: event.syncType,
      },
      'Historico do WhatsApp recebido'
    );

    for (const chat of chats) {
      try {
        await processHistoryChat(sock, chat);
      } catch (error) {
        logger.error(
          {
            error: String(error),
            groupJid: chat?.id,
          },
          'Falha ao processar chat de historico'
        );
      }
    }

    for (const message of messages) {
      try {
        const remoteJid = message?.key?.remoteJid || '';
        if (!remoteJid.endsWith('@g.us')) continue;
        const groupJid = normalizeJid(remoteJid);
        seenGroups.add(groupJid);
        await processCapturedMessage(sock, message, 'history');
      } catch (error) {
        logger.error(
          {
            error: String(error),
            messageId: message?.key?.id,
            remoteJid: message?.key?.remoteJid,
          },
          'Falha ao processar mensagem de historico'
        );
      }
    }

    if (!SYNC_FULL_HISTORY) return;

    for (const groupJid of seenGroups) {
      const state = getHistoryState(groupJid);
      if (state.finished || !state.oldestTimestampMs) continue;
      if (getLocalDayKey(state.oldestTimestampSeconds || normalizeTimestampToSeconds(state.oldestTimestampRaw)) !== todayKey) {
        state.finished = true;
        continue;
      }

      await requestOlderHistory(sock, groupJid);
    }

    seedHistoryAnchorsFromParticipatingGroups(sock).catch((error) => {
      logger.warn({ error: String(error) }, 'Falha ao reforcar bootstrap de historico');
    });
    scheduleHistorySweep(sock, 1500);
  });

  sock.ev.on('messages.upsert', async (event) => {
    for (const msg of event.messages || []) {
      try {
        await processCapturedMessage(sock, msg, 'live');
      } catch (error) {
        logger.error(
          {
            error: String(error),
            messageId: msg.key?.id,
            remoteJid: msg.key?.remoteJid,
          },
          'Falha ao processar mensagem'
        );
      }
    }
  });
}

start().catch((error) => {
  logger.fatal({ error: String(error) }, 'Bridge encerrou com erro');
  process.exit(1);
});
