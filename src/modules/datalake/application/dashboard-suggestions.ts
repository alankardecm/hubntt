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
O Data Lake da Netturbo contem as seguintes tabelas e colunas principais:
- crm_solicitacoes: protocolos e solicitacoes abertas (colunas: status, tipo, cidade, data_abertura, data_fechamento, sla_segundos)
- fato_solicitacoes: tabela fato de atendimentos com metricas analiticas (colunas: status, tipo, cidade, data_abertura, data_fechamento, sla_segundos)
- fato_contratos: dados de contratos de clientes (colunas: status, plano, valor_total, cidade, data_inicio, data_fim)

Mapeamento de termos de negocio (OBRIGATORIO seguir):
- "protocolo", "protocolos", "numero de protocolo", "quantidade de protocolo", "abrir protocolo" -> tabela: crm_solicitacoes
- "atendimento", "atendimentos", "fila de atendimento", "sla de atendimento" -> tabela: fato_solicitacoes
- "contrato", "contratos", "carteira", "assinante" -> tabela: fato_contratos

Regras obrigatorias:
1. Responda APENAS com JSON valido
2. O campo "suggestions" deve ser um array com 1 a 4 sugestoes
3. Use SOMENTE nomes de tabelas fornecidos no contexto
4. chartType deve ser um dos: line, bar, area, pie, table, metric
   - Use "metric" SOMENTE quando o usuario pede explicitamente um total/KPI/numero unico
   - Use "bar" ou "line" quando o usuario pede "grafico", "chart" ou distribuicao
5. Quando o usuario especificar condicoes de filtro (status, ano, valor, etc.), OBRIGATORIAMENTE preencha os campos de filtro

Campos de cada sugestao (todos opcionais exceto title, chartType, table, rationale):
- title: titulo descritivo do widget
- chartType: line | bar | area | pie | table | metric
- table: nome exato da tabela
- x: coluna para eixo X ou dimensao (ex: "status", "plano", "cidade", "data_inicio")
- metric: coluna numerica para agregar (ex: "valor_total", "sla_segundos")
- aggregation: count | sum | avg | min | max
- filterColumn: coluna para filtro primario (ex: "status")
- filterOperator: eq | contains | neq | gte | lte | gt | lt
- filterValue: valor para filtro primario (ex: "aprovado", "ativo")
- filter2Column: coluna para filtro secundario (ex: "valor_total")
- filter2Operator: eq | contains | neq | gte | lte | gt | lt
- filter2Value: valor para filtro secundario (ex: "500")
- dateColumn: coluna de data para filtro por periodo (ex: "data_inicio")
- dateFrom: data inicio no formato YYYY-MM-DD (ex: "2026-01-01")
- dateTo: data fim no formato YYYY-MM-DD (ex: "2026-12-31")
- timeBucket: none | day | month | year
- rationale: explicacao em portugues

Exemplos de mapeamento de linguagem natural para filtros:
- "aprovados" -> filterColumn: "status", filterOperator: "eq", filterValue: "aprovado"
- "em 2026" -> dateColumn: "data_inicio", dateFrom: "2026-01-01", dateTo: "2026-12-31"
- "acima de 500 reais" -> filter2Column: "valor_total", filter2Operator: "gte", filter2Value: "500"
- "grafico de contratos" -> chartType: "bar", x: "status" ou "plano"
- "evolucao mensal" -> chartType: "line", x: "data_inicio", timeBucket: "month"`,
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
