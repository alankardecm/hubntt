# Deploy do HUB 07.3 no Servidor

Documento criado em 2026-05-12. Registra o estado atual do deploy, como foi feito e o que ainda falta.

---

## 1. O que é este projeto

O **07.3** é a evolução do **07.2 (HUB NETTURBO)**, com a diferença principal de preparar suporte à **Evolution API** no lugar do Baileys para comunicação WhatsApp.

O código-base é o mesmo do 07.2. A Evolution API ainda não foi ativada — o projeto está rodando no servidor sem ela, exatamente como o 07.2 funcionava.

---

## 2. Onde está

| Item | Valor |
|------|-------|
| Servidor | `10.250.110.238` |
| Porta | `4200` |
| URL de acesso | `http://10.250.110.238:4200` |
| Caminho no servidor | `/opt/DESENVOLVIMENTO_E_TESTE/hubntt` |
| Repositório GitHub | `https://github.com/netturbo-tech/hubntt` |
| Branch | `master` |
| Processo PM2 | `hub-ntt-73` |

---

## 3. Como acessar

Pelo navegador, dentro da rede:

```
http://10.250.110.238:4200
```

---

## 4. Estado atual (2026-05-12)

### O que funciona
- IA Comunicação (WA Monitor com Baileys)
- Dashboards
- RAG
- Supabase (mensagens, grupos, análise)

### O que funciona — confirmado em 2026-05-12
- **Zabbix** — funcionando. O hostname `monitor.netturbosolucoes.com.br` não resolvia DNS no servidor. Solução: usar o IP direto `186.209.32.130` na variável `ZABBIX_URL` do `.env.local`
- **Data Lake MySQL** — funcionando após liberação de firewall

### O que ainda não foi ativado
- **Evolution API** — não instalada no servidor (planejado para próxima etapa)

---

## 4.2 Correções aplicadas em 2026-05-12

### Bug: `c.toLowerCase is not a function`
**Causa:** `filterValue` chegava como número vindo da IA (ex: ID numérico), e o código chamava `.toLowerCase()` sem garantir string.
**Fix:** `src/app/api/datalake/query/route.ts` — conversão `String(filterValue)` na entrada e nas comparações.

### Bug: Smart assistant retornando valores absurdos (ex: 556.337 contratos)
**Causa:** A IA usava `fato_contratos` (tabela de eventos — N linhas por contrato) para contar contratos, e somava `valor_total` em vez de fazer COUNT.
**Fix:** Mapeamento explícito no prompt: `crm_Funter` = uma linha por contrato, usar para contagens. `fato_contratos` = eventos, usar apenas para métricas financeiras.

### Melhoria: Smart assistant com valores reais das colunas
**O que faz:** Antes de gerar os widgets, o assistente busca os valores DISTINCT das colunas categóricas diretamente do MySQL e inclui no prompt.
**Resultado:** A IA usa os valores exatos do banco (ex: o valor real do campo `estagio`) em vez de adivinhar. Elimina filtros sem match.
**Arquivo:** `src/modules/datalake/application/smart-assistant.ts`

---

## 4.1 Status do Bridge Baileys (2026-05-12)

O bridge foi iniciado manualmente via terminal SSH e confirmado funcionando às 11:14 — mensagens dos grupos WhatsApp chegando em tempo real no dashboard de IA Comunicação.

Para subir o bridge no servidor:

```bash
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt

# Primeira vez: instalar dependências do bridge
npm run wa-bridge:install

# Rodar para escanear o QR code (terminal interativo)
npm run wa-bridge
```

Após escanear o QR code com o WhatsApp do número monitorado, a sessão fica salva em `08 - IA COMUNICACAO/bridge/auth_session/`. Em seguida, subir como processo permanente em outro terminal:

```bash
pm2 start npm --name "wa-bridge" -- run wa-bridge
pm2 save
```

Para verificar se está recebendo mensagens:

```bash
pm2 logs wa-bridge --lines 30
```

---

## 5. Como foi feito o deploy (passo a passo)

### 5.1 Pré-requisitos resolvidos no servidor

```bash
# Node.js estava na versão 18, Next.js 16 exige >= 20
# Instalar nvm e subir para Node 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
```

### 5.2 Clonar / atualizar o repositório

