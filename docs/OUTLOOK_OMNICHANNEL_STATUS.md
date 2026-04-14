# Outlook e Omnichannel - Status Atual

Este documento registra o que foi implementado no HUB para a frente omnichannel e a tentativa de integracao com Outlook corporativo.

## Objetivo

Evoluir o modulo de comunicacao, hoje centrado em WhatsApp, para uma base omnichannel capaz de receber mensagens de multiplos canais e consolidar leitura, sentimento, resumo e audio.

## O que ja foi implementado

### 1. Fundacao omnichannel no backend

Foi criada uma rota generica de ingestao:

- `POST /api/communications/inbound`

Arquivos principais:

- `src/app/api/communications/inbound/route.ts`
- `src/modules/communication/application/persist-inbound-communication.ts`
- `src/shared/types/omnichannel.ts`

Essa base:

- aceita `source` como `whatsapp`, `telegram`, `instagram`, `email`, `webchat`, `sms` e `other`
- reaproveita o pipeline de analise ja existente
- preserva compatibilidade com a estrutura atual do modulo de comunicacao

### 2. WhatsApp mantido sobre a nova base

A rota antiga:

- `POST /api/wa-monitor/inbound`

passou a delegar a persistencia para a camada compartilhada omnichannel, sem quebrar o fluxo atual do bridge.

### 3. Audio premium para o resumo

Foi adicionada geracao de audio server-side para o resumo das conversas:

- `POST /api/wa-monitor/group-brief/audio`

Arquivos principais:

- `src/lib/tts.ts`
- `src/app/api/wa-monitor/group-brief/audio/route.ts`
- `src/app/dashboard/comunicacao/page.tsx`

Comportamento:

- tenta gerar audio real no servidor via OpenAI TTS
- se nao estiver disponivel, usa fallback local do navegador

### 4. Outlook corporativo no backend

Foi criada a base tecnica para Microsoft Graph / Outlook:

- `GET /api/communications/outlook/auth/start`
- `GET /api/communications/outlook/auth/callback`
- `GET /api/communications/outlook/status`
- `POST /api/communications/outlook/sync`

Arquivos principais:

- `src/lib/outlook.ts`
- `src/app/api/communications/outlook/auth/start/route.ts`
- `src/app/api/communications/outlook/auth/callback/route.ts`
- `src/app/api/communications/outlook/status/route.ts`
- `src/app/api/communications/outlook/sync/route.ts`

### 5. Outlook corporativo no frontend

Foi adicionada uma secao no dashboard `/dashboard/comunicacao` com:

- status de configuracao
- status de conexao
- nome e email da conta
- botao `Conectar Outlook`
- botao `Sincronizar emails`

Arquivo principal:

- `src/app/dashboard/comunicacao/page.tsx`

## Configuracao usada

Variaveis esperadas para Outlook:

```text
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_REDIRECT_URI=
MS_POST_AUTH_REDIRECT=
```

Durante os testes:

- `MS_TENANT_ID=common`
- redirect local: `http://localhost:4100/api/communications/outlook/auth/callback`

## O que foi feito no Microsoft Entra

No app existente `NOC GPT (Microsoft Copilot Studio)`:

- foi adicionado o redirect URI web local
- foram adicionadas permissoes delegadas:
  - `User.Read`
  - `Mail.Read`
  - `offline_access`
- o tipo de conta foi alterado para multi-tenant (`Varios locatarios de ID de Entra`)
- a opcao foi ajustada para permitir todos os locatarios

## Bloqueio atual

Mesmo apos os ajustes, a autenticacao falhou com:

```text
AADSTS700016: Application with identifier '2ac9514c-b0f1-4c03-9c7e-0e7cc6888936'
was not found in the directory 'B R A SERVICOS DE COMUNICACAO LTDA'
```

Diagnostico mais provavel neste momento:

1. o app existente nao esta efetivamente disponivel/consentido para o tenant da conta usada no login
2. o tenant corporativo exige aprovacao/admin consent
3. o app `NOC GPT (Microsoft Copilot Studio)` nao e o melhor candidato para reaproveitamento nesse fluxo

## Recomendacao para a proxima sessao

O caminho mais seguro para concluir Outlook e:

1. criar um app novo dedicado no tenant correto da conta que sera usada
2. configurar:
   - `User.Read`
   - `Mail.Read`
   - `offline_access`
   - redirect URI local
3. usar o novo `client_id` e o novo `client_secret` no `.env.local`
4. retestar o fluxo no dashboard

## Estado de validacao

Ja validado localmente:

- `eslint`
- `npx tsc --noEmit`

Validado no produto:

- bloco Outlook aparece no dashboard
- backend de auth/sync existe
- omnichannel base existe

Nao validado ainda:

- login Microsoft completo com sucesso
- sincronizacao real de emails em tenant corporativo

## Como retomar

1. abrir `docs/OUTLOOK_OMNICHANNEL_STATUS.md`
2. confirmar o tenant correto da conta que sera usada
3. decidir entre:
   - pedir ao admin um app novo no tenant correto
   - ou obter consentimento/instalacao do app atual no tenant corporativo
4. atualizar `.env.local`
5. subir o HUB em `4100`
6. testar `Conectar Outlook`
