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
- inferencia de ciclo de conversas por grupo com protocolo e tempo sem resposta
- narrativa em audio do resumo consolidado no navegador

### Rotas do modulo

- `GET /api/wa-monitor/groups`
- `GET /api/wa-monitor/events`
- `GET /api/wa-monitor/insights`
- `POST /api/wa-monitor/inbound`
- `POST /api/wa-monitor/daily-insights/generate`
- `GET /api/wa-monitor/export`
- `GET /api/wa-monitor/group-brief`
- `GET /api/wa-monitor/conversation-sessions`

### Novo fluxo: ciclo de conversas

O endpoint `GET /api/wa-monitor/conversation-sessions` infere sessoes de conversa a partir de `wa_messages` usando `msg_timestamp`.

Parametros principais:

- `group_id` ou `group_name`
- `days`, `date_from`, `date_to`
- `gap_minutes` para fechar conversa por inatividade
- `protocol_attach_minutes` para associar um protocolo a uma conversa recente sem protocolo
- `ai=1` para acionar revisao por IA sobre as mensagens recentes
- `max_ai_messages` para limitar quantas mensagens entram na revisao por IA

O retorno informa inicio, fechamento, status, motivo de fechamento, protocolos encontrados, mencoes de protocolo com evidencia, tempo ate primeira resposta, maior tempo sem resposta e maior periodo sem atividade.

A deteccao usa camadas:

1. regra rapida para padroes claros de protocolo, chamado, ticket, OS, notificacao e ocorrencia
2. inferencia de sessoes por janela de inatividade e mensagens explicitas de fechamento
3. revisao opcional por IA (`ai=1`) para procurar protocolos e sinais de fechamento fora dos padroes diretos

### Uso da revisao por IA

A revisao por IA nao roda no refresh automatico da dashboard. Ela e acionada sob demanda pelo botao `Revisar com IA`, para evitar consumo recorrente de tokens e estouro de quota nos provedores.

Quando acionada, a dashboard chama:

- `GET /api/wa-monitor/conversation-sessions?days=1&limit=5000&ai=1&max_ai_messages=40`

O endpoint limita a revisao por IA a uma amostra recente de mensagens. A regra local continua sendo a base rapida e barata; a IA funciona como auditoria complementar.

Se Groq, Gemini ou OpenAI retornarem limite de quota, a API mantem o resultado local e informa que a revisao de IA nao foi aplicada. A tela nao deve manter chamadas repetidas com `ai=1`.

### Protocolos na dashboard

O bloco `Protocolos detectados` mostra cada protocolo vinculado a:

- conversa/grupo
- status da conversa
- origem da deteccao (`Regra` ou `IA`)
- evidencia textual da mensagem
- horario da mensagem quando disponivel

Para evitar erro de hidratacao no React, a lista usa chaves unicas por sessao, protocolo, mensagem, origem e indice. O card de conversa tambem evita `<button>` dentro de `<button>`: o header usa container neutro, o botao de expandir e o botao `Brief` sao controles separados.

O exportador `GET /api/wa-monitor/export` tambem aceita `sheet=sessions` para baixar essas conversas em CSV por grupo.

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

---

## 11. Modulo Dashboard Builder — Melhorias de UX (30/04/2026)

### Contexto

O modulo de criacao de dashboards analíticos (`src/app/dashboards/[id]/page.tsx`) permite que o usuario escolha tabelas do DataLake, explore colunas e monte widgets com tipos de grafico, agregacoes e filtros. As mudancas abaixo melhoraram a experiencia de selecao de tabela, colunas e tipo de grafico.

---

### 11.1 Novo componente: ColumnPicker

**Arquivo:** `src/components/datalake/ColumnPicker.tsx`

Substituiu todos os `<select>` nativos de selecao de coluna no painel lateral de criacao de widget.

**Funcionalidades:**
- Busca em tempo real por nome tecnico, label semantica ou descricao da coluna
- Colunas agrupadas por categoria: **Metricas** / **Dimensoes** / **Temporal**
- Badges de tipo (`num`, `data`, `texto`) visiveis na lista e no campo selecionado
- Botao `×` para limpar a selecao sem reabrir o dropdown
- Prop `filterType` para restringir o picker:
  - `"numeric"` — exibe apenas colunas numericas (para "Coluna numerica")
  - `"temporal"` — exibe apenas colunas de data/periodo (para "Coluna de periodo")
  - `"all"` — todas as colunas (padrao, para "Eixo ou categoria" e "Filtro de negocio")
- Fechamento automatico ao clicar fora

**Props principais:**

| Prop | Tipo | Descricao |
|------|------|-----------|
| `columns` | `ColumnInfo[]` | Lista de colunas da tabela selecionada |
| `table` | `string` | Nome da tabela (usado para buscar label semantica) |
| `value` | `string` | Coluna atualmente selecionada |
| `onChange` | `(col: string) => void` | Callback ao selecionar |
| `filterType` | `'numeric' \| 'temporal' \| 'all'` | Filtro de tipo |
| `nullable` | `boolean` | Permite limpar a selecao (padrao: `true`) |
| `nullLabel` | `string` | Texto da opcao vazia |

