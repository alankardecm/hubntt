import { NextResponse } from 'next/server';
import { persistInboundCommunication } from '@/modules/communication/application/persist-inbound-communication';
import { handleBotMessage } from '@/lib/evolution-bot';
import { sendText } from '@/lib/evolution-api';
import { handleAudioMeeting } from '@/lib/netmeet-whatsapp';
import { registerLid, resolveReplyTarget, isRegistered, isWhitelisted } from '@/lib/bot-registry';
import { getEmailByPhone, registerPhoneEmail, isPhoneRegistered } from '@/lib/phone-email-registry';
import { savePendingAudio, getPendingAudio, clearPendingAudio } from '@/lib/pending-audio';

// Payload da Evolution API v1.x — evento MESSAGES_UPSERT
// data é um array de mensagens
type EvoMessageItem = {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
    audioMessage?: object;
    videoMessage?: { caption?: string };
    documentMessage?: { title?: string; mimetype?: string };
    stickerMessage?: object;
  };
  messageType: string;
  messageTimestamp: number;
  pushName?: string;
};

type EvoWebhookPayload = {
  event: string;        // "MESSAGES_UPSERT" em v1.x
  instance: string;
  data: EvoMessageItem | EvoMessageItem[];
  apikey?: string;
};

function extractText(item: EvoMessageItem): string {
  const m = item.message ?? {};
  const raw =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.title ||
    '';
  if (raw) return raw;

  const labels: Record<string, string> = {
    audioMessage:    '[audio recebido]',
    imageMessage:    '[imagem recebida]',
    videoMessage:    '[video recebido]',
    documentMessage: '[documento recebido]',
    stickerMessage:  '[figurinha recebida]',
    locationMessage: '[localizacao recebida]',
    contactMessage:  '[contato recebido]',
  };
  return labels[item.messageType] ?? '';
}

function isGroup(jid: string) {
  return jid.endsWith('@g.us');
}

// Normaliza o nome do evento para comparação
function isMessageUpsert(event: string) {
  const e = event.toLowerCase().replace(/[._]/g, '');
  return e === 'messagesupsert';
}

