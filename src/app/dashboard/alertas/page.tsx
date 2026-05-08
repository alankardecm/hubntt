'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, TriangleAlert } from 'lucide-react';

type AlertItem = {
  id: string;
  message_id: string;
  group_id: string | null;
  group_name: string;
  sender_name: string | null;
  message_text: string;
  msg_timestamp: number;
  alert_type: string;
  severity: string;
  sentiment: string | null;
  keywords: string[];
  flags: string[];
};

type AlertsPayload = {
  ok?: boolean;
  summary?: {
    total: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    by_group: Record<string, number>;
  };
  alerts?: AlertItem[];
};

function formatTime(ts: number): string {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(ms));
}

export default function AlertasDashboard() {
  const [alertsData, setAlertsData] = useState<AlertsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<1 | 7 | 30>(1);
  const [filterType, setFilterType] = useState<string>('todos');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadAlerts(days: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/wa-monitor/alerts?days=${days}`);
      const data = (await res.json()) as AlertsPayload;
      if (data?.ok) {
        setAlertsData(data);
        setLastUpdated(new Date());
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts(period);
    const t = setInterval(() => loadAlerts(period), 60_000);
    return () => clearInterval(t);
  }, [period]);

  const allTypes = ['todos', ...Object.keys(alertsData?.summary?.by_type ?? {})];

  const filteredAlerts = (alertsData?.alerts ?? []).filter(
    (a) => filterType === 'todos' || a.alert_type === filterType
  );

  const alertTypeStyle: Record<string, { border: string; bg: string; label: string }> = {
    ofensa:    { border: 'border-red-500/30',    bg: 'bg-red-500/8',    label: 'text-red-400' },
    incidente: { border: 'border-orange-500/30', bg: 'bg-orange-500/8', label: 'text-orange-400' },
    alerta:    { border: 'border-yellow-500/30', bg: 'bg-yellow-500/8', label: 'text-yellow-400' },
  };

  function getStyle(type: string) {
    return alertTypeStyle[type] ?? { border: 'border-white/10', bg: 'bg-white/[0.03]', label: 'text-stone-400' };
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 py-6 lg:px-10 flex flex-col gap-6 pb-16">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/5 bg-card px-8 py-6 shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TriangleAlert className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                    Hub Operacional
                  </p>
                  <h1 className="mt-0.5 text-xl font-[950] uppercase tracking-[-0.03em]">
                    Alertas Operacionais
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadAlerts(period)}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <div className="flex items-center gap-1 rounded-[20px] border border-white/10 bg-white/[0.03] p-1">
                  {([1, 7, 30] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPeriod(d)}
                      className={`rounded-[16px] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        period === d ? 'bg-red-500 text-white shadow-md' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {d === 1 ? 'Hoje' : `${d}d`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Total de alertas',
                  value: alertsData?.summary?.total ?? 0,
                  color: (alertsData?.summary?.total ?? 0) > 0 ? 'text-red-400' : 'text-stone-400',
                },
                {
                  label: 'Grupos afetados',
                  value: Object.keys(alertsData?.summary?.by_group ?? {}).length,
                  color: 'text-orange-400',
                },
                {
                  label: 'Tipos distintos',
                  value: Object.keys(alertsData?.summary?.by_type ?? {}).length,
                  color: 'text-yellow-400',
                },
                {
                  label: 'Severidades',
                  value: Object.keys(alertsData?.summary?.by_severity ?? {}).length,
                  color: 'text-stone-300',
                },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-[22px] border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">{kpi.label}</p>
                  <p className={`mt-2 text-2xl font-[1000] tracking-[-0.05em] ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Filtro por tipo */}
          {allTypes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {allTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                    filterType === type
                      ? 'border-red-500/40 bg-red-500/15 text-red-400'
                      : 'border-white/10 bg-white/[0.03] text-stone-400 hover:text-white'
                  }`}
                >
                  {type}
                  {type !== 'todos' && alertsData?.summary?.by_type[type]
                    ? ` · ${alertsData.summary.by_type[type]}`
                    : ''}
                </button>
              ))}
            </div>
          )}

          {/* Lista de alertas */}
          {loading && !alertsData ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-stone-600 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-stone-500">Carregando alertas...</p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center py-20"
            >
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-stone-600 mx-auto mb-3" />
                <p className="text-sm text-stone-500">Nenhum alerta no período selecionado.</p>
                <p className="text-xs text-stone-600 mt-1">
                  {period === 1 ? 'Tente expandir para 7 ou 30 dias.' : 'Tudo tranquilo no período.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Breakdown por grupo */}
              {Object.keys(alertsData?.summary?.by_group ?? {}).length > 0 && (
                <div className="rounded-[28px] border border-white/5 bg-card px-6 py-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3">
                    Alertas por grupo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(alertsData?.summary?.by_group ?? {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([group, count]) => (
                        <span
                          key={group}
                          className="rounded-full border border-red-500/20 bg-red-500/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-400"
                        >
                          {group} · {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Cards individuais */}
              {filteredAlerts.map((alert) => {
                const style = getStyle(alert.alert_type);
                return (
                  <div
                    key={alert.id}
                    className={`rounded-[24px] border px-5 py-4 ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${style.label}`}>
                          {alert.alert_type}
                        </span>
                        {alert.severity && alert.severity !== alert.alert_type && (
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                            {alert.severity}
                          </span>
                        )}
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.12em]">
                          {alert.group_name}
                        </span>
                        {alert.sender_name && (
                          <span className="text-[10px] text-stone-500">· {alert.sender_name}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0">
                        {formatTime(alert.msg_timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-stone-300 leading-relaxed">{alert.message_text}</p>

                    {alert.keywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {alert.keywords.slice(0, 6).map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-stone-500"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {alert.flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {alert.flags.map((flag) => (
                          <span
                            key={flag}
                            className="rounded-full border border-red-500/15 bg-red-500/8 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-red-400"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {lastUpdated && (
                <p className="text-center text-[10px] text-stone-600 pt-2">
                  Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
