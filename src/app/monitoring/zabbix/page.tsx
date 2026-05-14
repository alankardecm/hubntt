'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  X,
  Unplug,
  Share2,
  Cpu,
  Database,
  Radio,
  Cable,
  Server,
  Eye,
  Layers,
  TrendingDown,
  HelpCircle,
  TriangleAlert,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Problem = {
  eventid: string;
  name: string;
  severity: string;
  clock: string;
  acknowledged: string;
  hosts?: { hostid: string; name: string }[];
  tags?: { tag: string; value: string }[];
};

type Host = {
  hostid: string;
  host: string;
  name: string;
  status: string;
  available?: string;
  groups?: { groupid: string; name: string }[];
  interfaces?: { ip: string; port: string; type: string; main: string; available?: string }[];
};

type Event = {
  eventid: string;
  clock: string;
  name: string;
  severity: string;
  acknowledged: string;
  value: string;
  hosts?: { hostid: string; name: string }[];
};

type Summary = {
  totalProblems: number;
  disasters: number;
  highSeverity: number;
  hostsUp: number;
  hostsDown: number;
  hostsUnknown: number;
  totalHosts: number;
};

type AvailabilityPoint = {
  clock: number;
  label: string;
  value: number;
  status: 'up' | 'down' | 'unknown';
};

type AvailabilitySeries = {
  host: {
    hostid: string;
    name: string;
    itemid: string;
    itemKey: string;
  };
  intervalMinutes: number;
  hours: number;
  summary: {
    uptimePercent: number;
    upBuckets: number;
    downBuckets: number;
    unknownBuckets: number;
    totalBuckets: number;
    downTransitions: number;
    lastDownClock: number | null;
  };
  points: AvailabilityPoint[];
};

type GroupKey = 'all' | 'backbone' | 'pop' | 'rede-acesso' | 'clientes';

type AlarmCategory = 'pppoe' | 'sdwan' | 'snmp' | 'memory' | 'modulation' | 'interface' | 'equipment' | 'icmp' | 'optical' | 'onu' | 'quality' | 'other';

