# Como Acessar o HUB

Este documento foi criado para facilitar o acesso ao `HUB NETTURBO` por outra pessoa no ambiente local.

Repositorio:

- `https://github.com/netturbo-tech/hubntt`

Branch publicada com o estado atual do projeto:

- `codex/hub-reestruturacao-estado-atual`

## Objetivo

Permitir que outra pessoa:

- clone o projeto
- instale as dependencias
- configure o ambiente local
- rode o HUB
- entenda quais APIs e integracoes externas sao necessarias

## 1. Como baixar o projeto

No terminal:

```powershell
git clone -b codex/hub-reestruturacao-estado-atual https://github.com/netturbo-tech/hubntt.git
cd hubntt
```

## 2. Como instalar dependencias

```powershell
npm install --legacy-peer-deps
```

## 3. Criar o arquivo `.env.local`

Para o projeto funcionar corretamente, e necessario criar um arquivo:

- `.env.local`

Esse arquivo nao vai no GitHub e deve ser criado localmente na raiz do projeto.

### Como criar

1. copiar a base de `.env.example`
2. criar um novo arquivo chamado `.env.local`
3. preencher as variaveis reais do ambiente

Exemplo:

```powershell
Copy-Item .env.example .env.local
```

Depois, abrir o `.env.local` e preencher os valores corretos.

## 4. Variaveis de ambiente principais

### 4.1 Supabase

Necessarias para persistencia operacional do HUB:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4.2 OpenAI / IA

Necessarias para chat, automacoes, resumos e parte das respostas:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`

### 4.3 Groq

Usado em partes do pipeline de resumo e processamento:

- `GROQ_API_KEY`
- `GROQ_MODEL`

### 4.4 Google / Gemini

Usado em embeddings e fluxos relacionados:

- `GOOGLE_API_KEY`

### 4.5 Pinecone

Necessario para a parte de RAG / busca vetorial:

- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

### 4.6 Data Lake MySQL

Necessario para a tela `/datalake`, dashboards e leituras operacionais:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `DATALAKE_ALLOWED_TABLES`
- `DATALAKE_PREVIEW_LIMIT`

### 4.7 Outlook / Microsoft Graph

Necessario para o modulo omnichannel com Outlook:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_REDIRECT_URI`
- `MS_POST_AUTH_REDIRECT`

### 4.8 Zabbix

Necessario para monitoramento e tela de infra:

- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`

### 4.9 WhatsApp / Bridge

Necessario para ingestao, grupos, resumos e monitor:

- `WHATSAPP_CAPTURE_TOKEN`

### 4.10 URL publica/local do app

Pode ser usada por partes do projeto que precisam conhecer a URL local:

- `NEXT_PUBLIC_APP_URL`

Recomendado localmente:

```text
NEXT_PUBLIC_APP_URL=http://localhost:4100
```

## 5. Como subir o projeto

No Windows, o modo recomendado neste projeto e:

```powershell
$env:PORT=4100
npm run dev:wasm
```

## 6. Como acessar

Depois que o projeto subir, acessar:

- home: `http://localhost:4100`
- healthcheck: `http://localhost:4100/api/health`

## 7. Rotas principais do HUB

- `/` - home
- `/dashboard` - workspace geral
- `/dashboards` - construtor de dashboards
- `/datalake` - explorer do Data Lake
- `/dashboard/noc` - camada Infra
- `/monitoring/noc` - leitura NOC 360
- `/monitoring/zabbix` - monitoramento Zabbix
- `/dashboard/comunicacao` - IA Comunicacao / omnichannel
- `/dashboard/custos` - leitura de custos
- `/rag` - assistente com busca contextual

## 8. APIs principais usadas pelo HUB

### 8.1 Health

- `GET /api/health`

Serve para validar se o app subiu corretamente.

### 8.2 Data Lake

- `GET /api/datalake/health`
- `GET /api/datalake/schema`
- `GET /api/datalake/columns?table=<nome>`
- `GET /api/datalake/preview?table=<nome>`
- `POST /api/datalake/query`
- `POST /api/datalake/dashboard-suggestions`

Essas rotas dependem do MySQL/Data Lake configurado corretamente no `.env.local`.

### 8.3 Zabbix

- `GET /api/zabbix`

Depende de:

- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`

### 8.4 WhatsApp Monitor

- `POST /api/wa-monitor/inbound`
- `GET /api/wa-monitor/groups`
- `GET /api/wa-monitor/insights`
- `POST /api/wa-monitor/daily-insights/generate`
- `GET /api/wa-monitor/export`
- `POST /api/wa-monitor/group-brief`
- `POST /api/wa-monitor/group-brief/audio`

Dependem da configuracao de Supabase, IA e, conforme o fluxo, integracao da captura do WhatsApp.

### 8.5 Comunicacao / Outlook

- `POST /api/communications/inbound`
- `GET /api/communications/outlook/status`
- `GET /api/communications/outlook/messages`
- `POST /api/communications/outlook/sync`
- `GET /api/communications/outlook/auth/start`
- `GET /api/communications/outlook/auth/callback`
- `POST /api/communications/outlook/disconnect`
- `POST /api/communications/omnichannel/summary`

Dependem da configuracao Microsoft Graph no `.env.local`.

### 8.6 Chat / RAG

- `POST /api/chat`

Depende de:

- OpenAI
- Gemini
- Pinecone
- configuracao correta do RAG

## 9. O que precisa estar funcionando para "rodar tudo"

Para o HUB abrir a interface basica, o codigo e as dependencias bastam.

Mas para rodar `tudo` de verdade, tambem e preciso:

- acesso ao Supabase
- acesso ao Data Lake MySQL
- acesso ao Zabbix
- chaves de IA validas
- configuracao do Outlook no tenant correto
- fluxo de captura do WhatsApp habilitado

Ou seja:

- sem `.env.local`, o projeto nao sobe corretamente em todas as rotas
- com `.env.local` incompleto, a interface pode abrir, mas varios modulos falharao

## 10. Como validar rapidamente

### Passo 1

Subir o projeto:

```powershell
$env:PORT=4100
npm run dev:wasm
```

### Passo 2

Testar:

- `http://localhost:4100/api/health`

### Passo 3

Abrir as principais telas:

- `http://localhost:4100/datalake`
- `http://localhost:4100/dashboard/comunicacao`
- `http://localhost:4100/monitoring/zabbix`
- `http://localhost:4100/rag`

## 11. Problemas mais comuns

### O projeto abre, mas o Data Lake falha

Verificar:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- whitelist de rede

### O Outlook nao conecta

Verificar:

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- redirect URI cadastrada
- tenant correto da conta

### O RAG abre, mas nao responde bem

Verificar:

- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

### O Zabbix nao retorna dados

Verificar:

- `ZABBIX_URL`
- `ZABBIX_API_TOKEN`
- acesso de rede ao Zabbix

## 12. Resumo rapido

Para acessar o HUB:

1. clonar a branch correta
2. instalar dependencias
3. criar `.env.local`
4. preencher as credenciais
5. subir com `npm run dev:wasm`
6. acessar `http://localhost:4100`

