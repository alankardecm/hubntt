import { openaiClient } from '@/infrastructure/ai/chat-clients';
import { getDatalakeOverview, getTablePreview } from '@/modules/datalake/application/overview';
import { getMysqlPool } from '@/infrastructure/datalake/mysql-client';
import type { DashboardSuggestion, DashboardSuggestionResponse, DatalakeTableInfo } from '@/shared/types/datalake';
import type { RowDataPacket } from 'mysql2';
import mysql from 'mysql2';

const DATE_PATTERN = /(data|dt_|_at$|competencia|vencimento|inicio|fim|conclusao|abertura|resposta|evento|cadastro|termino)/i;
const ID_PATTERN = /(^id($|_)|(_id$)|(^cod_)|(^codigo$))/i;
const NUMERIC_TYPES = /^(int|bigint|smallint|tinyint|decimal|float|double|numeric)/i;
const DATE_TYPES = /^(date|datetime|timestamp)/i;

function isCategoricalColumn(name: string, type: string): boolean {
  if (ID_PATTERN.test(name)) return false;
  if (DATE_PATTERN.test(name)) return false;
  if (NUMERIC_TYPES.test(type)) return false;
  if (DATE_TYPES.test(type)) return false;
  if (name.includes('formatada') || name.includes('descricao') || name.includes('endereco') || name.includes('email')) return false;
  return true;
}