O repositório já estava clonado em `/opt/DESENVOLVIMENTO_E_TESTE/hubntt`.

```bash
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt
git pull origin master
```

### 5.3 Instalar dependências

```bash
# Obrigatório usar --legacy-peer-deps por conflito de versão do zod entre pacotes
npm install --legacy-peer-deps
```

### 5.4 Build de produção

```bash
# NODE_OPTIONS limita RAM para não travar o servidor (2GB total)
NODE_OPTIONS="--max-old-space-size=1400" npm run build
```

> O `next.config.mjs` já está configurado com `typescript: { ignoreBuildErrors: true }` e `eslint: { ignoreDuringBuilds: true }` para agilizar o build em produção.

### 5.5 Criar o arquivo .env.local no servidor

O `.env.local` não vai para o GitHub (está no `.gitignore`). Precisa ser criado manualmente no servidor:

```bash
nano /opt/DESENVOLVIMENTO_E_TESTE/hubntt/.env.local
```

Colar o conteúdo do `.env.local` local (pasta do projeto 07.3 na máquina de desenvolvimento), ajustando as variáveis de URL para o servidor:

```
NEXT_PUBLIC_APP_URL=http://10.250.110.238:4200
MS_REDIRECT_URI=http://10.250.110.238:4200/api/communications/outlook/auth/callback
```

### 5.6 Subir com PM2

```bash
PORT=4200 pm2 start npm --name "hub-ntt-73" -- run start
pm2 save
```

---

## 6. Comandos úteis no servidor

```bash
# Ver status
pm2 list

# Ver logs em tempo real
pm2 logs hub-ntt-73

# Reiniciar após mudança de .env
pm2 restart hub-ntt-73

# Parar
pm2 stop hub-ntt-73

# Ver últimas 50 linhas de log
pm2 logs hub-ntt-73 --lines 50
```

---

## 7. Como atualizar o código no servidor

```bash
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt

# Garantir que nvm está ativo
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

git pull origin master
npm install --legacy-peer-deps
NODE_OPTIONS="--max-old-space-size=1400" npm run build
pm2 restart hub-ntt-73
```

---

## 8. Como adicionar a Evolution API (próxima etapa)

A Evolution API é a única diferença entre o 07.2 e o 07.3. Os arquivos já existem no código local (não commitados ainda).

### 8.1 Instalar Docker no servidor (se ainda não tiver)

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

### 8.2 Commitar os arquivos da Evolution API

Na máquina de desenvolvimento, dentro da pasta do 07.3:

```bash
git add docker-compose.evolution.yml
git add src/app/api/evolution/
git add src/app/dashboard/whatsapp/
git add src/lib/evolution-api.ts
git add src/lib/evolution-bot.ts
git commit -m "feat: adiciona Evolution API"
git push origin master
```

### 8.3 No servidor — subir a Evolution API via Docker

```bash
cd /opt/DESENVOLVIMENTO_E_TESTE/hubntt
git pull origin master

# Subir Evolution API (PostgreSQL + Redis + Evolution API)
docker-compose -f docker-compose.evolution.yml up -d
```

### 8.4 Configurar variáveis de ambiente

Adicionar no `.env.local` do servidor:

```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=netturbo-evolution-key-2026
EVOLUTION_INSTANCE_NAME=netturbo-prod
```

### 8.5 Fazer rebuild e reiniciar

```bash
NODE_OPTIONS="--max-old-space-size=1400" npm run build
pm2 restart hub-ntt-73
```

---

## 9. Backup de segurança

Foi criada uma tag no GitHub antes do deploy:

```
backup-20260512
```

Para restaurar este estado:

```bash
git checkout backup-20260512
```

---

## 10. Observações importantes

- O servidor tem **2GB de RAM** — o build consome bastante. Sempre usar `NODE_OPTIONS="--max-old-space-size=1400"` ao buildar.
- O `npm install` exige `--legacy-peer-deps` por conflito entre `zod@4` (projeto) e `zod@3` (alguns pacotes LangChain).
- O Node.js do servidor foi atualizado de 18 para 20 via `nvm`. A cada nova sessão SSH, rodar `nvm use 20` antes de qualquer comando npm/node.
- O `.env` e `.env.local` nunca são commitados. Devem ser mantidos manualmente no servidor.
