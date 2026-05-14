# Ponto de Recuperacao - Netturbo Hub

Este arquivo serve como checkpoint oficial para retomada rapida do HUB na proxima sessao.

---

## PONTO DE RECUPERACAO ATUAL (14/05/2026 — sessao bot WhatsApp)

### Resumo da sessao de hoje (para retomada rapida)

**O que foi feito:**
1. **Fix loop bot WhatsApp** — Evolution API fazia retry do webhook por timeout (IA de análise lenta) e re-enviava batch de mensagens antigas. Corrigido com dois guards no `webhook/route.ts`:
   - `isRecentMessage(timestamp)` — ignora mensagens com mais de 60s (históricas)
   - `hasBotResponded(msgId)` — Map com TTL 5min evita resposta duplicada no retry
2. **Histórico de conversa por número** — sessão de 15min com até 4 trocas em memória. Permite perguntas de acompanhamento tipo "quais as equipes desses protocolos" sem perder contexto
3. **Schema do DataLake corrigido** — `fato_solicitacoes` atualizado com colunas reais: `nome_cliente`, `cod_cliente`, `criticidade`, `cidade`, `bairro`, `data_prazo`, `reabertura`, `localizacao`. `nome_cliente` e `equipe` estão na tabela diretamente — não precisa de JOIN
4. **Data/hora atual no system prompt** — bot sabe a data/hora exata para resolver "hoje", "esta semana", "este mês" sem ambiguidade

**Commits desta sessão:**
- `b48b59f` — fix: prevenir loop de respostas do bot WhatsApp por retry da Evolution API
- `b90bcdb` — feat: historico de conversa e schema completo no bot WhatsApp

**Último commit no servidor:** `b90bcdb` (master) — deploy feito às 19:33

**Próximo passo prioritário:** Testar historico de contexto no WhatsApp ("quantos protocolos hoje?" → "quais as equipes desses?")

**Regra de trabalho:** sempre fazer backup antes de editar arquivos; git push só com autorização explícita do usuário.

### Arquivos modificados nesta sessão

```
src/app/api/evolution/webhook/route.ts  — guards anti-loop (recency + dedup)
src/lib/evolution-bot.ts                — historico de conversa + schema corrigido
PONTO_RECUPERACAO_HUB.md               — este arquivo
```

### Schema atual do fato_solicitacoes (corrigido)

```
protocolo(bigint PK), etiqueta(varchar), status(varchar), criticidade(varchar),
sla_segundos(decimal), data_abertura(datetime), data_conclusao(datetime),
data_prazo(datetime), tipo(varchar), atendente(varchar), equipe(varchar),
reabertura(tinyint), telefone_raw(varchar), cod_cliente(bigint),
nome_cliente(varchar), localizacao(varchar), bairro(varchar), cidade(varchar),
data_ingestao(datetime)

Status reais: 'Encerramento', 'Cancelado' (não existe 'Aberto')
"abertos em X" = filtrar por data_abertura (nunca por status)
"sem conclusão" = WHERE data_conclusao IS NULL
nome_cliente e equipe: direto na tabela, sem JOIN
```

---

## PONTO DE RECUPERACAO ANTERIOR (14/05/2026 — sessao completa)

### Resumo da sessao de hoje (para retomada rapida)

**O que foi feito:**
1. **Autenticação Azure AD** — NextAuth v5, Microsoft Entra ID, tela de login cyber green com logo Netturbo
2. **Nginx HTTPS** — certificado autoassinado, porta 4200 fechada externamente via nftables
3. **Gestão de usuários** — `/settings/users` com permissões por página, toggle dashboard VER/EDI, force logout
4. **Privacidade NetMeet** — fone→email via WhatsApp, cada usuário vê só suas atas, download TXT
5. **NetMeet no menu** — Whisper-1 (mais rápido), aceita áudio como documento WA
6. **Permissões de tabelas no Dashboard** — admin define quais tabelas cada usuário pode consultar
7. **Smart assistant corrigido** — timeBucket por mês, agrupamento por equipe/dimensão
8. **Segurança** — ntt.alertas bloqueado, users.json zerado, porta 4200 fechada

**Último commit:** `56782d6` (master)

**Próximo passo prioritário:** Deploy do commit de tabelas + testes de permissão no Dashboard

