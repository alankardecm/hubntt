# IA Comunicacao

Modulo do Netturbo Hub para monitorar grupos internos de WhatsApp, analisar sentimento, mapear palavras recorrentes, gerar resumos operacionais e exportar os dados por grupo.

## O que este modulo faz hoje

- le mensagens de grupos autorizados via bridge
- classifica sentimento por mensagem
- usa Groq como primeira opcao para sentimento e resumos
- usa OpenAI como fallback no resumo consolidado por grupo
- mantem fallback local quando nao houver LLM disponivel
- extrai palavras-chave e urgencia
- consolida resumo diario por grupo
- exporta dados por grupo em CSV
- gera resumo consolidado do periodo por grupo
- narra esse resumo em audio no navegador

## O que nao faz

- nao responde mensagens no WhatsApp
- nao envia audio de volta para os grupos
- nao gera `.mp3` persistido nesta fase
- nao substitui o fluxo operacional existente

## Rotas principais

- `/dashboard/comunicacao` - dashboard operacional do modulo
- `/api/wa-monitor/inbound` - entrada das mensagens capturadas
- `/api/wa-monitor/groups` - grupos monitorados
- `/api/wa-monitor/events` - eventos recentes
- `/api/wa-monitor/insights` - resumo agregado
- `/api/wa-monitor/daily-insights/generate` - consolidacao diaria em lote
- `/api/wa-monitor/export` - download por grupo
- `/api/wa-monitor/group-brief` - resumo consolidado do periodo por grupo

## Fluxos atuais

### 1. Mensagem individual

1. a mensagem entra pelo bridge
2. o hub tenta classificar com Groq
3. se Groq falhar, usa heuristica local
4. salva o resultado no Supabase

### 2. Resumo diario por grupo

1. o endpoint de consolidacao le as mensagens do dia
2. agrega sentimentos e keywords
3. usa Groq para redigir o resumo diario
4. salva em `wa_daily_insights`

### 3. Exportacao por grupo

O modulo continua exportando:

- `mensagens`
- `resumo diario`
- `palavras-chave`

### 4. Novo resumo consolidado por grupo

Foi adicionado um fluxo novo para resumir as conversas do periodo, mais proximo de um boletim de leitura rapida.

Esse fluxo:

1. recebe o grupo e a janela de dias
2. le as mensagens reais do periodo
3. calcula participantes, sentimento, urgencia e top keywords
4. tenta gerar um resumo com Groq
5. se Groq falhar, tenta OpenAI
6. se nenhuma LLM estiver disponivel, usa fallback local
7. devolve:
   - `title`
   - `summary`
   - `highlights`
   - `risks`
   - `next_steps`
   - `keywords`
   - `audio_script`

### 5. Audio do resumo

Na tela `/dashboard/comunicacao`, cada grupo passou a ter o botao:

- `Resumo conversas`

Quando o resumo e gerado, o painel lateral mostra:

- titulo
- resumo do periodo
- metricas principais
- destaques
- botao `Ouvir resumo do periodo`

O audio atual:

- usa `speechSynthesis` do navegador
- nao depende de API de TTS
- nao gera arquivo persistido

## Estrutura atual

```text
08 - IA COMUNICACAO/
|- README.md
|- DOCUMENTACAO_MESTRA.md
|- DOCUMENTACAO_TECNICA.md
|- CHANGELOG.md
|- PONTO_RECUPERACAO.md
|- docs/
`- bridge/
```

## Arquivos importantes no hub

- `src/app/dashboard/comunicacao/page.tsx`
- `src/app/api/wa-monitor/inbound/route.ts`
- `src/app/api/wa-monitor/insights/route.ts`
- `src/app/api/wa-monitor/export/route.ts`
- `src/app/api/wa-monitor/daily-insights/generate/route.ts`
- `src/app/api/wa-monitor/group-brief/route.ts`
- `src/lib/ai.ts`

## Execucao

1. preencher `.env.local` do hub
2. subir o hub com `npm run dev`
3. subir o bridge com `npm run wa-bridge`
4. escanear o QR do WhatsApp autorizado
5. testar mensagens em grupo autorizado
6. gerar resumo diario quando necessario
7. usar `Resumo conversas` para consolidar o periodo do grupo

## Comandos uteis

### Hub

```bash
npm run dev
```

### Bridge

```bash
npm run wa-bridge
```

### Resumo diario em lote

```powershell
npm run wa-daily-summary -- --date=2026-03-26
```

## Observacao

O modulo hoje ja entrega a leitura operacional das conversas e um resumo consolidado por grupo com narracao local.
Se no futuro precisarmos de audio mais natural ou download de `.mp3`, a proxima evolucao e trocar o TTS local por um provedor de voz.
