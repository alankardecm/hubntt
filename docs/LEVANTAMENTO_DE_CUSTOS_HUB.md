# Levantamento de Custos do HUB

Este documento organiza o levantamento de custos do HUB NETTURBO de forma que qualquer pessoa do time consiga entender:

- quais servicos externos o HUB usa hoje
- por que cada servico existe
- onde ele aparece no codigo
- como o custo nasce
- o que tende a ser custo fixo
- o que tende a ser custo variavel
- o que ainda depende de validacao com a operacao

Data de referencia deste levantamento: `13/04/2026`.

Importante: precos de APIs mudam com o tempo. Este documento usa fontes oficiais consultadas nesta data e deve ser revisado periodicamente.

## 1. Resumo executivo

Hoje o HUB usa uma combinacao de:

- `OpenAI`
- `Groq`
- `Google Gemini API`
- `Pinecone`
- `Supabase`
- `Microsoft Graph / Outlook`
- `Zabbix`
- `MySQL / Data Lake interno`
- `bridge de WhatsApp`

Nem tudo isso gera custo de API da mesma forma.

Na pratica, os maiores centros de custo provaveis sao:

1. `Supabase`, quando houver varios projetos, mais compute, storage ou funcoes
2. `Pinecone`, quando o RAG tiver mais busca e mais base vetorial
3. `OpenAI` e `Groq`, quando a camada de IA aumentar em volume
4. `Google Gemini embeddings`, quando houver mais indexacao e reindexacao do RAG

`Zabbix` nao aparece como licenca paga no desenho atual. O custo dele tende a ser de infraestrutura e operacao.

`Outlook / Microsoft Graph` normalmente nao entra como uma API cobrada por token como OpenAI ou Pinecone. O custo principal costuma estar nas licencas Microsoft 365 e em limites operacionais do tenant.

## 2. Como ler este documento

Para cada servico, este documento responde quatro perguntas:

1. `Por que existe`
2. `Onde aparece no HUB`
3. `Como o custo nasce`
4. `Como estimar`

No final existe uma secao com:

- checklist de validacao financeira real
- modelo de formula para estimativa mensal
- proximos passos para governanca de custos

## 3. Inventario de servicos usados pelo HUB

## 3A. Tabela rapida: qual API atende qual servico

Esta tabela foi montada para responder de forma direta:

- qual servico do HUB usa qual API
- para que ela esta sendo usada
- se a cobranca e por token, por uso, por plano ou por infra
- qual e uma estimativa comercial razoavel de custo com base nas consultas tipicas que o HUB faz hoje

Importante: a coluna de estimativa abaixo nao e faturamento real.

Ela e uma referencia operacional para ajudar a empresa a pensar:

- o que hoje e pago
- o que pode ficar caro
- o que ainda cabe em uso leve
- o que precisa de monitoramento mais serio

### Premissas usadas para as estimativas

As estimativas abaixo usam consultas tipicas do proprio HUB.

As faixas consideradas foram:

- `analise curta de mensagem`: `350` tokens de entrada e `40` tokens de saida
- `consulta tipica de assistente/chat`: `2.500` tokens de entrada e `700` tokens de saida
- `resumo diario ou resumo consolidado`: `4.000` tokens de entrada e `500` tokens de saida
- `consulta de embedding de pergunta no RAG`: `120` tokens de entrada
- `narracao curta TTS`: `900` tokens de entrada

Para facilitar decisao comercial, eu considerei tambem uma leitura de escala:

- `1.000 operacoes` do mesmo tipo

Isso ajuda a enxergar se o custo e irrelevante, moderado ou se precisa virar KPI financeiro.

