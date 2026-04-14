# Documentacao Tecnica - Netturbo Hub

## 1. Visao geral

O Netturbo Hub e a base operacional unica para:

- RAG
- dashboards HTML
- DataLake
- monitoramento Zabbix
- IA Comunicacao

O projeto foi criado em pasta separada para preservar a base original.

## 2. Objetivo tecnico

Padronizar uma unica superficie para:

- navegacao entre modulos
- consulta de conhecimento
- operacao diaria
- monitoramento
- consolidacao de inteligencia em comunicacao

## 3. Arquitetura atual

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Lucide React

### Backend

- Route Handlers do Next.js
- OpenAI para chat e fallback de resumo consolidado
- Groq como primeira opcao para resumos do modulo de comunicacao
- Pinecone para o RAG
- Google embeddings para consulta vetorial
- Supabase para persistencia
- Zabbix API para monitoramento

## 4. Modulos principais

- `src/app/rag/page.tsx`
- `src/app/datalake/page.tsx`
- `src/app/monitoring/zabbix/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/funter/page.tsx`
- `src/app/dashboard/comunicacao/page.tsx`

## 5. IA Comunicacao dentro do hub

### Capacidade atual

O modulo de WhatsApp dentro do hub hoje cobre:

- captura de mensagens via bridge
- classificacao de sentimento
- keywords e urgencia por mensagem
- resumo diario por grupo
- exportacao por grupo
- resumo consolidado do periodo por grupo
- narrativa em audio do resumo consolidado no navegador

### Rotas do modulo

- `GET /api/wa-monitor/groups`
- `GET /api/wa-monitor/events`
- `GET /api/wa-monitor/insights`
- `POST /api/wa-monitor/inbound`
- `POST /api/wa-monitor/daily-insights/generate`
- `GET /api/wa-monitor/export`
- `GET /api/wa-monitor/group-brief`

### Novo fluxo: group brief

Foi adicionado um endpoint especifico para consolidar a conversa do grupo no periodo:

- `src/app/api/wa-monitor/group-brief/route.ts`

Esse fluxo:

1. recebe `group_id` ou `group_name`
2. recebe `days`, `date_from` e `date_to` quando necessario
3. consulta `wa_messages` e `wa_analysis`
4. calcula:
   - total de mensagens
   - participantes ativos
   - distribuicao de sentimento
   - urgencia
   - top keywords
   - top participantes
5. envia amostras para a LLM
6. devolve um resumo consolidado com:
   - `title`
   - `summary`
   - `highlights`
   - `risks`
   - `next_steps`
   - `keywords`
   - `dominant_topic`
   - `audio_script`

### Ordem de fallback no resumo consolidado

O arquivo `src/lib/ai.ts` foi atualizado para o seguinte fluxo:

1. tentar Groq
2. se Groq falhar, tentar OpenAI
3. se nenhuma LLM estiver disponivel, usar fallback local heuristico no endpoint

### Audio

O audio atual nao gera arquivo `.mp3`.
Ele usa `speechSynthesis` do navegador para narrar o `audio_script` retornado pelo endpoint.

Vantagens do modelo atual:

- zero custo adicional para TTS
- nao depende de storage
- nao altera o pipeline atual de captura e exportacao

Limite atual:

- a voz depende do navegador e do sistema operacional do usuario

## 6. Exportacao por grupo

O endpoint `GET /api/wa-monitor/export` continua responsavel por:

- `sheet=messages`
- `sheet=summary`
- `sheet=keywords`

Ele nao foi substituido.
O novo `group-brief` e complementar ao fluxo existente.

## 7. Variaveis de ambiente

### Hub

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `PINECONE_ENVIRONMENT`
- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`
- `WHATSAPP_CAPTURE_TOKEN`

## 8. Como rodar

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

Bridge:

```bash
npm run wa-bridge
```

Consolidacao diaria:

```bash
npm run wa-daily-summary -- --date=YYYY-MM-DD
```

## 9. Validacao recente

O build do hub foi revalidado apos:

- inclusao do endpoint `group-brief`
- inclusao do botao `Resumo conversas`
- inclusao da narracao em audio na dashboard de comunicacao

## 10. Observacao operacional

O warning de chart com largura e altura invalidas ainda pode aparecer no build, mas nao bloqueou a compilacao das alteracoes recentes do modulo de comunicacao.
