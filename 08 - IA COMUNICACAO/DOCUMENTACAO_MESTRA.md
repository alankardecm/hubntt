# Documentacao Mestra - IA Comunicacao

## 1. Visao geral

O modulo IA Comunicacao faz leitura e analise de:

- mensagens de grupos internos do WhatsApp Business da empresa
- conversas com termos criticos
- sentimento das interacoes
- palavras-chave recorrentes
- reunioes com transcricao e resumo, em fase futura

O objetivo nao e responder mensagens. O objetivo e analisar e gerar inteligencia operacional.

## 2. O que o modulo resolve

- reduzir leitura manual de grupos
- destacar sinais de pressao, urgencia e incidente
- monitorar palavras criticas
- centralizar eventos de comunicacao em uma dashboard
- criar base para reunioes estilo Fireflies no futuro

## 3. Escopo atual

### 3.1 WhatsApp IA

- captura de mensagens de grupos internos
- filtro por grupos autorizados
- sentimento por mensagem com Groq e fallback local
- extracao de palavras-chave
- classificacao de urgencia
- resumo curto da mensagem
- consolidacao diaria em lote por grupo
- exportacao por grupo para download em CSV ou JSON
- persistencia no Supabase
- dashboard no hub
- whitelist centralizada para grupos permitidos

### 3.2 RAG operacional do hub

O RAG do hub agora faz consulta dupla:

- Pinecone para manuais, procedimentos e imagens
- Zabbix para alarmes, hosts, eventos e status operacional de clientes

O comportamento esperado e:

- perguntas de manual continuam indo para o Pinecone
- perguntas sobre cliente, alarme, status, queda e PPPoE consultam o Zabbix em paralelo
- quando houver `imageUrl` no Pinecone, a interface de fontes mostra a imagem junto do texto
- o chat deve usar as duas bases sem uma anular a outra

### 3.3 Reunioes

Ainda em base documental e arquitetural. O fluxo futuro deve suportar:

- upload de audio
- transcricao
- resumo
- decisoes
- tarefas
- indexacao

## 4. Stack e tecnologias

### Hub

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Supabase client/server

### Persistencia

- Supabase PostgreSQL
- tabelas do modulo `wa_*`

### IA

- Groq para classificacao de sentimento e resumo diario
- OpenAI para embeddings do RAG do hub
- OpenAI para resposta final do chat operacional
- heuristicas locais para fallback e regras operacionais

### Vetores

- Pinecone para o RAG do hub
- nao faz parte da persistencia principal deste modulo

### Operacao viva

- Zabbix como fonte viva de alarmes e eventos
- Pinecone como fonte oficial de manuais e imagens
- o chat deve combinar as duas fontes quando a pergunta misturar procedimento e situacao operacional

### Captura do WhatsApp

- Baileys, usando WhatsApp Web como ponte operacional
- leitura somente de grupos internos autorizados
- nome real do grupo obtido por metadata do WhatsApp

### Ferramentas de apoio

- PowerShell
- Node.js
- Chrome/WhatsApp Business
- SQL Editor do Supabase

## 5. Apps e servicos utilizados

### Em uso direto

- WhatsApp Business da empresa
- Supabase do ambiente atual
- Hub Netturbo em Next.js
- Pinecone no RAG

### Em apoio local

- PowerShell para executar o hub e o bridge
- navegador Chrome/Edge para abrir o hub
- QR code do WhatsApp Business para conectar a ponte

## 6. Arquitetura

```text
Grupo interno do WhatsApp
        ->
Bridge Baileys
        ->
API /api/wa-monitor/inbound
        ->
Supabase
        ->
Analise e agregacao
        ->
Dashboard /dashboard/comunicacao
```

### Fluxo atual do hub com RAG e Zabbix

```text
Pergunta do colaborador
        ->
buildRagContext (Pinecone + imagens)
        ->
buildZabbixContext (alarmes + eventos + hosts)
        ->
chat operacional
        ->
resposta executiva com fontes e evidencias
```

## 7. Como funciona na pratica

1. o WhatsApp Business da empresa entra nos grupos internos
2. o bridge autentica a sessao via QR
3. o bridge captura mensagens de grupos e resolve o nome real da conversa
4. o bridge envia o evento bruto para o hub
5. o hub salva em Supabase
6. o hub executa analise heuristica
7. a dashboard exibe os resultados

