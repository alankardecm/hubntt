# O que precisamos para implementar

## 1. Dependencias funcionais

### Captura

- forma de receber mensagens dos grupos internos
- identificacao do grupo
- identificacao do autor
- texto bruto da mensagem
- timestamp da mensagem

### Analise

- modelo de IA para sentimento
- Groq como camada principal de sentimento e resumo diario
- extracao de keywords
- regras de alerta
- resumo consolidado por grupo e periodo

### Persistencia

- banco para eventos brutos
- banco para analises
- banco para agregados
- storage para anexos, se existirem

### Dashboard

- cards de resumo
- lista de palavras-chave
- classificacao por grupo
- feed de eventos recentes

## 2. Dependencias tecnicas

- Next.js no hub
- Supabase para persistencia
- OpenAI para analise textual
- worker Node.js para processamento assíncrono
- opcional: fila Redis se o volume subir

## 3. Variaveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_CAPTURE_TOKEN`
- `WHATSAPP_CAPTURE_SECRET`

## 4. Tabelas minimas

### `wa_groups`

Grupos monitorados.

### `wa_messages`

Mensagens brutas capturadas.

### `wa_analysis`

Resultado da IA por mensagem.

### `wa_daily_insights`

Resumo consolidado por grupo e dia.

### `wa_keywords_config`

Palavras e regras de alerta.

## 5. Rotas minimas no hub

- `POST /api/wa-monitor/inbound`
- `GET /api/wa-monitor/groups`
- `GET /api/wa-monitor/insights`
- `GET /api/wa-monitor/events`
- `POST /api/wa-monitor/daily-insights/generate`
- `/dashboard/comunicacao`

## 6. Ordem de construcao

### Fase 1

- schema do banco
- dashboard basica
- mock de eventos

### Fase 2

- endpoint de entrada
- analise de sentimento
- palavras-chave
- persistencia real
- resumo diario em lote com Groq

### Fase 3

- coletor de mensagens
- alertas
- resumos diários
- filtros por grupo

### Fase 4

- dashboard ao vivo
- busca historica
- exportacao

## 7. Checklist minimo para subir

- build do hub fechado
- schema criado no banco
- variaveis de ambiente definidas
- dashboard acessivel
- fonte de mensagens funcionando