**Regra de trabalho:** sempre fazer backup antes de editar arquivos; git push só com autorização explícita do usuário.

### Padrão de permissões novos usuários
- Chat: ✅ habilitado
- NetMeet: ✅ habilitado
- Dashboard, Monitoring, Zabbix, WhatsApp, DataLake, RAG: ❌ desabilitado
- Tabelas Dashboard: [] (nenhuma — admin configura via modal)

### Contas especiais
- `alan.moreira@netturbo.com.br` = superadmin (hardcoded em auth.ts)
- `ntt.alertas@netturbo.com.br` = BLOQUEADO (hardcoded em BLOCKED_EMAILS)

### Mapeamento fone→email (NetMeet)
- Arquivo: `.runtime/phone-email.json`
- Gerado automaticamente quando usuário envia email no WhatsApp
- Áudio pendente expira em 10 minutos: `.runtime/pending-audio.json`

---

## PONTO DE RECUPERACAO ANTERIOR (14/05/2026 — sessao autenticação Azure AD)

### Resumo da sessao de hoje (para retomada rapida)

**O que foi feito:**
1. **Autenticação Azure AD implementada e funcionando em produção** — NextAuth v5 com Microsoft Entra ID. App Registration: `HUB Netturbo` (client ID `3264f7ab-5836-4403-8d6a-c9ae078366fb`), tenant `945bd206-3f96-49d3-903f-06bd1f80c935`
2. **Nginx configurado com HTTPS** — certificado autoassinado, redireciona porta 80→443, proxy para localhost:4200. HUB acessível em `https://10.250.110.238`
3. **Tela de login tema cyber green** — fundo `#000D00`, texto neon `#ACD000`, grade cyberpunk + scanlines. Funcional mas design a ajustar.
4. **alan.moreira@netturbo.com.br = superadmin** — role atribuída automaticamente no token JWT
5. **Botão Sair** na Sidebar conectado ao signOut do NextAuth

**Último commit:** `4a24943` (master)

**Próximo passo prioritário:** Ajustar intensidade visual da tela de login + adicionar logo Netturbo (aguardando arquivo de imagem do usuário)

**Regra de trabalho:** sempre fazer backup antes de editar arquivos; git push so com autorizacao explicita do usuario.

### Pendências tela de login
- Design muito intenso — suavizar saturação e luzes
- Logo Netturbo ausente — aguardando arquivo PNG/SVG

---

## PONTO DE RECUPERACAO ANTERIOR (13/05/2026 — 22h — fim de sessao)

### Resumo da sessao de hoje (para retomada rapida)

**O que foi feito:**
1. **NetMeet via WhatsApp integrado e testado em producao** — usuario manda audio no WA → Hub transcreve (OpenAI Whisper) → gera ata (GPT-4o-mini) → devolve ata formatada no WA. Testado as 21:39, funcionou na primeira tentativa.
2. **Codigo subido para dois remotes git:** `origin` (netturbo-tech/hubntt empresa) e `personal` (alankardecm/hubntt pessoal)
3. **Dois infograficos criados** para apresentacao: `HUB-FUNCIONALIDADES.html` e `HUB-TECNICO.html` na pasta `15 - PROJETO IA NETTURBO`

**Ultimo commit no servidor:** `86e9e42` (master)

**Proximo passo prioritario:** Autenticacao Azure AD / LDAP (prerequisito para pagina /meetings e isolamento de dados por usuario)

**Regra de trabalho:** sempre fazer backup antes de editar arquivos; git push so com autorizacao explicita do usuario.

---

### Ambiente de producao (servidor Linux)

- Servidor: `SRV-CT-TurboWS` — IP `10.250.110.238`
- Projeto: `/opt/DESENVOLVIMENTO_E_TESTE/hubntt`
- Todos os processos rodam via **PM2 como root**

### Processos PM2 ativos

| ID | Nome | Porta | Status |
|----|------|-------|--------|
| 0 | netmeet-monitor | — | online |
| 1 | netmeet-dashboard | — | online |
| 3 | hub-ntt-73 | 4200 | online |
| 7 | evolution-api | 8080 | online |

### Subir tudo no servidor (caso reinicie)

```bash
sudo su
pm2 resurrect
```

Se algum processo não subir:

