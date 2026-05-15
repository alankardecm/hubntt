'use client';

import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  DotProps,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeekData, WeeklyProtocolsResponse } from '@/app/api/datalake/weekly-protocols/route';

// ── Constantes ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

// Paleta: semana mais antiga → mais recente (atual = verde Netturbo)
const WEEK_COLORS = ['#a8a29e', '#78716c', '#57534e', '#8DC63F'];

// ── Tipos ──────────────────────────────────────────────────────────────────────

type ChartPoint = {
  day: string;
  [weekKey: string]: string | number | undefined;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildChartData(weeks: WeekData[]): ChartPoint[] {
  return DAY_LABELS.map((day) => {
    const point: ChartPoint = { day };
    for (const week of weeks) {
      point[week.weekKey] = week.days[day as keyof typeof week.days];
    }
    return point;
  });
}

// ── Dot com destaque de anomalia ───────────────────────────────────────────────

type AnomalyDotProps = DotProps & {
  payload?: ChartPoint;
  isCurrent: boolean;
  anomalies: Record<string, boolean>;
  color: string;
};

function AnomalyDot(props: AnomalyDotProps) {
  const { cx, cy, payload, isCurrent, anomalies, color } = props;
  if (cx === undefined || cy === undefined || !payload) return null;

  const isAnomaly = isCurrent && anomalies[payload.day];

  if (isAnomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />;
}

// ── Tooltip customizado ────────────────────────────────────────────────────────

type CustomTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  weeks: WeekData[];
  anomalies: Record<string, boolean>;
};

function CustomTooltip({ active, label, payload, weeks, anomalies }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  const isAnomalyDay = anomalies[label];
  const currentWeek = weeks.find((w) => w.isCurrent);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-stone-700 mb-2">
        {label}
        {isAnomalyDay && (
          <span className="ml-2 text-red-500 font-semibold">↑ Anomalia</span>
        )}
      </p>
      {payload.map((entry) => {
        const week = weeks.find((w) => w.weekKey === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-stone-500">{week?.label ?? entry.name}</span>
            <span className="ml-auto font-semibold text-stone-800">
              {entry.value ?? '—'}
            </span>
          </div>
        );
      })}
      {isAnomalyDay && currentWeek && (
        <p className="mt-2 pt-2 border-t border-stone-100 text-red-500">
          Volume +20% acima da média das semanas anteriores
        </p>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function ProtocolosSemanalPage() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [equipes, setEquipes] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<Record<string, boolean>>({});
  const [equipe, setEquipe] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (selectedEquipe: string) => {
    setLoading(true);
    setError('');
    try {
      const qs = selectedEquipe ? `?equipe=${encodeURIComponent(selectedEquipe)}` : '';
      const res = await fetch(`/api/datalake/weekly-protocols${qs}`);
      const data: WeeklyProtocolsResponse = await res.json();

      if (!data.ok || !data.weeks) {
        setError(data.error ?? 'Erro ao carregar dados.');
        return;
      }

      setWeeks(data.weeks);
      setEquipes(data.equipes ?? []);
      setAnomalies((data.anomalies as Record<string, boolean>) ?? {});
    } catch {
      setError('Falha na requisição.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(equipe);
  }, [fetchData, equipe]);

  const chartData = buildChartData(weeks);
  const anomalyDays = Object.entries(anomalies)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const currentWeek = weeks.find((w) => w.isCurrent);

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8DC63F]/10">
              <TrendingUp className="h-5 w-5 text-[#8DC63F]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-stone-800">
                Protocolos Semanais
              </h1>
              <p className="text-[11px] text-stone-400">
                Comparativo das últimas 4 semanas · anomalia &gt;20% acima da média
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de equipe */}
            <select
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8DC63F]/40"
              value={equipe}
              onChange={(e) => setEquipe(e.target.value)}
            >
              <option value="">Todas as equipes</option>
              {equipes.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            <button
              onClick={() => fetchData(equipe)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 disabled:opacity-40 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Anomalia banner */}
          {anomalyDays.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
            >
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  Volume anômalo detectado na semana atual
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                  Dias com +20% acima da média:{' '}
                  <strong>{anomalyDays.join(', ')}</strong>
                  {currentWeek && (
                    <> — {currentWeek.label}</>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* Gráfico */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  Protocolos abertos por dia da semana
                </p>
                {equipe && (
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Equipe: <span className="font-semibold text-stone-600">{equipe}</span>
                  </p>
                )}
              </div>
              {/* Legenda de anomalia */}
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                ponto anômalo
              </div>
            </div>

            {error ? (
              <div className="flex h-64 items-center justify-center text-sm text-red-500">
                {error}
              </div>
            ) : loading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-stone-300" />
              </div>
            ) : weeks.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-stone-400">
                Nenhum dado encontrado para o período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        weeks={weeks}
                        anomalies={anomalies}
                      />
                    }
                  />
                  <Legend
                    formatter={(value) => {
                      const week = weeks.find((w) => w.weekKey === value);
                      return (
                        <span className="text-[11px] text-stone-600">
                          {week?.label ?? value}
                          {week?.isCurrent ? ' (atual)' : ''}
                        </span>
                      );
                    }}
                  />
                  {weeks.map((week, idx) => {
                    const color = WEEK_COLORS[Math.min(idx, WEEK_COLORS.length - 1)];
                    return (
                      <Line
                        key={week.weekKey}
                        type="monotone"
                        dataKey={week.weekKey}
                        name={week.weekKey}
                        stroke={color}
                        strokeWidth={week.isCurrent ? 2.5 : 1.5}
                        strokeDasharray={week.isCurrent ? undefined : '4 3'}
                        connectNulls
                        dot={(dotProps) => (
                          <AnomalyDot
                            {...dotProps}
                            isCurrent={week.isCurrent}
                            anomalies={anomalies}
                            color={color}
                          />
                        )}
                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Tabela resumo */}
          {!loading && !error && weeks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-stone-100">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  Detalhamento por dia
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500">
                      <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider">Dia</th>
                      {weeks.map((week) => (
                        <th
                          key={week.weekKey}
                          className={`px-4 py-2.5 text-right font-semibold uppercase tracking-wider ${
                            week.isCurrent ? 'text-[#8DC63F]' : ''
                          }`}
                        >
                          {week.label}
                          {week.isCurrent && <span className="text-stone-400 normal-case tracking-normal font-normal"> (atual)</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAY_LABELS.map((day) => {
                      const isAnomaly = anomalies[day];
                      return (
                        <tr
                          key={day}
                          className={`border-t border-stone-100 ${isAnomaly ? 'bg-red-50/60' : 'hover:bg-stone-50'}`}
                        >
                          <td className="px-4 py-2.5 font-medium text-stone-700">
                            {day}
                            {isAnomaly && (
                              <AlertTriangle className="inline ml-1.5 h-3 w-3 text-red-400" />
                            )}
                          </td>
                          {weeks.map((week) => {
                            const val = week.days[day as keyof typeof week.days];
                            return (
                              <td
                                key={week.weekKey}
                                className={`px-4 py-2.5 text-right tabular-nums ${
                                  week.isCurrent
                                    ? isAnomaly
                                      ? 'font-bold text-red-600'
                                      : 'font-bold text-[#8DC63F]'
                                    : 'text-stone-500'
                                }`}
                              >
                                {val ?? '—'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
