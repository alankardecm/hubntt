'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database, Table2, ChevronRight,
  RefreshCcw, Layers, PlugZap, Bot, Eye,
  FileText, TrendingUp, Users, AlertCircle,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import type { DashboardSuggestionResponse, DatalakeOverview, DatalakePreviewResult } from '@/shared/types/datalake';

const emptyOverview: DatalakeOverview = {
  ok: false,
  status: 'disconnected',
  database: null,
  host: null,
  port: null,
  tableCount: 0,
  tables: [],
  previewLimit: 25,
};

// Metadata for the 3 known tables
const TABLE_META: Record<string, { label: string; icon: React.ElementType; color: string; description: string; prompts: string[] }> = {
  crm_solicitacoes: {
    label: 'CRM – Solicitações',
    icon: FileText,
    color: 'text-neon-cyan',
    description: 'Chamados e solicitações abertas pelos clientes (suporte, cancelamento, mudança de plano)',
    prompts: [
      'Volume de chamados por tipo nos últimos 30 dias',
      'Distribuição de chamados por status (aberto, fechado, pendente)',
      'Top 10 clientes com mais solicitações no mês',
    ],
  },
  fato_solicitacoes: {
    label: 'Fato – Atendimento',
    icon: TrendingUp,
    color: 'text-violet-400',
    description: 'Métricas de atendimento: volume, SLA, tipo, status, tempo de resolução',
    prompts: [
      'Tempo médio de resolução por tipo de solicitação',
      'Evolução mensal do volume de atendimentos',
      'SLA cumprido vs. SLA violado por período',
    ],
  },
  fato_contratos: {
    label: 'Fato – Contratos',
    icon: Users,
    color: 'text-emerald-400',
    description: 'Contratos de clientes: plano, valor, status ativo/cancelado, cidade',
    prompts: [
      'Distribuição de contratos por plano de internet',
      'Evolução de churn mensal (cancelamentos vs. ativações)',
      'Receita estimada por cidade ou bairro',
    ],
  },
};

const DEFAULT_TABLE_PROMPTS = [
  'Quero um dashboard de desempenho comercial por tabela mais relevante.',
  'Analise o volume de chamados abertos comparado com contratos ativos.',
  'Mostre a evolução de churn e SLA nos últimos meses.',
];

