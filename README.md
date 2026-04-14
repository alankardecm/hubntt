# Netturbo Hub Reestruturacao

Ambiente de trabalho paralelo para reestruturacao arquitetural do HUB NETTURBO.

Este diretorio existe para evolucao segura da arquitetura sem interromper o ambiente estavel atual em `07 - HUB NETTURBO`.

Hub operacional da Netturbo para concentrar IA, dashboards, DataLake, monitoramento e o modulo de comunicacao em um unico ambiente.

Este projeto foi criado dentro de `15 - PROJETO IA NETTURBO` sem alterar a base original do portal antigo.

## Operacao Paralela

Esta copia foi preparada para conviver com o ambiente legado durante a migracao.

- legado atual: `07 - HUB NETTURBO`
- novo ambiente: `07.1 - HUB NETTURBO REESTRUTURACAO`
- porta padrao da copia: `4100`
- healthcheck: `/api/health`
- dev local recomendado neste Windows: `npm run dev:wasm`

Detalhes operacionais em `docs/MIGRACAO_QUENTE.md`.
Checklist de homologacao em `docs/CHECKLIST_VALIDACAO_PARALELA.md`.
Roteiro de corte parcial em `docs/CORTE_PARCIAL_ROTEIRO.md`.
Integracao MySQL em `docs/DATALAKE_MYSQL.md`.
Levantamento inicial de custos em `docs/LEVANTAMENTO_DE_CUSTOS_HUB.md`.
Template de acompanhamento em `docs/CUSTOS_HUB_TEMPLATE.csv`.
Leitura executiva por cenario em `docs/CUSTOS_HUB_CENARIOS.md`.
Guia da camada de Infra em `docs/GUIA_INFRA_HUB.md`.

## Objetivo

Centralizar os modulos principais da operacao:

- `RAG` conversacional com busca semantica
- `Dashboards` operacionais dentro do hub
- `DataLake` como camada de consolidacao de fontes
- `Zabbix` para monitoramento e alarmes
- `Infra` para sustentacao real do HUB
- `IA Comunicacao` para leitura de grupos de WhatsApp, exportacao e resumos operacionais

## Estrutura atual

```text
07 - HUB NETTURBO/
|- src/
|  |- app/
|  |  |- page.tsx
|  |  |- layout.tsx
|  |  |- rag/page.tsx
|  |  |- datalake/page.tsx
|  |  |- monitoring/zabbix/page.tsx
|  |  `- dashboard/
|  |     |- page.tsx
|  |     |- funter/page.tsx
|  |     |- commercial/page.tsx
|  |     |- noc/page.tsx
|  |     `- comunicacao/page.tsx
|  |- components/
|  `- lib/
|- public/
|  `- dashboards/funter/
|- 08 - IA COMUNICACAO/
|- package.json
|- .env.local
`- README.md
```

## Modulos principais

### RAG

- busca semantica com embeddings
- consulta a Pinecone
- interface de chat no `/rag`

### Dashboards

- builder e visoes operacionais dentro do hub
- rota principal em `/dashboards`

### Zabbix

- monitoramento operacional
- endpoint `/api/zabbix`
- modo real ou mock, conforme variaveis de ambiente

### Infra

- camada de sustentacao operacional do HUB
- rota principal em `/dashboard/noc`
- leitura real de `Zabbix`, `Data Lake`, `Outlook` e `sink operacional`
- guia especifico em `docs/GUIA_INFRA_HUB.md`

### IA Comunicacao

O modulo de comunicacao hoje entrega:

- captura de mensagens de grupos operacionais via bridge
- base de ingestao omnichannel para novos canais
- analise de sentimento por mensagem
- palavras-chave por mensagem e por grupo
- resumo diario por grupo
- exportacao por grupo em CSV
- resumo consolidado do periodo por grupo
- narrativa em audio do resumo consolidado no navegador
- sincronizacao de email corporativo via Outlook
- inbox inicial de emails analisados
- visao omnichannel inicial para o NOC

## IA Comunicacao no estado atual

O fluxo de WhatsApp dentro do hub ficou assim:

1. o bridge captura mensagens de grupos monitorados
2. o hub recebe essas mensagens em `/api/wa-monitor/inbound`
3. cada mensagem pode receber sentimento, urgencia e keywords
4. os dados aparecem na dashboard `/dashboard/comunicacao`
5. por grupo, o usuario pode:
   - baixar `mensagens`
   - baixar `resumo diario`
   - baixar `palavras-chave`
   - gerar `resumo conversas`
6. o resumo consolidado do periodo pode ser ouvido na propria tela

### Guia operacional completo

Para entender o modulo de ponta a ponta, com explicacao de por que ele existe, como funciona e onde cada parte esta:

- `docs/GUIA_OMNICHANNEL_E_NOC.md`

Para entender a camada de Infra do HUB, com explicacao de servicos-base, status reais e limites atuais:

- `docs/GUIA_INFRA_HUB.md`

Para entender os servicos externos usados pelo HUB, onde eles aparecem no codigo e como estimar custo:

- `docs/LEVANTAMENTO_DE_CUSTOS_HUB.md`
- `docs/CUSTOS_HUB_TEMPLATE.csv`
- `docs/CUSTOS_HUB_CENARIOS.md`

### Fundacao omnichannel

O projeto agora tem uma rota generica de entrada para mensagens de multiplos canais:

- `/api/communications/inbound`

Essa rota reutiliza o mesmo pipeline de analise do WhatsApp e foi preparada para receber eventos de:

- `whatsapp`
- `telegram`
- `instagram`
- `email`
- `webchat`
- `sms`

Neste momento, a persistencia ainda usa as tabelas atuais do modulo de comunicacao para manter compatibilidade com o dashboard existente. O canal fica registrado em `source_type` e na chave interna da conversa.

### Outlook corporativo

O hub agora possui base para integrar a caixa do Outlook corporativo via Microsoft Graph com login do proprio usuario:

- `GET /api/communications/outlook/auth/start`
- `GET /api/communications/outlook/auth/callback`
- `GET /api/communications/outlook/status`
- `POST /api/communications/outlook/sync`

Fluxo:

1. o usuario inicia o login Microsoft
2. o callback recebe `code` e troca por token
3. o hub consulta a caixa do proprio usuario autenticado
4. os emails sincronizados entram no pipeline omnichannel como `source = email`
5. a analise, o resumo e os proximos canais reutilizam a mesma base

Hoje a tela tambem possui:

- bloco de inbox sincronizada
- fallback de leitura ao vivo do Outlook quando ainda nao houver persistencia visivel
- visao inicial de consolidacao omnichannel para o NOC

### Novo resumo consolidado por grupo

Foi adicionado um fluxo novo para consolidar as conversas do grupo no periodo selecionado, mais proximo de um boletim do que de um CSV bruto.

Endpoint novo:

- `/api/wa-monitor/group-brief`

Esse endpoint:

- le as mensagens do grupo no intervalo
- calcula participantes, urgencia, sentimento e top keywords
- tenta gerar um resumo com `Groq`
- se Groq nao responder, tenta `OpenAI`
- se nenhuma LLM estiver disponivel, monta um fallback local
- devolve:
  - `title`
  - `summary`
  - `highlights`
  - `risks`
  - `next_steps`
  - `keywords`
  - `audio_script`

Na tela `/dashboard/comunicacao`, esse fluxo aparece no botao:

- `Resumo conversas`

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- OpenAI
- Groq
- Pinecone
- Framer Motion
- Lucide React

## Instalacao local

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

O hub sobe em:

- `http://localhost:4000`

