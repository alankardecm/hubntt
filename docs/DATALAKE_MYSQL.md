# Data Lake MySQL — Documentacao Tecnica

Integracao segura e modular do HUB Netturbo com MySQL, incluindo catalogo de tabelas, preview read-only e Dashboard Builder com graficos ao vivo.

---

## Principios de Seguranca

- Credenciais somente no servidor (nunca em `NEXT_PUBLIC_*`)
- Preview somente leitura
- Validacao de nome de tabela (apenas `[A-Za-z0-9_]`)
- Allowlist opcional por `DATALAKE_ALLOWED_TABLES`
- Queries montadas por codigo — nenhum SQL raw do usuario

---

## Variaveis de Ambiente

Configurar em `.env.local` (prioridade no Next.js) ou `.env`:

```text
MYSQL_HOST=10.250.111.102
MYSQL_PORT=3306
MYSQL_DATABASE=NTT_DataLake_01
MYSQL_USER=alan.kardec
MYSQL_PASSWORD=               ← preencher manualmente
DATALAKE_ALLOWED_TABLES=      ← vazio = todas as tabelas liberadas
DATALAKE_PREVIEW_LIMIT=25
```

### DATALAKE_ALLOWED_TABLES

| Valor | Comportamento |
|-------|---------------|
| Vazio (`=`) | **Todas as tabelas do banco sao liberadas** |
| Lista separada por virgula | Somente as tabelas listadas sao acessiveis |

Exemplo com restricao:
```text
DATALAKE_ALLOWED_TABLES=crm_solicitacoes,fato_solicitacoes,fato_contratos
```

---

## Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/datalake/health` | Verifica conexao com o MySQL |
| GET | `/api/datalake/schema` | Lista tabelas com metadados (linhas, engine, data) |
| GET | `/api/datalake/preview?table=<nome>` | Amostra de dados de uma tabela (read-only) |
| GET | `/api/datalake/columns?table=<nome>` | Lista colunas de uma tabela com tipo |
| POST | `/api/datalake/dashboard-suggestions` | Sugestoes de dashboard geradas por IA |
| POST | `/api/datalake/query` | Executa query agregada segura (GROUP BY, COUNT, SUM, AVG...) |

### /api/datalake/query — payload

```json
{
  "table": "crm_solicitacoes",
  "xColumn": "status",
  "metric": "",
  "aggregation": "count",
  "limit": 20
}
```

Tipos de agregacao aceitos: `count`, `sum`, `avg`, `min`, `max`, `none` (raw)

---

## Telas

### /datalake — Catalogo e Preview

- Cards semanticos por tabela com descricao, contagem de linhas e atalhos de analise
- Navegacao por abas: Catalogo / Preview / Sugestoes IA
- Preview read-only com ate `DATALAKE_PREVIEW_LIMIT` linhas
- Sugestoes de dashboard geradas por IA com prompt contextualizado para ISP

### /dashboards — Dashboard Builder

- Grid modular de widgets com dados ao vivo do MySQL
- Painel lateral "Novo Widget" com:
  - Selecao de tabela (dinamica, buscada da API)
  - Tipo de grafico: Bar, Line, Area, Pie, Metrica, Tabela
  - Selecao de coluna X e coluna metrica (dinamicas por tabela)
  - Selecao de agregacao: COUNT, SUM, AVG, MIN, MAX, sem agregacao
  - Limite de linhas (slider 5-100)
  - Selecao de cor do grafico
- Drag-and-drop para reordenar widgets (HTML5 nativo)
- Persitencia automatica em `localStorage`
- Botao de refresh individual por widget
- Botao de remocao por widget

---

## Arquitetura dos Componentes

```
src/
  app/
    api/datalake/
      health/route.ts           → status da conexao
      schema/route.ts           → catalogo de tabelas
      preview/route.ts          → preview de dados
      columns/route.ts          → colunas de uma tabela
      query/route.ts            → query agregada segura
      dashboard-suggestions/    → sugestoes via IA
    datalake/page.tsx           → tela DataLake
    dashboards/page.tsx         → Dashboard Builder
  components/datalake/
    WidgetChart.tsx             → grafico universal (Recharts)
    WidgetCard.tsx              → card do widget com refresh/delete
  infrastructure/datalake/
    mysql-client.ts             → pool, config, validacao
  modules/datalake/application/
    overview.ts                 → logica de catalogo/preview
    dashboard-suggestions.ts   → logica de sugestoes IA
  shared/types/
    datalake.ts                 → tipos do catalogo/preview/sugestoes
    dashboard.ts                → tipos do Dashboard Builder
```

---

## Recomendacoes de Producao

- Use um usuario MySQL com permissao somente leitura (`SELECT`)
- Defina `DATALAKE_ALLOWED_TABLES` para restringir tabelas sensiveis
- Nunca use `NEXT_PUBLIC_*` para credenciais
- O arquivo `.env.local` tem prioridade sobre `.env` no Next.js
- Reinicie o servidor ao alterar variaveis de ambiente

---

## Historico

| Data | Evento |
|------|--------|
| 2026-04-10 | Conexao MySQL inicial, endpoints de catalogo e preview |
| 2026-04-10 | Tela `/datalake` com cards semanticos e sugestoes IA |
| 2026-04-10 | Dashboard Builder `/dashboards` com widgets ao vivo e drag-and-drop |
| 2026-04-10 | `DATALAKE_ALLOWED_TABLES` vazio = todas as tabelas liberadas |
