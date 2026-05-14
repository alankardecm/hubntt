# Ponto de Recuperacao - Netturbo Hub

Este arquivo serve como checkpoint oficial para retomada rapida do HUB na proxima sessao.

---

## PONTO DE RECUPERACAO ATUAL (13/05/2026 — 22h — fim de sessao)

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

1. **Diagnóstico (`/settings`)** — ainda usa tema escuro antigo, fora do padrão Netturbo claro
2. **Bot WhatsApp** — ainda recebe erros 401 para mensagens antigas em cache (residuo da migração wa-bridge → Evolution API); vai sumir naturalmente com o tempo
3. **Autenticação** — planejada via Active Directory (Azure AD / LDAP); não iniciada
4. **Supabase → PostgreSQL local** — PostgreSQL já instalado no servidor; migração dos dados do Supabase não iniciada
5. **Alertas proativos Zabbix** — bot enviar mensagem automática ao detectar alarme DISASTER
6. **NetMeet via WhatsApp** — ✅ implementado e testado em produção (13/05/2026) — áudio → Whisper → GPT → ata no WhatsApp funcionando

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
