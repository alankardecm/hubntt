# Ponto de Recuperacao - Netturbo Hub

Este arquivo serve como checkpoint oficial para retomada rapida do HUB na proxima sessao.

## Estado Atual (11/04/2026)

- O ambiente reestruturado esta funcional em paralelo ao legado
- Porta padrao do novo ambiente: `4100`
- Build validado com sucesso via `npm run build:wasm`
- Smoke check paralelo validado com sucesso
- Healthcheck funcional em `/api/health`
- Fundacao omnichannel adicionada ao modulo de comunicacao
- Audio premium server-side adicionado ao resumo das conversas
- Outlook corporativo implementado no codigo, mas ainda bloqueado por tenant/app registration

## Modulos confirmados neste checkpoint

- `RAG`
- `Zabbix`
- `IA Comunicacao`
- `DataLake MySQL`

## IA Comunicacao - expansao omnichannel

Entregue nesta etapa:

- rota generica `POST /api/communications/inbound`
- servico compartilhado de persistencia e analise para multiplos canais
- compatibilidade preservada com `POST /api/wa-monitor/inbound`
- TTS server-side para o fluxo `group-brief`
- Outlook corporativo preparado no backend e no dashboard

Arquivos principais:

- `src/app/api/communications/inbound/route.ts`
- `src/modules/communication/application/persist-inbound-communication.ts`
- `src/shared/types/omnichannel.ts`
- `src/lib/tts.ts`
- `src/lib/outlook.ts`
- `src/app/dashboard/comunicacao/page.tsx`
- `docs/OUTLOOK_OMNICHANNEL_STATUS.md`

## Outlook corporativo - status do bloqueio

Foi tentada a integracao com Microsoft Graph usando app registration existente.

O erro atual e:

```text
AADSTS700016: Application with identifier '2ac9514c-b0f1-4c03-9c7e-0e7cc6888936'
was not found in the directory 'B R A SERVICOS DE COMUNICACAO LTDA'
```

Leitura atual:

- o fluxo tecnico do projeto foi implementado
- o gargalo esta no tenant/app registration do Microsoft Entra
- a recomendacao mais segura e criar um app novo no tenant correto da conta corporativa que sera usada

## DataLake MySQL entregue ate aqui

- Conexao segura server-side com MySQL
- Catalogo de tabelas
- Preview read-only
- Sugestoes iniciais de dashboard
- Tela `/datalake` integrada ao backend

## Endpoints DataLake confirmados

- `GET /api/datalake/health`
- `GET /api/datalake/schema`
- `GET /api/datalake/preview?table=<nome>`
- `POST /api/datalake/dashboard-suggestions`

## Variaveis de ambiente necessarias

Configurar no `.env.local` ou `.env`:

```text
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=
DATALAKE_ALLOWED_TABLES=
DATALAKE_PREVIEW_LIMIT=25
```

Observacao:
- usar usuario MySQL somente leitura
- nao expor credenciais em `NEXT_PUBLIC_*`

## Como retomar na proxima sessao

Desenvolvimento local neste Windows:

```powershell
cd "C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07.1 - HUB NETTURBO REESTRUTURACAO"
$env:PORT=4100
npm run dev:wasm
```

Build validado:

```powershell
cd "C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07.1 - HUB NETTURBO REESTRUTURACAO"
$env:PORT=4100
npm run build:wasm
npm run start:parallel
```

Smoke check:

```powershell
$env:SMOKE_BASE_URL='http://localhost:4100'
npm run smoke:parallel
```

## Arquivos principais para retomar

- `README.md`
- `docs/MIGRACAO_QUENTE.md`
- `docs/CHECKLIST_VALIDACAO_PARALELA.md`
- `docs/CORTE_PARCIAL_ROTEIRO.md`
- `docs/DATALAKE_MYSQL.md`
- `docs/OUTLOOK_OMNICHANNEL_STATUS.md`
- `PONTO_RECUPERACAO_HUB.md`

## O que falta fazer

1. Resolver o app registration correto do Outlook no tenant da conta corporativa
2. Validar login Microsoft completo e sincronizacao real de emails
3. Preencher e revisar credenciais reais do ambiente com cuidado
4. Validar o `DataLake` com dados reais
5. Definir as primeiras tabelas liberadas em `DATALAKE_ALLOWED_TABLES`
6. Evoluir a geracao de dashboards sob demanda
7. Decidir a estrategia final de entrada em producao do novo HUB

## Como me chamar depois

Basta mandar algo como:

> "Vamos continuar o HUB. O ambiente novo em 4100 ja esta pronto e agora quero retomar Outlook/omnichannel a partir do status documentado."