Estado operacional real:

- o bridge conecta e autentica normalmente
- o endpoint `/api/wa-monitor/groups` serve como base para as ancora do historico
- a ponte tenta buscar o historico de hoje dos grupos permitidos
- o replay do WhatsApp ainda nao esta confiavel o suficiente para completar o dia inteiro
- mesmo com `messaging-history.set`, o resultado pode vir vazio, parcial ou com falha de decriptacao
- quando isso acontece, o backfill nao fecha e a captura segue apenas em modo ao vivo

Conclusao pratica:

o modulo ainda nao pode ser considerado fechado para historico do dia. O comportamento correto esperado continua sendo: receber o replay de hoje, persistir as mensagens no hub e marcar o grupo como coberto. Neste momento, esse fluxo ainda precisa de ajuste.

## 8. Fluxo de dados

### Entrada

- `group_jid`
- `group_name`
- `sender_jid`
- `sender_name`
- `message_text`
- `msg_timestamp`
- `message_id`
- `message_type`
- `bridge_name`

### Processamento

- normalizacao de texto
- deteccao de sentimento
- extracao de keywords
- classificacao de topico
- classificacao de urgencia
- geracao de resumo curto
- consolidacao diaria por grupo

### Saida

- registro em `wa_messages`
- registro em `wa_analysis`
- agregacao em `wa_daily_insights`
- arquivo exportavel por grupo
- dashboard em `/dashboard/comunicacao`

## 9. Estrutura de pastas

```text
08 - IA COMUNICACAO/
|-- README.md
|-- DOCUMENTACAO_TECNICA.md
|-- DOCUMENTACAO_MESTRA.md
|-- PONTO_RECUPERACAO.md
|-- CHANGELOG.md
|-- docs/
|   |-- arquitetura_hub.md
|   |-- dashboard_inicial.md
|   |-- execucao_passo_a_passo.md
|   |-- fluxo_de_ingestao.md
|   |-- implementacao.md
|   |-- modelo_de_dados.md
|-- bridge/
|   |-- index.js
|   |-- package.json
|   |-- README.md
|   |-- .env
|   |-- config/groups.whitelist.js
|-- supabase-schema-wa-comunicacao.sql
```

## 10. Rotas do hub

- `/` home do hub
- `/dashboard` workspace
- `/dashboard/comunicacao` dashboard do modulo
- `/dashboard/funter` dashboard FUNTER
- `/rag` portal RAG
- `/datalake` visao do DataLake
- `/monitoring/zabbix` monitoramento Zabbix
- `/api/chat` chat operacional que combina Pinecone e Zabbix
- `/api/wa-monitor/inbound` entrada do bridge
- `/api/wa-monitor/groups` grupos monitorados
- `/api/wa-monitor/events` eventos recentes
- `/api/wa-monitor/insights` agregacao do modulo
- `/api/wa-monitor/daily-insights/generate` consolidacao diaria em lote
- `/api/wa-monitor/export` download por grupo

## 11. Banco de dados

O schema do modulo cria:

- `wa_groups`
- `wa_messages`
- `wa_analysis`
- `wa_daily_insights`
- `wa_keywords_config`

Atualizacao da consolidacao diaria:

- `sentiment_label` em `wa_daily_insights`
- `primary_keyword` em `wa_daily_insights`
- `urgency_label` em `wa_daily_insights`
- `summary_model_used` em `wa_daily_insights`

### Papel de cada tabela

- `wa_groups`: grupos autorizados
- `wa_messages`: mensagens capturadas
- `wa_analysis`: analise por mensagem
- `wa_daily_insights`: consolidacao diaria
- `wa_keywords_config`: palavras configuraveis para alerta
- `wa_daily_insights.sentiment_label`: sentimento consolidado do grupo
- `wa_daily_insights.primary_keyword`: palavra-chave principal do periodo
- `wa_daily_insights.urgency_label`: urgencia consolidada
- `wa_daily_insights.summary_model_used`: modelo usado no resumo

## 12. Configuracao local

### Hub `.env.local`

Campos esperados:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL` opcional
- `WHATSAPP_CAPTURE_TOKEN`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `GOOGLE_API_KEY`
- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`
- `ZABBIX_AUTH_MODE` opcional
- `ZABBIX_ALLOWED_GROUPS` opcional

### Como consultar o Zabbix via chat

Use perguntas como:

- `O cliente LAVANDERIA tem alarmes ativos no momento?`
- `O cliente LAVANDERIA teve alarmes nas ultimas 24 horas?`
- `Qual o status do host AC-BR-VIN-ACT-CE-04?`
- `Mostre os eventos criticos do cliente LAVANDERIA`

### Como consultar manual com imagens

Use perguntas como:

- `Como configurar a ATA Grandstream HT818 de 8 portas?`
- `Quais sao os passos para o acesso inicial?`
- `Qual o perfil SIP correto para esse equipamento?`

Quando houver imagem no Pinecone, a tela de fontes do RAG deve exibir a imagem junto da referencia correspondente.

### Prompts Groq

- sentimento por mensagem em `docs/prompts_groq.md`
- resumo diario por grupo em `docs/prompts_groq.md`

### Bridge `.env`

Campos esperados:

- `HUB_API_URL=http://localhost:4000`
- `WHATSAPP_CAPTURE_TOKEN`
- `BRIDGE_NAME=wa-intelligence-bridge`
- `MONITOR_ALL_GROUPS=true|false`
- `WA_RESET_SESSION=true|false`
- `ALLOWED_GROUPS`
- `EXCLUDED_GROUPS`

## 13. Como usar

### Passo 1

Preencher os `.env`.

### Passo 2

Aplicar o schema no Supabase pelo SQL Editor.

### Passo 3

Decidir se o monitoramento vai ser:

- todos os grupos autorizados
- lista branca de grupos

### Passo 4

Subir o hub:

```powershell
npm run dev
```

### Passo 5

Subir o bridge:

```powershell
npm run wa-bridge
```

### Passo 6

Escanear o QR no WhatsApp Business.

### Passo 7

Mandar mensagem de teste no grupo permitido.

### Passo 8

Acessar:

- `http://localhost:4000/dashboard/comunicacao`

## 14. Estado atual do RAG do hub

Apesar de esta pasta documentar o modulo `IA Comunicacao`, ela ficou como ponto de apoio para o hub inteiro e, na pratica, tambem guarda o contexto do RAG do projeto.

### O que foi observado em 2026-03-30

- o RAG do hub ainda consulta o Pinecone corretamente
- a lateral de fontes mostra matches de imagem em algumas consultas
- em outras consultas o preview visual nao aparece, mesmo com `matches com imagem`
- o caso do `ZTE F612` mostrou contaminacao de contexto entre perguntas diferentes quando a conversa nao e separada corretamente
- o botao `Limpar sessao` foi ajustado para iniciar uma nova conversa, mas a consistencia visual dos previews ainda precisa ser validada

### Diagnostico de hoje

- nao parece ser erro puro de ingestao
- o problema mais provavel esta na combinacao de:
  - recuperacao de contexto
  - extracoes de URL de imagem
  - ordem dos matches retornados pelo Pinecone
  - persistencia de contexto entre conversas diferentes

### Pendencia para retomada

Na proxima sessao, revisar:

- se o match de imagem esta vindo com URL real ou apenas texto de markdown
- se a lateral esta renderizando `imageUrl` corretamente
- se o ZTE F612 continua sofrendo interferencia do assunto anterior
- se o `Limpar sessao` esta separando completamente uma consulta da outra sem perder contexto da conversa atual

### Automacao diaria

Quando quiser consolidar o dia sem usar o endpoint manualmente:

- `npm run wa-daily-summary -- --date=YYYY-MM-DD`

Para agendar no Windows:

- `powershell.exe -ExecutionPolicy Bypass -File scripts/register-wa-daily-summary-task.ps1`

## 14. Apresentacao executiva

Se quiser mostrar o projeto para diretoria sem entrar no detalhe tecnico, use:

- [Apresentacao Diretoria](APRESENTACAO_DIRETORIA.md)

Esse documento resume:

- objetivo do hub
- o que ja esta funcionando
- valor de negocio
- status atual
- proximos passos

## 15. Como escolher os grupos

Hoje existem dois modos:

### Modo aberto

- `MONITOR_ALL_GROUPS=true`
- `ALLOWED_GROUPS` vazio
- captura todos os grupos em que o numero estiver presente

### Modo controlado

- `MONITOR_ALL_GROUPS=false`
- preencher `ALLOWED_GROUPS`
- usar `EXCLUDED_GROUPS` para bloqueios permanentes