```bash
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt && pm2 start hub-ntt-73
cd /opt/evolution-api && pm2 start evolution-api
```

### Deploy padrão (após git push)

```bash
sudo su
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt
pm2 stop hub-ntt-73 && git pull origin master && npm run build && pm2 start hub-ntt-73
pm2 save
```

### Estado do WhatsApp

- Evolution API v2.3.7 conectada ao número `5519996780064`
- Manager: `http://10.250.110.238:8080/manager`
- API Key: `netturbo-evolution-key-2026`
- Instância: `netturbo-test`
- Webhook: `http://localhost:4200/api/evolution/webhook`
- Bot responde mensagens diretas de números na whitelist
- Se desconectar: acessar manager → clicar na instância → escanear QR

### RAG / Consulta Interna

- **Fonte primária**: BookStack (TurboDocs) em `http://turbodocs.netturbosolucoes.com.br`
  - IP interno: `10.250.120.90` — rota liberada pelo TI em 13/05/2026
  - Token: `GDWxFBhMbFVr37kuba7cvqKp7QkYiwab:ij8M7VOvwiqhIzFnvBnVCgQOaV8qUUQ9`
- **Fallback**: Pinecone (`netturbo-rag`)
- Disponível no Chat (modo Consulta Interna) e na página RAG

### Como retomar amanhã

Cole no chat:

```
"Continuar o HUB Netturbo. Servidor SRV-CT-TurboWS (10.250.110.238).
PM2 com hub-ntt-73 (porta 4200) e evolution-api (porta 8080) rodando como root.
Evolution API v2.3.7 conectada ao número 5519996780064 (netturbo-test).
Bot WhatsApp ativo com Zabbix + DataLake. RAG via BookStack (TurboDocs) funcionando.
Retomar a partir do PONTO_RECUPERACAO_HUB.md."
```

### Pendências abertas

1. **Permissão granular de tabelas no Dashboard** — ✅ implementado. Admin define tabelas por usuário via modal na tela de usuários.
2. **WhatsApp — substituir BOT_WHITELIST pelo Hub/AD** — ao invés de whitelist estática no .env, usar o phone-email.json + user-registry. Quem tem conta no Hub e fez o registro do número tem acesso ao bot. Quem não tem, recebe mensagem orientando a criar conta.
3. **Dashboard comparativo de protocolos** — tela/widget mostrando protocolos abertos por dia nas últimas 4 semanas, agrupado por dia da semana. Detecta anomalias: destaque visual quando um dia tem volume 2x acima da média dos mesmos dias anteriores. Usa fato_solicitacoes.data_abertura.
4. **Zabbix — correlação com IA Comunicação** — card de atenção quando muitos alarmes do mesmo tipo aparecem juntos + alto volume de msgs WA no mesmo período = alerta de evento em curso.
2. **Tela de login** — design muito intenso, suavizar; logo Netturbo ausente (aguardando arquivo PNG/SVG)
2. **Diagnóstico (`/settings`)** — ainda usa tema escuro antigo, fora do padrão Netturbo claro
3. **Bot WhatsApp** — ainda recebe erros 401 para mensagens antigas em cache (residuo da migração wa-bridge → Evolution API); vai sumir naturalmente com o tempo
4. **Supabase → PostgreSQL local** — PostgreSQL já instalado no servidor; migração dos dados do Supabase não iniciada
5. **Alertas proativos Zabbix** — bot enviar mensagem automática ao detectar alarme DISASTER
6. **Autenticação** — ✅ Azure AD implementado e funcionando em produção (14/05/2026)
7. **NetMeet via WhatsApp** — ✅ implementado e testado em produção (13/05/2026) — áudio → Whisper → GPT → ata no WhatsApp funcionando

### Variáveis de ambiente no servidor (`/opt/DESENVOLVIMENTO_E_TESTE/hubntt/.env`)

Variáveis adicionadas em 13/05/2026 (verificar se estão presentes):

```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=netturbo-evolution-key-2026
EVOLUTION_INSTANCE_NAME=netturbo-test
BOT_WHITELIST=5519995483158,5519997670137,5519998073842,5519993967033
BOOKSTACK_BASE_URL=http://turbodocs.netturbosolucoes.com.br
BOOKSTACK_TOKEN_ID=GDWxFBhMbFVr37kuba7cvqKp7QkYiwab
BOOKSTACK_TOKEN_SECRET=ij8M7VOvwiqhIzFnvBnVCgQOaV8qUUQ9
```

