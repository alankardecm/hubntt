'use client';

import Sidebar from '@/components/Sidebar';
import WidgetCard from '@/components/datalake/WidgetCard';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, Plus, Trash2, ChevronRight, LayoutGrid, Search, Table2, Columns3, Eye, Sparkles, RefreshCcw, Wand2, Filter } from 'lucide-react';
import type { AggregationType, ChartType, WidgetConfig } from '@/shared/types/dashboard';
import type { DashboardSuggestionResponse, DatalakeOverview, DatalakePreviewResult } from '@/shared/types/datalake';

const STORAGE_KEY = 'netturbo-dashboard-widgets';
const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'bar', label: 'Barras', icon: 'BA' },
  { value: 'line', label: 'Linha', icon: 'LI' },
  { value: 'area', label: 'Area', icon: 'AR' },
  { value: 'pie', label: 'Pizza', icon: 'PI' },
  { value: 'metric', label: 'Metrica', icon: 'ME' },
  { value: 'table', label: 'Tabela', icon: 'TB' },
];
const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: 'count', label: 'COUNT (contagem)' },
  { value: 'sum', label: 'SUM (soma)' },
  { value: 'avg', label: 'AVG (media)' },
  { value: 'min', label: 'MIN (minimo)' },
  { value: 'max', label: 'MAX (maximo)' },
  { value: 'none', label: 'Sem agregacao (tabela raw)' },
];
const WIDGET_COLORS = ['#379890', '#3f7d78', '#5b90c7', '#6aa84f', '#d4a23a', '#bf6f8d', '#7ab8b1', '#8f7edc'];
type ColumnInfo = { name: string; type: string };
const TABLE_HINTS: Record<string, { label: string; description: string; focus: string[] }> = {
  fato_contratos: { label: 'Contratos', description: 'Base mais forte para receita, carteira, cidade, vendedor e situacao contratual.', focus: ['carteira', 'churn', 'cidade', 'vendedor', 'ticket medio'] },
  crm_solicitacoes: { label: 'Solicitacoes', description: 'Base mais forte para chamados, abertura, recorrencia, clientes criticos e carga operacional.', focus: ['volume', 'tipo', 'status', 'cliente', 'tempo'] },
  fato_solicitacoes: { label: 'Atendimento', description: 'Base para SLA, resolucao, gargalos por tipo e distribuicao do atendimento.', focus: ['sla', 'tempo medio', 'tipo', 'status', 'evolucao'] },
};
const DECISION_PROMPTS = [
  'Quero um painel comercial para contratos, carteira e cidades mais relevantes.',
  'Quero identificar gargalos de atendimento, SLA e status de solicitacoes.',
  'Quero um dashboard executivo com receita, churn e distribuicao geografica.',
];
const emptyOverview: DatalakeOverview = { ok: false, status: 'disconnected', database: null, host: null, port: null, tableCount: 0, tables: [], previewLimit: 25 };
const defaultForm = { title: '', table: '', chartType: 'bar' as ChartType, xColumn: '', metric: '', aggregation: 'count' as AggregationType, limit: 20, color: WIDGET_COLORS[0] };

