# Ponto de Recuperacao - Netturbo Hub

Este arquivo serve como checkpoint oficial para retomada rapida do HUB na proxima sessao.

---

## PONTO DE RECUPERACAO ATUAL (11/05/2026 — fim de sessao)

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
ZABBIX_URL=http://monitor.netturbosolucoes.com.br:8989/api_jsonrpc.php
ZABBIX_API_TOKEN=9e9efb19c31a8dd0c57f803af5336fa9e45580f703770986a4049dd5f971fc6e

# DataLake MySQL
MYSQL_HOST=10.250.111.102
MYSQL_PORT=3306
MYSQL_DATABASE=NTT_DataLake_01
MYSQL_USER=alan.kardec
MYSQL_PASSWORD=ZMaxdnT2I6f8DCaBMnZuU9cklcuH2eeA
```

---

## Proximas frentes sugeridas

1. **Relatorio NOC agendado** — ao detectar alarme DISASTER no Zabbix, bot avisa grupo de NOC automaticamente
2. **Ampliar bot para grupos** — responder `/status`, `/chamados` em grupos configurados (hoje so responde mensagens diretas)
3. **Persistir registro LID no Supabase** — hoje fica em `.bot-registry.json` local, perde no deploy em servidor
4. **Envio proativo** — relatorio diario de chamados e status da rede no horario configurado
5. **Mais tabelas no DataLake** — liberar `fato_pesquisas` (CSAT), `crm_funter` para consulta pelo bot

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