| Servico do HUB | API / Tecnologia | Funcao no HUB | Onde aparece | Tipo de cobranca | Estimativa comercial de uso |
| --- | --- | --- | --- | --- | --- |
| RAG | Google Gemini Embeddings | Gera vetor da pergunta e de textos para busca semantica | [src/lib/rag.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/rag.ts:393>) | Por token processado | Uma consulta curta de embedding com `120` tokens custa cerca de `US$ 0.000024` usando `US$ 0.20 / 1M`. Em `1.000` consultas, cerca de `US$ 0.024`. |
| RAG | Pinecone | Busca vetorial e retorno de contexto | [src/lib/rag.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/rag.ts:400>) | Plano + reads + writes + storage | Em uso comercial, o custo nao nasce por prompt e sim por base vetorial e consultas. O gratis atende teste. Em producao, trate como custo estrutural do RAG. O `Standard` comeca em `US$ 50 / mes`. |
| Chat / Assistente | Groq `llama-3.3-70b-versatile` | Motor principal de resposta do assistente | [src/modules/chat/application/assistant-response.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/chat/application/assistant-response.ts:68>) | Por token | Uma consulta tipica com `2.500` tokens de entrada e `700` de saida custa cerca de `US$ 0.00203` usando `US$ 0.59 / 1M` entrada e `US$ 0.79 / 1M` saida. Em `1.000` consultas, cerca de `US$ 2.03`. |
| Chat / Assistente | OpenAI `gpt-4o-mini` | Fallback do chat quando Groq falha ou nao responde | [src/modules/chat/application/assistant-response.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/chat/application/assistant-response.ts:86>) | Por token | Uma consulta tipica com `2.500` tokens de entrada e `700` de saida custa cerca de `US$ 0.000795`. Em `1.000` consultas, cerca de `US$ 0.80`. Isso e baixo por chamada, mas cresce com volume. |
| IA Comunicacao | Groq `llama-3.1-70b-versatile` ou `llama-3.3-70b-versatile` | Sentimento, resumo diario e resumo consolidado | [src/lib/ai.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/ai.ts:114>) | Por token | Para `analise curta`, usando a mesma referencia de `US$ 0.59 / 1M` entrada e `US$ 0.79 / 1M` saida, cada mensagem sai por cerca de `US$ 0.000238`. Em `1.000` mensagens analisadas, cerca de `US$ 0.24`. Para `resumo consolidado` com `4.000` entrada e `500` saida, cerca de `US$ 0.002755` por resumo. |
| IA Comunicacao | OpenAI `gpt-4o-mini` | Apoio ou fallback em fluxos de IA do modulo | [src/lib/ai.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/ai.ts:17>) | Por token | Para `analise curta`, cada mensagem fica perto de `US$ 0.0000765`. Em `1.000` mensagens, cerca de `US$ 0.08`. Para `resumo consolidado`, cerca de `US$ 0.0009` por resumo. |
| Audio | OpenAI `gpt-4o-mini-tts` | Gera narracao de resumo em audio | [src/lib/tts.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/tts.ts:3>) | Por token de entrada e token de audio | Uma narracao curta com `900` tokens de entrada gera custo de entrada muito baixo, cerca de `US$ 0.00054`. O peso comercial esta no audio gerado. Como o preco oficial do audio e `US$ 12 / 1M`, esse item deve ser monitorado se a narracao virar recurso recorrente do NOC. |
| Outlook corporativo | Microsoft Graph API | Leitura e sincronizacao de emails do usuario | [src/lib/outlook.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/outlook.ts:39>) | Licenca Microsoft + quotas do tenant | Nao trate como custo por token. O custo comercial aqui e de licenca Microsoft 365, governanca e uso do tenant. Para o HUB, a pergunta certa nao e "quanto custa por email", e sim "qual licenca sustenta esse uso e quantas caixas vao operar". |
| Base do HUB | Supabase | Banco, persistencia, consultas, omnichannel e dashboards | [src/lib/supabase.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/supabase.ts:1>) | Plano + compute + storage + funcoes | Nao e custo por prompt. Comercialmente, trate como custo base da operacao. O `Free` atende validacao. Para producao, a referencia segura comeca no `Pro`, `US$ 25 / mes`, mais compute e excedentes. |
| Monitoramento | Zabbix API | Alarmes, eventos e contexto operacional | [src/lib/zabbix.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/zabbix.ts:139>) | Infra interna | O software em si e gratuito. O custo comercial esta em servidor, banco, retention, equipe e suporte. O gratis atende muito bem como software, mas nao elimina o custo da operacao. |
| Data Lake | MySQL interno | Fonte operacional para dashboards e consolidacao | [docs/DATALAKE_MYSQL.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/DATALAKE_MYSQL.md>) | Infra interna | Nao e custo por token. O custo comercial aqui e de infraestrutura, administracao e manutencao. |
| WhatsApp | Bridge proprio | Captura grupos e mensagens para o HUB | [src/lib/waGroups.js](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/waGroups.js:1>) | Infra interna | O custo nao apareceu como API paga no codigo. Comercialmente, trate como custo de maquina, manutencao, suporte e risco operacional. |