export async function POST(req: Request) {
  const payload = (await req.json()) as EvoWebhookPayload;

  // Ignorar tudo que não seja mensagem nova em tempo real
  if (!isMessageUpsert(payload.event)) {
    return NextResponse.json({ ok: true, skipped: true, event: payload.event });
  }

  // v1.x envia array; normaliza para sempre trabalhar com array
  const items = Array.isArray(payload.data) ? payload.data : [payload.data];
  const instance = payload.instance;

  const incoming = items.filter(item => !item.key.fromMe);

  // Persiste todas as mensagens no pipeline existente
  const results = await Promise.allSettled(
    incoming.map(item => {
      const jid   = item.key.remoteJid;
      const group = isGroup(jid);

      return persistInboundCommunication({
        source:           'whatsapp',
        sourceType:       group ? 'whatsapp_group' : 'whatsapp_direct',
        conversationId:   jid,
        conversationName: group ? jid.split('@')[0] : (item.pushName ?? jid.split('@')[0]),
        senderId:         item.key.participant ?? (group ? null : jid),
        senderName:       item.pushName ?? null,
        messageId:        item.key.id,
        messageText:      extractText(item),
        messageType:      item.messageType,
        mediaBase64:      null,
        mediaMimeType:    null,
        bridgeName:       `evolution:${instance}`,
        sentAt:           item.messageTimestamp,
      });
    })
  );

  // Bot: responde mensagens diretas (não de grupo) — texto e áudio
  for (const item of incoming) {
    const jid        = item.key.remoteJid;
    const text       = extractText(item).trim();
    const isTextMsg  = item.messageType === 'conversation' || item.messageType === 'extendedTextMessage';
    const isAudioDoc = item.messageType === 'documentMessage' &&
      (item.message?.documentMessage?.mimetype ?? '').startsWith('audio/')
    const isAudioMsg = item.messageType === 'audioMessage' || isAudioDoc;

    if (isGroup(jid)) continue;
    if (!isTextMsg && !isAudioMsg) continue;

    // Áudio → NetMeet: registra email se necessário, depois gera ata
    if (isAudioMsg) {
      const replyPhone = resolveReplyTarget(jid);
      const replyTo    = replyPhone ?? (!jid.includes('@lid') ? jid.split('@')[0] : null);
      if (replyTo && isWhitelisted(replyTo)) {
        const email = getEmailByPhone(replyTo);
        if (email) {
          // Já registrado — processa direto
          handleAudioMeeting(instance, item, replyTo, email, item.pushName)
            .catch(err => console.error('[NetMeet] erro ao processar áudio:', err));
        } else {
          // Salva áudio pendente e pede o email
          savePendingAudio(replyTo, {
            instance,
            item,
            replyTo,
            pushName: item.pushName ?? '',
            timestamp: new Date().toISOString(),
          });
          sendText(instance, replyTo,
            '🎙️ *Áudio recebido!*\n\n' +
            'Para salvar a ata no Hub Netturbo com seu nome, informe seu email corporativo:\n' +
            '_(ex: joao.silva@netturbo.com.br)_\n\n' +
            'Isso só precisa ser feito uma vez. Depois disso suas atas ficam disponíveis direto no Hub. 😊'
          ).catch(err => console.error('[NetMeet] erro ao pedir email:', err));
        }
      }
      continue;
    }

    // Texto
    if (!text) continue;

    // Comando /start <numero> — registra mapeamento LID → número real
    const startMatch = text.match(/^\/start\s+([\d\s()\-+]+)$/i);
    if (startMatch && jid.includes('@lid')) {
      const lid   = jid.split('@')[0];
      const phone = startMatch[1].replace(/\D/g, '');
      const full  = phone.startsWith('55') ? phone : `55${phone}`;
      registerLid(lid, full);
      sendText(instance, full,
        '✅ Número registrado! Agora posso responder suas mensagens.\n\nTente: *status* ou *oi*'
      ).catch(err => console.error('[Bot] erro ao confirmar /start:', err));
      continue;
    }

    // Resolve destino: número real (se LID registrado) ou número do JID
    const replyPhone = resolveReplyTarget(jid);
    const replyTo    = replyPhone ?? (!jid.includes('@lid') ? jid.split('@')[0] : null);

    // Verifica whitelist
    if (replyTo && !isWhitelisted(replyTo)) {
      console.warn(`[Bot] número não autorizado: ${replyTo}`);
      continue;
    }

    if (!replyTo) {
      // LID ainda não registrado — tenta avisar (vai falhar silenciosamente)
      sendText(instance, jid,
        '👋 Para ativar o assistente, envie:\n*/start SEU_NUMERO*\n\nEx: `/start 19999999999`'
      ).catch(() => console.warn(`[Bot] @lid sem registro, não respondeu: ${jid}`));
      continue;
    }

    // Detecção de email corporativo — resposta ao pedido do NetMeet
    const emailMatch = text.match(/^[\w.+-]+@[\w-]+\.[\w.]+$/)
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase()
      const pending = getPendingAudio(replyTo)
      if (pending) {
        registerPhoneEmail(replyTo, email)
        clearPendingAudio(replyTo)
        sendText(instance, replyTo, `✅ Email *${email}* registrado! Processando sua ata agora...`)
          .catch(() => {})
        handleAudioMeeting(
          pending.instance,
          pending.item as Parameters<typeof handleAudioMeeting>[1],
          pending.replyTo,
          email,
          pending.pushName,
        ).catch(err => console.error('[NetMeet] erro ao processar áudio pendente:', err))
        continue
      }
    }

    // Fire-and-forget
    handleBotMessage(text, item.pushName ?? undefined)
      .then(reply => sendText(instance, replyTo, reply))
      .catch(err  => console.error('[Bot] falha ao responder:', err));
  }

  const saved  = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({ ok: true, saved, failed });
}