Para subir o hub e o bridge juntos:

```powershell
.\start-wa-monitor.ps1
```

## Variaveis esperadas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_TTS_MODEL`
- `OPENAI_TTS_VOICE`
- `OPENAI_TTS_FORMAT`
- `OPENAI_TTS_SPEED`
- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_REDIRECT_URI`
- `MS_POST_AUTH_REDIRECT`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`
- `WHATSAPP_CAPTURE_TOKEN`

Observacoes:

- `GROQ_API_KEY` e a primeira opcao para os resumos do modulo de comunicacao
- `OPENAI_API_KEY` funciona como fallback para o resumo consolidado por grupo
- o audio atual usa o TTS do navegador, sem custo adicional de API

## Rotas principais

- `/` - home do hub
- `/dashboard` - workspace do hub
- `/dashboards` - dashboards do hub
- `/dashboard/noc` - camada Infra do hub
- `/dashboard/comunicacao` - dashboard do modulo de comunicacao
- `/datalake` - visao de fontes
- `/rag` - assistente conversacional
- `/monitoring/zabbix` - monitoramento
- `/api/chat` - chat do hub
- `/api/zabbix` - monitoramento Zabbix
- `/api/wa-monitor/inbound` - entrada de mensagens do bridge
- `/api/communications/inbound` - entrada omnichannel generica
- `/api/communications/outlook/auth/start` - inicia login Outlook corporativo
- `/api/communications/outlook/status` - status da conexao Outlook
- `/api/communications/outlook/sync` - sincroniza emails do Outlook para o pipeline
- `/api/communications/outlook/messages` - lista emails persistidos ou fallback ao vivo
- `/api/communications/omnichannel/summary` - consolidado inicial de protocolos e clientes por canal
- `/api/wa-monitor/insights` - resumo agregado do modulo
- `/api/wa-monitor/daily-insights/generate` - consolidacao diaria
- `/api/wa-monitor/export` - exportacao por grupo
- `/api/wa-monitor/group-brief` - resumo consolidado do periodo por grupo

## Build validado

O build do hub foi executado com sucesso apos a inclusao do fluxo:

- resumo consolidado por grupo
- narrativa em audio no modulo de comunicacao

## Documentacao adicional

- [Documentacao tecnica do hub](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/DOCUMENTACAO_TECNICA_HUB.md)
- [Plano de reestruturacao do hub](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/docs/REESTRUTURACAO_HUB_NETTURBO.md)
- [IA Comunicacao](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/08%20-%20IA%20COMUNICACAO/README.md)
- [Documentacao tecnica do modulo](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/08%20-%20IA%20COMUNICACAO/DOCUMENTACAO_TECNICA.md)