export default function DatalakePage() {
  const [overview, setOverview] = useState<DatalakeOverview>(emptyOverview);
  const [selectedTable, setSelectedTable] = useState('');
  const [preview, setPreview] = useState<DatalakePreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dashboardPrompt, setDashboardPrompt] = useState(DEFAULT_TABLE_PROMPTS[0]);
  const [dashboardSuggestions, setDashboardSuggestions] = useState<DashboardSuggestionResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'preview' | 'suggest'>('catalog');

  async function loadOverview() {
    setLoading(true);
    try {
      const response = await fetch('/api/datalake/schema');
      const data = (await response.json()) as DatalakeOverview;
      setOverview(data);

      const firstTable = data.tables[0]?.name || '';
      setSelectedTable((current) => current || firstTable);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(tableName: string) {
    if (!tableName) {
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    setActiveTab('preview');
    try {
      const response = await fetch(`/api/datalake/preview?table=${encodeURIComponent(tableName)}`);
      const data = (await response.json()) as DatalakePreviewResult;
      setPreview(data.ok ? data : null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function loadDashboardSuggestions() {
    setDashboardLoading(true);
    try {
      const response = await fetch('/api/datalake/dashboard-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: dashboardPrompt }),
      });

      const data = (await response.json()) as DashboardSuggestionResponse;
      setDashboardSuggestions(data.ok ? data : null);
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const statusBadge = useMemo(() => {
    if (overview.status === 'connected') return { label: 'Conectado', color: 'text-emerald-400 bg-emerald-500/10', dot: 'bg-emerald-400' };
    if (overview.status === 'error') return { label: 'Erro', color: 'text-red-400 bg-red-500/10', dot: 'bg-red-400' };
    return { label: 'Não configurado', color: 'text-amber-400 bg-amber-500/10', dot: 'bg-amber-400' };
  }, [overview.status]);

  const knownTables = overview.tables.filter((t) => TABLE_META[t.name]);
  const unknownTables = overview.tables.filter((t) => !TABLE_META[t.name]);

  const chartTypeIcon = (type: string) => {
    switch (type) {
      case 'metric': return '📊';
      case 'bar': return '📈';
      case 'line': return '📉';
      case 'area': return '🌊';
      case 'pie': return '🥧';
      default: return '📋';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-10 py-8 flex flex-col gap-8">

          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-stone-700">
              <span>Infraestrutura</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neon-cyan italic">Data Lake MySQL</span>
            </div>
            <button
              onClick={loadOverview}
              className="h-10 px-6 rounded-2xl bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Atualizar
            </button>
          </header>

          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Status',
                value: statusBadge.label,
                icon: overview.status === 'connected' ? CheckCircle2 : overview.status === 'error' ? XCircle : Clock,
                accent: statusBadge.dot,
              },
              { label: 'Banco', value: overview.database || 'Não definido', icon: Database, accent: 'bg-neon-cyan' },
              { label: 'Tabelas liberadas', value: overview.tableCount, icon: Table2, accent: 'bg-violet-400' },
              { label: 'Host', value: overview.host || 'Não definido', icon: Layers, accent: 'bg-emerald-400' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-[24px] p-5 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${item.accent}`} />
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-stone-600 shrink-0" />
                  <strong className="text-lg font-black leading-tight truncate">{String(item.value)}</strong>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Warning if not connected */}
          {!overview.ok && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-4 rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-5"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-400">Data Lake não conectado</p>
                <p className="mt-1 text-xs text-stone-400">
                  {overview.message || 'Configure as credenciais do MySQL no .env para habilitar o Data Lake.'}
                </p>
                <code className="mt-2 block text-[10px] text-stone-500 font-mono">
                  MYSQL_HOST • MYSQL_DATABASE • MYSQL_USER • MYSQL_PASSWORD
                </code>
              </div>
            </motion.div>
          )}

          {/* Known Tables — Quick Cards */}
          {overview.ok && knownTables.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600 mb-4">
                Tabelas Configuradas
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {knownTables.map((table, i) => {
                  const meta = TABLE_META[table.name];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={table.name}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-card rounded-[24px] p-6 border border-white/5 flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{table.name}</p>
                            <p className="text-sm font-black mt-0.5">{meta.label}</p>
                          </div>
                        </div>
                        {table.rows !== null && (
                          <span className="text-[10px] font-mono text-stone-500 bg-white/5 px-2 py-1 rounded-xl">
                            {table.rows.toLocaleString('pt-BR')} rows
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-400 leading-relaxed">{meta.description}</p>

                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-600">Análises sugeridas</p>
                        {meta.prompts.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => {
                              setDashboardPrompt(prompt);
                              setActiveTab('suggest');
                            }}
                            className="w-full text-left text-xs text-stone-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded-xl px-3 py-2 transition-colors"
                          >
                            → {prompt}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTable(table.name);
                          loadPreview(table.name);
                        }}
                        className={`mt-auto h-9 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          selectedTable === table.name
                            ? 'bg-neon-cyan text-black'
                            : 'bg-white/5 text-stone-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview da tabela
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tabs: Catálogo / Preview / Sugestões */}
          <section>
            <div className="flex items-center gap-1 mb-6 bg-white/[0.03] rounded-2xl p-1 w-fit">
              {[
                { key: 'catalog', label: 'Catálogo', icon: Table2 },
                { key: 'preview', label: 'Preview', icon: Eye },
                { key: 'suggest', label: 'Sugestões IA', icon: Bot },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'catalog' | 'preview' | 'suggest')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === key
                      ? 'bg-white/10 text-white'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Catálogo */}
            {activeTab === 'catalog' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-[24px] p-6 border border-white/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Todas as tabelas</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusBadge.color} flex items-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-[10px] font-black text-stone-600 uppercase tracking-widest py-4 px-4">Tabela</th>
                        <th className="text-left text-[10px] font-black text-stone-600 uppercase tracking-widest py-4 px-4">Descrição</th>
                        <th className="text-right text-[10px] font-black text-stone-600 uppercase tracking-widest py-4 px-4">Linhas</th>
                        <th className="text-left text-[10px] font-black text-stone-600 uppercase tracking-widest py-4 px-4">Engine</th>
                        <th className="text-right text-[10px] font-black text-stone-600 uppercase tracking-widest py-4 px-4">Atualização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-stone-500">Carregando catálogo...</td>
                        </tr>
                      ) : overview.tables.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 px-4 text-center text-stone-500">Nenhuma tabela disponível.</td>
                        </tr>
                      ) : (
                        [...knownTables, ...unknownTables].map((table) => {
                          const meta = TABLE_META[table.name];
                          const Icon = meta?.icon ?? Table2;
                          return (
                            <tr
                              key={table.name}
                              onClick={() => {
                                setSelectedTable(table.name);
                                loadPreview(table.name);
                              }}
                              className={`border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.02] ${selectedTable === table.name ? 'bg-white/[0.04]' : ''}`}
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-4 h-4 shrink-0 ${meta?.color ?? 'text-stone-500'}`} />
                                  <span className="text-sm font-bold">{table.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-xs text-stone-400">{meta?.label ?? '—'}</td>
                              <td className="py-4 px-4 text-right font-mono text-sm">{table.rows?.toLocaleString('pt-BR') ?? '—'}</td>
                              <td className="py-4 px-4 text-xs text-stone-400 uppercase">{table.engine ?? '—'}</td>
                              <td className="py-4 px-4 text-right text-xs text-stone-500">
                                {table.updatedAt ? new Date(table.updatedAt).toLocaleString('pt-BR') : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Tab: Preview */}
            {activeTab === 'preview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-[24px] p-6 border border-white/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Preview Seguro</h3>
                  <Eye className="w-4 h-4 text-neon-cyan" />
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-600">Tabela ativa</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => {
                      setSelectedTable(e.target.value);
                      loadPreview(e.target.value);
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Selecione uma tabela</option>
                    {overview.tables.map((table) => (
                      <option key={table.name} value={table.name}>{table.name}</option>
                    ))}
                  </select>
                </div>

                {previewLoading ? (
                  <p className="text-sm text-stone-500 py-8 text-center">Carregando preview...</p>
                ) : !preview ? (
                  <p className="text-sm text-stone-500 py-8 text-center">Selecione uma tabela para visualizar amostra dos dados.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">
                        Mostrando até <strong className="text-white">{preview.limit}</strong> linhas da tabela{' '}
                        <strong className="text-neon-cyan">{preview.table}</strong>
                      </span>
                      {TABLE_META[preview.table] && (
                        <span className="text-[10px] bg-white/5 text-stone-400 px-3 py-1 rounded-xl">
                          {TABLE_META[preview.table].label}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-white/5">
                      <table className="w-full text-xs">
                        <thead className="bg-white/[0.03]">
                          <tr>
                            {preview.columns.map((column) => (
                              <th key={column.name} className="px-3 py-3 text-left font-black uppercase tracking-wider text-stone-500 whitespace-nowrap">
                                {column.name}
                                {column.key === 'PRI' && <span className="ml-1 text-amber-400">🔑</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, index) => (
                            <tr key={index} className="border-t border-white/5 hover:bg-white/[0.02]">
                              {preview.columns.map((column) => (
                                <td key={column.name} className="px-3 py-3 text-stone-300 whitespace-nowrap max-w-[200px] truncate">
                                  {String(row[column.name] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-stone-600 uppercase tracking-widest">
                      {preview.columns.length} colunas • Read-only • Limite: {preview.limit} linhas
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab: Sugestões IA */}
            {activeTab === 'suggest' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-[24px] p-6 border border-white/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Sugestões de Dashboard com IA</h3>
                  <Bot className="w-4 h-4 text-neon-cyan" />
                </div>

                {/* Quick prompt buttons */}
                <div className="mb-5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-600">Atalhos rápidos</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_TABLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setDashboardPrompt(p)}
                        className={`text-[10px] font-bold px-3 py-2 rounded-xl transition-colors ${
                          dashboardPrompt === p
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                            : 'bg-white/5 text-stone-400 hover:bg-white/10 hover:text-white border border-transparent'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={dashboardPrompt}
                  onChange={(e) => setDashboardPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none resize-none"
                  placeholder="Descreva o dashboard desejado..."
                />

                <button
                  onClick={loadDashboardSuggestions}
                  disabled={dashboardLoading || !overview.ok}
                  className="mt-4 h-11 px-6 rounded-2xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <PlugZap className="w-4 h-4" />
                  {dashboardLoading ? 'Gerando...' : 'Gerar sugestões'}
                </button>

                {!overview.ok && (
                  <p className="mt-3 text-xs text-amber-400/70">Conecte o Data Lake para habilitar sugestões de dashboard.</p>
                )}

                {dashboardSuggestions && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-600">
                        Gerado por: {dashboardSuggestions.source === 'ai' ? '🤖 IA' : '⚙️ Heurística'}
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {dashboardSuggestions.suggestions.map((suggestion) => (
                        <div
                          key={`${suggestion.title}-${suggestion.table}`}
                          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-black leading-tight">{suggestion.title}</h4>
                            <span className="text-lg shrink-0">{chartTypeIcon(suggestion.chartType)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] uppercase tracking-widest font-black text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded-lg">
                              {suggestion.chartType}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest font-black text-stone-500 bg-white/5 px-2 py-1 rounded-lg">
                              {suggestion.table}
                            </span>
                            {suggestion.aggregation && (
                              <span className="text-[9px] uppercase tracking-widest font-black text-violet-400 bg-violet-400/10 px-2 py-1 rounded-lg">
                                {suggestion.aggregation}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 leading-relaxed">{suggestion.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