### Último commit

- Branch: `master`
- Último commit: `0c9f66c` — `docs: changelog completo da sessao 2026-05-13`
- GitHub: `https://github.com/netturbo-tech/hubntt`

---

## PONTO DE RECUPERACAO ANTERIOR (11/05/2026 — fim de sessao)

### Ambiente ativo

- Pasta: `07.3 - HUB NETTURBO REESTRUTURACAO EVOLUTION API`
- Porta do HUB: `4300`
- Evolution API: Docker, porta `8080`
- Redis: Docker, porta `6379`
- PostgreSQL Evolution: Docker, porta `5433`

### Subir ambiente completo

```powershell
cd "C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07.3 - HUB NETTURBO REESTRUTURACAO EVOLUTION API"
docker compose -f docker-compose.evolution.yml up -d
npx next dev --webpack -p 4300
```

Verificar containers:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Esperado: `evolution-api`, `evolution-db`, `evolution-redis` todos `Up`.

### Instancia WhatsApp

- Nome: `netturbo-test`
- Conta: Alan_NTT (numero 19996780064)
- Status: conectada e funcional
- Webhook: `http://host.docker.internal:4300/api/evolution/webhook`

### Bot WhatsApp — status

- Funcionando para consultas de Zabbix e DataLake
- Registro LID: cada usuario faz `/start SEU_NUMERO` uma vez — fica salvo em `.bot-registry.json`
- Whitelist configurada em `BOT_WHITELIST` no `.env.local`

### Como retomar

```
"Vamos continuar o HUB Evolution API.
Docker ja esta rodando, HUB na porta 4300, instancia netturbo-test conectada como Alan_NTT.
Bot WhatsApp ativo, DataLake e Zabbix integrados.
Retomar a partir do PONTO_RECUPERACAO_HUB.md."
```

---

## O que foi entregue nesta sessao (11/05/2026)

### 1. Evolution API — infraestrutura Docker

- `docker-compose.evolution.yml`: `evolution-api` v1.8.7 + `evolution-db` PostgreSQL 16 + `evolution-redis` Redis 7
- Versao v2.2.3 descartada: Baileys desatualizado, falha no Noise Protocol do WhatsApp
- Armazenamento: file-based (`DATABASE_ENABLED: false`), volume Docker `evolution_instances`
- API Key global: `netturbo-evolution-key-2026`

### 2. Modulo Evolution API no HUB — arquivos

```
src/lib/evolution-api.ts                          — cliente REST Evolution API v1.x
src/lib/evolution-bot.ts                          — bot IA (Zabbix + DataLake)
src/lib/bot-registry.ts                           — mapeamento LID → numero (persiste em .bot-registry.json)
src/app/api/evolution/instances/route.ts          — listar e criar instancias
src/app/api/evolution/instances/[name]/route.ts   — status, QR code, webhook, logout, delete
src/app/api/evolution/webhook/route.ts            — recebe mensagens + aciona bot
src/app/api/evolution/send/route.ts               — enviar mensagem de texto
src/app/dashboard/whatsapp/page.tsx               — pagina de gerenciamento
```

Runtime (nao commitar):
```
.bot-registry.json   — mapeamento LID → numero real (gitignored)
```

### 3. Bot WhatsApp com IA

#### Fluxo completo

```
Usuario → WhatsApp → Evolution API → webhook HUB
    → bot (se mensagem direta + whitelist)
    → OpenAI function calling
    → Zabbix API ou DataLake MySQL
    → resposta formatada → WhatsApp
```

#### Capacidades confirmadas e testadas

| Pergunta | Fonte | Resultado |
|---|---|---|
| `status` | Zabbix | Relatorio de alarmes e hosts |
| `oi` / `ola` | built-in | Apresentacao do bot |
| `quantos protocolos em maio 2026` | DataLake | 432 |
| `clientes com mais protocolos em maio` | DataLake + JOIN | Top 10 com totais |
| `quantos protocolos em março 2026` | DataLake | Funcionando apos correcao |

