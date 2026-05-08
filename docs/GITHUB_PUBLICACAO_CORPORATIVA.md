# Publicacao no GitHub Corporativo

Data de referencia desta publicacao:

- `2026-04-20`

Projeto:

- `07.1 - HUB NETTURBO REESTRUTURACAO`

Repositorio corporativo:

- `https://github.com/netturbo-tech/hubntt.git`

## Objetivo

Registrar o fluxo usado para publicar o estado atual do HUB reestruturado no GitHub da empresa sem perder o remoto pessoal ja existente.

Este documento e importante porque o ambiente local ainda convive com:

- conta pessoal no GitHub
- repositorio pessoal antigo
- repositorio corporativo novo

## Resultado final da publicacao

Repositorio de destino:

- `https://github.com/netturbo-tech/hubntt.git`

Branch publicada:

- `codex/hub-reestruturacao-estado-atual`

Commit publicado:

- `17abfdb`

Mensagem do commit:

- `hub netturbo estado atual reestruturado`

## Contexto de remotos

O projeto local ficou com dois remotos:

- `origin` -> repositorio pessoal
- `company` -> repositorio corporativo

Configuracao final:

```bash
origin  https://github.com/alankardecm/hubntt.git
company https://github.com/netturbo-tech/hubntt.git
```

Motivo:

- manter o remoto pessoal intacto
- publicar no remoto corporativo sem sobrescrever configuracoes antigas

## Problema encontrado

O primeiro push para o repositorio da empresa falhou com:

```text
remote: Permission to netturbo-tech/hubntt.git denied to alankardecm.
fatal: unable to access 'https://github.com/netturbo-tech/hubntt.git/': 403
```

Leitura correta do problema:

- o Git local ainda estava autenticando com a conta pessoal `alankardecm`
- o email configurado no repositorio nao resolve autenticacao sozinho
- o que manda no push e a credencial/token em cache

## Conta corporativa usada

Conta corporativa associada ao org:

- `alan.moreira@netturbo.com.br`

Observacao importante:

- `git config user.email` define autoria do commit
- autenticacao do push depende da credencial ativa do GitHub no Windows/navegador/token

## Fluxo executado

### 1. Confirmar a identidade local do repositorio

```powershell
git config user.name "Alan Moreira"
git config user.email "alan.moreira@netturbo.com.br"
git config --get user.name
git config --get user.email
```

### 2. Limpar a credencial antiga do GitHub

No Windows com Git Credential Manager:

```powershell
"protocol=https`nhost=github.com`n" | git credential-manager erase
```

Isso forca o Git a pedir autenticacao novamente no proximo push.

### 3. Adicionar o remoto corporativo sem perder o remoto pessoal

```powershell
git remote add company https://github.com/netturbo-tech/hubntt.git
```

### 4. Criar branch nova para publicacao segura

```powershell
git checkout -b codex/hub-reestruturacao-estado-atual
```

### 5. Stagear e commitar o estado atual

```powershell
git add -A
git commit -m "hub netturbo estado atual reestruturado"
```

### 6. Publicar no repositorio da empresa

```powershell
git push -u company codex/hub-reestruturacao-estado-atual
```

Durante esse push:

- o Git pediu autenticacao em navegador
- a autenticacao foi concluida com a conta corporativa
- o push passou com sucesso

## Validacoes feitas antes da publicacao

Antes do push, o projeto foi validado neste estado:

- `npm run lint`
- `npm run build`

Resultado:

- `lint` sem erros bloqueantes
- `build` concluido com sucesso

Tambem foram corrigidos pequenos pontos de TypeScript e tipagem antes da publicacao, principalmente em:

- `src/app/monitoring/noc/page.tsx`
- `src/app/api/wa-monitor/daily-insights/generate/route.ts`
- `src/app/dashboards/page.tsx`

## Como clonar e rodar no notebook de outra pessoa

Exemplo para o seu chefe:

```powershell
git clone -b codex/hub-reestruturacao-estado-atual https://github.com/netturbo-tech/hubntt.git
cd hubntt
npm install --legacy-peer-deps
$env:PORT=4100
npm run dev:wasm
```

Abrir:

- `http://localhost:4100`
- `http://localhost:4100/api/health`

## O que NAO foi para o GitHub

Arquivos de ambiente continuam fora do repositorio:

- `.env`
- `.env.local`
- `.env.example` pode existir como referencia, mas nao substitui as credenciais reais

Isso significa que para rodar tudo como no seu ambiente hoje ainda sera necessario fornecer:

- credenciais do Supabase
- credenciais do Data Lake MySQL
- chaves de IA
- variaveis do Outlook
- variaveis do WhatsApp bridge
- tokens do Zabbix, se aplicavel

## Recomendacao operacional daqui para frente

Se voce continuar usando os dois contextos GitHub no mesmo Windows:

1. mantenha `origin` como pessoal e `company` como corporativo
2. confirme sempre o remoto antes de publicar
3. use branch nova para publicacoes de validacao
4. quando o Git pedir autenticacao, confira se abriu a conta correta

Comandos uteis:

```powershell
git remote -v
git branch --show-current
git status -sb
```

## Se o push voltar a ir para a conta pessoal

Repita:

```powershell
"protocol=https`nhost=github.com`n" | git credential-manager erase
```

Depois rode novamente:

```powershell
git push -u company codex/hub-reestruturacao-estado-atual
```

E autentique com a conta corporativa.

## Resumo curto

- o projeto foi publicado com sucesso no GitHub da empresa
- o remoto pessoal foi preservado
- a branch publicada foi `codex/hub-reestruturacao-estado-atual`
- a autenticacao precisou ser trocada da conta pessoal para a corporativa
- o codigo subiu, mas os `.env` continuam locais

