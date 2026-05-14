# Documentação Técnica — Netturbo Hub

> Versão: 2.0 | Última atualização: 14/05/2026 | Autor: Alan Moreira / Claude Sonnet 4.6

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Infraestrutura de Produção](#3-infraestrutura-de-produção)
4. [Autenticação e Controle de Acesso](#4-autenticação-e-controle-de-acesso)
5. [Gestão de Usuários](#5-gestão-de-usuários)
6. [Bot WhatsApp](#6-bot-whatsapp)
7. [NetMeet — Transcrição de Reuniões](#7-netmeet--transcrição-de-reuniões)
8. [Zabbix — Monitoramento](#8-zabbix--monitoramento)
9. [DataLake — Consultas e Dashboard](#9-datalake--consultas-e-dashboard)
10. [RAG — Consulta Interna](#10-rag--consulta-interna)
11. [Chat com IA](#11-chat-com-ia)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [Procedimentos de Deploy](#13-procedimentos-de-deploy)
14. [Pendências e Roadmap](#14-pendências-e-roadmap)

---

## 1. Visão Geral

O **Netturbo Hub** é a central operacional única da Netturbo, acessível em `https://10.250.110.238`. Reúne em uma única interface:

- Monitoramento de rede em tempo real (Zabbix)
- Consultas ao DataLake (MySQL)
- Dashboards inteligentes com assistente de IA
- Transcriçao e ata automática de reuniões (NetMeet)
- Bot WhatsApp integrado ao Zabbix e DataLake
- RAG (consulta ao knowledge base interno BookStack)
- Chat com IA multimodal

### Acesso
| Ambiente | URL |
|---|---|
| Produção (HTTPS) | `https://10.250.110.238` |
| App interno (porta direta, bloqueada externamente) | `http://10.250.110.238:4200` |
| Evolution API | `http://10.250.110.238:8080` |

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Framer Motion, Lucide React |
| Auth | NextAuth v5 beta (Auth.js) + Microsoft Entra ID |
| WhatsApp | Evolution API v2.3.7 |
| Transcrição | OpenAI Whisper (`whisper-1`) |
| IA | GPT-4o-mini (atas, chat), OpenAI function calling |
| DataLake | MySQL 8 via `mysql2` |
| RAG | BookStack (TurboDocs) + Pinecone fallback |
| Monitoramento | Zabbix 6.2 API |
| Runtime | Node.js 18+ via PM2 |
| Reverse proxy | Nginx + certificado SSL autoassinado |
| Firewall | nftables |

---

## 3. Infraestrutura de Produção

### Servidor

| Item | Valor |
|---|---|
| Hostname | `SRV-CT-TurboWS` |
| IP | `10.250.110.238` |
| OS | Ubuntu Linux |
| Projeto | `/opt/DESENVOLVIMENTO_E_TESTE/hubntt` |
| Usuário runtime | `root` (via PM2) |

### Processos PM2

| ID | Nome | Porta | Função |
|----|------|-------|--------|
| 0 | netmeet-monitor | — | Monitor de reuniões |
| 1 | netmeet-dashboard | — | Dashboard NetMeet |
| 3 | hub-ntt-73 | 4200 | Hub principal (Next.js) |
| 7 | evolution-api | 8080 | WhatsApp Evolution API |

**Comandos PM2:**
```bash
pm2 list                    # ver todos os processos
pm2 restart hub-ntt-73      # reiniciar o Hub
pm2 logs hub-ntt-73         # ver logs
pm2 resurrect               # restaurar todos após reboot
pm2 save                    # salvar estado atual
```

### Nginx

Arquivo de configuração: `/etc/nginx/sites-available/hub-netturbo`

- Porta 80 → redireciona para 443
- Porta 443 → proxy para `localhost:4200`
- Buffer de headers: 128k (necessário para cookies JWT do Azure AD)
- SSL: certificado autoassinado em `/etc/nginx/ssl/`

**Renovar configuração:**
```bash
nginx -t && systemctl reload nginx
```

### Firewall (nftables)

Regra ativa: bloqueia acesso externo direto à porta 4200.
```bash
nft list ruleset | grep 4200
# tcp dport 4200 ip saddr != 127.0.0.1 drop
```

Configuração persiste em `/etc/nftables.conf` e é carregada pelo systemd no boot.

---

## 4. Autenticação e Controle de Acesso

### Provedor

**Microsoft Entra ID (Azure AD)** — single-tenant, apenas contas `@netturbo.com.br`.

| Item | Valor |
|---|---|
| App Registration | HUB Netturbo |
| Client ID | `3264f7ab-5836-4403-8d6a-c9ae078366fb` |
| Tenant ID | `945bd206-3f96-49d3-903f-06bd1f80c935` |
| Redirect URI | `https://10.250.110.238/api/auth/callback/microsoft-entra-id` |
| Permissões | `User.Read` (delegado, consentido para organização) |

### Roles

| Role | Quem tem | Pode fazer |
|---|---|---|
| `superadmin` | `alan.moreira@netturbo.com.br` (hardcoded) | Tudo, incluindo mudar roles de outros |
| `admin` | Promovido pelo superadmin via Hub | Acesso total, gerencia permissões de usuários |
| `user` | Qualquer pessoa que fez login | Apenas o que o admin liberar |

**Conta bloqueada:** `ntt.alertas@netturbo.com.br` — autenticação Azure bem-sucedida, mas Hub rejeita na entrada (`BLOCKED_EMAILS` em `auth.ts`).

### Arquivos de autenticação

| Arquivo | Função |
|---|---|
| `src/lib/auth.config.ts` | Config Edge-safe (providers, authorized callback) — usado pelo proxy |
| `src/lib/auth.ts` | Config completa Node.js (signIn, jwt, session callbacks) |
| `src/proxy.ts` | Proxy Next.js 16 que aplica autenticação em todas as rotas |
| `src/types/next-auth.d.ts` | Extensão dos tipos do NextAuth (role, pages, tokenVersion) |

### Tela de Login

Rota: `/auth/signin`  
Design: tema cyber green (fundo `#000D00`, texto neon `#ACD000`)  
Logo: `/public/logo-netturbo.png`

---

## 5. Gestão de Usuários

### Página admin

Rota: `/settings/users` — visível apenas para `superadmin` e `admin`.

Link na Sidebar aparece apenas para quem tem esses roles.

### Registro de usuários

Arquivo: `.runtime/auth/users.json`

Estrutura por usuário:
```json
{
  "email@netturbo.com.br": {
    "name": "Nome Completo",
    "email": "email@netturbo.com.br",
    "role": "user",
    "firstLogin": "2026-05-14T...",
    "lastLogin": "2026-05-14T...",
    "pages": { "chat": true, "dashboards": false, ... },
    "tokenVersion": 0,
    "preRegistered": false
  }
}
```

### Permissões por página

| Página | Chave | Padrão novo usuário |
|---|---|---|
| Chat | `chat` | ✅ habilitado |
| NetMeet | `netmeet` | ✅ habilitado |
| Dashboards | `dashboards` | ❌ desabilitado |
| Monitoramento NOC | `monitoring` | ❌ desabilitado |
| Zabbix | `zabbix` | ❌ desabilitado |
| WhatsApp IA | `whatsapp` | ❌ desabilitado |
| DataLake | `datalake` | ❌ desabilitado |
| RAG | `rag` | ❌ desabilitado |

**Dashboard tem 3 níveis:** `false` (sem acesso) / `view` (só visualiza) / `edit` (cria e edita).

**Permissão granular de tabelas:** cada usuário com acesso ao Dashboard tem uma lista de tabelas que pode consultar. Configurada via modal na tela de Usuários.

### Force Logout (Kick)

Na tela de usuários, botão `↪` na coluna Logout.  
Incrementa `tokenVersion` no registro → na próxima requisição do usuário, o proxy detecta versão antiga e redireciona para login.  
**Efeito imediato.**

### Pré-cadastro (sem login no Hub)

Permite que diretores/gerentes usem o bot WhatsApp sem nunca acessar o Hub.

1. Admin clica em **"Pré-cadastrar usuário"** na tela de Usuários
2. Informa nome + email corporativo
3. Usuário aparece na lista com badge **"Aguardando 1º login"**
4. Quando fizer login, badge some automaticamente

---

## 6. Bot WhatsApp

### Número e instância

| Item | Valor |
|---|---|
| Número | `+55 19 99678-0064` |
| Instância Evolution | `netturbo-test` |
| Evolution API Key | `netturbo-evolution-key-2026` |
| Manager | `http://10.250.110.238:8080/manager` |

### Autorização

**Substituiu o `BOT_WHITELIST` do .env.** Agora usa `users.json` como fonte de verdade.

**Fluxo de primeiro acesso:**
```
Número desconhecido manda mensagem
→ Bot: "Informe seu email corporativo"
→ Usuário manda email@netturbo.com.br
→ Bot verifica em users.json (logado OU pré-cadastrado)
   ✅ Encontrado → registra fone→email → todas as features liberadas
   ❌ Não encontrado → "Email não encontrado. Peça ao administrador."
```

Registro fone→email: `.runtime/phone-email.json`

### Funcionalidades

| Comando/Tipo | Resposta |
|---|---|
| `oi`, `ola`, `hey` | Apresentação do bot |
| `status`, `noc`, `alarmes` | Relatório Zabbix imediato |
| Perguntas sobre DataLake | Consulta MySQL via OpenAI function calling |
| Áudio (voz ou documento) | NetMeet — transcreve + gera ata |

### Registro de LID (WhatsApp moderno)

WhatsApp moderno usa JIDs `@lid` em vez de número. Para registrar:
```
/start 19999999999
```
Mapeamento salvo em `.bot-registry.json`.

---

## 7. NetMeet — Transcrição de Reuniões

### Fluxo

```
Usuário envia áudio no WhatsApp (voz ou arquivo de áudio)
→ Bot verifica se número está em phone-email.json
   Sim → processa direto
   Não → salva áudio pendente (10min) → pede email
→ getMediaBase64 (Evolution API)
→ OpenAI Whisper (whisper-1) → transcrição
→ GPT-4o-mini → gera resumo + decisões + tarefas (JSON)
→ Salva em .runtime/netmeet/meetings.json (userEmail + senderPhone)
→ Envia ata formatada de volta no WhatsApp
```

### Modelos utilizados

| Passo | Modelo |
|---|---|
| Transcrição de áudio | `whisper-1` (rápido, ~1x tempo real) |
| Geração de ata | `gpt-4o-mini` |

> Para áudios longos (20-30 min), o processo pode levar 5-15 minutos. O bot avisa que pode fechar o app.

### Página no Hub

Rota: `/dashboard/netmeet`

- **Usuário comum:** vê apenas suas próprias atas (filtrado por `userEmail`)
- **Superadmin/Admin:** vê todas as atas com nome do remetente
- **Download:** botão "Download TXT" gera arquivo com transcrição + decisões + tarefas

### Arquivo de reuniões

`.runtime/netmeet/meetings.json` — cada meeting tem:
- `id`, `title`, `classification: 'whatsapp-audio'`
- `transcript` (texto completo)
- `summary`, `decisions[]`, `actionItems[]`
- `userEmail`, `senderPhone`, `senderName`

---

## 8. Zabbix — Monitoramento

### Configuração

| Item | Valor |
|---|---|
| URL | Configurada em `ZABBIX_URL` no .env |
| Auth | Token Bearer em `ZABBIX_API_TOKEN` |
| Versão | Zabbix 6.2 |
| Auth mode | `auto` (tenta header primeiro, fallback para body) |

### Grupos monitorados (filtro de segurança)

O Hub só exibe dados dos seguintes grupos de host:

```
Backbone, POP, Rede de Acesso,
CLIENTE-BASE, CLIENTE-CORPORATIVO, CLIENTE-ENTREGUE-SEM-CPE,
CLIENTE-FREECORE, CLIENTE-ISP, CLIENTE-OPERADORA,
CLIENTE-ORGAO-PUBLICO, CLIENTE-PME, CLIENTE-TOP-CORPORATIVO,
CLIENTES-FREECORE, CLIENTES_CANCELAMENTO
```

Personalizável via `ZABBIX_ALLOWED_GROUPS` no .env (separado por vírgula).

### Página de monitoramento

Rota: `/monitoring/zabbix`

**Funcionalidades:**
- KPIs: total de alarmes, desastres, hosts online/offline
- **Categorias de alarme:** PPPoE, SD-WAN, SNMP, Memória, Modulação, Interface, Equipamento, Latência, Óptica, ONU, Qualidade
- **Card de atenção:** aparece automaticamente quando ≥5 alarmes do mesmo tipo (provável evento em larga escala)
- **Filtros combinados:** por grupo (Backbone/POP/etc.) + por categoria
- **Badge colorido** em cada alarme indicando o tipo
- **Histórico de host:** gráfico de disponibilidade 24h em buckets de 5 minutos
- Filtra alarmes com mais de 30 dias (deixar para o Zabbix)
- Atualização automática a cada 30 segundos

### Funções disponíveis (lib/zabbix.ts)

| Função | Retorna |
|---|---|
| `getActiveProblems(limit)` | Problemas ativos (últimos 30 dias, filtrado por host) |
| `getZabbixSummary()` | Contadores gerais |
| `getHosts(limit)` | Lista de hosts com IP, grupos, disponibilidade |
| `getRecentEvents(limit, hours)` | Eventos recentes com acknowledges |
| `getKeyItems(hostids)` | CPU, memória, tráfego, ping dos hosts |
| `getHostAvailabilityHistory(hostid, hours)` | Série temporal de disponibilidade |
| `buildZabbixContext(query)` | Contexto para RAG/Chat (busca por cliente) |

---

## 9. DataLake — Consultas e Dashboard

### Conexão MySQL

| Item | Valor |
|---|---|
| Host | `10.250.111.102` |
| Porta | `3306` |
| Database | `NTT_DataLake_01` |
| Usuário | `alan.kardec` |

### Tabelas disponíveis no Hub

Controlado por `DATALAKE_ALLOWED_TABLES` no .env. Se vazio → todas as tabelas. Se preenchido → apenas as listadas.

**Principais tabelas utilizadas:**

| Tabela | Conteúdo |
|---|---|
| `fato_solicitacoes` | Protocolos/chamados — `protocolo`, `status`, `data_abertura`, `data_conclusao`, `tipo`, `atendente`, `equipe`, `id_cliente` |
| `fato_contratos` | Eventos de contrato — `status`, `data_evento`, `id_cliente`, `id_contrato`, `valor_total` |
| `dim_cliente` | Cadastro de clientes — `id_cliente`, `cod_cliente`, `nome_cliente` |
| `dim_contrato` | Detalhes de contratos — `num_contrato`, `tipo_contrato`, `valor_mensal`, `status` |
| `crm_Funter` | Base CRM — `cliente`, `estagio`, `dt_cadastro`, `valor` (uma linha por contrato) |

**Regras críticas de SQL (gravadas no contexto da IA):**
- `"abertos em X"` = filtrar por `data_abertura` no período X, NUNCA por status
- `"em aberto/sem conclusão"` = `WHERE data_conclusao IS NULL`
- Status reais de `fato_solicitacoes`: `Encerramento` e `Cancelado` (não existe 'Aberto')
- `crm_Funter` para CONTAR contratos; `fato_contratos` APENAS para somar valor_total

### Permissão granular de tabelas por usuário

Cada usuário com acesso ao Dashboard (`dashboards: view/edit`) tem uma lista específica de tabelas que pode consultar.

- Configurado na tela de Usuários → clique em **"📋 X tabelas"** ao lado do toggle Dashboard
- Modal com checkboxes, busca, "Todas/Nenhuma"
- Superadmin e Admin: acesso a todas as tabelas sempre

A restrição é aplicada em:
- `/api/datalake/query` — query de widget
- `/api/datalake/schema` — lista de tabelas disponíveis
- `/api/datalake/smart-assistant` — assistente de criação de widgets

### Assistente inteligente de Dashboard

Rota da API: `POST /api/datalake/smart-assistant`

O assistente interpreta linguagem natural e gera configurações de widget:
- **"por mês"** → `timeBucket: month` + gráfico de barras/linha
- **"por equipe"** → `x: equipe` + gráfico de barras
- **"quantos protocolos"** → `aggregation: count` + `fato_solicitacoes`
- **"contratos ativos por mês"** → `crm_Funter` + `dt_cadastro` + `timeBucket: month`

---

## 10. RAG — Consulta Interna

### Fonte primária: BookStack (TurboDocs)

| Item | Valor |
|---|---|
| URL | `http://turbodocs.netturbosolucoes.com.br` |
| IP interno | `10.250.120.90` |
| Token ID | `GDWxFBhMbFVr37kuba7cvqKp7QkYiwab` |
| Token Secret | `ij8M7VOvwiqhIzFnvBnVCgQOaV8qUUQ9` |

### Fallback: Pinecone

Index: `netturbo-rag`

### Páginas que usam RAG

- `/chat` — Chat com IA (modo "Consulta Interna")
- `/rag` — Página dedicada de consulta RAG

---

## 11. Chat com IA

Rota: `/chat`

Modos:
- **Chat geral** — conversa livre com GPT-4o-mini
- **Consulta Interna** — combina RAG (BookStack) + Zabbix + DataLake

O contexto do Zabbix é injetado automaticamente se a pergunta mencionar termos como: alarme, cliente, host, status, down, offline, etc.

---

## 12. Variáveis de Ambiente

Arquivo no servidor: `/opt/DESENVOLVIMENTO_E_TESTE/hubntt/.env`

```bash
# ── OpenAI ──────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1

# ── Azure AD (NextAuth) ─────────────────────────────────────────
AZURE_AD_CLIENT_ID=3264f7ab-5836-4403-8d6a-c9ae078366fb
AZURE_AD_TENANT_ID=945bd206-3f96-49d3-903f-06bd1f80c935
AZURE_AD_CLIENT_SECRET=<secret>
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://10.250.110.238
AUTH_TRUST_HOST=true

# ── Evolution API / WhatsApp ────────────────────────────────────
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=netturbo-evolution-key-2026
EVOLUTION_INSTANCE_NAME=netturbo-test

# ── MySQL DataLake ──────────────────────────────────────────────
MYSQL_HOST=10.250.111.102
MYSQL_PORT=3306
MYSQL_DATABASE=NTT_DataLake_01
MYSQL_USER=alan.kardec
MYSQL_PASSWORD=<senha>
DATALAKE_ALLOWED_TABLES=          # vazio = todas as tabelas

# ── Zabbix ──────────────────────────────────────────────────────
ZABBIX_URL=http://<url-interna>/api_jsonrpc.php
ZABBIX_API_TOKEN=<token>
ZABBIX_AUTH_MODE=auto             # auto | header | body
# ZABBIX_ALLOWED_GROUPS=          # opcional: filtrar grupos

# ── BookStack (RAG) ─────────────────────────────────────────────
BOOKSTACK_BASE_URL=http://turbodocs.netturbosolucoes.com.br
BOOKSTACK_TOKEN_ID=GDWxFBhMbFVr37kuba7cvqKp7QkYiwab
BOOKSTACK_TOKEN_SECRET=ij8M7VOvwiqhIzFnvBnVCgQOaV8qUUQ9

# ── Outros ──────────────────────────────────────────────────────
GOOGLE_API_KEY=<key>
OPENROUTER_API_KEY=<key>
```

---

## 13. Procedimentos de Deploy

### Deploy padrão (após `git push` autorizado)

```bash
sudo su
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt
pm2 stop hub-ntt-73
git pull origin master
npm install --legacy-peer-deps
npm run build
pm2 start hub-ntt-73
pm2 save
```

### Reiniciar após reboot do servidor

```bash
sudo su
pm2 resurrect
# Se algum processo não subir:
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt && pm2 start hub-ntt-73
cd /opt/evolution-api && pm2 start evolution-api
```

### WhatsApp desconectado

```
Acessar http://10.250.110.238:8080/manager
→ Clicar na instância netturbo-test
→ Escanear QR Code
```

### Repositório Git

| Remote | URL |
|---|---|
| origin (empresa) | `https://github.com/netturbo-tech/hubntt` |
| personal | `https://github.com/alankardecm/hubntt` |

Branch principal: `master`

**Regra:** git push apenas com autorização explícita do usuário.

---

## 14. Pendências e Roadmap

### Em andamento / Próximos

| Item | Prioridade |
|---|---|
| Dashboard comparativo de protocolos (últimas 4 semanas por dia) | Alta |
| Zabbix — correlação com IA Comunicação (alarmes + volume WA) | Alta |
| Bot mais inteligente (categorias de alarme, "tem PPPoE caindo?") | Média |
| Tela diagnóstico `/settings` — atualizar para tema claro Netturbo | Baixa |

### Arquitetura de arquivos runtime (não versionados)

```
.runtime/
├── auth/
│   └── users.json              # registro de usuários (logins + pré-cadastros)
├── netmeet/
│   └── meetings.json           # atas de reunião
├── phone-email.json            # mapeamento fone WhatsApp → email Hub
└── pending-audio.json          # áudios aguardando registro de email (TTL 10min)

.bot-registry.json              # mapeamento WhatsApp LID → número real
```

### Fluxos que dependem de migração futura

- **Supabase → PostgreSQL local:** o módulo "Sink operacional" no NOC usa Supabase (não configurado). Migrar para PostgreSQL local quando necessário.
- **Permissão granular de tabelas:** futuramente, controlar por grupo de usuário e não apenas individualmente.

---

## Apêndice — Estrutura de Pastas Relevantes

```
src/
├── app/
│   ├── api/
│   │   ├── admin/users/         # gestão de usuários, roles, tabelas, pré-cadastro
│   │   ├── datalake/            # query, schema, smart-assistant
│   │   ├── evolution/           # webhook, send, instances
│   │   ├── netmeet/             # meetings CRUD
│   │   ├── zabbix/              # proxy para Zabbix API
│   │   └── health/              # health check
│   ├── auth/signin/             # tela de login (cyber green)
│   ├── access-denied/           # página de acesso negado
│   ├── dashboard/
│   │   ├── netmeet/             # lista de atas do usuário
│   │   ├── noc/                 # NOC principal
│   │   └── whatsapp/            # gestão da instância WhatsApp
│   ├── monitoring/zabbix/       # dashboard Zabbix completo
│   ├── settings/users/          # gestão de usuários e permissões
│   └── ...
├── components/
│   ├── admin/
│   │   ├── UserPermissionRow    # linha da tabela de usuários (permissões, roles)
│   │   ├── TablePermissionsModal # modal de tabelas do dashboard
│   │   ├── PreRegisterModal     # modal de pré-cadastro
│   │   └── UsersPageActions     # botão pré-cadastrar
│   ├── netmeet/
│   │   └── NetMeetList          # lista de atas com expansão e download
│   └── ...
├── lib/
│   ├── auth.ts                  # NextAuth config completa (Node.js)
│   ├── auth.config.ts           # NextAuth config Edge-safe (proxy)
│   ├── user-registry.ts         # CRUD do users.json
│   ├── user-pages.ts            # tipos e defaults de permissão (Edge-safe)
│   ├── phone-email-registry.ts  # mapeamento fone → email
│   ├── pending-audio.ts         # áudios pendentes de email
│   ├── evolution-api.ts         # cliente REST Evolution API
│   ├── evolution-bot.ts         # bot IA (Zabbix + DataLake)
│   ├── netmeet-whatsapp.ts      # transcrição + ata via WhatsApp
│   └── zabbix.ts                # cliente Zabbix API completo
└── modules/
    ├── datalake/
    │   └── application/
    │       ├── smart-assistant.ts  # assistente de criação de widgets
    │       └── overview.ts         # listagem de tabelas com filtro por usuário
    └── netmeet/
        └── storage.ts              # CRUD do meetings.json
```
