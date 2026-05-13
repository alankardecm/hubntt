# Changelog - Netturbo Hub

## 2026-05-13

### Rebranding Visual — Identidade Netturbo

- Paleta de cores migrada para a identidade oficial Netturbo extraída do logotipo:
  - Verde lima `#8DC63F` substitui o teal `#379890` em todos os componentes
  - Cinza `#404040` substitui o verde-floresta `#143230`
- `globals.css` atualizado com novos tokens de tema (`--color-primary`, `--color-foreground`, etc.)
- Gradiente de fundo do `body` atualizado para toque verde lima
- `Sidebar.tsx` atualizado com hardcodes de cor substituídos
- Banner de ambiente (`EnvironmentBanner`) removido do `layout.tsx`
- Workspace (`/dashboard`) convertido de tema escuro para tema claro, alinhado ao site netturbo.com.br

---

### Menu Lateral — Reestruturação

- Removidos os itens **Netmeet** e **Custos** do menu lateral e do Workspace
- Removido o item **RAG** do menu (funcionalidade absorvida pelo Chat em modo Consulta Interna)
- Adicionados ao menu: **WhatsApp**, **Alertas**, **Chat**
- Workspace passou a espelhar exatamente o menu lateral (fonte da verdade)
- Numeração dos cards do Workspace renumerada em sequência após ajustes

---

### Página Hub (`/`) — Redesign

- Sidebar adicionada (era a única página sem ela)
- Saudação dinâmica: "Bom dia / Boa tarde / Boa noite, Netturbo."
- Status em tempo real: busca `/api/health/full` ao carregar e exibe barra colorida por serviço
- Acesso rápido a 6 módulos mais usados com cards compactos
- Strip de conexões com pílulas verdes/vermelhas por serviço
- Link "Ver detalhes →" aponta para Diagnóstico (`/settings`)

---

### Chat IA (`/chat`) — Criação e Evolução

- **Criação inicial**: interface de chat geral (Groq llama-3.3-70b + fallback OpenAI gpt-4o-mini)
- **Modo Consulta Interna**: toggle no header alterna entre modo geral e consulta ao TurboDocs
  - Modo interno busca no BookStack antes de responder e exibe fontes com links clicáveis
  - Imagens das fontes exibidas como thumbnails clicáveis com lightbox (Escape ou clique fora para fechar)
- Quick prompts diferentes por modo
- Histórico salvo no localStorage (até 40 mensagens)
- API: `POST /api/chat-geral` com parâmetro `mode: 'geral' | 'interno'`

---

### RAG — Integração BookStack (TurboDocs)

- **Nova fonte primária**: BookStack (`turbodocs.netturbosolucoes.com.br`) substituiu Pinecone como fonte principal
  - Credenciais: Token ID + Token Secret configurados em `.env`
  - Busca via `/api/search?query=...` + conteúdo completo via `/api/pages/{id}`
  - Extração de imagens do HTML das páginas com resolução de URLs relativas
  - Zero custo de embedding — busca full-text interna do BookStack
- **Pinecone mantido como fallback** automático se BookStack não retornar resultado
- `src/lib/bookstack.ts` criado com cliente completo (busca, extração de texto e imagens)
- Correção: URL das fontes estava duplicando o base URL — corrigido para usar `resolveUrl()`
- **Rede**: rota `10.250.120.0/24` adicionada pelo TI para acesso do servidor ao TurboDocs (`10.250.120.90`)

**Página RAG atualizada:**
- Lightbox em imagens (clique para expandir, Escape para fechar, ícone de zoom no hover)
- Filtro de fontes: score mínimo 0.50 para resultados Pinecone, deduplicação por título
- Máximo 6 fontes exibidas
- Textos atualizados (removidas referências a "Pinecone RAG")

---

### Evolution API — Instalação e Migração do WhatsApp