#### Atalhos diretos (sem chamar o AI)

- `oi`, `ola`, `hey`, `hi` → apresentacao
- `status`, `noc`, `alarmes`, `problemas` → relatorio Zabbix imediato

### 4. Bugs corrigidos nesta sessao

#### Bug 1 — Evolution API v2.2.3 incompativel com WhatsApp atual
- Causa: Baileys desatualizado, falha no Noise Protocol (WebSocket closed)
- Solucao: migrar para v1.8.7 (ultima versao ativa, Jun/2025)

#### Bug 2 — QR Code nao gerava (count: 0)
- Causa: Redis ausente no docker-compose, Evolution API nao conseguia armazenar o QR
- Solucao: adicionar container `evolution-redis` ao docker-compose

#### Bug 3 — Webhook retornava 401
- Causa: Evolution API v1.x envia chave da *instancia* no header, nao a chave global
- Solucao: remover validacao de auth do endpoint `/api/evolution/webhook`

#### Bug 4 — Bot nao respondia (JID @lid)
- Causa: WhatsApp moderno usa LID em vez de numero de telefone; Evolution API nao consegue enviar para JID @lid via REST
- Solucao: sistema de registro `/start NUMERO` que mapeia LID → numero real, persistido em `.bot-registry.json`

#### Bug 5 — OpenAI 400: tool_calls sem resposta
- Causa: AI fazia dois `tool_calls` simultaneos e o codigo so respondia ao primeiro
- Solucao: loop que processa TODOS os tool_calls antes da segunda chamada ao AI

#### Bug 6 — Consultas de periodo retornavam zero
- Causa: AI adicionava `AND status = 'Aberto'` em queries de "protocolos abertos em X"
  mas o status `Aberto` nao existe em `fato_solicitacoes` (so existem `Encerramento` e `Cancelado`)
- Solucao: schema context explicito com status reais + regra clara:
  - "abertos em [periodo]" = filtrar por `data_abertura`, nunca por `status`
  - "em aberto / sem conclusao" = `WHERE data_conclusao IS NULL`

### 5. Seguranca — Whitelist

```
BOT_WHITELIST=5519995483158,5519997670137,5519998073842,5519993967033
```

Numeros autorizados atualmente:

| Numero | DDI |
|---|---|
| 19995483158 (Alan Moreira) | 5519995483158 |
| 19997670137 | 5519997670137 |
| 19998073842 | 5519998073842 |
| 19993967033 | 5519993967033 |

Para adicionar: editar `.env.local` e reiniciar o HUB.

### 6. Registro LID (uma vez por usuario)

Cada usuario manda para `19996780064`:

```
/start SEU_NUMERO
```

Exemplo: `/start 19997670137`

Bot confirma com mensagem. Registro salvo em `.bot-registry.json`, sobrevive a reinicializacoes.

---

## Arquitetura DataLake — tabelas autorizadas para consulta

O bot so consulta estas tabelas (hardcoded no contexto do AI):

```
fato_solicitacoes  — protocolos/chamados (2026, atualizado diariamente)
  protocolo, status, data_abertura, data_conclusao, tipo, atendente, equipe, id_cliente

fato_contratos     — contratos (atualizado continuamente)
  status, data_evento, id_cliente, id_contrato, valor_total

dim_cliente        — cadastro de clientes
  id_cliente, cod_cliente, nome_cliente

dim_contrato       — detalhes dos contratos
  id_contrato, num_contrato, tipo_contrato, valor_mensal, status, data_cadastro
```

Regras criticas de SQL (gravadas no contexto do AI):
- "abertos em X" = filtrar por `data_abertura`, NUNCA por `status`
- "em aberto" = `WHERE data_conclusao IS NULL`
- Status reais de `fato_solicitacoes`: `Encerramento` e `Cancelado` (nao existe 'Aberto')
- JOIN para nome do cliente: `JOIN dim_cliente dc ON fs.id_cliente = dc.id_cliente`

---

## Variaveis de ambiente (.env.local)

