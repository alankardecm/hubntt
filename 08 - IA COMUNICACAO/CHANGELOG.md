# Changelog - IA Comunicacao

## 2026-05-07

### Corrigido

- Deteccao de protocolo no formato `prefixo#numero` (ex: `ntt#124135`) nao funcionava
  - O regex esperava letras seguidas diretamente de digitos (`ntt124135`)
  - O `#` entre o prefixo e o numero quebrava o padrao silenciosamente
  - Adicionados dois novos padroes em `PROTOCOL_PATTERNS`:
    1. `Protocolo ntt#124135` — palavra-chave + separador opcional + prefixo#numero
    2. `ntt#124135` standalone — prefixo curto (2-8 letras) + `#` + 4+ digitos, sem palavra-chave
  - Apos captura, `normalizeProtocol` remove o `#` → `ntt#124135` vira `NTT124135`
  - Arquivo: `src/modules/communication/application/wa-conversation-sessions.ts`

### Adicionado

- Rota `GET /api/wa-monitor/alerts` — sistema de alertas operacionais
  - Detecta mensagens com `urgency = critica` ou `alta`
  - Detecta flags: `ofensa_ou_desqualificacao`, `incidente`, `urgente`, `palavra_critica`
  - Parâmetros: `days`, `group_id`, `limit`
  - Retorno: lista de alertas + sumário por severidade, tipo e grupo

- Rota `GET /api/wa-monitor/live` — stream SSE para dashboard ao vivo
  - Eventos: `connected`, `messages`, `heartbeat`, `error`
  - Polling interno a cada 5 segundos
  - Parâmetros: `group_id` (opcional), `since_ts` (unix, para retomar de onde parou)
  - Uso: `new EventSource('/api/wa-monitor/live?group_id=...')`

### Corrigido

- `GET /api/wa-monitor/events` — ordenacao corrigida de `created_at` para `msg_timestamp`
- `POST /api/wa-monitor/daily-insights/generate` — filtro de periodo corrigido de `created_at` para `msg_timestamp`
- `GET /api/wa-monitor/group-brief` — filtro de periodo corrigido de `created_at` para `msg_timestamp`
- `GET /api/wa-monitor/export` (sheets `messages` e `keywords`) — filtro de periodo corrigido de `created_at` para `msg_timestamp`

O bug causava mensagens enviadas por backfill (historico do WhatsApp) aparecerem no dia de hoje em vez do dia original, pois a bridge insere com `created_at = agora` mas `msg_timestamp = quando a mensagem foi enviada no grupo.`

## 2026-04-09

### Adicionado

- Endpoint `GET /api/wa-monitor/group-brief`
- Botao `Resumo conversas` na dashboard `/dashboard/comunicacao`
- Painel operacional para mostrar resumo consolidado do periodo por grupo
- Narracao do resumo via `speechSynthesis` no navegador

### IA / Resumo consolidado

- O resumo do periodo agora segue a ordem:
  - Groq
  - OpenAI
  - fallback local
- O retorno do `group-brief` passou a incluir:
  - `title`
  - `summary`
  - `highlights`
  - `risks`
  - `next_steps`
  - `keywords`
  - `audio_script`

### Documentacao

- `README.md` do modulo reescrito
- `DOCUMENTACAO_TECNICA.md` reescrita
- `PONTO_RECUPERACAO.md` atualizado com o novo estado do modulo

### Hub / RAG relacionado

- O RAG do hub foi ajustado em paralelo para melhorar consultas procedurais e por identificador de equipamento
- Casos trabalhados:
  - `HT818`
  - `DM2104`

## 2026-03-31 (sessao tarde)

### Adicionado

- Central de Exportacao na dashboard `/dashboard/comunicacao`:
  - Card por grupo monitorado (todos, nao apenas ativos)
  - Seletor de periodo: 7d / 15d / 30d
  - 3 botoes de download por grupo: Mensagens / Resumo diario / Palavras-chave
  - Cada botao informa as colunas que o arquivo gerado contem

### Alterado

- Rota `GET /api/wa-monitor/export` completamente reescrita:
  - Parametro `sheet=messages|summary|keywords` substitui `format=csv|json`
  - CSV antigo (27 colunas misturadas, ilegivel no Excel) descartado
  - `sheet=messages`: 8 colunas (Data, Hora, Remetente, Mensagem, Sentimento, Score, Urgencia, Palavras-chave)
  - `sheet=summary`: 10 colunas (Data, Total, Positivo, Neutro, Negativo, Urgentes, Nivel, Palavra Principal, Resumo Executivo)
  - `sheet=keywords`: 3 colunas (Posicao, Palavra, Ocorrencias)
  - Separador ponto-e-virgula (;) e BOM UTF-8 para Excel PT-BR

### Corrigido

- Contaminacao de contexto no RAG (`src/app/api/chat/route.ts`):
  - `buildRetrievalQuery` agora envia apenas a pergunta atual ao Pinecone
  - sessionTopic nao mais contamina o vetor de busca quando o assunto muda
  - System prompt recebeu regra explicita separando follow-up de nova consulta
