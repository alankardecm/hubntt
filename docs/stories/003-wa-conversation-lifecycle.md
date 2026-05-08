# Story 003 - Ciclo de conversas do WPP IA

## Status

Ready for Review

## Story

Como usuario do Hub Netturbo,
quero identificar quando uma conversa de WhatsApp comeca e termina, se houve protocolo registrado e quanto tempo ficou sem resposta,
para acompanhar varios atendimentos abertos e fechados no mesmo grupo durante o dia.

## Acceptance Criteria

- [x] Existe uma forma CLI/API de consultar conversas detectadas por grupo e periodo.
- [x] A deteccao reconhece protocolos no padrao `#protocolo xxxxxx` e variacoes comuns.
- [x] Cada conversa detectada informa inicio, fechamento, status, motivo de fechamento e mensagens relacionadas.
- [x] Cada conversa detectada informa se teve protocolo registrado e quais protocolos foram encontrados.
- [x] Cada conversa detectada informa tempo ate primeira resposta e tempo sem resposta dentro da propria janela de conversa.
- [x] Conversas sem protocolo sao separadas por janela de inatividade configuravel.
- [x] O CSV de exportacao inclui uma planilha/logica de conversas detectadas.
- [x] Gates de qualidade executados.

## Tasks

- [x] Criar motor de inferencia de sessoes de conversa do WhatsApp.
- [x] Criar endpoint `GET /api/wa-monitor/conversation-sessions`.
- [x] Adicionar exportacao CSV `sheet=sessions`.
- [x] Adicionar opcao de exportacao no painel de comunicacao.
- [x] Exibir um bloco visivel de ciclo de conversas na dashboard de comunicacao.
- [x] Exibir protocolos detectados vinculados a conversa e evidencia.
- [x] Adicionar revisao opcional por IA via `ai=1`.
- [x] Tornar revisao por IA acionada sob demanda para evitar consumo recorrente de tokens.
- [x] Corrigir chaves duplicadas na lista de protocolos detectados.
- [x] Corrigir HTML invalido de botao aninhado no card de conversa.
- [x] Ajustar contraste do feed de mensagens em tema claro.
- [x] Registrar audio, imagem e outras midias sem legenda como atividade da conversa.
- [x] Atualizar documentacao minima da story.
- [x] Rodar lint, typecheck e teste disponivel.

## Checklist

- [x] Escopo confirmado pelo pedido do usuario
- [x] Arquitetura mantida como CLI/API first
- [x] Quality gates concluidos
- [x] File list atualizada

## Validation

- [x] `npm run lint` passou sem erros; restaram 2 warnings preexistentes em `src/app/rag/page.tsx` e `src/lib/tts.ts`.
- [x] `npm run typecheck` passou.
- [x] `npm run build` passou fora do sandbox apos falha `EPERM` no sandbox.
- [x] Servidor local iniciado em `http://localhost:4101` porque a porta `4100` ja estava ocupada.
- [x] `GET /api/health` respondeu 200 em `http://localhost:4101`.
- [x] `GET /dashboard/comunicacao` respondeu 200 em `http://localhost:4101`.
- [x] `GET /api/wa-monitor/conversation-sessions?days=1&limit=5` respondeu 200 em `http://localhost:4101`.
- [x] Bloco visual `Ciclo de conversas` adicionado logo abaixo dos KPIs principais.
- [x] `GET /api/wa-monitor/conversation-sessions?days=1&limit=20` respondeu 200 com `protocol_mentions` quando houver protocolo.
- [x] `GET /api/wa-monitor/conversation-sessions?days=1&limit=50` respondeu 200 sem acionar IA no refresh automatico.
- [x] Dashboard `/dashboard/comunicacao` respondeu 200 na porta `4100`.
- [x] Porta de teste `4101` encerrada; validacao atual segue pela `4100`.
- [x] `node --check "08 - IA COMUNICACAO/bridge/index.js"` passou apos fallback para midias.
- [x] Evento de audio das 09:03 do grupo `PROVEDOR IPV6 X NTT (LINK)` reparado via API local; endpoint passou a retornar 8 mensagens e ultima atividade em 09:03.
- [ ] `npm test` nao executado porque o `package.json` nao possui script `test`.

## File List

- [docs/stories/003-wa-conversation-lifecycle.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/stories/003-wa-conversation-lifecycle.md:1>)
- [src/modules/communication/application/wa-conversation-sessions.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/communication/application/wa-conversation-sessions.ts:1>)
- [src/modules/communication/application/load-wa-conversation-sessions.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/communication/application/load-wa-conversation-sessions.ts:1>)
- [src/app/api/wa-monitor/conversation-sessions/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/wa-monitor/conversation-sessions/route.ts:1>)
- [src/app/api/wa-monitor/inbound/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/wa-monitor/inbound/route.ts:1>)
- [src/app/api/wa-monitor/export/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/wa-monitor/export/route.ts:1>)
- [src/app/dashboard/comunicacao/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboard/comunicacao/page.tsx:1>)
- [src/lib/ai.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/lib/ai.ts:1>)
- [src/shared/schemas/ai-schemas.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/shared/schemas/ai-schemas.ts:1>)
- [08 - IA COMUNICACAO/bridge/index.js](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/08 - IA COMUNICACAO/bridge/index.js:1>)
- [08 - IA COMUNICACAO/docs/fluxo_de_ingestao.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/08 - IA COMUNICACAO/docs/fluxo_de_ingestao.md:1>)
- [README.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/README.md:1>)
- [DOCUMENTACAO_TECNICA_HUB.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/DOCUMENTACAO_TECNICA_HUB.md:1>)
