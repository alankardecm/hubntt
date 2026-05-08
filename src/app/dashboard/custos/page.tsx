import fs from 'node:fs/promises';
import path from 'node:path';
import Sidebar from '@/components/Sidebar';
import { BadgeDollarSign, Bot, Database, FileSpreadsheet, Layers3, Server, Wallet } from 'lucide-react';

type TokenCostRow = {
  competencia: string;
  projeto: string;
  provedor: string;
  modelo: string;
  tokens_input: string;
  tokens_output: string;
  chamadas: string;
  custo_usd: string;
  custo_brl: string;
  observacoes: string;
};

async function loadTokenCostRows(): Promise<TokenCostRow[]> {
  try {
    const csvPath = path.join(process.cwd(), 'docs', 'TOKEN_COSTS_PROJETOS.csv');
    const content = await fs.readFile(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce((acc, header, index) => {
        acc[header as keyof TokenCostRow] = values[index] || '';
        return acc;
      }, {} as TokenCostRow);
    });
  } catch {
    return [];
  }
}

type CostRow = {
  competencia: string;
  ambiente: string;
  modulo: string;
  servico: string;
  tipo_custo: string;
  status_atual: string;
  gratuito_ate: string;
  plano_modelo: string;
  unidade_metrica: string;
  consumo_mensal: string;
  preco_unitario_usd: string;
  custo_estimado_usd: string;
  custo_estimado_brl: string;
  estimativa_comercial: string;
  responsavel: string;
  fonte_dado: string;
  observacoes: string;
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function toNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency: 'USD' | 'BRL') {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

async function loadCostRows() {
  const csvPath = path.join(process.cwd(), 'docs', 'CUSTOS_HUB_TEMPLATE.csv');
  const content = await fs.readFile(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) return [] as CostRow[];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header as keyof CostRow] = values[index] || '';
      return acc;
    }, {} as CostRow);
  });
}

