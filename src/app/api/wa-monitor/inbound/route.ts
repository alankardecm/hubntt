import { NextResponse } from 'next/server';
import { persistInboundCommunication } from '@/modules/communication/application/persist-inbound-communication';

type InboundPayload = {
  group_id?: string;
  group_name?: string;
  group_jid?: string;
  sender_jid?: string;
  sender_name?: string;
  message_text?: string;
  text?: string;
  msg_timestamp?: number;
  timestamp?: number | string;
  source_type?: string;
  message_id?: string;
  message_type?: string;
  bridge_name?: string;
};

function authError() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const token = process.env.WHATSAPP_CAPTURE_TOKEN;
  if (token) {
    const received = request.headers.get('x-wa-capture-token');
    if (!received || received !== token) return authError();
  }

  const payload = (await request.json()) as InboundPayload;
  const sentAt =
    payload.msg_timestamp ||
    (typeof payload.timestamp === 'number' ? payload.timestamp : undefined) ||
    Math.floor(Date.now() / 1000);

  const result = await persistInboundCommunication({
    source: 'whatsapp',
    sourceType: payload.source_type || 'whatsapp_group',
    conversationId: payload.group_id || payload.group_jid,
    conversationName: payload.group_name || payload.group_id || payload.group_jid,
    senderId: payload.sender_jid || null,
    senderName: payload.sender_name || null,
    messageId: payload.message_id || null,
    messageText: payload.message_text || payload.text || '',
    messageType: payload.message_type || null,
    bridgeName: payload.bridge_name || request.headers.get('x-bridge-name') || null,
    sentAt,
  });

  return NextResponse.json(result, { status: result.status });
}