const CATEGORY_CONFIG: Record<AlarmCategory, { label: string; Icon: React.ElementType; color: string; border: string; bg: string }> = {
  pppoe:      { label: 'PPPoE',       Icon: Unplug,       color: 'text-fuchsia-400', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10' },
  sdwan:      { label: 'SD-WAN',      Icon: Share2,       color: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10' },
  snmp:       { label: 'SNMP',        Icon: Cpu,          color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
  memory:     { label: 'Memória',     Icon: Database,     color: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10' },
  modulation: { label: 'Modulação',   Icon: Radio,        color: 'text-sky-400',     border: 'border-sky-500/30',     bg: 'bg-sky-500/10' },
  interface:  { label: 'Interface',   Icon: Cable,        color: 'text-yellow-400',  border: 'border-yellow-500/30',  bg: 'bg-yellow-500/10' },
  equipment:  { label: 'Equipamento', Icon: Server,       color: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/10' },
  icmp:       { label: 'Latência',    Icon: Activity,     color: 'text-green-400',   border: 'border-green-500/30',   bg: 'bg-green-500/10' },
  optical:    { label: 'Óptica',      Icon: Eye,          color: 'text-purple-400',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10' },
  onu:        { label: 'ONU/GPON',    Icon: Layers,       color: 'text-teal-400',    border: 'border-teal-500/30',    bg: 'bg-teal-500/10' },
  quality:    { label: 'Qualidade',   Icon: TrendingDown, color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10' },
  other:      { label: 'Outros',      Icon: HelpCircle,   color: 'text-stone-400',   border: 'border-stone-500/20',   bg: 'bg-stone-500/5' },
};

function classifyProblem(name: string): AlarmCategory {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('pppoe')) return 'pppoe';
  if (n.includes('sd-wan') || n.includes('sdwan')) return 'sdwan';
  if (n.includes('snmp')) return 'snmp';
  if (n.includes('memor')) return 'memory';
  if (n.includes('modula')) return 'modulation';
  if (n.includes('consumo zero') || n.includes('descarte') || n.includes('crc') || n.includes('interface')) return 'interface';
  if (n.includes('indisponivel') || n.includes('indisponiv') || n.includes('restarted') || n.includes('reiniciado')) return 'equipment';
  if (n.includes('latencia') || n.includes('icmp')) return 'icmp';
  if (n.includes('atenuacao') || n.includes('potencia') || n.includes('rxpower') || n.includes('optic') || n.includes('transceptor')) return 'optical';
  if (n.includes('onu') || n.includes('gpon')) return 'onu';
  if (n.includes('pontuacao') || n.includes('qualidade') || n.includes('pro-ativo') || n.includes('pro ativo')) return 'quality';
  return 'other';
}

type GroupCard = {
  key: GroupKey;
  label: string;
  accent: string;
};

const SEVERITY_LABEL: Record<string, string> = {
  '0': 'Não classif.',
  '1': 'Informação',
  '2': 'Aviso',
  '3': 'Média',
  '4': 'Alta',
  '5': 'Desastre',
};

const SEVERITY_BG: Record<string, string> = {
  '0': 'border-stone-500/20 bg-stone-500/5',
  '1': 'border-blue-500/20 bg-blue-500/5',
  '2': 'border-yellow-500/20 bg-yellow-500/5',
  '3': 'border-orange-500/20 bg-orange-500/5',
  '4': 'border-red-500/20 bg-red-500/5',
  '5': 'border-neon-pink/30 bg-neon-pink/10',
};

const SEVERITY_BADGE: Record<string, string> = {
  '0': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  '1': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  '2': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  '3': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '4': 'text-red-400 bg-red-500/10 border-red-500/20',
  '5': 'text-neon-pink bg-neon-pink/10 border-neon-pink/30',
};

function timeAgo(clock: string) {
  const diff = Math.floor(Date.now() / 1000) - Number(clock);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function formatClock(clock: string) {
  return new Date(Number(clock) * 1000).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function formatUnixClock(clock: number | null) {
  if (!clock) return 'Sem queda recente';
  return new Date(clock * 1000).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveGroupKey(groupName: string): GroupKey | null {
  const normalized = normalizeText(groupName);
  if (normalized.includes('cliente')) return 'clientes';
  if (normalized.includes('backbone')) return 'backbone';
  if (normalized === 'pop' || normalized.includes('pop ')) return 'pop';
  if (normalized.includes('rede acesso') || normalized.includes('rede de acesso')) return 'rede-acesso';
  return null;
}

function isPppoeAlert(text: string) {
  return normalizeText(text).includes('pppoe');
}

function getOperationalGroupKeys(host: Host, problemOrEventName = ''): GroupKey[] {
  const rawGroups = (host.groups || [])
    .map((group) => resolveGroupKey(group.name))
    .filter(Boolean) as GroupKey[];

  const operationalGroups = new Set<GroupKey>();
  const isPppoe = isPppoeAlert(problemOrEventName) || normalizeText([host.name, host.host].join(' ')).includes('pppoe');

  for (const group of rawGroups) {
    if (group === 'clientes') {
      operationalGroups.add(group);
      continue;
    }

    if (group === 'rede-acesso') {
      operationalGroups.add(group);
      continue;
    }

    if (group === 'pop') {
      operationalGroups.add(group);
      continue;
    }

    if (group === 'backbone') {
      if (!isPppoe) {
        operationalGroups.add(group);
      }
      continue;
    }

    operationalGroups.add(group);
  }

  if (isPppoe) {
    operationalGroups.add('clientes');
  }

  if (operationalGroups.size === 0) {
    operationalGroups.add('all');
  }

  return Array.from(operationalGroups).filter((group) => group !== 'all');
}

function getHostAvailability(host: Host) {
  const mainInterface = host.interfaces?.find((iface) => iface.main === '1') || host.interfaces?.[0];
  return host.available || mainInterface?.available || '0';
}

function AvailabilityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: AvailabilityPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const statusLabel =
    point.status === 'up' ? 'UP' : point.status === 'down' ? 'DOWN' : 'Sem leitura';

  return (
    <div className="rounded-[18px] border border-white/10 bg-[#07141f] px-4 py-3 text-xs shadow-2xl">
      <p className="font-black uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{statusLabel}</p>
    </div>
  );
}

const GROUP_CARDS: GroupCard[] = [
  { key: 'all', label: 'Todos', accent: 'bg-neon-cyan text-black' },
  { key: 'backbone', label: 'Backbone', accent: 'bg-emerald-500 text-black' },
  { key: 'pop', label: 'POP', accent: 'bg-blue-500 text-white' },
  { key: 'rede-acesso', label: 'Rede de Acesso', accent: 'bg-amber-500 text-black' },
  { key: 'clientes', label: 'Clientes', accent: 'bg-fuchsia-500 text-white' },
];

export default function ZabbixDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedHistoryHost, setSelectedHistoryHost] = useState<Host | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySeries | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'problems' | 'hosts' | 'events'>('problems');
  const [hostFilter, setHostFilter] = useState<'all' | 'down' | 'up'>('all');
  const [groupFilter, setGroupFilter] = useState<GroupKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<AlarmCategory | 'all'>('all');
  const permissionDenied =
    error.includes('No permissions to call') ||
    error.includes('ZABBIX_PERMISSION_DENIED') ||
    error.includes('sem permissão');

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, probRes, hostsRes, eventsRes] = await Promise.all([
        fetch('/api/zabbix?view=summary'),
        fetch('/api/zabbix?view=problems&limit=200'),
        fetch('/api/zabbix?view=hosts&limit=500'),
        fetch('/api/zabbix?view=events&limit=50'),
      ]);

      const [sumData, probData, hostsData, eventsData] = await Promise.all([
        sumRes.json(),
        probRes.json(),
        hostsRes.json(),
        eventsRes.json(),
      ]);

      if (sumData.ok) setSummary(sumData.summary);
      if (probData.ok) setProblems(probData.problems || []);
      if (hostsData.ok) setHosts(hostsData.hosts || []);
      if (eventsData.ok) setEvents(eventsData.events || []);
      if (!sumData.ok) setError(sumData.error || 'Erro ao conectar ao Zabbix');
      else setError('');
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na conexão');
    } finally {
      setLoading(false);
    }
  }, []);

  const openHostHistory = useCallback(async (host: Host) => {
    setSelectedHistoryHost(host);
    setAvailability(null);
    setAvailabilityError('');

    try {
      setAvailabilityLoading(true);
      const response = await fetch(`/api/zabbix?view=availability&hostid=${encodeURIComponent(host.hostid)}&hours=24&interval=5`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Falha ao carregar historico do host.');
      }

      setAvailability(data.availability || null);
    } catch (err) {
      setAvailabilityError(err instanceof Error ? err.message : 'Falha ao carregar historico do host.');
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const filteredHosts = hosts.filter((h) => {
    const availability = getHostAvailability(h);
    if (hostFilter === 'down') return availability === '2';
    if (hostFilter === 'up') return availability === '1';
    return true;
  });

  const hostGroupMap = hosts.reduce((acc, host) => {
    acc[host.hostid] = getOperationalGroupKeys(host);
    return acc;
  }, {} as Record<string, GroupKey[]>);

  // Categorias dos alarmes
  const categoryStats = Object.keys(CATEGORY_CONFIG).map((cat) => {
    const key = cat as AlarmCategory;
    const count = problems.filter(p => classifyProblem(p.name) === key).length;
    return { key, count };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  // Card de atenção: categoria com concentração anormal (≥5 ou >40% do total)
  const attentionCategory = categoryStats.find(s =>
    s.count >= 5 || (problems.length > 0 && s.count / problems.length > 0.4)
  );

  const filteredProblems = problems.filter((problem) => {
    if (groupFilter !== 'all') {
      const matchGroup = (problem.hosts || []).some((host) => {
        const hostRecord = hosts.find((candidate) => candidate.hostid === host.hostid);
        if (!hostRecord) return false;
        return getOperationalGroupKeys(hostRecord, problem.name).includes(groupFilter);
      });
      if (!matchGroup) return false;
    }
    if (categoryFilter !== 'all' && classifyProblem(problem.name) !== categoryFilter) return false;
    return true;
  });

  const filteredEvents = events.filter((event) => {
    if (groupFilter === 'all') return true;
    return (event.hosts || []).some((host) => {
      const hostRecord = hosts.find((candidate) => candidate.hostid === host.hostid);
      if (!hostRecord) return false;
      return getOperationalGroupKeys(hostRecord, event.name).includes(groupFilter);
    });
  });

  const filteredHostsByGroup = filteredHosts.filter((host) => {
    if (groupFilter === 'all') return true;
    return (hostGroupMap[host.hostid] || []).includes(groupFilter);
  });

  const groupStats = GROUP_CARDS.map((group) => {
    if (group.key === 'all') {
      return {
        ...group,
        hosts: hosts.length,
        problems: problems.length,
        events: events.length,
      };
    }

    const hostIds = hosts.filter((host) => (hostGroupMap[host.hostid] || []).includes(group.key)).map((host) => host.hostid);
    const hostIdSet = new Set(hostIds);

    return {
      ...group,
      hosts: hostIds.length,
      problems: problems.filter((problem) => {
        return (problem.hosts || []).some((host) => {
          const hostRecord = hosts.find((candidate) => candidate.hostid === host.hostid);
          if (!hostRecord) return false;
          return hostIdSet.has(host.hostid) && getOperationalGroupKeys(hostRecord, problem.name).includes(group.key);
        });
      }).length,
      events: events.filter((event) => {
        return (event.hosts || []).some((host) => {
          const hostRecord = hosts.find((candidate) => candidate.hostid === host.hostid);
          if (!hostRecord) return false;
          return hostIdSet.has(host.hostid) && getOperationalGroupKeys(hostRecord, event.name).includes(group.key);
        });
      }).length,
    };
  });

  const activeGroupLabel = GROUP_CARDS.find((group) => group.key === groupFilter)?.label || 'Todos';

  const kpiCards = [
    {
      label: 'Alarmes ativos',
      value: summary?.totalProblems ?? '—',
      note: 'em monitoramento',
      icon: AlertTriangle,
      color: summary?.totalProblems ? 'text-neon-pink' : 'text-stone-400',
      glow: summary?.totalProblems ? 'shadow-neon-pink/10' : '',
    },
    {
      label: 'Desastres',
      value: summary?.disasters ?? '—',
      note: 'severity 5',
      icon: ShieldAlert,
      color: summary?.disasters ? 'text-neon-pink' : 'text-stone-400',
      glow: summary?.disasters ? 'shadow-neon-pink/20' : '',
    },
    {
      label: 'Hosts online',
      value: summary?.hostsUp ?? '—',
      note: `de ${summary?.totalHosts ?? '?'} total`,
      icon: Wifi,
      color: 'text-green-400',
      glow: 'shadow-green-500/10',
    },
    {
      label: 'Hosts offline',
      value: summary?.hostsDown ?? '—',
      note: 'inacessíveis',
      icon: WifiOff,
      color: summary?.hostsDown ? 'text-red-400' : 'text-stone-400',
      glow: summary?.hostsDown ? 'shadow-red-500/10' : '',
    },
  ];

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-12 py-10 flex flex-col gap-8">

          {/* ── HEADER ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Zabbix 6.2</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Monitoramento</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Tempo real</span>
              {lastUpdate && (
                <span className="px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">Central de monitoramento</p>
                </div>
                <h1 className="mt-3 text-5xl lg:text-6xl font-[1000] tracking-[-0.08em] leading-[0.95] uppercase">
                  Zabbix<br /><span className="text-neon-cyan">Dashboard</span>
                </h1>
                <p className="mt-4 max-w-xl text-base text-stone-400 leading-relaxed">
                  Alarmes ativos, status de hosts, histórico de eventos e métricas em tempo real.
                  Atualização automática a cada 30 segundos.
                </p>
              </div>

              <button
                onClick={fetchAll}
                disabled={loading}
                className="flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

          {error && (
            <div className="mt-6 rounded-[24px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              ⚠️ {error}
            </div>
          )}

          {permissionDenied && (
            <div className="rounded-[28px] border border-amber-500/25 bg-amber-500/10 p-6 text-sm text-amber-200">
              <div className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-amber-300">
                <ShieldAlert className="w-4 h-4" />
                Ajuste necessário no Zabbix
              </div>
              <p className="mt-3 leading-relaxed text-amber-100/90">
                O token conectou, mas o usuario associado nao tem permissao para ler hosts, problemas e eventos.
                No Zabbix, o acesso aos dados e controlado por <span className="font-bold">user group</span> e
                <span className="font-bold"> host group</span>.
              </p>
              <ul className="mt-4 space-y-2 text-amber-100/90">
                <li>1. Confirme se o usuario do token e Admin ou Super Admin.</li>
                <li>2. Dê permissão de leitura nos host groups monitorados.</li>
                <li>3. Se necessario, gere um novo token apos ajustar o usuario.</li>
              </ul>
            </div>
          )}
        </motion.section>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                className={`rounded-[30px] border border-white/5 bg-card p-6 shadow-xl ${card.glow}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">{card.label}</p>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <strong className={`mt-4 block text-4xl font-[1000] tracking-[-0.05em] ${card.color}`}>
                  {loading ? '—' : card.value}
                </strong>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-stone-600">{card.note}</p>
              </motion.div>
            ))}
          </div>

          {/* ── CARD DE ATENÇÃO ── */}
          {attentionCategory && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4"
            >
              <TriangleAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Concentração de alarmes detectada</p>
                <p className="mt-1 text-sm font-bold text-amber-200">
                  {attentionCategory.count} alarmes do tipo <span className="font-black">{CATEGORY_CONFIG[attentionCategory.key].label}</span> ativos simultaneamente
                  {attentionCategory.count >= 5 ? ' — provável evento em larga escala ou falha de equipamento de agregação.' : '.'}
                </p>
                <button
                  onClick={() => { setActiveTab('problems'); setCategoryFilter(attentionCategory.key); }}
                  className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 hover:underline"
                >
                  Ver alarmes {CATEGORY_CONFIG[attentionCategory.key].label} →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── CATEGORIAS DE ALARMES ── */}
          {!loading && categoryStats.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3">Tipos de alarme</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-white text-black border-white'
                      : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                  }`}
                >
                  Todos ({problems.length})
                </button>
                {categoryStats.map(({ key, count }) => {
                  const cfg = CATEGORY_CONFIG[key];
                  const isActive = categoryFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setCategoryFilter(key); setActiveTab('problems'); }}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        isActive ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                      }`}
                    >
                      <cfg.Icon className="w-3 h-3" />
                      {cfg.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Grupos monitorados</p>
                <p className="mt-1 text-sm text-stone-400">Recorte atual: {activeGroupLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {GROUP_CARDS.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => setGroupFilter(group.key)}
                    className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      groupFilter === group.key
                        ? group.accent
                        : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {groupStats.map((group) => (
                <div
                  key={group.key}
                  className={`rounded-[22px] border p-4 ${
                    group.key === 'backbone'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : group.key === 'pop'
                        ? 'border-blue-500/20 bg-blue-500/5'
                        : group.key === 'rede-acesso'
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-neon-cyan/20 bg-neon-cyan/5'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">{group.label}</p>
                  <p className="mt-3 text-3xl font-[1000] tracking-[-0.05em]">{group.hosts}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-stone-500">hosts</p>
                  <div className="mt-4 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
                    <span>{group.problems} alarmes</span>
                    <span>{group.events} eventos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex items-center gap-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-1.5 w-fit">
              {(['problems', 'hosts', 'events'] as const).map((tab) => {
              const labels = { problems: `Alarmes (${filteredProblems.length})`, hosts: `Hosts (${filteredHostsByGroup.length})`, events: `Eventos (${filteredEvents.length})` };
                return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-[22px] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                    activeTab === tab ? 'bg-neon-cyan text-black shadow-lg shadow-neon-cyan/20' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* ── TAB: PROBLEMS ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'problems' && (
              <motion.div
                key="problems"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-[950] tracking-[-0.04em] uppercase">Alarmes ativos</h2>
                  <span className={`rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                    problems.length > 0 ? 'text-neon-pink border-neon-pink/30 bg-neon-pink/10' : 'text-green-400 border-green-500/20 bg-green-500/10'
                  }`}>
                    {filteredProblems.length > 0 ? `${filteredProblems.length} ativos` : 'Sem alarmes'}
                  </span>
                </div>

                {loading ? (
                  <p className="text-stone-500 text-sm">Carregando...</p>
                ) : filteredProblems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-stone-500">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Nenhum alarme ativo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProblems.map((p) => {
                      const cat = classifyProblem(p.name);
                      const catCfg = CATEGORY_CONFIG[cat];
                      return (
                      <div
                        key={p.eventid}
                        className={`rounded-[24px] border p-5 ${SEVERITY_BG[p.severity] || 'border-white/5 bg-white/[0.02]'}`}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded-full border px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] ${SEVERITY_BADGE[p.severity] || ''}`}>
                                {SEVERITY_LABEL[p.severity] || p.severity}
                              </span>
                              <button
                                onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] transition-all ${catCfg.border} ${catCfg.bg} ${catCfg.color}`}
                              >
                                <catCfg.Icon className="w-2.5 h-2.5" />
                                {catCfg.label}
                              </button>
                              {p.acknowledged === '1' && (
                                <span className="rounded-full border border-stone-500/20 bg-stone-500/10 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                                  Ack
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-black uppercase tracking-[0.1em]">{p.name}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              {p.hosts?.map((h) => h.name).join(', ') || 'Host desconhecido'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{timeAgo(p.clock)}</p>
                            <p className="mt-1 text-[10px] text-stone-600">{formatClock(p.clock)}</p>
                          </div>
                        </div>
                        {p.tags && p.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.tags.slice(0, 4).map((t, i) => (
                              <span key={i} className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[9px] text-stone-500">
                                {t.tag}: {t.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: HOSTS ── */}
            {activeTab === 'hosts' && (
              <motion.div
                key="hosts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-xl font-[950] tracking-[-0.04em] uppercase">Hosts monitorados</h2>
                  <div className="flex gap-2 rounded-[24px] border border-white/10 bg-white/[0.03] p-1">
                    {(['all', 'up', 'down'] as const).map((f) => {
                      const labels = { all: 'Todos', up: 'Online', down: 'Offline' };
                      return (
                        <button
                          key={f}
                          onClick={() => setHostFilter(f)}
                          className={`rounded-[18px] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            hostFilter === f
                              ? f === 'down' ? 'bg-red-500 text-white' : f === 'up' ? 'bg-green-500 text-black' : 'bg-neon-cyan text-black'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          {labels[f]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedHistoryHost && (
                  <div className="mb-6 rounded-[28px] border border-neon-cyan/15 bg-neon-cyan/[0.04] p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Historico do host</p>
                        <h3 className="mt-2 text-2xl font-[950] tracking-[-0.04em] uppercase">{selectedHistoryHost.name}</h3>
                        <p className="mt-2 text-sm text-stone-400">Leitura sob demanda de 24h com buckets de 5 minutos.</p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedHistoryHost(null);
                          setAvailability(null);
                          setAvailabilityError('');
                        }}
                        className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-stone-400 transition hover:text-white"
                        aria-label="Fechar historico"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <div className="rounded-[20px] border border-green-500/20 bg-green-500/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-300">Uptime 24h</p>
                        <p className="mt-2 text-2xl font-[1000] text-green-300">{availability ? `${availability.summary.uptimePercent}%` : '...'}</p>
                      </div>
                      <div className="rounded-[20px] border border-red-500/15 bg-red-500/5 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Quedas</p>
                        <p className="mt-2 text-2xl font-[1000] text-white">{availability ? availability.summary.downTransitions : '...'}</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Ultima queda</p>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-white">{availability ? formatUnixClock(availability.summary.lastDownClock) : 'Carregando'}</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Item</p>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-white">{availability ? availability.host.itemKey : 'Carregando'}</p>
                      </div>
                    </div>

                    <div className="mt-6 h-[240px]">
                      {availabilityLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-stone-500">Carregando historico...</div>
                      ) : availabilityError ? (
                        <div className="flex h-full items-center justify-center rounded-[20px] border border-amber-500/20 bg-amber-500/10 px-6 text-center text-sm text-amber-200">{availabilityError}</div>
                      ) : availability && availability.points.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={availability.points} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="label" tick={{ fill: '#78716c', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} minTickGap={18} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#78716c', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} width={34} />
                            <Tooltip content={<AvailabilityTooltip />} />
                            <Line type="stepAfter" dataKey="value" stroke="#23d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#23d3ee' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-stone-500">Sem dados de historico para este host.</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {loading ? (
                      <p className="text-stone-500 text-sm col-span-3">Carregando...</p>
                    ) : filteredHostsByGroup.map((h) => {
                    const availability = getHostAvailability(h);
                    const isUp = availability === '1';
                    const isDown = availability === '2';
                    const ip = h.interfaces?.find((i) => i.main === '1')?.ip || '';
                    return (
                      <div
                        key={h.hostid}
                        className={`rounded-[24px] border p-4 flex items-start gap-3 ${
                          isDown ? 'border-red-500/25 bg-red-500/5' :
                          isUp ? 'border-green-500/15 bg-green-500/5' :
                          'border-white/5 bg-white/[0.02]'
                        }`}
                      >
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${isUp ? 'bg-green-500 shadow-sm shadow-green-500' : isDown ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-stone-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase tracking-[0.1em] truncate">{h.name}</p>
                          {ip && <p className="mt-0.5 text-[10px] text-stone-500 font-mono">{ip}</p>}
                          {h.groups && h.groups.length > 0 && (
                            <p className="mt-1 text-[10px] text-stone-600 truncate">{h.groups.map((g) => g.name).join(' · ')}</p>
                          )}
                          <button
                            onClick={() => void openHostHistory(h)}
                            className="mt-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-300 transition hover:border-neon-cyan/30 hover:text-neon-cyan"
                          >
                            Historico
                          </button>
                        </div>
                        <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${isUp ? 'text-green-400 border-green-500/20 bg-green-500/10' : isDown ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-stone-400 border-stone-500/20 bg-stone-500/10'}`}>
                          {isUp ? 'UP' : isDown ? 'DOWN' : '?'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── TAB: EVENTS ── */}
            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl pb-20"
              >
                <h2 className="text-xl font-[950] tracking-[-0.04em] uppercase mb-6">Histórico de eventos (7d)</h2>
                {loading ? (
                  <p className="text-stone-500 text-sm">Carregando...</p>
                ) : filteredEvents.length === 0 ? (
                  <p className="text-stone-500 text-sm">Nenhum evento recente.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((ev) => (
                      <div key={ev.eventid} className={`rounded-[22px] border p-4 ${SEVERITY_BG[ev.severity] || 'border-white/5 bg-white/[0.02]'}`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] ${SEVERITY_BADGE[ev.severity] || ''}`}>
                                {SEVERITY_LABEL[ev.severity] || ev.severity}
                              </span>
                              {ev.acknowledged === '1' && (
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500">· Ack</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-black uppercase tracking-[0.1em]">{ev.name}</p>
                            <p className="mt-1 text-xs text-stone-500">{ev.hosts?.map((h) => h.name).join(', ')}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <Zap className="w-4 h-4 text-stone-600 ml-auto" />
                            <p className="mt-1 text-[10px] text-stone-500">{formatClock(ev.clock)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