export default async function CustosDashboard() {
  const rows = await loadCostRows();
  const tokenRows = await loadTokenCostRows();

  const totalUsd = rows.reduce((sum, row) => sum + toNumber(row.custo_estimado_usd), 0);
  const totalBrl = rows.reduce((sum, row) => sum + toNumber(row.custo_estimado_brl), 0);
  const totalServicos = new Set(rows.map((row) => row.servico)).size;
  const totalPagos = rows.filter((row) => row.status_atual === 'pago').length;
  const totalFreemium = rows.filter((row) => row.status_atual === 'freemium').length;

  const byServico = Array.from(
    rows.reduce((map, row) => {
      const current = map.get(row.servico) || { servico: row.servico, usd: 0, brl: 0, linhas: 0 };
      current.usd += toNumber(row.custo_estimado_usd);
      current.brl += toNumber(row.custo_estimado_brl);
      current.linhas += 1;
      map.set(row.servico, current);
      return map;
    }, new Map<string, { servico: string; usd: number; brl: number; linhas: number }>())
      .values()
  ).sort((a, b) => b.usd - a.usd || b.brl - a.brl || a.servico.localeCompare(b.servico));

  const byModulo = Array.from(
    rows.reduce((map, row) => {
      const current = map.get(row.modulo) || { modulo: row.modulo, usd: 0, brl: 0, linhas: 0 };
      current.usd += toNumber(row.custo_estimado_usd);
      current.brl += toNumber(row.custo_estimado_brl);
      current.linhas += 1;
      map.set(row.modulo, current);
      return map;
    }, new Map<string, { modulo: string; usd: number; brl: number; linhas: number }>())
      .values()
  ).sort((a, b) => b.usd - a.usd || b.brl - a.brl || a.modulo.localeCompare(b.modulo));

  const byStatus = Array.from(
    rows.reduce((map, row) => {
      const current = map.get(row.status_atual) || { status: row.status_atual, linhas: 0 };
      current.linhas += 1;
      map.set(row.status_atual, current);
      return map;
    }, new Map<string, { status: string; linhas: number }>())
      .values()
  ).sort((a, b) => b.linhas - a.linhas || a.status.localeCompare(b.status));

  // ── Agrupamentos de tokens por projeto ─────────────────────────────────────
  const byProjeto = Array.from(
    tokenRows.reduce((map, row) => {
      const cur = map.get(row.projeto) || { projeto: row.projeto, usd: 0, brl: 0, tokens_in: 0, tokens_out: 0, chamadas: 0, linhas: 0 };
      cur.usd += toNumber(row.custo_usd);
      cur.brl += toNumber(row.custo_brl);
      cur.tokens_in += toNumber(row.tokens_input);
      cur.tokens_out += toNumber(row.tokens_output);
      cur.chamadas += toNumber(row.chamadas);
      cur.linhas += 1;
      map.set(row.projeto, cur);
      return map;
    }, new Map<string, { projeto: string; usd: number; brl: number; tokens_in: number; tokens_out: number; chamadas: number; linhas: number }>())
    .values()
  ).sort((a, b) => b.usd - a.usd || b.brl - a.brl || a.projeto.localeCompare(b.projeto));

  const totalTokenUsd = tokenRows.reduce((sum, r) => sum + toNumber(r.custo_usd), 0);
  const totalTokenBrl = tokenRows.reduce((sum, r) => sum + toNumber(r.custo_brl), 0);
  const totalTokenIn = tokenRows.reduce((sum, r) => sum + toNumber(r.tokens_input), 0);
  const totalTokenOut = tokenRows.reduce((sum, r) => sum + toNumber(r.tokens_output), 0);

  const topRows = [...rows].sort((a, b) => {
    const usdDiff = toNumber(b.custo_estimado_usd) - toNumber(a.custo_estimado_usd);
    if (usdDiff !== 0) return usdDiff;
    const brlDiff = toNumber(b.custo_estimado_brl) - toNumber(a.custo_estimado_brl);
    if (brlDiff !== 0) return brlDiff;
    return a.servico.localeCompare(b.servico);
  });

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-12 py-10 flex flex-col gap-8">
          <section className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Financeiro</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Custos</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Hub</span>
            </div>

            <div className="mt-6 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-5">
                <h1 className="text-5xl lg:text-6xl font-[1000] tracking-[-0.08em] leading-[0.95] uppercase">
                  Painel de custos do hub
                </h1>
                <p className="max-w-3xl text-base lg:text-lg text-stone-400 leading-relaxed">
                  Esta tela consolida a base de custos do HUB a partir do CSV operacional. Ela cruza
                  servico, status atual, limite do gratuito e estimativa comercial para separar o que ja
                  e custo real do que ainda cabe em validacao.
                </p>
              </div>

              <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                    Fonte da tela
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-background/40 px-4 py-3 text-sm text-stone-300">
                  `docs/CUSTOS_HUB_TEMPLATE.csv`
                </div>
                <div className="rounded-2xl border border-white/5 bg-background/40 px-4 py-3 text-sm text-stone-300">
                  {rows.length} linha(s) com status operacional e estimativa comercial
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-stone-300">
                  <span className="rounded-full border border-white/10 px-4 py-2">
                    docs/CUSTOS_HUB_CENARIOS.md
                  </span>
                  <span className="rounded-full border border-white/10 px-4 py-2">
                    docs/LEVANTAMENTO_DE_CUSTOS_HUB.md
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Custo estimado USD',
                value: formatMoney(totalUsd, 'USD'),
                icon: BadgeDollarSign,
                tone: 'text-neon-cyan',
              },
              {
                label: 'Custo estimado BRL',
                value: formatMoney(totalBrl, 'BRL'),
                icon: Wallet,
                tone: 'text-neon-orange',
              },
              {
                label: 'Servicos mapeados',
                value: String(totalServicos),
                icon: Server,
                tone: 'text-neon-cyan',
              },
              {
                label: 'Linhas pagas / freemium',
                value: `${totalPagos} / ${totalFreemium}`,
                icon: Layers3,
                tone: 'text-neon-orange',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-[30px] border border-white/5 bg-card p-7 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                    <card.icon className={`w-6 h-6 ${card.tone}`} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600">
                    KPI
                  </span>
                </div>
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-[950] tracking-[-0.06em] uppercase">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Por servico</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Centros de custo</h2>
                </div>
                <Server className="w-6 h-6 text-neon-cyan" />
              </div>

              <div className="mt-8 space-y-4">
                {byServico.map((item) => (
                  <div key={item.servico} className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-[-0.04em]">{item.servico}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
                          {item.linhas} linha(s) no template
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-stone-400">{formatMoney(item.usd, 'USD')}</p>
                        <p className="text-lg font-black text-white">{formatMoney(item.brl, 'BRL')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Por modulo</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Peso da plataforma</h2>
                </div>
                <Database className="w-6 h-6 text-neon-orange" />
              </div>

              <div className="mt-8 space-y-4">
                {byModulo.map((item) => (
                  <div key={item.modulo} className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-[-0.04em]">{item.modulo}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
                          {item.linhas} linha(s) consolidadas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-stone-400">{formatMoney(item.usd, 'USD')}</p>
                        <p className="text-lg font-black text-white">{formatMoney(item.brl, 'BRL')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CUSTOS REAIS DE TOKENS POR PROJETO ── */}
          <section className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-stone-600 mb-2">
                  <Bot className="w-4 h-4 text-neon-cyan" />
                  <span>IA · LLM · Tokens</span>
                </div>
                <h2 className="text-2xl font-[950] tracking-[-0.05em] uppercase">
                  Custos reais de tokens por projeto
                </h2>
                <p className="mt-2 text-sm text-stone-400">
                  Consumo real de tokens agrupado por projeto. Edite{' '}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-stone-300">
                    docs/TOKEN_COSTS_PROJETOS.csv
                  </code>{' '}
                  para registrar os valores mensais de cada provedor.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">Total tokens</p>
                <p className="text-2xl font-[950] tracking-[-0.05em] text-neon-cyan">
                  {formatMoney(totalTokenUsd, 'USD')}
                </p>
                <p className="text-lg font-black text-white">{formatMoney(totalTokenBrl, 'BRL')}</p>
              </div>
            </div>

            {/* KPIs de token */}
            <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
              {[
                { label: 'Tokens entrada', value: totalTokenIn.toLocaleString('pt-BR'), tone: 'text-neon-cyan' },
                { label: 'Tokens saída',   value: totalTokenOut.toLocaleString('pt-BR'), tone: 'text-neon-orange' },
                { label: 'Projetos IA',    value: String(byProjeto.length),              tone: 'text-neon-cyan' },
                { label: 'Modelos ativos', value: String(new Set(tokenRows.map((r) => r.modelo)).size), tone: 'text-neon-orange' },
              ].map((k) => (
                <div key={k.label} className="rounded-[24px] border border-white/5 bg-white/[0.03] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">{k.label}</p>
                  <p className={`mt-3 text-2xl font-[950] tracking-[-0.05em] ${k.tone}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Cards por projeto */}
            {byProjeto.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {byProjeto.map((proj) => {
                  const provedores = tokenRows
                    .filter((r) => r.projeto === proj.projeto)
                    .map((r) => ({ provedor: r.provedor, modelo: r.modelo, usd: toNumber(r.custo_usd), brl: toNumber(r.custo_brl), tokens_in: toNumber(r.tokens_input), tokens_out: toNumber(r.tokens_output), observacoes: r.observacoes }));

                  return (
                    <div key={proj.projeto} className="rounded-[26px] border border-white/5 bg-white/[0.03] p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black uppercase tracking-[-0.02em]">{proj.projeto}</h3>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
                            {proj.linhas} modelo{proj.linhas !== 1 ? 's' : ''} · {proj.chamadas > 0 ? `${proj.chamadas.toLocaleString('pt-BR')} chamadas` : 'sem chamadas registradas'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-stone-400">{formatMoney(proj.usd, 'USD')}</p>
                          <p className="text-lg font-black text-white">{formatMoney(proj.brl, 'BRL')}</p>
                        </div>
                      </div>

                      {(proj.tokens_in + proj.tokens_out) > 0 && (
                        <div className="flex gap-4 rounded-[18px] border border-white/5 bg-background/40 px-4 py-2.5">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-600">Entrada</p>
                            <p className="text-sm font-black text-neon-cyan">{proj.tokens_in.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-600">Saída</p>
                            <p className="text-sm font-black text-neon-orange">{proj.tokens_out.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {provedores.map((p, i) => (
                          <div key={i} className="rounded-[16px] border border-white/5 bg-background/30 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-stone-200">{p.provedor}</span>
                                <span className="ml-1.5 text-[10px] text-stone-500">{p.modelo}</span>
                              </div>
                              <span className="text-[11px] font-black text-stone-300 shrink-0">
                                {p.usd > 0 ? formatMoney(p.usd, 'USD') : '—'}
                              </span>
                            </div>
                            {p.observacoes && (
                              <p className="mt-1 text-[10px] text-stone-600 leading-relaxed line-clamp-2">{p.observacoes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-8 py-10 text-center">
                <Bot className="h-8 w-8 text-stone-600 mx-auto mb-3" />
                <p className="text-sm text-stone-500">Nenhum custo de token registrado.</p>
                <p className="mt-1 text-xs text-stone-600">
                  Preencha <code className="text-stone-400">docs/TOKEN_COSTS_PROJETOS.csv</code> com os valores reais do mês.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr] pb-16">
            <div className="rounded-[34px] border border-white/5 bg-white/[0.03] p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Por status</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Pago x gratis x interno</h2>
                </div>
                <Layers3 className="w-6 h-6 text-neon-cyan" />
              </div>

              <div className="mt-8 space-y-4">
                {byStatus.map((item) => (
                  <div key={item.status} className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-[-0.04em]">{item.status}</h3>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
                          classificacao operacional
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">{item.linhas} linha(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Linhas do CSV</p>
                  <h2 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Base operacional</h2>
                </div>
                <FileSpreadsheet className="w-6 h-6 text-neon-orange" />
              </div>

              <div className="mt-8 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
                      <th className="px-3 py-3">Servico</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Modulo</th>
                      <th className="px-3 py-3">Ambiente</th>
                      <th className="px-3 py-3">Plano</th>
                      <th className="px-3 py-3">Gratis ate</th>
                      <th className="px-3 py-3">Estimativa comercial</th>
                      <th className="px-3 py-3">USD</th>
                      <th className="px-3 py-3">BRL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRows.map((row, index) => (
                      <tr key={`${row.servico}-${row.modulo}-${row.ambiente}-${index}`} className="border-b border-white/5 last:border-b-0 align-top">
                        <td className="px-3 py-4 font-semibold text-stone-100">{row.servico}</td>
                        <td className="px-3 py-4">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-200">
                            {row.status_atual}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-stone-300">{row.modulo}</td>
                        <td className="px-3 py-4 text-stone-300">{row.ambiente}</td>
                        <td className="px-3 py-4 text-stone-400">{row.plano_modelo}</td>
                        <td className="px-3 py-4 text-stone-400 min-w-[180px]">{row.gratuito_ate}</td>
                        <td className="px-3 py-4 text-stone-300 min-w-[340px]">{row.estimativa_comercial}</td>
                        <td className="px-3 py-4 text-stone-300">{formatMoney(toNumber(row.custo_estimado_usd), 'USD')}</td>
                        <td className="px-3 py-4 text-stone-300">{formatMoney(toNumber(row.custo_estimado_brl), 'BRL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