### Leitura comercial rapida da tabela

Se a pergunta for `o que hoje custa por consulta`, a resposta e:

- `Groq`
- `OpenAI`
- `Gemini embeddings`

Se a pergunta for `o que hoje custa por estrutura e operacao`, a resposta e:

- `Pinecone`
- `Supabase`
- `Microsoft 365`
- `Zabbix`
- `Data Lake`
- `bridge de WhatsApp`

Se a pergunta for `o que pode continuar no gratis por um tempo`, a resposta mais realista e:

- `Zabbix` como software
- `Supabase Free` para validacao
- `Pinecone Starter` para RAG pequeno
- `Groq Free` para teste e uso leve
- parte do `Gemini` em volume pequeno

Se a pergunta for `o que eu ja deveria tratar como custo comercial`, a resposta e:

- `OpenAI`
- `Pinecone` em producao
- `Supabase` em producao
- `Microsoft 365 / Outlook`
- toda a infraestrutura interna que sustenta o ambiente

### 3.1 OpenAI

#### Por que existe

O HUB usa OpenAI para partes da camada de IA generativa e de voz.

Hoje a plataforma usa OpenAI principalmente para:

- fallback ou uso direto de chat
- embeddings em partes do projeto
- sugestoes de dashboards
- TTS server-side

#### Onde aparece no codigo

- [src/lib/ai.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/ai.ts:8>)
- [src/infrastructure/ai/chat-clients.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/infrastructure/ai/chat-clients.ts:4>)
- [src/lib/tts.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/tts.ts:3>)
- [src/modules/datalake/application/dashboard-suggestions.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/datalake/application/dashboard-suggestions.ts:37>)

#### Modelos encontrados no projeto

- `gpt-4o-mini`
- `gpt-4o-mini-tts`
- referencia a embeddings OpenAI

#### Como o custo nasce

O custo da OpenAI nasce por consumo.

As frentes que mais pesam sao:

- tokens de entrada
- tokens de saida
- uso de modelos de audio
- uso de embeddings, se esse fluxo estiver ativo em producao

#### Preco oficial consultado

- `gpt-4o`: `US$ 2.50 / 1M` tokens de entrada e `US$ 10.00 / 1M` tokens de saida
- `gpt-4o-mini`: `US$ 0.15 / 1M` tokens de entrada e `US$ 0.60 / 1M` tokens de saida
- `gpt-4o-mini-tts`: `US$ 0.60 / 1M` tokens de entrada e `US$ 12.00 / 1M` tokens de audio de saida

#### Fontes oficiais

- https://openai.com/api/pricing/
- https://platform.openai.com/docs/pricing

#### Formula pratica

```text
Custo OpenAI = (tokens_entrada / 1.000.000 * preco_entrada)
             + (tokens_saida / 1.000.000 * preco_saida)
             + (tokens_audio / 1.000.000 * preco_audio)
```

#### Observacao importante

Se o HUB estiver usando `Groq` como primario em algumas rotas e `OpenAI` como fallback, o custo da OpenAI pode ficar baixo no inicio e crescer apenas nos casos em que Groq falhar ou em fluxos especificos como TTS.

### 3.2 Groq

#### Por que existe

O HUB usa Groq para resumir, classificar sentimento e responder em partes da experiencia conversacional.

