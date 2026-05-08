# Changelog - Netturbo Hub

## 2026-05-08

### IA Comunicação e WhatsApp Bridge v2

- **Transcrição de Áudio Automatizada**:
  - Integração com **OpenAI Whisper** para transcrição de `audioMessage`.
  - Processamento em tempo real com buffer convertido para Base64.
- **IA Vision para NOC**:
  - Integração com **GPT-4o Vision** para análise de imagens recebidas em grupos.
  - Extração automática de logs, status de equipamentos e descrições de fotos enviadas por técnicos.
- **Configuração Dinâmica de Bridge**:
  - Novo endpoint `/api/wa-monitor/bridge/config` para gestão de whitelist/blacklist via banco de dados.
  - Atualização automática do bridge a cada 5 minutos, eliminando a necessidade de reinicialização manual ao adicionar novos grupos.
- **Resiliência e Mídia**:
  - Adicionado suporte a download de mídias pesadas com reautenticação automática via Baileys.
  - Implementação de fallback de texto para mídias não suportadas por transcrição/visão.

## 2026-05-07

### Dashboards e Data Lake

- **Assistente Inteligente (Smart Assistant)**:
  - Novo modulo de IA que mapeia linguagem natural para configuracoes reais de widgets.
  - Implementado em `src/modules/datalake/application/smart-assistant.ts`.
  - Integrado no editor de dashboards com campo de busca por objetivo.
- **Filtros Avançados**:
  - Suporte a múltiplos filtros (Filtro 1 e Filtro 2) por widget.
  - Inclusao de operadores matemáticos: `>`, `<`, `>=`, `<=`, `!=`.
  - Atualizacao do motor de query `/api/datalake/query` para processar a nova logica de filtros.
- **Correções de Build**:
  - Sincronizacao de tipos `FilterOperator` em todo o projeto.
  - Correcao de validacao Zod em `src/lib/env.ts` para variaveis numericas.
  - Ajuste de tipos em `src/app/api/health/full/route.ts`.

### Monitoramento e NOC

- **Motor de Correlação NOC-WPP**:
  - Nova funcionalidade que cruza alarmes técnicos do Zabbix com o sentimento social do WhatsApp.
  - Localizacao: `src/modules/monitoring/application/correlation-engine.ts`.
  - Calcula o **Impact Score** de incidentes baseando-se em proximidade temporal e palavras-chave (hosts vs. locais citados).
- **Painel NOC 360 Atualizado**:
  - Nova coluna de **Impacto em Clientes** integrada.
  - Exibicao dinâmica de mensagens de clientes vinculadas a falhas de infraestrutura em tempo real.
  - Novo endpoint `/api/monitoring/correlation`.

## 2026-04-11

### IA Comunicacao - Omnichannel e Outlook

- Adicionada rota generica `POST /api/communications/inbound` para ingestao omnichannel
- Criado servico compartilhado de persistencia e analise para multiplos canais
- `POST /api/wa-monitor/inbound` passou a reutilizar a nova base compartilhada
- Adicionado TTS server-side para o resumo consolidado em `POST /api/wa-monitor/group-brief/audio`
- Dashboard `/dashboard/comunicacao` atualizado para tentar audio premium no servidor com fallback local
- Adicionadas rotas base para Outlook corporativo:
  - `GET /api/communications/outlook/auth/start`
  - `GET /api/communications/outlook/auth/callback`
  - `GET /api/communications/outlook/status`
  - `POST /api/communications/outlook/sync`
- Dashboard `/dashboard/comunicacao` recebeu bloco para conectar e sincronizar Outlook
- Documentado o status em `docs/OUTLOOK_OMNICHANNEL_STATUS.md`

### Bloqueio atual

- Integracao Outlook nao concluida por bloqueio no Microsoft Entra / tenant
- Erro observado durante a autenticacao:
  - `AADSTS700016`
- Recomendacao registrada:
  - criar app novo no tenant correto da conta corporativa ou obter consentimento/instalacao adequada do app atual

## 2026-04-10

### DataLake MySQL — Ativação das Tabelas Operacionais

- `.env` configurado com `DATALAKE_ALLOWED_TABLES=crm_solicitacoes,fato_solicitacoes,fato_contratos`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` definidos para producao controlada
- Tela `/datalake` reescrita com cards pre-configurados por tabela:
  - `crm_solicitacoes` — chamados CRM (suporte, cancelamento, mudanca de plano)
  - `fato_solicitacoes` — fato de atendimento e SLA
  - `fato_contratos` — fato de contratos, churn e receita
- Cada card exibe descricao semantica, contagem de linhas e 3 analises sugeridas
- Clique em analise sugerida preenche o prompt e abre aba de Sugestoes IA
- Navegacao por abas: Catalogo / Preview / Sugestoes IA
- Prompt de IA enriquecido com contexto de ISP brasileiro e semantica das tabelas

## 2026-04-09

### Adicionado

- Novo endpoint `GET /api/wa-monitor/group-brief`
- Novo fluxo `Resumo conversas` na dashboard `/dashboard/comunicacao`
- Narracao do resumo consolidado por grupo via `speechSynthesis` no navegador

### Alterado

- `README.md` do hub reescrito para refletir o estado atual do projeto
- `DOCUMENTACAO_TECNICA_HUB.md` reescrita com o fluxo novo de `group-brief`
- `README.md` e `DOCUMENTACAO_TECNICA.md` do modulo `08 - IA COMUNICACAO` alinhados com a implementacao real

### RAG

- `src/lib/rag.ts` ajustado para:
  - detectar consultas procedurais
  - tratar identificadores de equipamento como sinal forte (`DM2104`, `HT818` etc.)
  - reduzir o impacto de matches de imagem quando a consulta nao pede imagem
  - preservar o ranking real na selecao final dos matches
- `src/app/api/chat/route.ts` ajustado para:
  - sintetizar melhor consultas de manual
  - montar resposta procedural diretamente dos passos do contexto quando houver numeracao
  - melhorar a formatacao de comandos e instrucoes

### Validado

- `npm run build` aprovado apos:
  - inclusao do `group-brief`
  - ajuste do fluxo de audio
  - correcoes no RAG para consultas de procedimento

## 2026-03-26

### Adicionado

- Documentacao tecnica do hub
- Changelog do hub
- Linkagem dos documentos no README

## 2026-03-25

### Adicionado

- Criacao da nova pasta `07 - HUB NETTURBO`
- Copia da base funcional do `05 - PORTAL_V3`
- Home do hub redesenhada como ponto central
- Integracao do FUNTER como modulo do hub
- Copia dos assets do dashboard FUNTER para `public/dashboards/funter/`
- Ajuste do layout global e da sidebar
- Ajuste do endpoint de chat para compilar com a base local

### Validado

- Dependencias instaladas com `npm install --legacy-peer-deps`
- Build executado com sucesso

## 2026-03-24

### Base

- Estrutura inicial do portal e dos modulos RAG, DataLake e Zabbix
