# Ponto de Recuperacao - IA Comunicacao

Data de referencia: 2026-04-09
Ultima sessao: Alan Moreira + Codex

## Estado atual do modulo

O modulo esta funcional e com duas frentes principais estabilizadas:

1. operacao de grupos de WhatsApp
2. resumo consolidado do periodo por grupo com audio local

## O que esta funcionando

### Captura e processamento

- bridge conecta ao WhatsApp Business via Baileys
- hub recebe mensagens em `POST /api/wa-monitor/inbound`
- sentimento classificado por Groq com fallback local
- dados persistidos em:
  - `wa_groups`
  - `wa_messages`
  - `wa_analysis`
  - `wa_daily_insights`

### Dashboard `/dashboard/comunicacao`

- grupos monitorados com status
- mapa de palavras
- distribuicao de sentimento
- alertas de pressao negativa
- exportacao por grupo
- resumo diario por grupo
- resumo consolidado do periodo por grupo

### Novo fluxo: resumo consolidado

Foi adicionado:

- endpoint `GET /api/wa-monitor/group-brief`
- botao `Resumo conversas` em cada card de grupo
- painel lateral com:
  - titulo
  - resumo do periodo
  - metricas
  - palavras-chave
  - highlights
  - botao `Ouvir resumo do periodo`

### Audio

O audio atual:

- usa `speechSynthesis`
- nao gera arquivo `.mp3`
- depende do navegador
- narra o campo `audio_script` retornado pela API

## Ordem de fallback da IA no resumo consolidado

1. Groq
2. OpenAI
3. fallback local heuristico

Arquivos principais:

- `src/app/api/wa-monitor/group-brief/route.ts`
- `src/lib/ai.ts`
- `src/app/dashboard/comunicacao/page.tsx`

## O que foi documentado nesta janela

Foram atualizados:

- `07 - HUB NETTURBO/README.md`
- `07 - HUB NETTURBO/DOCUMENTACAO_TECNICA_HUB.md`
- `08 - IA COMUNICACAO/README.md`
- `08 - IA COMUNICACAO/DOCUMENTACAO_TECNICA.md`
- `07 - HUB NETTURBO/CHANGELOG_HUB.md`
- `08 - IA COMUNICACAO/CHANGELOG.md`

## RAG relacionado nesta janela

O RAG do hub foi trabalhado em paralelo porque ele consome a mesma base Turbo-Docs do ambiente:

- `src/lib/rag.ts`
- `src/app/api/chat/route.ts`

Casos testados:

- `como configurar o ATA Grandstream HT818 de 8 portas`
- `como configurar um DM2104`

Conclusao atual:

- o Pinecone encontra a documentacao correta
- `DM2104` passou a recuperar o documento certo no topo
- ainda existe espaco para melhorar a formatacao final da resposta procedural
- `HT818` ainda precisa de refinamento para ficar mais fiel ao manual do Turbo-Docs

## Como retomar daqui

1. abrir `15 - PROJETO IA NETTURBO/07 - HUB NETTURBO`
2. garantir `.env.local`
3. rodar:

```bash
npm run dev
```

4. subir a bridge em outro terminal:

```bash
npm run wa-bridge
```

5. abrir `/dashboard/comunicacao`
6. testar o botao `Resumo conversas` em um grupo com mensagens reais
7. validar o audio do resumo
8. se a retomada for no RAG, abrir `/rag` e testar `DM2104` e `HT818`

## Arquivos principais do checkpoint

```
07 - HUB NETTURBO/
|-- src/app/dashboard/comunicacao/page.tsx
|-- src/app/api/wa-monitor/group-brief/route.ts
|-- src/app/api/wa-monitor/export/route.ts
|-- src/app/api/wa-monitor/daily-insights/generate/route.ts
|-- src/lib/ai.ts
|-- src/lib/rag.ts
|-- src/app/api/chat/route.ts
|-- README.md
|-- DOCUMENTACAO_TECNICA_HUB.md
|-- PONTO_RECUPERACAO_HUB.md
`-- 08 - IA COMUNICACAO/
    |-- README.md
    |-- DOCUMENTACAO_TECNICA.md
    |-- CHANGELOG.md
    `-- PONTO_RECUPERACAO.md
```

## Validacao executada

Build validado repetidamente:

```bash
npm run build
```

Status:

- aprovado

Warning nao bloqueante observado:

- `The width(-1) and height(-1) of chart should be greater than 0`

## Proximo passo natural no proximo chat

1. refinar o RAG procedural
2. melhorar a resposta do `HT818`
3. opcionalmente formatar comandos do RAG em bloco visual
4. se desejado, evoluir o audio do modulo para `.mp3` real
