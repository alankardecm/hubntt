# HUB NTT

Reestruturacao do HUB operacional da Netturbo em um ambiente paralelo, focado em consolidar `IA`, `Dashboards`, `Data Lake`, `Infra`, `Zabbix`, `RAG` e `IA Comunicacao` em uma unica plataforma.

Este projeto foi criado para evoluir a arquitetura do portal sem interromper a base legada em producao.

## Visao executiva

O `HUB NTT` funciona como uma camada central de operacao e leitura analitica. A proposta e tirar informacao dispersa de canais e sistemas diferentes e organizar tudo dentro de um unico ambiente.

Hoje o projeto ja cobre, em diferentes niveis de maturidade:

- dashboards operacionais dentro do proprio HUB
- Data Lake MySQL como base de consulta e exploracao
- Zabbix como fonte de monitoramento
- **Motor de Correlacao NOC-WPP**: cruza alarmes do Zabbix com sentimentos do WhatsApp para medir impacto real
- camada `Infra` para sustentacao real do ecossistema
- omnichannel com `WhatsApp` e `Outlook`
- RAG com busca semantica
- **Assistente Inteligente**: criacao de dashboards via linguagem natural
- documentacao tecnica, operacional e de custos

## Principais modulos

### Dashboards

- rota principal em `/dashboards`
- builder para montar visoes mais proximas de um Power BI interno
- exploracao de tabelas, colunas e previews para acelerar a tomada de decisao

### Data Lake

- rota principal em `/datalake`
- leitura de tabelas MySQL liberadas
- preview de dados
- apoio a sugestoes de dashboards

### Infra

- rota atual em `/dashboard/noc`
- substitui a antiga tela cenografica de NOC
- monitora a sustentacao real do HUB com leitura de:
  - `Zabbix`
  - `Data Lake`
  - `Outlook`
  - `sink operacional`

### IA Comunicacao

- rota principal em `/dashboard/comunicacao`
- base operacional para WhatsApp + Outlook
- seletor de grupos monitorados
- inbox sincronizada
- resumos diarios
- resumo consolidado por conversa
- ciclo de conversas do WhatsApp com inicio, fechamento, protocolo e tempo sem resposta
- visao omnichannel inicial para protocolos e clientes por canal

### Zabbix

- rota principal em `/monitoring/zabbix`
- endpoint `/api/zabbix`
- leitura de resumo, hosts, eventos e problemas ativos

### RAG

- rota principal em `/rag`
- embeddings
- busca vetorial
- apoio a respostas contextualizadas do HUB

## Arquitetura resumida

O projeto foi organizado para funcionar como uma plataforma modular:

1. `captura`
   - WhatsApp via bridge
   - Outlook via Microsoft Graph
   - Zabbix via API
   - Data Lake via MySQL
2. `persistencia`
   - Supabase como base operacional
3. `analise`
   - OpenAI
   - Groq
   - Gemini embeddings
   - Pinecone
4. `visualizacao`
   - dashboards internos do HUB
   - Data Lake explorer
   - camada Infra
   - IA Comunicacao

## Operacao paralela

Esta copia foi preparada para conviver com o ambiente legado durante a migracao.

- legado atual: `07 - HUB NETTURBO`
- novo ambiente: `07.1 - HUB NETTURBO REESTRUTURACAO`
- porta padrao da copia: `4200`
- healthcheck: `/api/health`
- ambiente recomendado no Windows: `npm run dev:wasm`

## Rotas principais

- `/` - home do hub
- `/dashboard` - workspace
- `/dashboards` - dashboards do hub
- `/dashboard/noc` - camada Infra
- `/dashboard/comunicacao` - IA Comunicacao
- `/dashboard/custos` - leitura inicial de custos do ecossistema
- `/datalake` - explorer do Data Lake
- `/monitoring/zabbix` - monitoramento Zabbix
- `/rag` - assistente com contexto

## APIs principais

- `/api/health`
- `/api/chat`
- `/api/zabbix`
- `/api/datalake/schema`
- `/api/datalake/preview`
- `/api/datalake/query`
- `/api/communications/inbound`
- `/api/communications/outlook/status`
- `/api/communications/outlook/sync`
- `/api/communications/outlook/messages`
- `/api/communications/omnichannel/summary`
- `/api/wa-monitor/inbound`
- `/api/wa-monitor/groups`
- `/api/wa-monitor/insights`
- `/api/wa-monitor/export`
- `/api/wa-monitor/group-brief`
- `/api/wa-monitor/conversation-sessions`

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Framer Motion`
- `Supabase`
- `MySQL`
- `OpenAI`
- `Groq`
- `Google Gemini`
- `Pinecone`
- `Lucide React`

## Setup local

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

Ambiente paralelo recomendado no Windows:

```bash
npm run dev:wasm
```

Para subir o hub junto com o fluxo de WhatsApp:

```powershell
.\start-wa-monitor.ps1
```

## Variaveis principais

Plataforma:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

IA:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

Outlook:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_REDIRECT_URI`
- `MS_POST_AUTH_REDIRECT`

Monitoracao:

- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`

WhatsApp / bridge:

- `WHATSAPP_CAPTURE_TOKEN`

## Documentacao principal

Operacao paralela e migracao:

- `docs/MIGRACAO_QUENTE.md`
- `docs/CHECKLIST_VALIDACAO_PARALELA.md`
- `docs/CORTE_PARCIAL_ROTEIRO.md`

Infra e monitoracao:

- `docs/GUIA_INFRA_HUB.md`
- `docs/DATALAKE_MYSQL.md`

Omnichannel e comunicacao:

- `docs/GUIA_OMNICHANNEL_E_NOC.md`
- `docs/OUTLOOK_OMNICHANNEL_STATUS.md`

Custos:

- `docs/LEVANTAMENTO_DE_CUSTOS_HUB.md`
- `docs/CUSTOS_HUB_TEMPLATE.csv`
- `docs/CUSTOS_HUB_CENARIOS.md`

Arquitetura e continuidade:

- `DOCUMENTACAO_TECNICA_HUB.md`
- `CHANGELOG_HUB.md`
- `PONTO_RECUPERACAO_HUB.md`
- `GOVERNANCA_DE_ESCOPO_E_DEPLOY.md`

## Estado atual

O projeto ja atende bem como base operacional e arquitetural do novo HUB, mas ainda esta em evolucao.

As frentes mais maduras hoje sao:

- exploracao do Data Lake
- integracao com Zabbix
- camada Infra
- base omnichannel com WhatsApp e Outlook
- documentacao e leitura inicial de custos

As frentes que ainda devem evoluir mais:

- dashboards com mais recursos de drill-down
- identificacao mais forte de protocolos/clientes
- healthchecks dedicados para todos os servicos externos
- refinamento de persistencia do omnichannel

## Observacao importante

Este repositorio representa uma base corporativa real da operacao. Mesmo quando publicado de forma privada, a recomendacao e tratar arquitetura, integracoes, dados e credenciais com governanca.