**Instalação:**
- Evolution API v2.3.7 instalada em `/opt/evolution-api` via npm (sem Docker)
- PostgreSQL 15 instalado localmente para banco de dados da Evolution API
- Banco e usuário `evolution` criados, schema aplicado via `npx prisma db push`
- Processo registrado no PM2 como `evolution-api` na porta `8080`

**Configuração:**
- Instância `netturbo-test` criada via API
- Webhook configurado apontando para `http://localhost:4200/api/evolution/webhook`
- Número `5519996780064` conectado via QR code no manager (`http://10.250.110.238:8080/manager`)

**Migração do wa-bridge:**
- `wa-bridge` (Baileys customizado) descontinuado e removido do PM2
- Evolution API passou a ser o único cliente WhatsApp do número da Netturbo
- Arquivos nunca commitados agora incluídos no repositório:
  - `src/app/api/evolution/webhook/route.ts` — recebe eventos MESSAGES_UPSERT
  - `src/app/api/evolution/instances/route.ts` — lista/cria instâncias
  - `src/app/api/evolution/instances/[name]/route.ts` — detalhe/delete/ações por instância
  - `src/app/api/evolution/send/route.ts` — envia mensagens
  - `src/lib/evolution-api.ts` — cliente HTTP da Evolution API
  - `src/lib/evolution-bot.ts` — bot com function calling (Zabbix + DataLake)
  - `src/lib/bot-registry.ts` — whitelist e mapeamento LID → número

**Correção de compatibilidade v2:**
- Payload `sendText` corrigido: `{ textMessage: { text } }` → `{ text }` (formato v2)
- Tipo `Instance` na página WhatsApp atualizado para formato v2 (`name`, `connectionStatus` em vez de `instance.instanceName`, `instance.status`)

**Variáveis adicionadas ao `.env` do servidor:**
```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=netturbo-evolution-key-2026
EVOLUTION_INSTANCE_NAME=netturbo-test
BOT_WHITELIST=5519995483158,5519997670137,5519998073842,5519993967033
BOOKSTACK_BASE_URL=http://turbodocs.netturbosolucoes.com.br
BOOKSTACK_TOKEN_ID=GDWxFBhMbFVr37kuba7cvqKp7QkYiwab
BOOKSTACK_TOKEN_SECRET=ij8M7VOvwiqhIzFnvBnVCgQOaV8qUUQ9
```

**Bot WhatsApp validado:**
- Responde perguntas sobre Zabbix e DataLake via função calling com OpenAI
- Testado: consulta "20 últimos protocolos com clientes" retornou dados reais do DataLake
- Whitelist ativa: somente números autorizados recebem resposta

---

### Página WhatsApp (`/dashboard/whatsapp`)

- Página de gerenciamento da Evolution API criada e commitada
- Exibe instâncias conectadas, status, QR code para reconexão
- Permite configurar webhook e enviar mensagem de teste diretamente pelo hub
- Ícone `Webhook` (inexistente na versão instalada) substituído por `Link2`
- Cores atualizadas para identidade Netturbo

---

### Infraestrutura do Servidor

- **Memória**: servidor ampliado para 8GB RAM (antes: 771MB livres disponíveis)
- **Disco**: 3 volumes — `/` (7.8G), `/opt` (32G, onde ficam todos os serviços), `/mnt/disk1` (7.8G)
- **PM2 unificado**: processos do `alan.moreira` e do `root` estavam em daemons separados causando conflito de porta 4200 — resolvido com `pm2 kill` no usuário alan e gestão única via root
- **PM2 save**: estado salvo em `/root/.pm2/dump.pm2`
- Processos ativos após sessão:

| ID | Nome | Porta | Status |
|----|------|-------|--------|
| 0 | netmeet-monitor | — | online |
| 1 | netmeet-dashboard | — | online |
| 3 | hub-ntt-73 | 4200 | online |
| 7 | evolution-api | 8080 | online |

---

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
