# Story 001 - NetMeet no Hub

## Status

In Progress

## Story

Como operador do Hub Netturbo,
quero abrir um modulo NetMeet dentro do proprio Hub para criar reunioes por link, concentrar transcript/resumo e acompanhar o historico,
para demonstrar o fluxo de reunioes sem depender de terminal nem de uma ferramenta separada.

## Acceptance Criteria

- [x] Existe um modulo `NetMeet` acessivel pela navegacao do Hub.
- [x] O modulo permite criar uma reuniao com nome, link e classificacao.
- [x] O modulo lista as reunioes criadas e mostra o detalhe da reuniao selecionada.
- [x] O modulo aceita transcript colado ou upload `.txt`.
- [x] O modulo gera resumo estruturado com Groq quando configurado e fallback local quando necessario.
- [x] O modulo pode publicar o resumo no Teams via webhook/workflow HTTP.
- [x] Os dados ficam persistidos localmente para reutilizacao durante a demo.

## Tasks

- [x] Criar persistencia local do modulo NetMeet no Hub.
- [x] Criar APIs internas do Hub para reunioes, transcript e processamento.
- [x] Criar pagina `NetMeet` dentro do workspace do Hub.
- [x] Integrar o modulo na home e na sidebar.
- [ ] Validar fluxo com uma reuniao de demo real.

## Checklist

- [x] Escopo confirmado
- [x] Arquitetura definida
- [x] File list atualizada

## File List

- [docs/stories/001-netmeet-no-hub.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/stories/001-netmeet-no-hub.md:1>)
- [src/app/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/page.tsx:1>)
- [src/app/dashboard/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboard/page.tsx:1>)
- [src/app/dashboard/netmeet/page.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/dashboard/netmeet/page.tsx:1>)
- [src/app/api/netmeet/meetings/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/netmeet/meetings/route.ts:1>)
- [src/app/api/netmeet/meetings/[id]/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/netmeet/meetings/[id]/route.ts:1>)
- [src/app/api/netmeet/meetings/[id]/transcript/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/netmeet/meetings/[id]/transcript/route.ts:1>)
- [src/app/api/netmeet/meetings/[id]/process/route.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/app/api/netmeet/meetings/[id]/process/route.ts:1>)
- [src/components/Sidebar.tsx](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/components/Sidebar.tsx:1>)
- [src/modules/netmeet/storage.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/netmeet/storage.ts:1>)
- [src/modules/netmeet/insights.ts](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/src/modules/netmeet/insights.ts:1>)