---

### 11.2 Seletor de tabela — cards visuais

No painel lateral de criacao de widget, o `<select>` de tabela foi substituido por cards clicaveis exibindo:

- Label semantica e nome tecnico da tabela
- Contagem de rows
- Icone de check na tabela ativa

---

### 11.3 Tipos de grafico — icones SVG e dica de uso

Os botoes de selecao de tipo de grafico deixaram de usar siglas de texto (`BA`, `LI`, etc.) e passaram a exibir mini-graficos SVG desenhados para cada tipo, acompanhados de uma dica de uso.

| Tipo | Icone | Dica |
|------|-------|------|
| Barras | Retangulos verticais de alturas variadas | Comparar categorias |
| Linha | Poliline com pontos | Tendencia temporal |
| Area | Poliline preenchida | Volume ao longo do tempo |
| Pizza | Fatias de circulo | Partes de um todo |
| Metrica | Card com bloco central | Valor unico (KPI) |
| Tabela | Grid de linhas e colunas | Dados brutos |

---

### 11.4 Logica automatica entre Calculo e Tipo de grafico

Foram adicionadas duas funcoes auxiliares (`handleChartTypeChange` e `handleAggregationChange`) que sincronizam automaticamente os campos relacionados:

| Acao do usuario | Efeito automatico |
|-----------------|-------------------|
| Selecionar "Sem agregacao (tabela raw)" | Troca chartType para `table` |
| Selecionar chartType `table` | Troca aggregation para `none` |
| Selecionar chartType `metric` | Limpa o campo "Eixo ou categoria" |
| Selecionar aggregation != `none` com chartType `table` | Troca chartType para `bar` |

---

### 11.5 Explorador de tabelas — abas Colunas / Preview

O painel central do editor (Explorador) foi redesenhado para resolver o problema de espaco:

**Antes:** lista de colunas e preview de dados lado a lado — ambos estreitos e de dificil leitura.

**Agora:**

- **Strip de stats compacto** no topo: Rows / Colunas / Foco em tres blocos horizontais pequenos
- **Abas `Colunas` e `Preview`** — cada aba ocupa toda a largura do painel
- **Aba Colunas:** lista compacta com uma linha por coluna (label + nome mono + badges de tipo), sem cards altos
  - Badge verde `num` para colunas numericas
  - Badge cinza com o tipo SQL bruto (`bigint`, `varchar`, etc.)
  - Hover sutil por linha para facilitar leitura
- **Aba Preview:** tabela com largura total, linhas zebradas, bordas verticais entre colunas e header com label semantica + nome tecnico

---

### 11.6 Arquivos alterados

| Arquivo | Tipo de alteracao |
|---------|-------------------|
| `src/components/datalake/ColumnPicker.tsx` | **Novo componente** |
---

## 12. Motor de Correlacao NOC-WPP (07/05/2026)

### Contexto

Para reduzir o ruido operacional, o HUB agora correlaciona falhas tecnicas detectadas pelo Zabbix com o impacto real percebido pelos clientes no WhatsApp. Isso permite que o NOC priorize incidentes que estao gerando reclamacoes ativas.

### Componentes

- **Engine:** `src/modules/monitoring/application/correlation-engine.ts`
- **Endpoint:** `GET /api/monitoring/correlation`
- **UI:** `/monitoring/noc` (Painel NOC 360)

### Logica de Correlacao

A engine realiza um cruzamento em tres camadas:

1. **Janela Temporal:** Busca mensagens negativas/urgentes no WhatsApp em uma janela de +/- 60 minutos em relacao ao alarme do Zabbix.
2. **Match de Texto (Keywords):** Extrai nomes de hosts, cidades e bairros do alarme do Zabbix e busca esses termos nas mensagens de clientes.
3. **Impact Score:** Calcula uma pontuacao de 0 a 100 baseada no volume de mensagens relacionadas e na gravidade do sentimento detectado pela IA.

---

## 13. Assistente Inteligente de Dashboard (07/05/2026)

### Contexto

O Assistente Inteligente permite que usuarios nao-tecnicos construam widgets complexos usando linguagem natural, eliminando a necessidade de conhecer nomes de tabelas ou tipos de agregacao SQL.

### Fluxo de Trabalho

1. **Pedido do Usuario:** *"Quero ver o faturamento de Campinas acima de 1000 reais"*
2. **Identificacao de Tabela:** A IA identifica que a tabela `fato_faturamento` e a mais relevante.
3. **Analise de Schema:** O assistente consulta as colunas reais da tabela (ex: `valor`, `cidade`, `status`).
4. **Geracao de Widget:** A IA configura automaticamente:
   - Filtro 1: `cidade = Campinas`
   - Filtro 2: `valor >= 1000`
   - Agregacao: `SUM(valor)`
   - Tipo: `BarChart` ou `Metric`
5. **Aplicacao:** O usuario clica em "Adicionar ao Dashboard" e o widget e criado instantaneamente.

### Backend

- **Modulo:** `src/modules/datalake/application/smart-assistant.ts`
- **API:** `/api/datalake/smart-assistant`