- Extracao de `imageUrl` no RAG (`src/lib/rag.ts`):
  - `extractMatchImageUrl` ganhou fallback: tenta regex no conteudo textual do chunk
  - Chamada redundante em `buildPineconeContext` removida

### Documentacao

- `PONTO_RECUPERACAO.md` reescrito com contexto completo para retomada por qualquer IA
  - Estado atual, arquivos envolvidos, comandos, schema, bloqueios conhecidos
  - Explicacao do campo `sentiment_score` (Score) e sua escala de -1 a +1

## 2026-03-31 (sessao manha)

### Adicionado

- Rota `GET /api/wa-monitor/export` para baixar dados por grupo em `CSV` ou `JSON`
- Exportacao com mensagens, sentimento, palavras mais usadas e resumos diarios do grupo
- Botao `Baixar CSV` na dashboard `/dashboard/comunicacao` para grupos ativos

### Documentacao

- `DOCUMENTACAO_MESTRA.md` atualizada com a frente de exportacao por grupo
- `DOCUMENTACAO_TECNICA.md` atualizada com contrato da rota de export
- `PONTO_RECUPERACAO.md` atualizado com a nova etapa de validacao
- `README.md` reescrito em ASCII e alinhado com a funcionalidade de download

## 2026-03-27

### Corrigido

- `npm run dev` agora limpa a pasta `.next` antes de iniciar o Next para evitar cache de rotas desatualizado no Windows
- `npm run dev` agora derruba a instancia antiga ocupando a porta `4000` antes de subir o hub
- Bridge do WhatsApp agora sincroniza o historico de hoje dos grupos permitidos ao conectar, antes de seguir em tempo real
- Timestamp de mensagens historicas na bridge passou a ser normalizado antes do filtro de dia para nao perder mensagens de hoje por diferenca de unidade
- Pedido de `fetchMessageHistory` passou a usar timestamp em milissegundos, conforme esperado pelo Baileys, para reforcar o backfill
- Um grupo antigo saiu da lista padrao e foi substituido por `Relacionamento NT`
- Mensagens ao vivo agora tambem servem como ancora para o backfill de historico
- Bridge passou a se apresentar como `macOS Desktop` no Baileys para aumentar a chance de history sync completo
- Bootstrap de historico agora usa anchors reais do hub e um arquivo local persistido antes de solicitar replay
- Anchors de historico sao salvos em `bridge/auth_session/history_anchors.json` para sobreviver a reinicios
- Bridge agora dispara `FULL_HISTORY_SYNC_ON_DEMAND` ao conectar, como tentativa extra para puxar o historico do dia
- Bridge ganhou bootstrap reforcado via `chats.upsert` para criar ancora provisoria quando um grupo ainda nao tiver mensagem salva no hub
- Sessao antiga da bridge foi limpa em `bridge/auth_session` para forcar um pareamento novo depois dos erros de decrypt observados no boot
- Dashboard de comunicacao agora destaca os grupos com pressao negativa e lista os mais afetados na distribuicao geral de sentimento
- Bloco de resumo diario por grupo passou a aparecer somente quando existir resumo preparado de verdade em `wa_daily_insights`
- Diagnostico do historico do Baileys foi corrigido para refletir replay parcial/ausente do WhatsApp, e nao apenas timeout de 20s
- Documentacao de retomada ajustada para mencionar replay parcial e falha de decriptacao como causa operacional do backfill incompleto

## 2026-03-26

### Adicionado

- Documento de modelo de dados
- Documento de fluxo de ingestao
- Documento da dashboard inicial
- Dashboard inicial do modulo em `/dashboard/comunicacao`

### Ajustado

- Classificacao de palavras criticas reforcada para mensagens curtas com ofensa
- Flatten da resposta de eventos para a dashboard ler sentimento e keywords corretamente
- Normalizacao da urgencia para evitar dependencia de string com acento corrompido
- Dashboard de comunicacao reestruturada para blocos oficiais: grupos, mapa de palavras, sentimento, resumo diario e base futura de audio
- Removido bloco de leitura por grupo, que nao tinha funcao operacional
- Resumo diario por grupo agora usa o ultimo evento capturado quando nao existe insight consolidado
- Sentimento do WhatsApp agora tenta Groq e usa heuristica local como fallback
- Prompt oficial de sentimento e resumo diario documentado em `docs/prompts_groq.md`
- Endpoint `POST /api/wa-monitor/daily-insights/generate` adicionado para consolidacao em lote
- Consolidacao diaria ganhou campos persistidos para sentimento, palavra principal, urgencia e modelo usado
- Comando `npm run wa-daily-summary` adicionado para rodar consolidacao manualmente
- Helper `scripts/register-wa-daily-summary-task.ps1` adicionado para agendamento diario no Windows
- Helper `scripts/run-wa-daily-summary.ps1` adicionado para execucao runtime do resumo diario

### Estrutura

- `README.md`
- `DOCUMENTACAO_TECNICA.md`
- `PONTO_RECUPERACAO.md`
- `CHANGELOG.md`
- `docs/modelo_de_dados.md`
- `docs/fluxo_de_ingestao.md`