function generateId() {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function isNumericColumn(type: string) {
  return /int|decimal|float|double|numeric|bigint|smallint/i.test(type);
}
function looksDimensionalColumn(name: string) {
  return /(cidade|status|tipo|vendedor|cliente|bairro|plano|servico|canal|mes|ano|data)/i.test(name);
}
function looksTemporalColumn(name: string) {
  return /(data|dt_|mes|ano|periodo)/i.test(name);
}
function buildWidget(input: { title: string; table: string; chartType: ChartType; aggregation: AggregationType; xColumn?: string; metric?: string; limit?: number; color: string }): WidgetConfig {
  return { id: generateId(), title: input.title, table: input.table, chartType: input.chartType, xColumn: input.xColumn || '', metric: input.metric || '', aggregation: input.aggregation, limit: input.limit || 20, color: input.color };
}

export default function DashboardsPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [colsLoading, setColsLoading] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [overview, setOverview] = useState<DatalakeOverview>(emptyOverview);
  const [selectedTable, setSelectedTable] = useState('');
  const [preview, setPreview] = useState<DatalakePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');
  const [suggestionPrompt, setSuggestionPrompt] = useState(DECISION_PROMPTS[0]);
  const [suggestions, setSuggestions] = useState<DashboardSuggestionResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const dragId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const deferredExplorerSearch = useDeferredValue(explorerSearch);
  const deferredColumnSearch = useDeferredValue(columnSearch);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/datalake/schema');
      const data = (await response.json()) as DatalakeOverview;
      setOverview(data);
      if (data.ok && data.tables.length > 0) {
        const names = data.tables.map((t) => t.name);
        setAvailableTables(names);
        setSelectedTable((current) => current || names[0]);
        setForm((current) => ({ ...current, table: current.table || names[0] }));
      }
    } catch {}
  }, []);

  const loadColumns = useCallback(async (table: string) => {
    if (!table) return;
    setColsLoading(true);
    try {
      const res = await fetch(`/api/datalake/columns?table=${encodeURIComponent(table)}`);
      const data = (await res.json()) as { ok: boolean; columns: ColumnInfo[] };
      setColumns(data.ok ? data.columns : []);
    } finally {
      setColsLoading(false);
    }
  }, []);

  const loadPreview = useCallback(async (table: string) => {
    if (!table) return;
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/datalake/preview?table=${encodeURIComponent(table)}`);
      const data = (await response.json()) as DatalakePreviewResult;
      setPreview(data.ok ? data : null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async (promptValue: string) => {
    setSuggestionsLoading(true);
    try {
      const response = await fetch('/api/datalake/dashboard-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptValue }),
      });
      const data = (await response.json()) as DashboardSuggestionResponse;
      setSuggestions(data.ok ? data : null);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWidgets(JSON.parse(saved) as WidgetConfig[]);
    } catch {}
    void loadOverview();
    void loadSuggestions(DECISION_PROMPTS[0]);
  }, [loadOverview, loadSuggestions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    if (!selectedTable) return;
    void loadColumns(selectedTable);
    void loadPreview(selectedTable);
    setForm((current) => ({ ...current, table: selectedTable, xColumn: '', metric: '' }));
  }, [selectedTable, loadColumns, loadPreview]);

  useEffect(() => {
    if (showPanel && form.table) void loadColumns(form.table);
  }, [form.table, showPanel, loadColumns]);

  const filteredTables = useMemo(() => {
    const needle = deferredExplorerSearch.trim().toLowerCase();
    if (!needle) return overview.tables;
    return overview.tables.filter((table) => table.name.toLowerCase().includes(needle));
  }, [overview.tables, deferredExplorerSearch]);

  const filteredColumns = useMemo(() => {
    const needle = deferredColumnSearch.trim().toLowerCase();
    if (!needle) return columns;
    return columns.filter((column) => column.name.toLowerCase().includes(needle) || column.type.toLowerCase().includes(needle));
  }, [columns, deferredColumnSearch]);

  const numericColumns = useMemo(() => columns.filter((column) => isNumericColumn(column.type)), [columns]);
  const dimensionalColumns = useMemo(() => columns.filter((column) => looksDimensionalColumn(column.name)), [columns]);
  const temporalColumns = useMemo(() => columns.filter((column) => looksTemporalColumn(column.name)), [columns]);

  const quickActions = useMemo(() => {
    if (!selectedTable) return [] as Array<{ title: string; description: string; chartType: ChartType; aggregation: AggregationType; xColumn: string; metric: string }>;
    const countDimension = dimensionalColumns[0]?.name || columns[0]?.name || '';
    const topMetric = numericColumns[0]?.name || '';
    const trendDimension = temporalColumns[0]?.name || countDimension;
    return [
      { title: 'Tabela exploratoria', description: 'Mostra linhas brutas para inspecao rapida da base.', chartType: 'table', aggregation: 'none', xColumn: '', metric: '' },
      { title: 'Contagem por categoria', description: 'Ajuda a descobrir distribuicao por status, cidade, vendedor ou tipo.', chartType: 'bar', aggregation: 'count', xColumn: countDimension, metric: '' },
      { title: 'Valor total por categoria', description: 'Mostra soma em dimensoes chave quando existe coluna numerica.', chartType: 'bar', aggregation: 'sum', xColumn: countDimension, metric: topMetric },
      { title: 'Tendencia temporal', description: 'Organiza leitura por data, mes ou periodo para decisao rapida.', chartType: 'line', aggregation: topMetric ? 'sum' : 'count', xColumn: trendDimension, metric: topMetric },
    ];
  }, [selectedTable, dimensionalColumns, columns, numericColumns, temporalColumns]);

  function pushWidget(widget: WidgetConfig) {
    setWidgets((prev) => [...prev, widget]);
    setColorIndex((index) => index + 1);
  }
  function openPanel() {
    const nextColor = WIDGET_COLORS[colorIndex % WIDGET_COLORS.length];
    setForm({ ...defaultForm, color: nextColor, table: selectedTable || availableTables[0] || '' });
    setShowPanel(true);
  }
  function addWidget() {
    if (!form.title || !form.table) return;
    pushWidget(buildWidget({ title: form.title, table: form.table, chartType: form.chartType, aggregation: form.aggregation, xColumn: form.xColumn, metric: form.metric, limit: form.limit, color: form.color }));
    setShowPanel(false);
  }
  function addQuickAction(action: (typeof quickActions)[number]) {
    if (!selectedTable) return;
    const color = WIDGET_COLORS[colorIndex % WIDGET_COLORS.length];
    pushWidget(buildWidget({ title: `${TABLE_HINTS[selectedTable]?.label || selectedTable} | ${action.title}`, table: selectedTable, chartType: action.chartType, aggregation: action.aggregation, xColumn: action.xColumn, metric: action.metric, limit: action.chartType === 'table' ? 25 : 12, color }));
  }
  function addSuggestion(index: number) {
    const suggestion = suggestions?.suggestions[index];
    if (!suggestion) return;
    const color = WIDGET_COLORS[colorIndex % WIDGET_COLORS.length];
    pushWidget(buildWidget({ title: suggestion.title, table: suggestion.table, chartType: suggestion.chartType, aggregation: suggestion.aggregation || 'count', xColumn: suggestion.x, metric: suggestion.metric || suggestion.y, limit: suggestion.chartType === 'table' ? 25 : 15, color }));
  }
  function removeWidget(id: string) { setWidgets((prev) => prev.filter((w) => w.id !== id)); }
  function clearAll() { if (confirm('Limpar todos os widgets?')) setWidgets([]); }
  function handleDragStart(id: string) { dragId.current = id; }
  function handleDragOver(e: React.DragEvent, id: string) { e.preventDefault(); dragOverId.current = id; }
  function handleDrop() {
    if (!dragId.current || !dragOverId.current || dragId.current === dragOverId.current) return;
    setWidgets((prev) => {
      const items = [...prev];
      const fromIndex = items.findIndex((w) => w.id === dragId.current);
      const toIndex = items.findIndex((w) => w.id === dragOverId.current);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return items;
    });
    dragId.current = null;
    dragOverId.current = null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-10 py-8 flex min-h-full flex-col gap-8">
          <header className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">
                <span>Data Lake</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#379890] italic">Decision Dashboard Builder</span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#143230]">Dashboards para decisao na hora</h1>
              <p className="mt-2 max-w-4xl text-sm text-stone-600">Encontre a tabela certa, entenda as colunas, veja amostra dos dados e transforme isso rapido em visao executiva dentro do HUB.</p>
            </div>
            <div className="flex items-center gap-3">
              {widgets.length > 0 && <button onClick={clearAll} className="h-10 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/20"><span className="inline-flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Limpar</span></button>}
              <button onClick={openPanel} className="h-10 rounded-2xl bg-[#379890] px-6 text-[9px] font-black uppercase tracking-widest text-white shadow-[0_18px_38px_-18px_rgba(55,152,144,0.45)] transition-all hover:scale-105 active:scale-95"><span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Widget</span></button>
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
            <div className="rounded-[30px] border border-[#143230]/8 bg-white/85 p-6 shadow-[0_20px_50px_-34px_rgba(20,50,48,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Catalogo</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#143230]">Tabelas</h2></div>
                <Table2 className="w-6 h-6 text-[#379890]" />
              </div>
              <div className="mt-5 rounded-2xl border border-[#143230]/10 bg-[#f7f8f4] px-4 py-3 flex items-center gap-3"><Search className="w-4 h-4 text-stone-400" /><input value={explorerSearch} onChange={(e) => setExplorerSearch(e.target.value)} placeholder="Buscar tabela" className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400" /></div>
              <div className="mt-5 space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredTables.map((table) => {
                  const active = selectedTable === table.name;
                  const hint = TABLE_HINTS[table.name];
                  return (
                    <button key={table.name} onClick={() => setSelectedTable(table.name)} className={`w-full rounded-[22px] border p-4 text-left transition-all ${active ? 'border-[#379890]/30 bg-[#379890]/10 shadow-[0_18px_35px_-25px_rgba(55,152,144,0.45)]' : 'border-[#143230]/8 bg-white hover:border-[#379890]/20'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-sm font-black text-[#143230]">{hint?.label || table.name}</p><p className="mt-1 font-mono text-[10px] text-stone-500">{table.name}</p></div>
                        <span className="rounded-full border border-[#143230]/8 px-2 py-1 text-[10px] font-black text-stone-500">{table.rows?.toLocaleString('pt-BR') ?? '-' } rows</span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-stone-600">{hint?.description || 'Tabela liberada no Data Lake para exploracao e widgets.'}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#143230]/8 bg-white/85 p-6 shadow-[0_20px_50px_-34px_rgba(20,50,48,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Explorador</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#143230]">{TABLE_HINTS[selectedTable]?.label || selectedTable || 'Selecione uma tabela'}</h2></div>
                <button onClick={() => selectedTable && void loadPreview(selectedTable)} className="rounded-2xl border border-[#143230]/10 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 hover:border-[#379890]/20 hover:text-[#143230]"><span className="inline-flex items-center gap-2"><RefreshCcw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} /> Atualizar</span></button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-[#143230]/8 bg-[#f7f8f4] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Rows</p><p className="mt-2 text-3xl font-black text-[#143230]">{overview.tables.find((table) => table.name === selectedTable)?.rows?.toLocaleString('pt-BR') || '-'}</p></div>
                <div className="rounded-[22px] border border-[#143230]/8 bg-[#f7f8f4] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Colunas</p><p className="mt-2 text-3xl font-black text-[#143230]">{columns.length}</p></div>
                <div className="rounded-[22px] border border-[#143230]/8 bg-[#f7f8f4] p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Foco analitico</p><p className="mt-2 text-sm font-black text-[#143230]">{TABLE_HINTS[selectedTable]?.focus.slice(0, 2).join(' / ') || 'Exploracao geral'}</p></div>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[24px] border border-[#143230]/8 bg-white p-4">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Columns3 className="w-4 h-4 text-[#379890]" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Colunas</p></div>{colsLoading && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">carregando</span>}</div>
                  <div className="mt-3 rounded-2xl border border-[#143230]/10 bg-[#f7f8f4] px-4 py-3 flex items-center gap-3"><Filter className="w-4 h-4 text-stone-400" /><input value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} placeholder="Buscar coluna ou tipo" className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400" /></div>
                  <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {filteredColumns.map((column) => (
                      <div key={column.name} className="rounded-2xl border border-[#143230]/8 bg-[#f7f8f4] px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="text-sm font-black text-[#143230]">{column.name}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{column.type}</p></div>
                          {isNumericColumn(column.type) && <span className="rounded-full bg-[#379890]/10 px-2 py-1 text-[10px] font-black uppercase text-[#2c7f78]">metrica</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#143230]/8 bg-white p-4">
                  <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#379890]" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Preview dos dados</p></div>
                  <div className="mt-4 max-h-[430px] overflow-auto rounded-2xl border border-[#143230]/8 bg-[#fcfcfb]">
                    {previewLoading ? (
                      <div className="flex h-[280px] items-center justify-center gap-3 text-sm text-stone-500"><RefreshCcw className="w-4 h-4 animate-spin" /> Carregando amostra</div>
                    ) : !preview || preview.columns.length === 0 ? (
                      <div className="flex h-[280px] items-center justify-center text-sm text-stone-500">Selecione uma tabela para visualizar os dados.</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#f0f3ef]"><tr>{preview.columns.map((column) => <th key={column.name} className="px-3 py-3 text-left font-black uppercase tracking-[0.15em] text-stone-500 whitespace-nowrap">{column.name}</th>)}</tr></thead>
                        <tbody>{preview.rows.map((row, index) => <tr key={index} className="border-t border-[#143230]/6 hover:bg-[#f6faf8]">{preview.columns.map((column) => <td key={column.name} className="max-w-[220px] truncate px-3 py-2 text-stone-700">{String(row[column.name] ?? '')}</td>)}</tr>)}</tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#143230]/8 bg-white/85 p-6 shadow-[0_20px_50px_-34px_rgba(20,50,48,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Acoes</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#143230]">Decisao rapida</h2></div>
                <Sparkles className="w-6 h-6 text-[#379890]" />
              </div>
              <div className="mt-5 space-y-3">
                {quickActions.map((action) => (
                  <button key={action.title} onClick={() => addQuickAction(action)} disabled={!selectedTable || (action.aggregation !== 'none' && !action.xColumn)} className="w-full rounded-[22px] border border-[#143230]/8 bg-[#f7f8f4] p-4 text-left transition-all hover:border-[#379890]/20 disabled:opacity-50">
                    <p className="text-sm font-black text-[#143230]">{action.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-stone-600">{action.description}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-[24px] border border-[#143230]/8 bg-[#f7f8f4] p-4">
                <div className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-[#379890]" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Sugestoes por objetivo</p></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {DECISION_PROMPTS.map((prompt) => (
                    <button key={prompt} onClick={() => { setSuggestionPrompt(prompt); void loadSuggestions(prompt); }} className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${suggestionPrompt === prompt ? 'bg-[#379890] text-white' : 'border border-[#143230]/10 bg-white text-stone-600 hover:border-[#379890]/20'}`}>{prompt.slice(0, 28)}...</button>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {suggestionsLoading ? (
                    <div className="rounded-2xl border border-[#143230]/8 bg-white px-4 py-6 text-sm text-stone-500">Gerando sugestoes...</div>
                  ) : (
                    suggestions?.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={`${suggestion.title}-${index}`} className="rounded-2xl border border-[#143230]/8 bg-white p-4">
                        <p className="text-sm font-black text-[#143230]">{suggestion.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-stone-600">{suggestion.rationale}</p>
                        <button onClick={() => addSuggestion(index)} className="mt-4 rounded-full bg-[#379890]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2c7f78] hover:bg-[#379890]/20">Adicionar ao dashboard</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
          {widgets.length > 0 && <div className="flex items-center gap-6 rounded-[24px] border border-[#143230]/8 bg-white/70 px-5 py-4"><div className="flex items-center gap-2 text-[10px] font-black text-stone-600"><LayoutGrid className="w-4 h-4" /><span>{widgets.length} widget{widgets.length !== 1 ? 's' : ''}</span></div><div className="text-[10px] font-black text-stone-500">Arraste os cards para reordenar e monte uma leitura executiva da base.</div></div>}
          {widgets.length === 0 && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[36px] border border-[#379890]/10 bg-white/75 py-24"><div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#379890]/12 shadow-[0_24px_40px_-24px_rgba(55,152,144,0.45)]"><BarChart2 className="h-9 w-9 text-[#379890]" /></div><div className="text-center"><h2 className="mb-2 text-2xl font-black text-[#143230]">Monte um painel orientado a decisao</h2><p className="text-sm text-stone-600">Escolha uma tabela, entenda as colunas, veja os dados e use as acoes rapidas para subir a primeira leitura.</p></div></motion.div>}
          {widgets.length > 0 && <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 pb-12"><AnimatePresence mode="popLayout">{widgets.map((widget) => <div key={widget.id} draggable onDragStart={() => handleDragStart(widget.id)} onDragOver={(e) => handleDragOver(e, widget.id)} onDrop={handleDrop}><WidgetCard widget={widget} onRemove={removeWidget} dragHandleProps={{ onMouseDown: (e) => e.stopPropagation() }} /></div>)}</AnimatePresence></div>}
        </div>
      </main>

      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPanel(false)} className="fixed inset-0 z-40 bg-[#143230]/25 backdrop-blur-[2px]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed right-0 top-0 z-50 flex h-full w-[430px] flex-col border-l border-[#143230]/10 bg-[#f7f8f4] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#143230]/8 bg-white/80 px-6 py-5">
                <div className="flex items-center gap-3"><Plus className="h-5 w-5 text-[#379890]" /><div><h2 className="text-sm font-black uppercase tracking-widest text-[#143230]">Novo Widget</h2><p className="mt-1 text-[11px] text-stone-500">Monte uma visualizacao mais livre e detalhada</p></div></div>
                <button onClick={() => setShowPanel(false)} className="text-xl leading-none text-stone-500 transition-colors hover:text-[#143230]">x</button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Titulo *</label><input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Receita por cidade" className="mt-2 w-full rounded-2xl border border-[#143230]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#379890]/50" /></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Tabela *</label><select value={form.table} onChange={(e) => setForm((f) => ({ ...f, table: e.target.value, xColumn: '', metric: '' }))} className="mt-2 w-full rounded-2xl border border-[#143230]/10 bg-white px-4 py-3 text-sm outline-none"><option value="">Selecione uma tabela</option>{availableTables.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Tipo de grafico</label><div className="mt-2 grid grid-cols-3 gap-2">{CHART_TYPES.map((ct) => <button key={ct.value} onClick={() => setForm((f) => ({ ...f, chartType: ct.value }))} className={`rounded-2xl border py-3 text-xs font-black transition-all ${form.chartType === ct.value ? 'border-[#379890] bg-[#379890]/10 text-[#2c7f78]' : 'border-[#143230]/10 bg-white text-stone-500 hover:border-[#379890]/20 hover:text-[#143230]'}`}><div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-[11px]">{ct.icon}</div>{ct.label}</button>)}</div></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Agregacao</label><select value={form.aggregation} onChange={(e) => setForm((f) => ({ ...f, aggregation: e.target.value as AggregationType }))} className="mt-2 w-full rounded-2xl border border-[#143230]/10 bg-white px-4 py-3 text-sm outline-none">{AGGREGATIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
                {form.aggregation !== 'none' && <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Coluna de agrupamento</label><select value={form.xColumn} onChange={(e) => setForm((f) => ({ ...f, xColumn: e.target.value }))} className="mt-2 w-full rounded-2xl border border-[#143230]/10 bg-white px-4 py-3 text-sm outline-none"><option value="">Selecione uma coluna</option>{columns.map((col) => <option key={col.name} value={col.name}>{col.name} ({col.type})</option>)}</select></div>}
                {['sum', 'avg', 'min', 'max'].includes(form.aggregation) && <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Coluna metrica</label><select value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))} className="mt-2 w-full rounded-2xl border border-[#143230]/10 bg-white px-4 py-3 text-sm outline-none"><option value="">Selecione a coluna de valor</option>{columns.filter((col) => isNumericColumn(col.type)).map((col) => <option key={col.name} value={col.name}>{col.name} ({col.type})</option>)}</select></div>}
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Limite de linhas: <span className="text-[#143230]">{form.limit}</span></label><input type="range" min={5} max={100} step={5} value={form.limit} onChange={(e) => setForm((f) => ({ ...f, limit: Number(e.target.value) }))} className="mt-2 w-full accent-[#379890]" /></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Cor</label><div className="mt-2 flex flex-wrap gap-2">{WIDGET_COLORS.map((c) => <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} className={`h-8 w-8 rounded-xl border border-white/60 transition-all ${form.color === c ? 'scale-110 ring-2 ring-[#143230] ring-offset-2 ring-offset-[#f7f8f4]' : 'hover:scale-110'}`} style={{ background: c }} />)}</div></div>
              </div>
              <div className="border-t border-[#143230]/8 bg-white/80 px-6 py-5"><button onClick={addWidget} disabled={!form.title || !form.table} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#379890] text-[10px] font-black uppercase tracking-widest text-white shadow-[0_18px_36px_-18px_rgba(55,152,144,0.45)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40"><Plus className="w-4 h-4" /> Adicionar ao Dashboard</button></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
