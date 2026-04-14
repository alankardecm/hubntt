'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeInfo,
  Bot,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Mic,
  RefreshCw,
  Square,
  Sparkles,
  TriangleAlert,
  Users,
  Volume2,
} from 'lucide-react';

const GROUP_SELECTION_STORAGE_KEY = 'netturbo-wa-selected-groups';

type InsightItem = {
  group_name?: string;
  group?: string;
  summary?: string;
  insight?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyword?: string;
  urgency?: string;
  date?: string;
  id?: string;
};

type ConversationItem = {
  group_id?: string;
  group_name?: string;
  count?: number;
  last_text?: string;
  last_at?: string;
  negative_count?: number;
};

type LiveGroupItem = {
  id?: string;
  name?: string;
  group_name?: string;
  today_messages?: {
    count?: number;
  };
};

type GroupBriefPayload = {
  group?: {
    id?: string;
    name?: string;
  };
  period?: {
    days?: number;
    date_from?: string;
    date_to?: string;
  };
  metrics?: {
    messages?: number;
    participants?: number;
    urgent_count?: number;
    sentiment_breakdown?: {
      positive?: number;
      neutral?: number;
      negative?: number;
    };
    top_keywords?: Array<{ term?: string; count?: number }>;
    top_participants?: Array<{ name?: string; count?: number }>;
  };
  brief?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    score?: number;
    title?: string;
    summary?: string;
    highlights?: string[];
    risks?: string[];
    next_steps?: string[];
    keywords?: string[];
    dominant_topic?: string;
    audio_script?: string;
    model_used?: string;
  };
};

type StoredInsightItem = {
  id?: string;
  group_name?: string;
  group?: string;
  executive_summary?: string;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  primary_keyword?: string;
  urgency_label?: string;
  date?: string;
  total_messages?: number;
};

type LiveInsightsPayload = {
  summary?: {
    messages_7d?: number;
    groups_active?: number;
    sentiment_average?: number;
    positive?: number;
    neutral?: number;
    negative?: number;
    urgent?: number;
  };
  top_keywords?: Array<{ term?: string; count?: number }>;
  conversations?: ConversationItem[];
  stored_insights?: StoredInsightItem[];
};

type OutlookStatusPayload = {
  ok?: boolean;
  configured?: boolean;
  connected?: boolean;
  account?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type OutlookMessageItem = {
  id?: string;
  sender_name?: string | null;
  sender_jid?: string | null;
  text_raw?: string;
  msg_timestamp?: number | null;
  created_at?: string;
  wa_groups?: {
    id?: string;
    name?: string;
  };
  wa_analysis?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: string;
    summary?: string;
    keywords?: string[];
  };
};

type OutlookMessagesPayload = {
  ok?: boolean;
  messages?: OutlookMessageItem[];
};

type OmnichannelProtocolItem = {
  protocol: string;
  channels: string[];
  last_seen_at: string;
  references: string[];
};

type OmnichannelClientItem = {
  client: string;
  channels: string[];
  message_count: number;
  references: string[];
};

type OmnichannelSummaryPayload = {
  ok?: boolean;
  window_days?: number;
  summary?: {
    email_messages?: number;
    whatsapp_messages?: number;
    total_protocols?: number;
    protocols_email?: number;
    protocols_whatsapp?: number;
    protocols_shared?: number;
    clients_email?: number;
    clients_whatsapp?: number;
    clients_shared?: number;
  };
  protocols?: OmnichannelProtocolItem[];
  clients?: {
    email_only?: OmnichannelClientItem[];
    whatsapp_only?: OmnichannelClientItem[];
    shared?: OmnichannelClientItem[];
  };
};

const fallbackSummary = {
  messages_7d: 1284,
  groups_active: 8,
  sentiment_average: -0.32,
  positive: 28,
  neutral: 39,
  negative: 33,
  urgent: 18,
};

const fallbackKeywords = [
  { term: 'prazo', count: 41 },
  { term: 'urgente', count: 36 },
  { term: 'caiu', count: 24 },
  { term: 'reuniao', count: 21 },
  { term: 'erro', count: 19 },
  { term: 'pendencia', count: 17 },
];

const criticalKeywordSet = new Set([
  'urgente',
  'erro',
  'queda',
  'pendencia',
  'lixo',
  'desempregado',
  'burro',
  'idiota',
  'inutil',
  'imbecil',
  'babaca',
  'xibata',
  'otario',
  'problema',
  'falha',
  'atraso',
]);

const fallbackDailySummaries: InsightItem[] = [
  {
    group_name: 'Operacao NOC',
    summary: 'Dia com foco em queda, prazo e liberacao. Pressao negativa moderada e recorrencia de incidente.',
    sentiment: 'negative',
    keyword: 'queda',
    urgency: 'alta',
  },
  {
    group_name: 'Comercial Interno',
    summary: 'Conversas centradas em cliente, retorno e reuniao. Tom geral neutro com pontos de ajuste.',
    sentiment: 'neutral',
    keyword: 'cliente',
    urgency: 'baixa',
  },
  {
    group_name: 'Suporte',
    summary: 'Maior incidencia de erro e pendencia. Indicado revisar recorrencia e resposta operacional.',
    sentiment: 'negative',
    keyword: 'erro',
    urgency: 'alta',
  },
];

const sentimentStyle: Record<string, string> = {
  positive: 'text-green-400 bg-green-500/10 border-green-500/20',
  neutral: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
  negative: 'text-neon-pink bg-neon-pink/10 border-neon-pink/20',
};

const sentimentLabel: Record<string, string> = {
  positive: 'Positivo',
  neutral: 'Neutro',
  negative: 'Negativo',
};

