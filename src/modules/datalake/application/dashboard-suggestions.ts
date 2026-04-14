import { openaiClient } from '@/infrastructure/ai/chat-clients';
import type { DashboardSuggestion, DashboardSuggestionResponse, DatalakeTableInfo } from '@/shared/types/datalake';

function buildHeuristicSuggestions(prompt: string, tables: DatalakeTableInfo[]): DashboardSuggestion[] {
  const topTables = tables.slice(0, 4);

  return topTables.map((table, index) => ({
    title: `${table.name} - visao ${index + 1}`,
    chartType: index === 0 ? 'table' : index === 1 ? 'bar' : index === 2 ? 'line' : 'metric',
    table: table.name,
    aggregation: index === 3 ? 'count' : undefined,
    rationale: `Sugestao heuristica baseada na disponibilidade da tabela ${table.name} para o pedido: ${prompt}.`,
  }));
}

function isSuggestionArray(value: unknown): value is DashboardSuggestion[] {
  return Array.isArray(value);
}

export async function suggestDashboards(input: { prompt: string; tables: DatalakeTableInfo[] }): Promise<DashboardSuggestionResponse> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    return {
      ok: false,
      prompt,
      suggestions: [],
      source: 'heuristic',
    };
  }

  const tableSummary = input.tables.slice(0, 20).map((table) => ({
    name: table.name,
    rows: table.rows,
    engine: table.engine,
  }));

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Voce e um analista de dados especializado em provedores de internet (ISP) brasileiros.
O Data Lake da Netturbo contém as seguintes tabelas principais e seus significados:
- crm_solicitacoes: chamados e solicitacoes abertas no CRM pelos clientes (suporte tecnico, cancelamento, mudanca de plano)
- fato_solicitacoes: tabela fato do DW com metricas de atendimento (volume, SLA, tipo, status, data abertura, data fechamento)
- fato_contratos: tabela fato do DW com dados de contratos de clientes (plano, valor, status ativo/cancelado, data inicio, cidade)

Regras:
- Responda APENAS com JSON valido
- O campo suggestions deve ser um array com ate 4 sugestoes
- Cada sugestao deve conter: title, chartType, table, aggregation (opcional), x (opcional), y (opcional), metric (opcional) e rationale
- Use apenas nomes de tabelas fornecidos no contexto
- Prefira sugestoes operacionais e comerciais relevantes para um ISP
- chartType deve ser um dos: line, bar, area, pie, table, metric`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              prompt,
              tables: tableSummary,
            }),
          },
        ],
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content) as { suggestions?: DashboardSuggestion[] };
      const suggestions = isSuggestionArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [];

      if (suggestions.length > 0) {
        return {
          ok: true,
          prompt,
          suggestions,
          source: 'ai',
        };
      }
    } catch {
      // fallback below
    }
  }

  return {
    ok: true,
    prompt,
    suggestions: buildHeuristicSuggestions(prompt, input.tables),
    source: 'heuristic',
  };
}
