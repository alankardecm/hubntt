import { openaiClient } from '@/infrastructure/ai/chat-clients';
import { getDatalakeOverview, getTablePreview } from '@/modules/datalake/application/overview';
import type { DashboardSuggestion, DashboardSuggestionResponse, DatalakeTableInfo } from '@/shared/types/datalake';

/**
 * Smart Assistant for Dashboard building.
 * It uses a two-step AI process:
 * 1. Identify the most relevant table for the user's prompt.
 * 2. Use the table schema (columns) to generate precise widget configurations.
 */

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
- "nome do cliente", "cliente X", "contratos do cliente", "contratos por cliente", "quantos contratos" -> crm_Funter
- "contrato", "contratos", "carteira", "churn", "assinante", "valor contrato", "receita" -> fato_contratos
- Se o pedido menciona o NOME de um cliente especifico (ex: "cliente CLARO", "contratos da OI") use crm_Funter pois ela tem a coluna "cliente" com o nome.
- Se o pedido e sobre metricas financeiras ou status de contratos sem mencionar nome de cliente, use fato_contratos.

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
    
    // Validate if it's one of the tables
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
    // If no specific table found, fallback to the generic suggestion logic
    // but with more context
    return { ok: true, prompt, suggestions: [], source: 'heuristic' };
  }

  const schema = await getTablePreview(table, 1);
  const columns = schema.columns.map(c => `${c.name} (${c.type})`).join(', ');

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

Mapeamento de termos de negocio para esta tabela:
- Se a tabela for crm_solicitacoes: "protocolo" e "solicitacao" sao o mesmo conceito. COUNT(*) = quantidade de protocolos abertos.
- Se a tabela for fato_solicitacoes: "atendimento" e o termo principal. Use sla_segundos para metricas de SLA e tempo. Para filtrar por nome de cliente use nome_cliente com operador "contains".
- Se a tabela for fato_contratos: "contrato" e "assinante" sao equivalentes.
- Se a tabela for crm_Funter: a coluna "cliente" tem o nome do cliente (ex: CLARO, OI, VIVO). Para filtrar por nome use filterColumn=cliente e filterOperator=contains. A coluna "contrato" identifica cada contrato. COUNT(*) = quantidade de contratos. Use "estagio" ou "status" para filtrar situacao do contrato.

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
- "aprovados", "ativo", "vigente" -> use filterOperator: "contains" para status/estagio, nao "eq", pois o valor exato pode variar.
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
