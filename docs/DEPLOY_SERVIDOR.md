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

### O que ainda não funciona — aguarda liberação de firewall
- **Zabbix** — porta `8989` bloqueada para o IP `10.250.110.238`
- **Data Lake MySQL** — porta `3306` bloqueada para o IP `10.250.110.238`

O time de firewall foi acionado em 2026-05-12 para liberar essas portas.

### O que ainda não foi ativado
- **Evolution API** — não instalada no servidor (planejado para próxima etapa)

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
