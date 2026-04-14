# Documentacao Tecnica - IA Comunicacao

## Documento de referencia

- [Documentacao Mestra](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/08%20-%20IA%20COMUNICACAO/DOCUMENTACAO_MESTRA.md)

## 1. Visao geral

Este modulo adiciona inteligencia operacional sobre grupos internos de WhatsApp dentro do Netturbo Hub.

Hoje ele cobre:

- captura de mensagens
- sentimento por mensagem
- urgencia e keywords
- resumo diario por grupo
- exportacao por grupo
- resumo consolidado do periodo por grupo
- narracao do resumo no navegador

## 2. Problema que resolve

- excesso de conversa para leitura manual
- perda de contexto no meio do volume de mensagens
- necessidade de baixar CSV e ainda assim ter uma visao executiva do periodo
- necessidade de transformar conversas em boletim rapido de consumo

## 3. Arquitetura atual

### Ingestao

Fonte atual:

- bridge do WhatsApp autorizado

Entrada no hub:

- `POST /api/wa-monitor/inbound`

### Persistencia

Base atual:

- Supabase

Tabelas envolvidas no fluxo:

- `wa_groups`
- `wa_messages`
- `wa_analysis`
- `wa_daily_insights`

### IA

Camadas atuais:

1. Groq para sentimento e resumos
2. OpenAI como fallback no resumo consolidado do periodo
3. heuristica local como fallback final

## 4. Funcionalidades atuais

### 4.1 Sentimento por mensagem

Cada mensagem pode receber:

- `sentiment`
- `sentiment_score`
- `keywords`
- `urgency`

### 4.2 Resumo diario em lote

Rota:

- `POST /api/wa-monitor/daily-insights/generate`

Essa rota:

1. le mensagens do dia por grupo
2. consolida contagens reais
3. usa Groq para redacao
4. salva em `wa_daily_insights`

### 4.3 Exportacao por grupo

Rota:

- `GET /api/wa-monitor/export`

Sheets suportadas:

- `messages`
- `summary`
- `keywords`

### 4.4 Novo resumo consolidado do periodo

Rota:

- `GET /api/wa-monitor/group-brief`

Parametros:

- `group_id` ou `group_name`
- `days`
- `date_from`
- `date_to`

Essa rota:

1. localiza o grupo
2. le mensagens do intervalo
3. agrega:
   - quantidade de mensagens
   - participantes
   - sentimento
   - urgencia
   - keywords
   - participantes mais ativos
4. seleciona amostras de mensagens
5. chama a camada de IA em `src/lib/ai.ts`
6. devolve um objeto `brief`

### 4.5 Estrutura do brief

Saida principal:

```json
{
  "title": "Grupo X: resumo dos ultimos 7 dias",
  "summary": "texto consolidado do periodo",
  "highlights": ["..."],
  "risks": ["..."],
  "next_steps": ["..."],
  "keywords": ["..."],
  "dominant_topic": "tema",
  "audio_script": "roteiro curto para narracao"
}
```

## 5. Camada de IA

Arquivo central:

- `src/lib/ai.ts`

Funcoes adicionadas:

- `buildConversationBriefPrompt`
- `summarizeConversationBrief`
- `runOpenAiJsonPrompt`

### Ordem de execucao

1. Groq
2. OpenAI
3. fallback local no endpoint

### Objetivo do prompt

Gerar um resumo consolidado das conversas do grupo no periodo, com:

- historia principal do intervalo
- pontos mais relevantes
- riscos
- proximos passos
- script falado para audio

## 6. Dashboard operacional

Tela:

- `/dashboard/comunicacao`

Mudancas adicionadas:

- novo botao `Resumo conversas` em cada card de grupo
- painel lateral com o resumo consolidado selecionado
- botao `Ouvir resumo do periodo`

### Audio

O audio atual:

- usa `speechSynthesis`
- depende do navegador
- nao salva `.mp3`
- narra o campo `audio_script`

## 7. Bridge de captura

Arquivo:

- `bridge/index.js`

Responsabilidades:

- autenticar WhatsApp via QR
- escutar grupos permitidos
- enviar mensagens para o hub

Contrato minimo:

- `WHATSAPP_CAPTURE_TOKEN` igual entre bridge e hub
- hub no ar em `http://localhost:4000`
- bridge executado separado do Next.js

## 8. Execucao

### Ordem recomendada

1. preparar `.env.local`
2. aplicar schema no Supabase
3. subir o hub
4. subir o bridge
5. escanear o QR
6. validar mensagens em grupo autorizado
7. usar a dashboard para exportar ou resumir o periodo

### Comandos

Hub:

```bash
npm run dev
```

Bridge:

```bash
npm run wa-bridge
```

Resumo diario:

```powershell
npm run wa-daily-summary -- --date=2026-03-26
```

## 9. Limites atuais

- o audio ainda nao e exportado como arquivo
- a voz depende do navegador
- o resumo consolidado e sob demanda por grupo
- ainda nao existe envio automatico desse audio para WhatsApp

## 10. Proximas evolucoes naturais

1. gerar `.mp3` real
2. permitir download do resumo consolidado em `.txt` ou `.json`
3. agendar resumo por grupo em horarios fixos
4. enviar o boletim para outro canal interno quando fizer sentido
