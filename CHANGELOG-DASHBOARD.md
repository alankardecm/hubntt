# Changelog - Dashboard & Datalake

## 2026-05-08

### Adicionado

- Mapeamento de termos de negocio para tabelas de protocolos e atendimentos
  - "protocolo", "protocolos", "quantidade de protocolo" -> `crm_solicitacoes`
  - "atendimento", "atendimentos", "sla de atendimento" -> `fato_solicitacoes`
  - Mapeamento aplicado em: `datalake-semantics.ts`, `dashboard-suggestions.ts`, `smart-assistant.ts`
  - `crm_solicitacoes` recebeu novo label "Protocolos / Solicitacoes" e "protocolo" nos focos
  - `fato_solicitacoes` recebeu novo label "Atendimentos (Fato)" e "atendimento" nos focos

- Bucket padrão de 100 para colunas financeiras usadas como eixo sem bucket explícito
  - Route `POST /api/datalake/query`: quando `xColumn` bate com padrão de coluna monetária (`valor`, `preco`, `receita`, `custo`, `ticket`, etc.) e `numericBucketSize` é 0, aplica bucket 100 automaticamente — evita gráfico de barras ilegível com um bar por valor exato
  - Editor `src/app/dashboards/[id]/page.tsx`: ao selecionar coluna numérica como eixo, `numericBucketSize` é inicializado em 100 (antes era sempre 0)
  - Nova função `isMoneyColumnName` exportada de `src/lib/dashboard-widget-intelligence.ts` — centraliza o heurístico de nomes financeiros

### Corrigido

- Bug: `suggestionToWidget` em `src/app/datalake/page.tsx` ignorava o campo `y` da sugestao da IA
  - Antes: `metric: suggestion.metric ?? ''` — se a IA retornava apenas `y`, o widget ficava sem metrica
  - Depois: `metric: suggestion.metric ?? suggestion.y ?? ''` — alinhado com o comportamento do editor

### Tipos

- `DashboardSuggestion.aggregation` agora inclui `count_distinct`
- `DashboardSuggestion.filterOperator` e `filter2Operator` agora referenciam `FilterOperator` de `dashboard.ts` em vez de duplicar o union literal
- Arquivos: `src/shared/types/datalake.ts`

---

## 2026-05-07

### Corrigido

- Bug: o botao "Criar Dashboard" na aba "Sugestoes IA" ignorava completamente a sugestao da IA
  - Antes: chamava `createDashboardFromTable(suggestion.table)` — jogava fora chartType, filtros e datas sugeridos e gerava 4 widgets genericos via `buildStarterWidgets`
  - Depois: chama `createDashboardFromSuggestion(suggestion)` — converte a sugestao diretamente em `WidgetConfig` com todos os campos preenchidos
  - Arquivo: `src/app/datalake/page.tsx`

- Bug: `FilterOperator` nao tinha operadores numericos — impossivel filtrar "acima de X"
  - Antes: apenas `eq` (igual) e `contains` (contem)
  - Depois: adicionados `gte` (>=), `lte` (<=), `gt` (>), `lt` (<), `neq` (!=)
  - Arquivo: `src/shared/types/dashboard.ts`

- Bug: widget so suportava 1 filtro — impossivel combinar status + valor + periodo ao mesmo tempo
  - Adicionados campos `filter2Column`, `filter2Operator`, `filter2Value` ao `WidgetConfig`
  - Arquivo: `src/shared/types/dashboard.ts`

### Adicionado

- Suporte aos novos operadores (`gte`, `lte`, `gt`, `lt`, `neq`) na rota de query do Datalake
  - Arquivo: `src/app/api/datalake/query/route.ts`

- Suporte ao segundo filtro (`filter2Column`, `filter2Operator`, `filter2Value`) na rota de query
  - Permite combinar ex: `status = aprovado` + `valor_total >= 500` + periodo
  - Arquivo: `src/app/api/datalake/query/route.ts`

- Campos de filtro e data adicionados ao tipo `DashboardSuggestion`
  - Novos campos: `filterColumn`, `filterOperator`, `filterValue`, `filter2Column`, `filter2Operator`, `filter2Value`, `dateColumn`, `dateFrom`, `dateTo`, `timeBucket`
  - Arquivo: `src/shared/types/datalake.ts`

- Prompt da IA de sugestao de dashboard reescrito
  - Antes: retornava apenas `title`, `chartType`, `table`, `aggregation` — sem filtros
  - Depois: extrai filtros do texto natural do usuario
  - Exemplos ensinados ao modelo:
    - `"aprovados"` → `filterColumn: status, filterOperator: eq, filterValue: aprovado`
    - `"em 2026"` → `dateColumn: data_inicio, dateFrom: 2026-01-01, dateTo: 2026-12-31`
    - `"acima de 500 reais"` → `filter2Column: valor_total, filter2Operator: gte, filter2Value: 500`
    - `"grafico"` → `chartType: bar` (nunca `metric` a menos que o usuario peca KPI explicito)
  - Arquivo: `src/modules/datalake/application/dashboard-suggestions.ts`

- Funcao `suggestionToWidget()` na pagina do Datalake
  - Converte `DashboardSuggestion` → `WidgetConfig` completo com todos os filtros
  - Arquivo: `src/app/datalake/page.tsx`

- `WidgetCard` agora passa `filter2Column`, `filter2Operator`, `filter2Value` na query
  - Arquivo: `src/components/datalake/WidgetCard.tsx`

### Editor de widget — concluido

- `src/app/dashboards/[id]/page.tsx` foi atualizado na mesma sessao:
  - `FILTER_OPERATORS` inclui todos os operadores: `eq`, `neq`, `contains`, `gte`, `lte`, `gt`, `lt`
  - `WidgetFormState` e `defaultForm` tem `filter2Column`, `filter2Operator`, `filter2Value`
  - `addSuggestion()` passa todos os filtros da sugestao da IA corretamente
  - Formulario UI tem bloco completo do Filtro 2 com dropdown de operadores atualizado

---

## Contexto do bug original

O usuario pediu: *"grafico de contratos aprovados em 2026 com valores acima de 500 reais"*

O sistema retornou um card KPI com `4.317.906.710,17` — era `SUM(valor_total)` de todos os contratos sem nenhum filtro.

Causa raiz: tres bugs encadeados

1. `FilterOperator` sem `gte` → impossivel filtrar por valor minimo
2. Apenas 1 filtro por widget → impossivel combinar status + valor + periodo
3. Botao "Criar Dashboard" ignorava a sugestao da IA inteiramente
