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

## 4.6 Sistema de alertas

Rota:

- `GET /api/wa-monitor/alerts`

Parametros:

- `days` — periodo em dias (padrao: 1 = hoje, max: 30)
- `group_id` — filtrar por grupo especifico
- `limit` — maximo de alertas (padrao: 100, max: 500)

Logica de deteccao:

A rota cruza duas consultas na tabela `wa_analysis`:

1. mensagens com `urgency` em `critica` ou `alta`
2. mensagens com `flags` contendo qualquer um de: `ofensa_ou_desqualificacao`, `incidente`, `urgente`, `palavra_critica`

Os dois conjuntos sao mesclados e deduplicados por `message_id`.

Tipos de alerta retornados:

| `alert_type` | Condicao |
|---|---|
| `ofensa` | flag `ofensa_ou_desqualificacao` presente |
| `incidente` | flag `incidente` presente |
| `urgente` | flag `urgente` presente |
| `critico` | urgencia `critica` sem flag especifica |
| `alerta` | demais casos de urgencia `alta` |

Estrutura de cada alerta retornado:

```json
{
  "id": "...",
  "message_id": "...",
  "group_id": "...",
  "group_name": "Grupo X",
  "sender_name": "Fulano",
  "message_text": "...",
  "msg_timestamp": 1234567890,
  "alert_type": "incidente",
  "severity": "critica",
  "sentiment": "negative",
  "sentiment_score": -0.85,
  "keywords": ["queda", "urgente"],
  "flags": ["incidente", "palavra_critica"],
  "summary": "...",
  "analyzed_at": "2026-05-07T10:30:00Z"
}
```

Retorno tambem inclui sumario agregado:

```json
{
  "summary": {
    "total": 12,
    "by_severity": { "critica": 3, "alta": 9 },
    "by_type": { "incidente": 5, "ofensa": 2, "urgente": 5 },
    "by_group": { "Grupo NOC": 7, "Suporte": 5 }
  }
}
```

## 4.7 Dashboard ao vivo via SSE

Rota:

- `GET /api/wa-monitor/live`

Parametros:

- `group_id` — filtrar por grupo (opcional)
- `since_ts` — timestamp unix em segundos para retomar stream (opcional, padrao: ultimos 60s)

Uso no frontend:

```javascript
const es = new EventSource('/api/wa-monitor/live?group_id=abc123');

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'messages') {
    // data.messages — array de novas mensagens
    // data.last_ts  — usar como since_ts ao reconectar
  }
};
```

Tipos de evento:

| `type` | Condicao | Campos relevantes |
|---|---|---|
| `connected` | Na abertura da conexao | `ts`, `last_ts` |
| `messages` | Novas mensagens detectadas | `count`, `messages`, `last_ts` |
| `heartbeat` | Ciclo sem novidades | `ts`, `last_ts` |
| `error` | Falha na consulta | `error` |

Cada item em `messages`:

```json
{
  "id": "...",
  "group_id": "...",
  "group_name": "Grupo X",
  "sender_name": "Fulano",
  "text": "...",
  "msg_timestamp": 1234567890,
  "sentiment": "negative",
  "urgency": "critica",
  "keywords": ["queda"]
}
```

Comportamento:

- polling interno a cada 5 segundos
- primeira consulta ocorre 2 segundos apos a conexao
- ao reconectar, passar `since_ts=` com o ultimo `last_ts` recebido para nao perder mensagens
- em ambientes serverless (Vercel), conexoes longas podem ser cortadas — use polling convencional via `GET /api/wa-monitor/events` nesses casos

## 4.8 Export sheet de sessoes

Sheet adicional disponivel na rota `GET /api/wa-monitor/export`:

- `sheet=sessions` ou `sheet=conversas`

Colunas:

```
Grupo, Status, Inicio, Fechamento, Motivo fechamento,
Duracao min, Protocolo registrado, Protocolos,
Primeira resposta min, Sem resposta ate fechamento min,
Maior espera resposta min, Maior sem atividade min,
Mensagens, Participantes, Iniciador, Ultimo remetente,
Primeira mensagem, Ultima mensagem
```

Parametros extras:

- `gap_minutes` — intervalo de inatividade para fechar sessao (padrao: 90)
- `protocol_attach_minutes` — janela para vincular protocolo a sessao (padrao: 45)
- `ai=true` — ativa revisao por IA das sessoes

## 9. Limites atuais

- o audio ainda nao e exportado como arquivo
- a voz depende do navegador
- o resumo consolidado e sob demanda por grupo
- ainda nao existe envio automatico desse audio para WhatsApp
- o endpoint `/live` nao e adequado para ambientes serverless (Vercel/Lambda)

## 10. Proximas evolucoes naturais

1. gerar `.mp3` real
2. permitir download do resumo consolidado em `.txt` ou `.json`
3. agendar resumo por grupo em horarios fixos
4. enviar o boletim para outro canal interno quando fizer sentido
5. painel de alertas na dashboard com contagem em tempo real via SSE