```
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=netturbo-evolution-key-2026
EVOLUTION_INSTANCE_NAME=netturbo-test
PORT=4300
NEXT_PUBLIC_APP_URL=http://localhost:4300

# Bot WhatsApp
BOT_WHITELIST=5519995483158,5519997670137,5519998073842,5519993967033

# Zabbix
ZABBIX_URL=<URL_INTERNA_EMPRESA>
ZABBIX_API_TOKEN=<TOKEN_EMPRESA>

# DataLake MySQL
MYSQL_HOST=<HOST_EMPRESA>
MYSQL_PORT=3306
MYSQL_DATABASE=<DATABASE_EMPRESA>
MYSQL_USER=<USUARIO_EMPRESA>
MYSQL_PASSWORD=<SENHA_EMPRESA>
```

---

## NetMeet via WhatsApp (integrado em 13/05/2026)

### Arquivos criados/modificados

```
src/lib/netmeet-whatsapp.ts                   — NOVO: transcribe áudio + gera ata + responde WA
src/lib/evolution-api.ts                       — ADICIONADO: getMediaBase64()
src/app/api/evolution/webhook/route.ts         — MODIFICADO: detecta audioMessage e aciona NetMeet
```

### Fluxo

```
Usuário envia áudio no WhatsApp (número 5519996780064)
    → webhook detecta messageType === 'audioMessage'
    → verifica whitelist
    → responde "Transcrevendo... aguarde"
    → getMediaBase64 (Evolution API)
    → OpenAI Whisper (transcrição)
    → GPT-4o-mini (gera resumo + decisões + tarefas)
    → salva em .runtime/netmeet/meetings.json (classification: 'whatsapp-audio')
    → responde ata formatada no WhatsApp
```

### Variáveis de ambiente necessárias no servidor

Adicionar ao `.env` se ainda não existirem:
```
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
# OPENAI_CHAT_MODEL já está configurado (usado pelo bot)
# OPENAI_API_KEY já está configurado
```

### Deploy (após git push autorizado)

```bash
sudo su
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt
pm2 stop hub-ntt-73 && git pull origin master && npm run build && pm2 start hub-ntt-73
pm2 save
```

### Testado e funcionando em produção (13/05/2026 — 21:39)

- Endpoint confirmado: `POST /chat/getBase64FromMediaMessage/{instance}` ✅
- Body: `{ "message": { "key": { "id": "..." } }, "convertToMp4": false }` ✅
- Modelo transcrição: `gpt-4o-transcribe` ✅
- Modelo ata: `gpt-4o-mini` ✅

---

## Proximas frentes sugeridas

1. **Relatorio NOC agendado** — ao detectar alarme DISASTER no Zabbix, bot avisa grupo de NOC automaticamente
2. **Ampliar bot para grupos** — responder `/status`, `/chamados` em grupos configurados (hoje so responde mensagens diretas)
3. **Persistir registro LID no Supabase** — hoje fica em `.bot-registry.json` local, perde no deploy em servidor
4. **Envio proativo** — relatorio diario de chamados e status da rede no horario configurado
5. **Mais tabelas no DataLake** — liberar `fato_pesquisas` (CSAT), `crm_funter` para consulta pelo bot
6. **Página /meetings no Hub** — dashboard de reuniões gravadas, histórico, reenvio de ata

---

## Estado Git

- Branch: `main`
- Sem commits para a sessao de 11/05/2026
- Todo o trabalho esta em arquivos locais nao commitados na pasta `07.3`

---

## Historico de checkpoints anteriores

### 15/04/2026 — Dashboards + DataLake + Zabbix (ambiente 07.2, porta 4200)

- remodelagem da tela `/dashboards` orientada a negocio
- semantica para tabelas e colunas do DataLake
- filtros de negocio e recorte por periodo nos widgets
- agrupamento temporal por dia, mes e ano
- modo de inspecao e edicao de widget existente
- historico de disponibilidade de host no Zabbix (24h, buckets de 5min)

### 11/04/2026 — Omnichannel + Outlook + TTS (ambiente 07.1, porta 4100)

- rota generica `POST /api/communications/inbound`
- TTS server-side para `group-brief`
- Outlook corporativo implementado, bloqueado por tenant/app registration

Bloqueio Outlook pendente:
```
AADSTS700016: Application '2ac9514c-b0f1-4c03-9c7e-0e7cc6888936'
not found in directory 'B R A SERVICOS DE COMUNICACAO LTDA'
```
Solucao: criar novo app registration no tenant correto do Microsoft Entra.