#### Onde aparece no codigo

- [src/lib/ai.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/ai.ts:15>)
- [src/infrastructure/ai/chat-clients.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/infrastructure/ai/chat-clients.ts:7>)
- [src/modules/chat/application/assistant-response.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/chat/application/assistant-response.ts:68>)
- [src/modules/communication/application/daily-summary.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/communication/application/daily-summary.ts:35>)
- [src/modules/communication/application/message-analysis.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/communication/application/message-analysis.ts:14>)

#### Modelos encontrados no projeto

- `llama-3.1-70b-versatile`
- `llama-3.3-70b-versatile`

#### Como o custo nasce

O custo da Groq tambem nasce por uso de tokens, semelhante a provedores compativeis com API estilo OpenAI.

As frentes mais provaveis aqui sao:

- resumo diario
- resumo consolidado de conversas
- classificacao de sentimento
- respostas da camada de assistente

#### Preco oficial consultado

Os precos da Groq variam por modelo. A referencia deve sempre ser validada na pagina oficial do modelo ativo na conta.

Exemplo de valor oficial consultado na documentacao:

- `llama-3.1-8b-instant`: `US$ 0.05 / 1M` tokens de entrada e `US$ 0.08 / 1M` tokens de saida

#### Fontes oficiais

- https://console.groq.com/docs/models
- https://console.groq.com/docs/billing-faqs
- https://console.groq.com/docs/spend-limits

#### Formula pratica

```text
Custo Groq = (tokens_entrada / 1.000.000 * preco_entrada_modelo)
           + (tokens_saida / 1.000.000 * preco_saida_modelo)
```

#### Observacao importante

Como o projeto usa nomes de modelos diferentes dos exemplos mais baratos, a conta real deve ser validada diretamente no painel Groq antes de fechar qualquer previsao de gasto.

### 3.3 Google Gemini API

#### Por que existe

O Google Gemini aparece hoje na camada de embeddings do RAG.

#### Onde aparece no codigo

- [src/lib/rag.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/rag.ts:393>)

#### Modelo encontrado no projeto

- `models/gemini-embedding-2-preview`

#### Como o custo nasce

O custo nasce quando o sistema gera vetores.

Isso pode ocorrer em duas situacoes:

- indexacao de base
- consultas que geram embedding da pergunta

#### Preco oficial consultado

- `gemini-embedding-2-preview`: `US$ 0.20 / 1M` tokens
- `gemini-embedding-001`: `US$ 0.15 / 1M` tokens

#### Fonte oficial

- https://ai.google.dev/gemini-api/docs/pricing

#### Formula pratica

```text
Custo Gemini Embeddings = (tokens_processados / 1.000.000 * preco_embedding)
```

#### Observacao importante

Se o RAG estiver sendo consultado varias vezes por dia, o custo de embeddings pode aparecer tanto na indexacao quanto nas consultas, dependendo de como o fluxo estiver sendo executado.

### 3.4 Pinecone

#### Por que existe

Pinecone e a base vetorial do RAG.

#### Onde aparece no codigo

- [src/lib/rag.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/rag.ts:400>)
- [src/app/rag/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/rag/page.tsx:131>)

#### Como o custo nasce

O custo da Pinecone normalmente nasce em tres pontos:

- armazenamento vetorial
- leituras
- escritas

#### Preco oficial consultado

Referencia oficial encontrada:

- `Starter`: gratuito
- `Standard`: minimo de `US$ 50 / mes`
- `Storage`: `US$ 0.33 / GB / mes`
- `Write units`: cerca de `US$ 4 a US$ 4.50 / 1M`
- `Read units`: cerca de `US$ 16 a US$ 18 / 1M`

#### Fonte oficial

- https://www.pinecone.io/pricing/

#### Formula pratica

```text
Custo Pinecone = custo_plano
               + (GB_armazenados * preco_storage)
               + (write_units / 1.000.000 * preco_write)
               + (read_units / 1.000.000 * preco_read)
```

#### Observacao importante