function normalizeGroup(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ComunicacaoDashboard() {
  const [liveData, setLiveData] = useState<LiveInsightsPayload | null>(null);
  const [liveGroups, setLiveGroups] = useState<LiveGroupItem[]>([]);
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
  const [groupSelectionHydrated, setGroupSelectionHydrated] = useState(false);
  const [hasStoredGroupSelection, setHasStoredGroupSelection] = useState(false);
  const [exportDays, setExportDays] = useState<7 | 15 | 30>(7);
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [audioMode, setAudioMode] = useState<'server' | 'browser'>('browser');
  const [groupBriefLoadingKey, setGroupBriefLoadingKey] = useState<string | null>(null);
  const [groupBriefError, setGroupBriefError] = useState('');
  const [selectedGroupBrief, setSelectedGroupBrief] = useState<GroupBriefPayload | null>(null);
  const [outlookStatus, setOutlookStatus] = useState<OutlookStatusPayload | null>(null);
  const [outlookMessages, setOutlookMessages] = useState<OutlookMessageItem[]>([]);
  const [omnichannelSummary, setOmnichannelSummary] = useState<OmnichannelSummaryPayload | null>(null);
  const [outlookLoading, setOutlookLoading] = useState(false);
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [outlookSwitching, setOutlookSwitching] = useState(false);
  const [outlookMessage, setOutlookMessage] = useState('');
  const [outlookError, setOutlookError] = useState('');
  const serverAudioRef = useRef<HTMLAudioElement | null>(null);

  async function refreshOutlookMessages() {
    const response = await fetch('/api/communications/outlook/messages?limit=8');
    const payload = (await response.json()) as OutlookMessagesPayload & { error?: string };
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'Falha ao consultar emails do Outlook.');
    }
    setOutlookMessages(payload.messages || []);
  }

  async function refreshOmnichannelSummary() {
    const response = await fetch('/api/communications/omnichannel/summary?days=30');
    const payload = (await response.json()) as OmnichannelSummaryPayload & { error?: string };
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'Falha ao consultar consolidado omnichannel.');
    }
    setOmnichannelSummary(payload);
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [insightsResponse, groupsResponse, outlookResponse, outlookMessagesResponse, omnichannelResponse] = await Promise.all([
          fetch('/api/wa-monitor/insights?days=7'),
          fetch('/api/wa-monitor/groups'),
          fetch('/api/communications/outlook/status'),
          fetch('/api/communications/outlook/messages?limit=8'),
          fetch('/api/communications/omnichannel/summary?days=30'),
        ]);
        const insightsData = await insightsResponse.json();
        const groupsData = await groupsResponse.json();
        const outlookData = await outlookResponse.json();
        const outlookMessagesData = (await outlookMessagesResponse.json()) as OutlookMessagesPayload;
        const omnichannelData = (await omnichannelResponse.json()) as OmnichannelSummaryPayload;
        if (alive && insightsData?.ok) setLiveData(insightsData);
        if (alive && groupsData?.ok) setLiveGroups(groupsData.groups || []);
        if (alive && outlookData?.ok) setOutlookStatus(outlookData);
        if (alive && outlookMessagesData?.ok) setOutlookMessages(outlookMessagesData.messages || []);
        if (alive && omnichannelData?.ok) setOmnichannelSummary(omnichannelData);
      } catch {
        if (alive) {
          setLiveData(null);
          setLiveGroups([]);
          setOutlookStatus(null);
          setOutlookMessages([]);
          setOmnichannelSummary(null);
        }
      }
    }

    load();
    const timer = setInterval(load, 30000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const recentOutlookMessages = useMemo(() => {
    return outlookMessages.map((message) => ({
      id: message.id || '',
      sender: message.sender_name || message.sender_jid || 'Remetente nao identificado',
      conversationName: message.wa_groups?.name || 'Email sincronizado',
      summary: message.wa_analysis?.summary || message.text_raw || 'Sem conteudo disponivel.',
      sentiment: message.wa_analysis?.sentiment || 'neutral',
      urgency: message.wa_analysis?.urgency || 'baixa',
      keywords: message.wa_analysis?.keywords || [],
      createdAt: message.created_at || '',
    }));
  }, [outlookMessages]);

  const omnichannelCards = [
    {
      label: 'Protocolos por email',
      value: omnichannelSummary?.summary?.protocols_email ?? 0,
      note: 'janela 30d',
    },
    {
      label: 'Protocolos por WPP',
      value: omnichannelSummary?.summary?.protocols_whatsapp ?? 0,
      note: 'janela 30d',
    },
    {
      label: 'Clientes nos dois canais',
      value: omnichannelSummary?.summary?.clients_shared ?? 0,
      note: 'email + wpp',
    },
    {
      label: 'Protocolos cruzados',
      value: omnichannelSummary?.summary?.protocols_shared ?? 0,
      note: 'presentes nos dois',
    },
  ];

  function formatDateTime(value: string) {
    if (!value) return 'Data nao informada';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setAudioSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      serverAudioRef.current?.pause();
      serverAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('outlook_connected');
    const error = params.get('outlook_error');

    if (connected === '1') {
      setOutlookMessage('Conta Outlook conectada. Agora voce pode sincronizar os emails.');
      setOutlookError('');
    }

    if (error) {
      setOutlookError(decodeURIComponent(error));
      setOutlookMessage('');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedValue = window.localStorage.getItem(GROUP_SELECTION_STORAGE_KEY);
      if (!storedValue) {
        setGroupSelectionHydrated(true);
        return;
      }

      const parsed = JSON.parse(storedValue);
      if (Array.isArray(parsed)) {
        setSelectedGroupKeys(parsed.map((item) => normalizeGroup(String(item))).filter(Boolean));
        setHasStoredGroupSelection(true);
      }
    } catch {
      window.localStorage.removeItem(GROUP_SELECTION_STORAGE_KEY);
    } finally {
      setGroupSelectionHydrated(true);
    }
  }, []);

  const summary = liveData?.summary || fallbackSummary;

  const keywordCards = useMemo(() => {
    const source = liveData?.top_keywords?.length ? liveData.top_keywords : fallbackKeywords;
    return source.map((item) => ({
      term: item.term || '',
      count: item.count ?? 1,
    }));
  }, [liveData]);

  const wordCloudWords = useMemo(() => {
    const source = [...keywordCards].sort((a, b) => b.count - a.count);
    const max = source[0]?.count || 1;
    const min = source[source.length - 1]?.count || 1;
    return source.map((item, index) => {
      const normalized = normalizeGroup(item.term);
      const intensity = max === min ? 0.5 : (item.count - min) / (max - min);
      const fontSize = Math.round(16 + intensity * 28);
      const palette = criticalKeywordSet.has(normalized)
        ? ['text-neon-pink', 'bg-neon-pink/10 border-neon-pink/20']
        : normalized === 'cliente'
          ? ['text-neon-orange', 'bg-neon-orange/10 border-neon-orange/20']
          : ['text-neon-cyan', 'bg-neon-cyan/10 border-neon-cyan/20'];
      return {
        ...item,
        fontSize,
        toneClass: palette[0],
        chipClass: palette[1],
        rotate: index % 5 === 0 ? -3 : index % 4 === 0 ? 4 : 0,
      };
    });
  }, [keywordCards]);

  const activeGroupKeys = new Set(
    liveGroups.map((group) => normalizeGroup(group?.name || group?.group_name || '')).filter(Boolean)
  );

  const allGroups = useMemo(() => {
    const groupMap = new Map<string, LiveGroupItem & { displayName: string }>();

    liveGroups.forEach((group) => {
      const displayName = group?.name || group?.group_name || '';
      const key = normalizeGroup(displayName);
      if (!key) return;
      groupMap.set(key, {
        ...group,
        displayName,
      });
    });

    return [...groupMap.entries()]
      .map(([key, group]) => ({
        key,
        id: group.id || '',
        name: group.displayName,
        todayCount: Number(group.today_messages?.count || 0),
      }))
      .sort((a, b) => {
        if (b.todayCount !== a.todayCount) return b.todayCount - a.todayCount;
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [liveGroups]);

  useEffect(() => {
    if (!groupSelectionHydrated) return;

    const availableKeys = allGroups.map((group) => group.key);
    if (!availableKeys.length) return;

    setSelectedGroupKeys((current) => {
      if (!hasStoredGroupSelection) return availableKeys;
      return current.filter((key) => availableKeys.includes(key));
    });
  }, [allGroups, groupSelectionHydrated, hasStoredGroupSelection]);

  useEffect(() => {
    if (!groupSelectionHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(GROUP_SELECTION_STORAGE_KEY, JSON.stringify(selectedGroupKeys));
  }, [selectedGroupKeys, groupSelectionHydrated]);

  const selectedGroupKeySet = useMemo(() => new Set(selectedGroupKeys), [selectedGroupKeys]);

  const monitoredGroups = allGroups
    .filter((group) => selectedGroupKeySet.has(group.key))
    .map((group) => ({
      id: group.id,
      key: group.key,
      name: group.name,
      active: activeGroupKeys.has(group.key),
      todayCount: group.todayCount,
      hasTodayCoverage: group.todayCount > 0,
    }));

  const buildExportHref = (groupName: string, sheet: 'messages' | 'summary' | 'keywords', days = exportDays) => {
    const params = new URLSearchParams({
      sheet,
      days: String(days),
      group_name: groupName,
    });
    return `/api/wa-monitor/export?${params.toString()}`;
  };

  const conversationsByGroup = useMemo(() => {
    const map = new Map<string, ConversationItem>();
    const conversations = Array.isArray(liveData?.conversations) ? liveData.conversations : [];

    conversations.forEach((item: ConversationItem) => {
      const key = normalizeGroup(item.group_name || '');
      if (!key) return;
      map.set(key, item);
    });

    return map;
  }, [liveData]);

  const negativeConversations = useMemo(() => {
    const conversations = Array.isArray(liveData?.conversations) ? liveData.conversations : [];
    return conversations
      .filter((item: ConversationItem) => selectedGroupKeySet.has(normalizeGroup(item.group_name || '')))
      .filter((item: ConversationItem) => Number(item.negative_count || 0) > 0)
      .sort((a: ConversationItem, b: ConversationItem) => {
        const negativeDiff = Number(b.negative_count || 0) - Number(a.negative_count || 0);
        if (negativeDiff !== 0) return negativeDiff;
        return Number(b.count || 0) - Number(a.count || 0);
      })
      .slice(0, 4);
  }, [liveData, selectedGroupKeySet]);

  const preparedDailySummaries: InsightItem[] = useMemo(() => {
    const insights = Array.isArray(liveData?.stored_insights) ? liveData.stored_insights : [];
    return insights
      .filter((item) => {
        const groupKey = normalizeGroup(item?.group_name || item?.group || '');
        const text = String(item?.executive_summary || '').trim();
        const totalMessages = Number(item?.total_messages || 0);
        return selectedGroupKeySet.has(groupKey) && Boolean(text) && totalMessages > 0;
      })
      .map((item) => ({
        id: item.id,
        group_name: item.group_name || item.group || 'Grupo interno',
        summary: item.executive_summary,
        sentiment: item.sentiment_label || 'neutral',
        keyword: item.primary_keyword || '',
        urgency: item.urgency_label || 'baixa',
        date: item.date,
      }))
      .slice(0, 8);
  }, [liveData, selectedGroupKeySet]);

  const dailySummaryFeed = useMemo(
    () => (preparedDailySummaries.length ? preparedDailySummaries : fallbackDailySummaries),
    [preparedDailySummaries]
  );

  function stopAudio() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (serverAudioRef.current) {
      serverAudioRef.current.pause();
      serverAudioRef.current.currentTime = 0;
      serverAudioRef.current = null;
    }
    setSpeakingKey(null);
  }

  function speakText(text: string, key: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setAudioError('Audio nao suportado neste navegador.');
      return;
    }

    const trimmed = String(text || '').trim();
    if (!trimmed) {
      setAudioError('Nao ha resumo disponivel para reproduzir.');
      return;
    }

    setAudioError('');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('pt-br')) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('pt')) ||
      null;

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.lang = preferredVoice?.lang || 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingKey(null);
    utterance.onerror = () => {
      setSpeakingKey(null);
      setAudioError('Falha ao gerar audio neste navegador.');
    };

    setSpeakingKey(key);
    window.speechSynthesis.speak(utterance);
  }

  async function playServerAudio(text: string, title: string, key: string) {
    const response = await fetch('/api/wa-monitor/group-brief/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, title }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || 'Falha ao gerar audio no servidor.');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    serverAudioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
      serverAudioRef.current = null;
      setSpeakingKey(null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      serverAudioRef.current = null;
      setSpeakingKey(null);
      setAudioError('Falha ao reproduzir o audio gerado no servidor.');
    };

    setSpeakingKey(key);
    setAudioMode('server');
    await audio.play();
  }

  async function speakBrief(text: string, title: string, key: string) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      setAudioError('Nao ha resumo disponivel para reproduzir.');
      return;
    }

    setAudioError('');

    try {
      await playServerAudio(trimmed, title, key);
    } catch {
      setAudioMode('browser');
      speakText(trimmed, key);
    }
  }

  async function loadGroupBrief(groupName: string) {
    const params = new URLSearchParams({
      group_name: groupName,
      days: String(exportDays),
    });

    setGroupBriefLoadingKey(groupName);
    setGroupBriefError('');

    try {
      const response = await fetch(`/api/wa-monitor/group-brief?${params.toString()}`);
      const payload = (await response.json()) as GroupBriefPayload & { ok?: boolean; error?: string };

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Falha ao gerar resumo das conversas.');
      }

      setSelectedGroupBrief(payload);
    } catch (error) {
      setGroupBriefError(error instanceof Error ? error.message : 'Falha ao gerar resumo das conversas.');
    } finally {
      setGroupBriefLoadingKey(null);
    }
  }

  async function refreshOutlookStatus() {
    setOutlookLoading(true);
    try {
      const response = await fetch('/api/communications/outlook/status');
      const payload = (await response.json()) as OutlookStatusPayload & { error?: string };
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Falha ao consultar Outlook.');
      }
      setOutlookStatus(payload);
    } catch (error) {
      setOutlookError(error instanceof Error ? error.message : 'Falha ao consultar Outlook.');
    } finally {
      setOutlookLoading(false);
    }
  }

  function connectOutlook() {
    window.location.href = '/api/communications/outlook/auth/start?prompt=select_account';
  }

  async function switchOutlookAccount() {
    setOutlookSwitching(true);
    setOutlookError('');
    setOutlookMessage('');

    try {
      const response = await fetch('/api/communications/outlook/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar a conta atual do Outlook.');
      }

      window.location.href = '/api/communications/outlook/auth/start?prompt=select_account';
    } catch (error) {
      setOutlookError(error instanceof Error ? error.message : 'Falha ao trocar a conta do Outlook.');
      setOutlookSwitching(false);
    }
  }

  async function syncOutlookEmails() {
    setOutlookSyncing(true);
    setOutlookError('');
    setOutlookMessage('');

    try {
      const response = await fetch('/api/communications/outlook/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ top: 15 }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        pulled?: number;
        ingested?: Array<{ duplicate?: boolean; ok?: boolean }>;
      };

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Falha ao sincronizar emails.');
      }

      const inserted = (payload.ingested || []).filter((item) => item.ok && !item.duplicate).length;
      const duplicates = (payload.ingested || []).filter((item) => item.duplicate).length;
      setOutlookMessage(
        `Outlook sincronizado: ${payload.pulled || 0} emails lidos, ${inserted} novos e ${duplicates} ja existentes.`
      );
      await refreshOutlookStatus();
      await refreshOutlookMessages();
      await refreshOmnichannelSummary();
    } catch (error) {
      setOutlookError(error instanceof Error ? error.message : 'Falha ao sincronizar emails.');
    } finally {
      setOutlookSyncing(false);
    }
  }

  const selectedBrief = selectedGroupBrief?.brief;
  const selectedBriefMetrics = selectedGroupBrief?.metrics;
  const selectedBriefGroupName = selectedGroupBrief?.group?.name || 'Grupo interno';
  const selectedBriefAudio = String(selectedBrief?.audio_script || '').trim();
  const selectedBriefKeywords = selectedBrief?.keywords?.length
    ? selectedBrief.keywords
    : (selectedBriefMetrics?.top_keywords || []).map((item) => item.term || '').filter(Boolean);

  const positiveCount = summary.positive ?? 0;
  const neutralCount = summary.neutral ?? 0;
  const negativeCount = summary.negative ?? 0;
  const totalSentiment = positiveCount + neutralCount + negativeCount || 1;
  const sentimentBars = [
    { label: 'Positivo', value: Math.round((positiveCount / totalSentiment) * 100), color: 'bg-green-500' },
    { label: 'Neutro', value: Math.round((neutralCount / totalSentiment) * 100), color: 'bg-neon-cyan' },
    { label: 'Negativo', value: Math.round((negativeCount / totalSentiment) * 100), color: 'bg-neon-pink' },
  ];

  function toggleGroupSelection(groupKey: string) {
    setHasStoredGroupSelection(true);
    setSelectedGroupKeys((current) =>
      current.includes(groupKey) ? current.filter((item) => item !== groupKey) : [...current, groupKey]
    );
  }

  function selectAllGroups() {
    setHasStoredGroupSelection(true);
    setSelectedGroupKeys(allGroups.map((group) => group.key));
  }

  function clearSelectedGroups() {
    setHasStoredGroupSelection(true);
    setSelectedGroupKeys([]);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-12 py-10 flex flex-col gap-10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">IA Comunicacao</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">WhatsApp</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Sentimento</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Resumo diario</span>
            </div>

            <div className="mt-6 grid gap-10 xl:grid-cols-12 items-start">
              <div className="xl:col-span-7 space-y-5">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
                    Mapa operacional do modulo
                  </p>
                </div>
                <h1 className="text-5xl lg:text-6xl font-[1000] tracking-[-0.08em] leading-[0.95] uppercase">
                  WhatsApp interno com leitura de grupos, palavras e sentimento
                </h1>
                <p className="max-w-2xl text-base lg:text-lg text-stone-400 leading-relaxed">
                  A tela foi desenhada para operar o dia a dia: todos os grupos disponiveis, mapa de palavras,
                  sentimento geral, resumo diario e base para transcricao de audio no futuro.
                </p>
              </div>

              <div className="xl:col-span-5 grid gap-4">
                {[
                  { label: 'Mensagens analisadas', value: summary.messages_7d, note: 'ultima 24h' },
                  { label: 'Sentimento medio', value: Number(summary.sentiment_average || 0).toFixed(2), note: 'leitura geral' },
                  { label: 'Alertas ativos', value: summary.urgent, note: 'termos criticos' },
                  { label: 'Grupos monitorados', value: monitoredGroups.length, note: `${allGroups.length} grupos encontrados` },
                ].map((card, index) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className="rounded-[28px] border border-white/5 bg-white/[0.03] p-6"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">{card.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <strong className="text-3xl font-[1000] tracking-[-0.05em]">{card.value}</strong>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-600">{card.note}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Grupos monitorados</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Seletor de monitoramento</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => selectAllGroups()}
                    className="rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/15"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => clearSelectedGroups()}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 transition hover:text-white"
                  >
                    Limpar
                  </button>
                  <Users className="w-6 h-6 text-neon-cyan" />
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400">
                Todos os grupos encontrados entram aqui. Clique nos chips para escolher quais grupos ficam ativos no monitoramento visual, nos resumos e na central de exportacao.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {allGroups.map((group) => {
                  const isSelected = selectedGroupKeySet.has(group.key);
                  return (
                    <button
                      key={group.key}
                      onClick={() => toggleGroupSelection(group.key)}
                      className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                        isSelected
                          ? 'border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan'
                          : 'border-white/10 bg-white/[0.03] text-stone-400 hover:text-white'
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {monitoredGroups.map((group) => (
                  <div
                    key={group.name}
                    className={`rounded-[26px] border p-4 ${
                      group.hasTodayCoverage || conversationsByGroup.has(normalizeGroup(group.name))
                        ? 'border-neon-pink/20 bg-neon-pink/5'
                        : 'border-white/5 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.14em]">{group.name}</h3>
                        <p className="mt-2 text-[11px] text-stone-500">
                          {group.hasTodayCoverage
                            ? `Hoje: ${group.todayCount} mensagens`
                            : group.active
                              ? 'Ja aparece no banco'
                              : 'Aguardando primeira captura'}
                        </p>
                        {conversationsByGroup.get(normalizeGroup(group.name))?.negative_count ? (
                          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-neon-pink">
                            Pressao negativa detectada
                          </p>
                        ) : null}
                        {group.active ? (
                          <a
                            href={buildExportHref(group.name, 'messages')}
                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/15"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Baixar CSV
                          </a>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                          conversationsByGroup.get(normalizeGroup(group.name))?.negative_count
                            ? 'text-neon-pink bg-neon-pink/10 border-neon-pink/20'
                            : group.hasTodayCoverage
                              ? 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20'
                              : group.active
                              ? 'text-green-400 bg-green-500/10 border-green-500/20'
                              : 'text-stone-400 bg-white/5 border-white/10'
                        }`}
                      >
                        {conversationsByGroup.get(normalizeGroup(group.name))?.negative_count
                          ? 'Negativo'
                          : group.hasTodayCoverage
                            ? 'Hoje'
                            : group.active
                            ? 'Ativo'
                            : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
                {!monitoredGroups.length ? (
                  <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-stone-400 md:col-span-2">
                    Nenhum grupo selecionado no momento. Escolha pelo menos um grupo acima para reativar o monitoramento desta tela.
                  </div>
                ) : null}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Mapa de palavras</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Termos recorrentes</h2>
                </div>
                <MessageSquareText className="w-6 h-6 text-neon-orange" />
              </div>

              <div className="mt-8 rounded-[30px] border border-white/5 bg-background/40 p-5">
                <div className="flex min-h-[320px] flex-wrap items-center justify-center gap-x-3 gap-y-4 p-4">
                  {wordCloudWords.map((item) => (
                    <span
                      key={item.term}
                      className={`inline-flex items-center rounded-full border px-3 py-1 font-black uppercase tracking-[0.12em] ${item.toneClass} ${item.chipClass}`}
                      style={{
                        fontSize: `${item.fontSize}px`,
                        transform: `rotate(${item.rotate}deg)`,
                      }}
                      title={`${item.term} - ${item.count} ocorrencias`}
                    >
                      {item.term}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {wordCloudWords.slice(0, 3).map((item) => (
                  <div key={item.term} className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">Destaque</p>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.14em]">{item.term}</p>
                    <p className="mt-3 text-sm text-stone-400">{item.count} ocorrencias</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Sentimento geral</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Distribuicao geral</h2>
                </div>
                <Sparkles className="w-6 h-6 text-neon-cyan" />
              </div>

              <div className="mt-8 space-y-5">
                {sentimentBars.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-black uppercase tracking-[0.18em]">{item.label}</span>
                      <span className="text-stone-400">{item.value}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-white/5 bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TriangleAlert className="w-5 h-5 text-neon-pink" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                      Grupos com pressao negativa
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
                    {negativeConversations.length > 0 ? `${negativeConversations.length} em alerta` : 'Sem alerta'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {negativeConversations.length > 0 ? (
                    negativeConversations.map((item: ConversationItem) => (
                      <div
                        key={`${item.group_id || item.group_name}`}
                        className="rounded-[22px] border border-neon-pink/20 bg-neon-pink/5 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.12em]">
                              {item.group_name || 'Grupo interno'}
                            </p>
                            <p className="mt-2 text-xs text-stone-400 line-clamp-2">
                              {item.last_text || 'Sem texto recente disponivel'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-pink">
                              {item.negative_count || 0} negativos
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                              {item.count || 0} msgs
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed text-stone-400">
                      Nenhum grupo negativo foi detectado no recorte atual.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/5 bg-background/40 p-5">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="w-5 h-5 text-neon-pink" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Leitura operacional</p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-stone-400">
                  O sistema destaca pressao em incidentes, prazos e termos ofensivos. A leitura principal
                  precisa continuar focada em risco operacional.
                </p>
              </div>
            </motion.div>

          </section>

          {/* ── CENTRAL DE EXPORTAÇÃO ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Central de exportacao</p>
                <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Download por grupo</h2>
                <p className="mt-2 text-sm text-stone-500 max-w-lg">
                  Baixe sentimentos, palavras mais usadas e resumo diario de cada grupo monitorado.
                  Disponivel em CSV (para Excel) ou JSON (para integracao).
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-1.5">
                {([7, 15, 30] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setExportDays(days)}
                    className={`rounded-[22px] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                      exportDays === days
                        ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {monitoredGroups.map((group, index) => {
                const convData = conversationsByGroup.get(normalizeGroup(group.name));
                const hasNegative = Boolean(convData?.negative_count);
                const sentiment = hasNegative ? 'negative' : group.hasTodayCoverage ? 'live' : group.active ? 'active' : 'pending';
                const statusColors: Record<string, string> = {
                  negative: 'border-neon-pink/25 bg-neon-pink/5',
                  live: 'border-neon-cyan/20 bg-neon-cyan/5',
                  active: 'border-green-500/20 bg-green-500/5',
                  pending: 'border-white/5 bg-white/[0.02]',
                };
                const badgeColors: Record<string, string> = {
                  negative: 'text-neon-pink bg-neon-pink/10 border-neon-pink/20',
                  live: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
                  active: 'text-green-400 bg-green-500/10 border-green-500/20',
                  pending: 'text-stone-500 bg-white/5 border-white/10',
                };
                const badgeLabel: Record<string, string> = {
                  negative: 'Pressao negativa',
                  live: `Hoje: ${group.todayCount} msgs`,
                  active: 'Ativo',
                  pending: 'Aguardando',
                };

                return (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * index }}
                    className={`rounded-[30px] border p-6 flex flex-col gap-5 ${statusColors[sentiment]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black uppercase tracking-[0.12em] leading-tight truncate">{group.name}</h3>
                        <span className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] ${badgeColors[sentiment]}`}>
                          {badgeLabel[sentiment]}
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                    </div>

                    {/* Botao Mensagens */}
                    <a
                      href={buildExportHref(group.name, 'messages')}
                      className="flex items-center gap-3 rounded-[20px] border border-neon-cyan/25 bg-neon-cyan/10 px-4 py-3 transition-all hover:bg-neon-cyan/20 hover:scale-[1.01] active:scale-95"
                    >
                      <FileText className="h-4 w-4 text-neon-cyan shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-cyan">Mensagens</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">Data · Remetente · Texto · Sentimento · Urgencia</p>
                      </div>
                    </a>

                    {/* Botao Resumo Diario */}
                    <a
                      href={buildExportHref(group.name, 'summary')}
                      className="flex items-center gap-3 rounded-[20px] border border-green-500/25 bg-green-500/10 px-4 py-3 transition-all hover:bg-green-500/20 hover:scale-[1.01] active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-400">Resumo diario</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">Data · Sentimento · Urgentes · Resumo executivo</p>
                      </div>
                    </a>

                    <button
                      onClick={() => loadGroupBrief(group.name)}
                      disabled={groupBriefLoadingKey === group.name}
                      className="flex items-center gap-3 rounded-[20px] border border-neon-pink/25 bg-neon-pink/10 px-4 py-3 text-left transition-all hover:bg-neon-pink/20 hover:scale-[1.01] active:scale-95 disabled:cursor-wait disabled:opacity-70"
                    >
                      {groupBriefLoadingKey === group.name ? (
                        <LoaderCircle className="h-4 w-4 text-neon-pink shrink-0 animate-spin" />
                      ) : (
                        <Mic className="h-4 w-4 text-neon-pink shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-pink">Resumo conversas</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">Consolida o periodo e prepara narrativa em audio</p>
                      </div>
                    </button>

                    {/* Botao Palavras */}
                    <a
                      href={buildExportHref(group.name, 'keywords')}
                      className="flex items-center gap-3 rounded-[20px] border border-neon-orange/25 bg-neon-orange/10 px-4 py-3 transition-all hover:bg-neon-orange/20 hover:scale-[1.01] active:scale-95"
                    >
                      <MessageSquareText className="h-4 w-4 text-neon-orange shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neon-orange">Palavras-chave</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">Ranking de termos · Posicao · Ocorrencias</p>
                      </div>
                    </a>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/5 bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-600">Formato dos arquivos</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-stone-400">
                <div className="rounded-[20px] bg-white/[0.02] border border-white/5 p-4">
                  <p className="font-black uppercase tracking-[0.15em] text-neon-cyan mb-2">mensagens-[grupo]-[N]d.csv</p>
                  <p>Colunas: Data · Hora · Remetente · Mensagem · Sentimento · Score · Urgencia · Palavras-chave</p>
                </div>
                <div className="rounded-[20px] bg-white/[0.02] border border-white/5 p-4">
                  <p className="font-black uppercase tracking-[0.15em] text-green-400 mb-2">resumo-diario-[grupo]-[N]d.csv</p>
                  <p>Colunas: Data · Total · Positivo · Neutro · Negativo · Urgentes · Resumo executivo</p>
                </div>
                <div className="rounded-[20px] bg-white/[0.02] border border-white/5 p-4">
                  <p className="font-black uppercase tracking-[0.15em] text-neon-orange mb-2">palavras-[grupo]-[N]d.csv</p>
                  <p>Colunas: Posicao · Palavra · Ocorrencias (ordenado por frequencia)</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-stone-600">
                Separador: ponto e virgula (;) · Encoding: UTF-8 com BOM · Abrir direto no Excel sem configuracao
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Outlook corporativo</p>
                </div>
                <h2 className="mt-3 text-2xl font-[950] tracking-[-0.05em] uppercase">Email no omnichannel</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                  Conecte sua conta Microsoft 365 da empresa e sincronize emails para o mesmo pipeline de analise,
                  resumo e operacao usado hoje pelo WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => connectOutlook()}
                  disabled={!outlookStatus?.configured}
                  className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Conectar Outlook
                </button>
                <button
                  onClick={() => switchOutlookAccount()}
                  disabled={!outlookStatus?.connected || outlookSwitching}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {outlookSwitching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Trocar conta
                </button>
                <button
                  onClick={() => syncOutlookEmails()}
                  disabled={!outlookStatus?.connected || outlookSyncing}
                  className="inline-flex items-center gap-2 rounded-full border border-neon-pink/20 bg-neon-pink/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-pink transition hover:bg-neon-pink/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {outlookSyncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Sincronizar emails
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {[
                {
                  label: 'Configuracao',
                  value: outlookStatus?.configured ? 'Pronta' : 'Pendente',
                  tone: outlookStatus?.configured ? 'text-green-400' : 'text-neon-pink',
                },
                {
                  label: 'Conexao',
                  value: outlookStatus?.connected ? 'Conectado' : 'Desconectado',
                  tone: outlookStatus?.connected ? 'text-neon-cyan' : 'text-stone-400',
                },
                {
                  label: 'Conta',
                  value: outlookStatus?.account?.name || 'Nao informada',
                  tone: 'text-white',
                },
                {
                  label: 'Email',
                  value: outlookStatus?.account?.email || 'Nao informado',
                  tone: 'text-stone-300',
                },
              ].map((card) => (
                <div key={card.label} className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">{card.label}</p>
                  <p className={`mt-3 text-sm font-black uppercase tracking-[0.08em] break-words ${card.tone}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/5 bg-background/40 p-5">
              {!outlookStatus?.configured ? (
                <p className="text-sm leading-relaxed text-stone-400">
                  Falta configurar `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` e `MS_REDIRECT_URI` no ambiente
                  para liberar o login do Outlook corporativo.
                </p>
              ) : outlookStatus?.connected ? (
                <p className="text-sm leading-relaxed text-stone-400">
                  A conta ja esta conectada. Clique em <span className="font-black text-neon-pink">Sincronizar emails</span> para trazer a inbox
                  para o pipeline omnichannel e consolidar analises junto com os outros canais. Se a conta estiver errada,
                  use <span className="font-black text-white">Trocar conta</span>.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-stone-400">
                  O app ja esta preparado para Microsoft 365. O proximo passo e autenticar sua conta corporativa em
                  <span className="font-black text-neon-cyan"> Conectar Outlook</span>.
                </p>
              )}
              {outlookLoading ? <p className="mt-4 text-sm leading-relaxed text-stone-500">Atualizando status do Outlook...</p> : null}
              {outlookMessage ? <p className="mt-4 text-sm leading-relaxed text-green-400">{outlookMessage}</p> : null}
              {outlookError ? <p className="mt-4 text-sm leading-relaxed text-neon-pink">{outlookError}</p> : null}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Inbox sincronizada</p>
                </div>
                <h2 className="mt-3 text-2xl font-[950] tracking-[-0.05em] uppercase">Ultimos emails analisados</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                  Aqui entram os emails que ja passaram pela sincronizacao do Outlook e pelo pipeline de analise do hub.
                </p>
              </div>
              <span className="rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan">
                {recentOutlookMessages.length} emails na tela
              </span>
            </div>

            <div className="mt-8 grid gap-4">
              {recentOutlookMessages.length ? (
                recentOutlookMessages.map((message) => (
                  <div key={message.id} className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                          {message.conversationName}
                        </p>
                        <h3 className="mt-2 text-sm font-black uppercase tracking-[0.12em] break-words">
                          {message.sender}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-stone-300">
                          {message.summary}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${sentimentStyle[message.sentiment]}`}>
                          {sentimentLabel[message.sentiment]}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                      <span className="inline-flex items-center gap-2 text-neon-pink">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        Urgencia: {message.urgency}
                      </span>
                      {message.keywords.slice(0, 5).map((keyword) => (
                        <span
                          key={`${message.id}-${keyword}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-stone-400">
                  Nenhum email sincronizado apareceu ainda nesta visao. Use <span className="font-black text-neon-pink">Sincronizar emails</span> para carregar a caixa do Outlook e popular este bloco.
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">NOC omnichannel</p>
                </div>
                <h2 className="mt-3 text-2xl font-[950] tracking-[-0.05em] uppercase">Protocolos e clientes por canal</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-400">
                  Base inicial para contar protocolos por email e WhatsApp, identificar clientes que entram por um ou pelos dois canais e listar os protocolos encontrados no historico.
                </p>
              </div>
              <span className="rounded-full border border-neon-orange/20 bg-neon-orange/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-orange">
                {omnichannelSummary?.window_days || 30} dias
              </span>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {omnichannelCards.map((card) => (
                <div key={card.label} className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-[1000] tracking-[-0.05em]">{card.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-600">{card.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-white/5 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">Protocolos detectados</p>
                    <h3 className="mt-2 text-xl font-[950] tracking-[-0.04em] uppercase">Quais protocolos apareceram</h3>
                  </div>
                  <BadgeInfo className="h-5 w-5 text-neon-cyan" />
                </div>
                <div className="mt-6 space-y-3">
                  {(omnichannelSummary?.protocols || []).slice(0, 10).map((item) => (
                    <div key={item.protocol} className="rounded-[22px] border border-white/5 bg-background/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black uppercase tracking-[0.12em]">{item.protocol}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.channels.map((channel) => (
                            <span
                              key={`${item.protocol}-${channel}`}
                              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                channel === 'email'
                                  ? 'border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan'
                                  : channel === 'whatsapp'
                                    ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                    : 'border-white/10 bg-white/[0.03] text-stone-400'
                              }`}
                            >
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                        Ultima ocorrencia: {formatDateTime(item.last_seen_at)}
                      </p>
                      {item.references.length ? (
                        <p className="mt-2 text-sm leading-relaxed text-stone-400">{item.references.join(' • ')}</p>
                      ) : null}
                    </div>
                  ))}
                  {!omnichannelSummary?.protocols?.length ? (
                    <div className="rounded-[22px] border border-dashed border-white/10 bg-background/30 p-4 text-sm leading-relaxed text-stone-400">
                      Ainda nao encontrei protocolos no historico analisado. Quando os textos tiverem padroes como protocolo, ticket, chamado ou OS, eles passam a aparecer aqui.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    title: 'Clientes por email',
                    tone: 'text-neon-cyan',
                    items: omnichannelSummary?.clients?.email_only || [],
                  },
                  {
                    title: 'Clientes por WPP',
                    tone: 'text-green-400',
                    items: omnichannelSummary?.clients?.whatsapp_only || [],
                  },
                  {
                    title: 'Clientes nos dois canais',
                    tone: 'text-neon-orange',
                    items: omnichannelSummary?.clients?.shared || [],
                  },
                ].map((block) => (
                  <div key={block.title} className="rounded-[30px] border border-white/5 bg-white/[0.03] p-6">
                    <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${block.tone}`}>{block.title}</p>
                    <div className="mt-4 space-y-3">
                      {block.items.length ? (
                        block.items.slice(0, 6).map((item) => (
                          <div key={`${block.title}-${item.client}`} className="rounded-[20px] border border-white/5 bg-background/40 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black uppercase tracking-[0.12em]">{item.client}</p>
                              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                {item.message_count} interacoes
                              </span>
                            </div>
                            {item.references.length ? (
                              <p className="mt-2 text-sm leading-relaxed text-stone-400">{item.references.join(' • ')}</p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-white/10 bg-background/30 px-4 py-3 text-sm leading-relaxed text-stone-400">
                          Sem clientes suficientes neste recorte ainda.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] pb-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.34 }}
                className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Resumo diario</p>
                    <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Resumo diario por grupo</h2>
                  </div>
                  <Users className="w-6 h-6 text-neon-cyan" />
                </div>

                <div className="mt-8 space-y-4">
                  {dailySummaryFeed.map((event, index) => {
                    return (
                    <div
                      key={`${event.id || event.group_name || event.date || index}`}
                      className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
                            {event.group_name || event.group || 'Grupo interno'}
                          </p>
                          <p className="mt-3 text-sm text-stone-400 leading-relaxed">
                            {event.summary || 'Sem resumo disponivel'}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${sentimentStyle[event.sentiment || 'neutral']}`}>
                          {sentimentLabel[event.sentiment || 'neutral']}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
                        <span>{event.keyword ? `Palavra-chave: ${event.keyword}` : 'Sem termo critico'}</span>
                        <span className="inline-flex items-center gap-2 text-neon-cyan">
                          <BadgeInfo className="w-3.5 h-3.5" />
                          {`Urgencia: ${event.urgency || 'baixa'}`}
                        </span>
                      </div>
                    </div>
                  )})}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-[34px] border border-white/5 bg-white/[0.03] p-8 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Resumo das conversas</p>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                    {selectedBrief ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">
                          {selectedBriefGroupName}
                        </p>
                        <h3 className="mt-3 text-xl font-[950] tracking-[-0.04em] uppercase">
                          {selectedBrief.title || 'Resumo do periodo'}
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-stone-300">
                          {selectedBrief.summary || 'Sem resumo disponivel.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed text-stone-400">
                        Clique em <span className="font-black text-neon-pink">Resumo conversas</span> em um grupo
                        para consolidar o periodo e preparar a narrativa em audio.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                    {selectedBrief ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Mensagens</p>
                          <p className="mt-2 text-lg font-black">{selectedBriefMetrics?.messages || 0}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Participantes</p>
                          <p className="mt-2 text-lg font-black">{selectedBriefMetrics?.participants || 0}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-stone-400">
                        O resumo usa uma LLM para consolidar a conversa do periodo e montar uma narrativa curta,
                        mais proxima de um boletim do que de um CSV bruto.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                    {selectedBrief ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          {speakingKey === 'group-brief' ? (
                            <button
                              onClick={() => stopAudio()}
                              className="inline-flex items-center gap-2 rounded-full border border-neon-pink/20 bg-neon-pink/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-pink transition hover:bg-neon-pink/15"
                            >
                              <Square className="h-4 w-4" />
                              Parar audio
                            </button>
                          ) : (
                            <button
                              onClick={() => speakBrief(selectedBriefAudio, selectedBrief.title || selectedBriefGroupName, 'group-brief')}
                              disabled={!selectedBriefAudio}
                              className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/15 disabled:opacity-50"
                            >
                              <Volume2 className="h-4 w-4" />
                              Ouvir resumo do periodo
                            </button>
                          )}
                          <span className={`inline-flex items-center rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] ${sentimentStyle[selectedBrief.sentiment || 'neutral']}`}>
                            {sentimentLabel[selectedBrief.sentiment || 'neutral']}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                            {audioMode === 'server'
                              ? 'Audio premium do servidor'
                              : audioSupported
                                ? 'Fallback local do navegador'
                                : 'Navegador sem suporte'}
                          </span>
                        </div>
                        {selectedBriefKeywords.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedBriefKeywords.slice(0, 6).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-300"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed text-stone-400">
                        Depois de gerar o resumo, voce pode ouvi-lo aqui no navegador e usar isso como um
                        mini podcast operacional do grupo.
                      </p>
                    )}
                    {groupBriefError ? <p className="mt-4 text-sm leading-relaxed text-neon-pink">{groupBriefError}</p> : null}
                    {audioError ? <p className="mt-4 text-sm leading-relaxed text-neon-pink">{audioError}</p> : null}
                  </div>
                  {selectedBrief ? (
                    <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500">Destaques</p>
                      <div className="mt-4 grid gap-3">
                        {(selectedBrief.highlights?.length ? selectedBrief.highlights : selectedBrief.next_steps || []).slice(0, 4).map((item) => (
                          <div key={item} className="rounded-[18px] border border-white/5 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-stone-300">
                            {item}
                          </div>
                        ))}
                        {!selectedBrief.highlights?.length && !selectedBrief.next_steps?.length ? (
                          <p className="text-sm leading-relaxed text-stone-400">
                            O grupo ja tem um resumo consolidado pronto para consulta e audio.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}