Recomendacao:

- comecar em modo controlado
- testar em 1 grupo primeiro
- expandir depois

## 16. Como a analise funciona

### Sentimento

O modulo usa uma heuristica local para classificar:

- positive
- neutral
- negative

### Keywords

Alguns termos observados:

- urgente
- erro
- queda
- prazo
- cliente
- pendencia
- sinal
- fibra

### Urgencia

Sinais de urgencia:

- palavras criticas
- sentimento muito negativo
- combinacao de termos tecnicos e operacionais

## 16. Dashboard

A dashboard `/dashboard/comunicacao` mostra:

- total de mensagens
- sentimento medio
- alertas ativos
- grupos monitorados
- distribuicao geral de sentimento
- mapa de palavras recorrentes
- resumo diario por grupo
- base futura para audio e transcricao
- lista de grupos permitidos
- status de cada grupo permitido
- resumo diario persistido quando existir
- botao para baixar CSV por grupo ativo

### Estrutura oficial da tela

1. grupos monitorados
2. mapa total de palavras
3. sentimento geral
4. resumo diario por grupo
5. base futura para transcricao de audio

## 17. Exportacao e download

O modulo agora tambem deve servir como ponto de exportacao por grupo para auditoria, repasse gerencial e analise externa ao hub.

### O que o download precisa trazer

- mensagens do grupo no periodo
- sentimento por mensagem
- palavras mais usadas no grupo
- resumo diario das conversas quando existir

### Formatos

- `CSV` para abrir em Excel
- `JSON` para integracao tecnica

### Rota

- `GET /api/wa-monitor/export`

### Parametros

- `group_id` ou `group_name`
- `days`
- `date_from`
- `date_to`
- `format=csv|json`

### Conteudo exportado

- identificacao do grupo
- periodo consultado
- total de mensagens
- distribuicao de sentimento
- top keywords
- lista de mensagens com analise
- consolidacao diaria de `wa_daily_insights`

### Exemplos

- `/api/wa-monitor/export?group_name=relacionamento%20nt&days=7&format=csv`
- `/api/wa-monitor/export?group_name=relacionamento%20nt&date_from=2026-03-01&date_to=2026-03-31&format=json`

## 18. Ponte de captura

O bridge:

- usa Baileys
- conecta com QR
- lee mensagens de grupos
- envia o payload para o hub
- nao responde mensagens

### Regras

- o `WHATSAPP_CAPTURE_TOKEN` precisa ser igual no hub e no bridge
- o `message_id` evita duplicidade
- o `bridge_name` ajuda na auditoria
- `WA_RESET_SESSION=true` deve ser usado so na primeira conexao limpa
- `WA_SYNC_FULL_HISTORY=true` faz o bridge tentar recuperar o historico sincronizado de hoje ao subir
- a consolidacao diaria usa Groq para redacao e interpretacao do periodo

## 19. Deploy

Antes de subir:

- confirmar build local
- conferir envs
- aplicar schema no banco
- testar captura
- revisar grupos autorizados

O build do hub precisa fechar sem erro.

## 20. Checklist de validacao

- hub abre em `http://localhost:4000`
- `GET /dashboard/comunicacao` responde
- bridge conecta no WhatsApp Business
- QR e autenticacao funcionam
- mensagem de teste gera registro
- Supabase recebe dados
- dashboard mostra o evento

## 21. Problemas comuns

### QR reaparecendo

Possivel causa:

- `WA_RESET_SESSION=true`
- sessao antiga invalidada
- conflito de credencial

### Mensagem nao entra no hub

Possivel causa:

- token diferente entre hub e bridge
- grupo fora da whitelist
- bridge nao reiniciado apos alterar `.env`

### Dashboard vazia

Possivel causa:

- ainda nao existe mensagem nova no banco
- o grupo nao esta sendo capturado
- o Supabase nao recebeu o schema

## 22. Recuperacao

Se o projeto precisar ser retomado, a referencia principal e:

- `PONTO_RECUPERACAO.md`

Se precisar entender o detalhe tecnico, use:

- `DOCUMENTACAO_TECNICA.md`

Se precisar rodar passo a passo, use:

- `docs/execucao_passo_a_passo.md`

## 23. Regra de manutencao

Toda funcionalidade nova precisa atualizar:

- README
- documentacao tecnica
- documentacao mestra
- ponto de recuperacao
- changelog