Se o RAG crescer muito, a Pinecone pode deixar de ser um custo pequeno e virar um dos principais itens do HUB.

### 3.5 Supabase

#### Por que existe

Supabase e a base operacional do HUB.

Ele aparece como:

- banco
- cliente publico
- cliente admin
- persistencia do modulo de comunicacao
- leitura das dashboards

#### Onde aparece no codigo

- [src/lib/supabase.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/supabase.ts:1>)
- [src/modules/communication/application/persist-inbound-communication.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/communication/application/persist-inbound-communication.ts:38>)
- [src/app/api/wa-monitor/groups/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/wa-monitor/groups/route.ts:54>)
- [src/app/api/communications/omnichannel/summary/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/communications/omnichannel/summary/route.ts:97>)
- [src/app/dashboard/noc/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboard/noc/page.tsx:13>)

#### Como o custo nasce

O custo do Supabase mistura parte fixa e parte variavel.

Os pontos principais sao:

- plano da organizacao
- compute por projeto
- storage
- funcoes
- realtime

#### Preco oficial consultado

Referencia oficial encontrada:

- `Pro`: `US$ 25 / mes` por organizacao
- exemplo oficial de `Micro Compute`: `744 horas = US$ 10`
- `Storage`: `US$ 0.021 / GB / mes`
- `Edge Functions`: `US$ 2 / 1M` invocacoes acima da franquia
- `Realtime`: `US$ 2.50 / 1M` mensagens acima da franquia

#### Fontes oficiais

- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/manage-your-usage/compute
- https://supabase.com/docs/guides/storage/pricing
- https://supabase.com/docs/guides/functions/pricing
- https://supabase.com/docs/guides/realtime/pricing

#### Formula pratica

```text
Custo Supabase = plano_base
               + soma_compute_projetos
               + (GB_storage * preco_storage)
               + (invocacoes_functions_excedentes / 1.000.000 * preco_functions)
               + (mensagens_realtime_excedentes / 1.000.000 * preco_realtime)
```

#### Observacao importante

Como o HUB usa bastante persistencia operacional, o Supabase tende a ser um custo estrutural do ambiente, nao apenas um custo eventual.

### 3.6 Microsoft Graph / Outlook

#### Por que existe

O modulo de comunicacao usa Microsoft Graph para conectar a caixa Outlook corporativa e trazer emails para o pipeline omnichannel.

#### Onde aparece no codigo

- [src/lib/outlook.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/outlook.ts:39>)
- [src/app/api/communications/outlook/messages/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/communications/outlook/messages/route.ts:1>)
- [src/app/api/communications/outlook/sync/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/communications/outlook/sync/route.ts:1>)

#### Como o custo nasce

Nesse caso, o custo nao se parece com OpenAI ou Pinecone.

Em geral, a leitura de emails via Graph depende de:

- licenca Microsoft 365 / Exchange do usuario
- limites e quotas do tenant
- eventuais recursos medidos do ecossistema Microsoft

#### Fonte oficial consultada

- https://learn.microsoft.com/en-us/graph/overview
- https://learn.microsoft.com/en-us/graph/throttling
- https://learn.microsoft.com/en-us/graph/usage-quotas

#### Observacao importante

Para o fluxo atual do HUB, o principal risco aqui nao e financeiro por chamada, e sim:

- licenciamento correto da conta
- aprovacao administrativa do app
- limites de uso

Por isso, esse item deve entrar no levantamento mais como `custo de licenca Microsoft e governanca`, nao como `API de IA paga por token`.

### 3.7 Zabbix

#### Por que existe

O HUB usa Zabbix para leitura de alarmes, problemas ativos e contexto operacional.

#### Onde aparece no codigo

- [src/lib/zabbix.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/zabbix.ts:139>)
- [src/app/api/zabbix/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/zabbix/route.ts:1>)
- [src/app/monitoring/zabbix/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/monitoring/zabbix/page.tsx:1>)

#### Como o custo nasce

No desenho atual, o Zabbix nao aparece como licenca paga do software.

O custo real costuma estar em:

- servidor
- banco
- armazenamento historico
- equipe
- suporte especializado, se houver contrato

#### Fonte oficial

- https://www.zabbix.com/br/true_open_source

#### Observacao importante

Para o HUB, o Zabbix deve ser tratado mais como custo de infraestrutura interna do que custo de API.

### 3.8 MySQL / Data Lake interno

#### Por que existe

O modulo Data Lake consolida fontes internas e apoia dashboards e analises.

#### Onde aparece no codigo

- [src/modules/datalake/application/dashboard-suggestions.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/datalake/application/dashboard-suggestions.ts:1>)
- documentacao operacional: [docs/DATALAKE_MYSQL.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/DATALAKE_MYSQL.md>)

#### Como o custo nasce

O custo aqui tende a ser interno:

- infraestrutura de banco
- administracao
- backup
- rede
- manutencao

Nao ha um preco publico unico de API porque esse custo depende de como a Netturbo hospeda esse ambiente.

### 3.9 Bridge de WhatsApp

#### Por que existe

O bridge conecta o numero, descobre grupos e envia mensagens para o HUB.

#### Onde aparece no projeto

- pasta operacional `08 - IA COMUNICACAO`
- [src/lib/waGroups.js](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/waGroups.js:1>)

#### Como o custo nasce

O custo aqui nao apareceu como uma API externa paga dentro do codigo.

Na pratica, os custos provaveis sao:

- maquina onde o bridge roda
- manutencao da sessao
- suporte operacional
- risco de indisponibilidade

Esse item deve entrar no levantamento como custo de operacao interna, nao como licenca confirmada de fornecedor externo.

## 4. O que hoje realmente pesa no orcamento

Se o HUB crescer no uso real, o comportamento mais provavel de custos e este:

### Custo fixo ou quase fixo

- `Supabase`
- infraestrutura do `Data Lake`
- infraestrutura do `Zabbix`
- infraestrutura do `bridge de WhatsApp`

### Custo variavel por uso

- `OpenAI`
- `Groq`
- `Google Gemini embeddings`
- `Pinecone`

### Custo misto

- `Microsoft 365 / Outlook`
  - existe licenca base
  - existe governanca
  - podem existir limites ou ampliacoes dependendo do tenant

## 5. Matriz rapida de centros de custo

| Servico | Tipo de custo | Direcionador principal |
| --- | --- | --- |
| OpenAI | Variavel | Tokens e audio |
| Groq | Variavel | Tokens |
| Gemini Embeddings | Variavel | Tokens processados |
| Pinecone | Misto | Storage, reads, writes |
| Supabase | Misto | Plano, compute, storage, funcoes |
| Microsoft Graph | Misto | Licenca Microsoft e quotas |
| Zabbix | Interno | Infra e operacao |
| Data Lake MySQL | Interno | Infra e administracao |
| Bridge WhatsApp | Interno | Execucao e manutencao |

## 6. O que ainda falta para fechar o custo real mensal

Este documento mostra o mapa tecnico e os precos oficiais de referencia.

Para transformar isso em `custo mensal real`, ainda faltam os dados operacionais da conta:

### 6.1 OpenAI

- qual modelo esta sendo usado em producao
- quantos tokens entram por mes
- quantos tokens saem por mes
- quanto TTS foi gerado no periodo

### 6.2 Groq

- qual modelo esta ativo na conta real
- tokens de entrada e saida por mes

### 6.3 Gemini + Pinecone

- quantos documentos foram indexados
- quanto storage vetorial existe hoje
- quantas consultas o RAG recebe por dia
- quantos reads e writes a Pinecone consome

### 6.4 Supabase

- qual plano esta contratado
- quantos projetos existem
- qual tamanho de compute por projeto
- quanto storage esta sendo usado
- se Edge Functions e Realtime ja passaram da franquia

### 6.5 Microsoft / Outlook

- qual licenca Microsoft 365 esta associada aos usuarios
- se existe custo incremental no tenant para esse uso

### 6.6 Custos internos

- servidor do bridge
- servidor do Zabbix
- servidor do Data Lake
- horas de manutencao

