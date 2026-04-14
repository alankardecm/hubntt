import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

type GroupRow = {
  id: string;
  name: string;
  whatsapp_jid?: string | null;
  is_active?: boolean | null;
};

type MessageInsightRow = {
  id: string;
  group_id: string;
  created_at: string;
  text_raw: string;
  wa_groups?: { id: string; name: string } | Array<{ id: string; name: string }>;
};

type AnalysisInsightRow = {
  id: string;
  message_id: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  keywords?: string[];
  urgency?: string;
  topic?: string;
  wa_messages?: {
    group_id?: string;
    created_at?: string;
    wa_groups?: { id: string; name: string } | Array<{ id: string; name: string }>;
  };
};

function normalizeValue(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Number(searchParams.get('days') || '7') || 7, 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const supabase = getSupabaseAdmin();
    const [groupsRes, messagesRes, analysisRes, insightsRes] = await Promise.all([
      supabase.from('wa_groups').select('id, name, whatsapp_jid, is_active'),
      supabase
        .from('wa_messages')
        .select('id, group_id, created_at, text_raw, wa_groups(id, name)')
        .gte('created_at', since.toISOString()),
      supabase
        .from('wa_analysis')
        .select('id, message_id, sentiment, sentiment_score, keywords, urgency, topic, wa_messages!inner(group_id, created_at, wa_groups(id, name))')
        .gte('analyzed_at', since.toISOString()),
      supabase
        .from('wa_daily_insights')
        .select('*')
        .gte('date', since.toISOString().slice(0, 10)),
    ]);

    const groups = (groupsRes.data || []) as GroupRow[];
    const messages = (messagesRes.data || []) as MessageInsightRow[];
    const analysis = (analysisRes.data || []) as AnalysisInsightRow[];
    const storedInsights = insightsRes.data || [];

    const positive = analysis.filter((item) => item.sentiment === 'positive').length;
    const neutral = analysis.filter((item) => item.sentiment === 'neutral').length;
    const negative = analysis.filter((item) => item.sentiment === 'negative').length;
    const urgent = analysis.filter((item) => normalizeValue(item.urgency) === 'critica').length;

    const keywordMap = new Map<string, number>();
    analysis.forEach((item) => {
      (item.keywords || []).forEach((kw: string) => {
        keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
      });
    });

    const topKeywords = [...keywordMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));

    const conversationMap = new Map<string, { group_id: string; group_name: string; count: number; last_text: string; last_at: string; negative_count: number }>();
    messages.forEach((message) => {
      const group = Array.isArray(message.wa_groups) ? message.wa_groups[0] : message.wa_groups;
      const groupId = message.group_id;
      const groupName = group?.name || 'Grupo';
      const current = conversationMap.get(groupId) || {
        group_id: groupId,
        group_name: groupName,
        count: 0,
        last_text: '',
        last_at: '',
        negative_count: 0,
      };
      current.count += 1;
      if (!current.last_at || new Date(message.created_at) > new Date(current.last_at)) {
        current.last_at = message.created_at;
        current.last_text = message.text_raw;
        current.group_name = groupName;
      }
      conversationMap.set(groupId, current);
    });

    analysis.forEach((item) => {
      const group = Array.isArray(item.wa_messages?.wa_groups) ? item.wa_messages.wa_groups[0] : item.wa_messages?.wa_groups;
      const groupId = item.wa_messages?.group_id;
      if (!groupId) return;
      const current = conversationMap.get(groupId);
      if (current && item.sentiment === 'negative') {
        current.negative_count += 1;
        conversationMap.set(groupId, current);
      } else if (group && !conversationMap.has(groupId)) {
        conversationMap.set(groupId, {
          group_id: groupId,
          group_name: group.name || 'Grupo',
          count: 0,
          last_text: '',
          last_at: '',
          negative_count: item.sentiment === 'negative' ? 1 : 0,
        });
      }
    });

    const conversations = [...conversationMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgSentiment =
      analysis.length > 0
        ? Number((analysis.reduce((sum: number, item) => sum + Number(item.sentiment_score || 0), 0) / analysis.length).toFixed(2))
        : 0;

    return NextResponse.json({
      ok: true,
      summary: {
        messages_7d: messages.length,
        groups_active: groups.filter((group) => group.is_active).length,
        sentiment_average: avgSentiment,
        positive,
        neutral,
        negative,
        urgent,
      },
      top_keywords: topKeywords,
      conversations,
      recent_events: analysis.slice(0, 20),
      stored_insights: storedInsights,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