async function fetchColumnSamples(
  tableName: string,
  columns: Array<{ name: string; type: string }>
): Promise<Record<string, string[]>> {
  const pool = getMysqlPool();
  const escapedTable = mysql.escapeId(tableName);
  const result: Record<string, string[]> = {};

  const categoricalCols = columns
    .filter(c => isCategoricalColumn(c.name, c.type))
    .slice(0, 8);

  await Promise.all(
    categoricalCols.map(async (col) => {
      try {
        const escapedCol = mysql.escapeId(col.name);
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT DISTINCT ${escapedCol} AS v FROM ${escapedTable} WHERE ${escapedCol} IS NOT NULL AND ${escapedCol} != '' ORDER BY ${escapedCol} LIMIT 15`
        );
        const values = (rows as Array<Record<string, unknown>>)
          .map(r => String(r.v ?? ''))
          .filter(Boolean);
        if (values.length > 0) result[col.name] = values;
      } catch {
        // silently skip if column query fails
      }
    })
  );

  return result;
}

async function identifyRelevantTable(prompt: string, tables: DatalakeTableInfo[]): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const tableNames = tables.map(t => t.name).join(', ');
    const response = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Voce e um assistente de banco de dados especializado em ISP brasileiro. Dada a lista de tabelas e o pedido do usuario, identifique qual tabela (APENAS UMA) e a mais relevante.
Tabelas disponiveis: ${tableNames}

Mapeamento obrigatorio de termos de negocio:
- "protocolo", "protocolos", "numero de protocolo", "quantidade de protocolo", "chamado", "chamados" -> fato_solicitacoes
- "atendimento", "atendimentos", "sla de atendimento", "fila de atendimento", "atendente", "equipe" -> fato_solicitacoes
- "quantos contratos", "numero de contratos", "contratos por cliente", "contratos do cliente", "contratos aprovados", "contratos ativos", "contratos cancelados" -> crm_Funter
- Se o pedido menciona o NOME de um cliente especifico (ex: "cliente CLARO", "contratos da OI") use crm_Funter.
- crm_Funter tem UMA LINHA POR CONTRATO. Use para contar contratos. Coluna de data: dt_cadastro. Coluna de status: estagio. Coluna de nome do cliente: cliente.
- fato_contratos tem UMA LINHA POR EVENTO (muitas por contrato). Use APENAS para metricas financeiras como valor_total agregado por periodo.
- "valor total dos contratos", "receita", "faturamento", "soma de valor" -> fato_contratos com aggregation sum em valor_total.

Responda APENAS com o nome da tabela. Se nenhuma for relevante, responda "none".`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const result = response.choices[0]?.message?.content?.trim().toLowerCase();
    if (result === 'none' || !result) return null;

    return tables.find(t => t.name.toLowerCase() === result)?.name || null;
  } catch {
    return null;
  }
}

export async function smartWidgetAssistant(prompt: string): Promise<DashboardSuggestionResponse> {
  const overview = await getDatalakeOverview();
  if (!overview.ok) {
    return { ok: false, prompt, suggestions: [], source: 'heuristic' };
  }

  const table = await identifyRelevantTable(prompt, overview.tables);
  if (!table) {
    return { ok: true, prompt, suggestions: [], source: 'heuristic' };
  }

  const schema = await getTablePreview(table, 1);
  const columns = schema.columns.map(c => `${c.name} (${c.type})`).join(', ');

  const columnSamples = await fetchColumnSamples(table, schema.columns);
  const samplesText = Object.entries(columnSamples)
    .map(([col, values]) => `  - ${col}: ${values.map(v => `"${v}"`).join(', ')}`)
    .join('\n');

  try {
    const response = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Voce e um analista de dados especializado em Dashboards para ISP brasileiro.
O usuario quer criar um widget para a tabela "${table}".
Colunas disponiveis: ${columns}

VALORES REAIS DAS COLUNAS CATEGORICAS (use exatamente esses valores nos filtros):
${samplesText || '  (nenhum disponivel)'}

Mapeamento de termos de negocio para esta tabela:
- Se a tabela for crm_solicitacoes: "protocolo" e "solicitacao" sao o mesmo conceito. COUNT(*) = quantidade de protocolos abertos.
- Se a tabela for fato_solicitacoes: "atendimento" e o termo principal. Use sla_segundos para metricas de SLA e tempo. Para filtrar por nome de cliente use nome_cliente com operador "contains".
- Se a tabela for fato_contratos: "contrato" e "assinante" sao equivalentes.
- Se a tabela for crm_Funter: cada linha e um contrato. Colunas: "cliente" (nome do cliente), "contrato" (numero), "estagio" (status do contrato), "dt_cadastro" (data de cadastro - use como dateColumn), "valor" (valor do contrato). NUNCA use fato_contratos para contar contratos.

IMPORTANTE: Use os VALORES REAIS listados acima para os filtros. Se o usuario pedir "aprovados", escolha o valor da lista de estagio/status que mais se aproxima semanticamente.

Regras CRITICAS para gerar o JSON:
- Gere ate 3 sugestoes de widgets no array "suggestions"
- Cada sugestao deve ter:
  - title: Titulo amigavel em portugues
  - chartType: line, bar, area, pie, table, metric
  - table: "${table}"
  - x: nome da coluna para o eixo X (se aplicavel)
  - metric: nome da coluna para o calculo (se aplicavel)
  - aggregation: count, sum, avg, min, max
  - filterColumn: nome da coluna para o primeiro filtro (se houver)
  - filterOperator: eq, neq, contains, gte, lte, gt, lt
  - filterValue: valor do primeiro filtro (SEMPRE string, nunca numero)
  - filter2Column: nome da coluna para o segundo filtro (se houver)
  - filter2Operator: eq, neq, contains, gte, lte, gt, lt
  - filter2Value: valor do segundo filtro (SEMPRE string)
  - dateColumn: coluna de data para o recorte temporal (se houver)
  - dateFrom: data inicial YYYY-MM-DD
  - dateTo: data final YYYY-MM-DD
  - rationale: explicacao de por que esse widget e util para o pedido do usuario.

REGRAS DE AGREGACAO (OBRIGATORIAS):
- "quantos", "quantidade", "total de registros", "numero de" -> aggregation: "count", metric: null. NUNCA use sum para contar registros.
- "valor total", "receita", "faturamento", "soma de valor" -> aggregation: "sum" com metric na coluna de valor.
- "media", "ticket medio" -> aggregation: "avg".
- NUNCA some colunas de valor quando o usuario pergunta quantidade/contagem.

REGRAS DE FILTRO:
- Use EXATAMENTE os valores reais listados acima. Prefira "contains" para evitar erros de case ou espacos.
- Para meses: "marco 2026" -> dateFrom: "2026-03-01", dateTo: "2026-03-31".
- Para nomes de clientes: sempre use filterOperator: "contains".
- Use APENAS as colunas fornecidas.

Responda APENAS o JSON.`
        },
        {
          role: 'user',
          content: `Pedido do usuario: ${prompt}`
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as { suggestions?: DashboardSuggestion[] };
    console.log('[smart-assistant] prompt:', prompt);
    console.log('[smart-assistant] table:', table);
    console.log('[smart-assistant] column samples:', JSON.stringify(columnSamples));
    console.log('[smart-assistant] suggestions:', JSON.stringify(parsed.suggestions, null, 2));

    return {
      ok: true,
      prompt,
      suggestions: parsed.suggestions || [],
      source: 'ai'
    };
  } catch (error) {
    return {
      ok: false,
      prompt,
      suggestions: [],
      source: 'heuristic'
    };
  }
}