## 7. Modelo simples de estimativa mensal

Use este quadro como base para montar a conta mensal do HUB.

```text
Custo mensal estimado do HUB
= OpenAI
+ Groq
+ Gemini Embeddings
+ Pinecone
+ Supabase
+ Licencas Microsoft relacionadas
+ Infra interna Zabbix
+ Infra interna Data Lake
+ Infra interna WhatsApp bridge
```

## 8. Recomendacao de governanca

Para o HUB nao virar uma plataforma sem previsibilidade financeira, o ideal e criar quatro controles simples:

### 8.1 Controle por provedor

Ter um quadro mensal com:

- provedor
- plano
- custo fixo
- custo variavel
- limite
- dono interno

### 8.2 Controle por modulo

Separar custo por area do HUB:

- `RAG`
- `Chat e IA`
- `Comunicacao omnichannel`
- `Zabbix`
- `Dashboards / Data Lake`

### 8.3 Controle por ambiente

Separar:

- homologacao
- desenvolvimento
- producao

Isso evita somar custo tecnico de teste como se fosse custo operacional.

### 8.4 Alertas de gasto

Ativar, quando existir no fornecedor:

- spend cap
- billing alert
- alerta por uso de tokens
- alerta por storage

## 9. Leitura pratica para decisao

Se a pergunta for `onde o HUB pode ficar caro primeiro?`, a resposta mais honesta hoje e:

1. `Supabase`, porque e a base estrutural
2. `Pinecone`, se o RAG ganhar escala
3. `OpenAI` e `Groq`, se chat, resumo e audio crescerem
4. `Gemini embeddings`, se houver muita indexacao

Se a pergunta for `o que provavelmente nao e o susto principal de custo agora?`, a resposta e:

- `Zabbix` como software
- `Graph / Outlook` por chamada simples

## 10. Checklist para fechar o levantamento financeiro real

Antes de consolidar um numero final, validar:

- qual plano do `Supabase`
- qual plano e uso real da `Pinecone`
- qual gasto mensal da `OpenAI`
- qual gasto mensal da `Groq`
- qual projeto usa `Gemini embeddings` em producao
- qual licenca Microsoft esta sustentando o Outlook
- onde rodam `Zabbix`, `Data Lake` e `bridge`
- se existem ambientes paralelos duplicando custo

## 11. Referencias oficiais

- OpenAI Pricing: https://openai.com/api/pricing/
- OpenAI Platform Pricing Docs: https://platform.openai.com/docs/pricing
- Groq Models and Pricing: https://console.groq.com/docs/models
- Groq Billing FAQ: https://console.groq.com/docs/billing-faqs
- Google Gemini Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Pinecone Pricing: https://www.pinecone.io/pricing/
- Supabase Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Compute: https://supabase.com/docs/guides/platform/manage-your-usage/compute
- Supabase Storage: https://supabase.com/docs/guides/storage/pricing
- Supabase Functions: https://supabase.com/docs/guides/functions/pricing
- Supabase Realtime: https://supabase.com/docs/guides/realtime/pricing
- Microsoft Graph Overview: https://learn.microsoft.com/en-us/graph/overview
- Microsoft Graph Throttling: https://learn.microsoft.com/en-us/graph/throttling
- Microsoft Graph Usage Quotas: https://learn.microsoft.com/en-us/graph/usage-quotas
- Zabbix Open Source: https://www.zabbix.com/br/true_open_source

## 12. Conclusao

O HUB ja se comporta como uma plataforma com varios motores de custo, e nao como um unico sistema simples.

Hoje a forma correta de pensar custo nele e:

- `IA` custa por consumo
- `RAG` custa por embedding e vetor
- `base operacional` custa por infraestrutura
- `Outlook` custa mais por licenca e governanca do que por chamada isolada

Este documento e a base para a proxima etapa, que pode ser:

1. transformar isso em planilha de acompanhamento mensal
2. estimar cenario `baixo`, `medio` e `alto`
3. separar custo por modulo operacional do HUB
