# Story 002 - Dashboards self-service no Data Lake

## Status

Ready for Review

## Story

Como usuario do Hub Netturbo,
quero explorar qualquer tabela disponivel no Data Lake e criar um dashboard inicial com poucos cliques,
para montar leituras personalizadas sem depender de desenvolvedor.

## Acceptance Criteria

- [x] O catalogo do Data Lake usa semantica dinamica para tabelas conhecidas e desconhecidas.
- [x] O usuario consegue criar dashboard diretamente a partir de uma tabela.
- [x] O dashboard criado a partir de uma tabela recebe widgets iniciais seguros quando as colunas estao disponiveis.
- [x] O gerador evita somar identificadores tecnicos como `id_*`, `cod_*` e `protocolo`.
- [x] Tendencias temporais usam agrupamento mensal quando o eixo e uma data.
- [x] A lista de dashboards aponta para o explorador de tabelas.
- [x] O fluxo principal e responsivo para desktop e telas menores.
- [x] Gates de qualidade executados.

## Tasks

- [x] Recuperar `src/lib/datalake-semantics.ts` para UTF-8 valido e conteudo completo.
- [x] Expandir inferencia semantica de tabelas e colunas.
- [x] Permitir criacao de dashboard com widgets no endpoint `POST /api/dashboards`.
- [x] Criar widgets iniciais a partir das colunas de uma tabela.
- [x] Sanear consultas antigas para nao somar identificadores como metricas.
- [x] Melhorar eixos dos graficos com datas compactas e numeros legiveis.
- [x] Corrigir o dashboard salvo `a15ae3be-b91b-40e5-83c6-8ed237b9b047` para leituras coerentes.
- [x] Melhorar responsividade dos controles do explorador.
- [x] Rodar lint, typecheck equivalente, testes e build quando aplicavel.

## Checklist

- [x] Escopo confirmado pelo pedido do usuario
- [x] Arquitetura mantida dentro do fluxo Data Lake -> Dashboard
- [x] Quality gates concluidos
- [x] File list atualizada

## Validation

- [x] `npm run lint` passou sem erros; restaram 2 warnings preexistentes em `src/app/rag/page.tsx` e `src/lib/tts.ts`.
- [x] `npm run typecheck` passou.
- [x] `npm run build` passou fora do sandbox apos falha `EPERM` no sandbox.
- [x] `npm run smoke:parallel` passou com o servidor local em `http://localhost:4100`.
- [x] `GET /datalake` respondeu 200.
- [x] `GET /dashboards/a15ae3be-b91b-40e5-83c6-8ed237b9b047` respondeu 200.
- [x] `GET /api/datalake/schema` respondeu conectado com 20 tabelas.
- [x] `GET /api/datalake/columns?table=crm_funter` respondeu 200.
- [x] `GET /api/datalake/preview?table=crm_funter&limit=3` respondeu 200.
- [x] Queries problematicas de tendencia passaram a retornar labels mensais (`YYYY-MM`) e contagens em vez de somas de IDs.
- [ ] `npm test` nao executado porque o `package.json` nao possui script `test`.

## File List

- [docs/stories/002-datalake-dashboard-self-service.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/stories/002-datalake-dashboard-self-service.md:1>)
- [src/lib/datalake-semantics.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/datalake-semantics.ts:1>)
- [src/app/datalake/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/datalake/page.tsx:1>)
- [src/app/dashboards/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboards/page.tsx:1>)
- [src/app/api/dashboards/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/dashboards/route.ts:1>)
- [src/app/api/datalake/query/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/datalake/query/route.ts:1>)
- [src/app/dashboards/[id]/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboards/[id]/page.tsx:1>)
- [src/components/datalake/ColumnPicker.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/components/datalake/ColumnPicker.tsx:1>)
- [src/components/datalake/WidgetChart.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/components/datalake/WidgetChart.tsx:1>)
- [src/lib/dashboard-widget-intelligence.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/dashboard-widget-intelligence.ts:1>)
- [package.json](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/package.json:1>)
