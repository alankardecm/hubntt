# Reestruturacao do HUB NETTURBO

## 1. Objetivo

Transformar o HUB NETTURBO em uma base empresarial solida para:

- operar modulos criticos da Netturbo com confiabilidade
- escalar novas funcionalidades sem degradar o que ja funciona
- reduzir acoplamento entre interface, integracoes e regras de negocio
- preparar o projeto para manutencao continua, crescimento por modulo e uso orientado por equipe

Este documento e o artefato inicial de arquitetura para orientar a reestruturacao com apoio do AIOX.

## 2. Diagnostico do estado atual

## Pontos fortes

- Ja existe um hub unico com proposta clara de centralizacao operacional.
- A base usa stack moderna: Next.js 16, React 19 e TypeScript.
- O projeto ja integra IA, Pinecone, Supabase, Zabbix e monitoramento de WhatsApp.
- O modulo de comunicacao mostra capacidade real de gerar valor operacional.
- A navegacao modular do hub permite evolucao incremental sem reiniciar o projeto do zero.

## Fragilidades estruturais

### 2.1 Acoplamento alto

- A rota [`src/app/api/chat/route.ts`](/C:/Users/alan.moreira/Documents/00%20-%202026/15%20-%20PROJETO%20IA%20NETTURBO/07%20-%20HUB%20NETTURBO/src/app/api/chat/route.ts) concentra responsabilidades demais.
- O fluxo mistura orquestracao de prompt, RAG, heuristica procedural, decisao operacional de Zabbix e fallback de provedores na mesma camada.
- Isso dificulta manutencao, testes, debug e extensao.

### 2.2 Fronteiras de dominio pouco claras

- `RAG`, `Zabbix`, `IA Comunicacao`, `DataLake` e dashboards convivem no mesmo app sem boundaries fortes.
- Parte da logica de negocio vive em `route handlers`, parte em `src/lib`, parte em scripts externos e parte em assets estaticos.
- O projeto funciona como hub, mas ainda nao opera como plataforma modular.

### 2.3 Naming e identidade tecnica inconsistentes

- O `package.json` ainda esta como `portal-v3`.
- O rebranding funcional para HUB NETTURBO ainda nao foi completado na base tecnica.
- Isso aumenta ruido para onboarding, documentacao e padronizacao futura.

### 2.4 Mistura de camada de produto com camada de integracao

- O mesmo projeto atende interface, APIs, regras operacionais e integracoes externas.
- O bridge do WhatsApp vive ao lado do hub, mas sem uma divisao de ownership suficientemente clara.
- A empresa fica dependente de uma estrutura que tende a crescer em espiral.

### 2.5 Baixa blindagem operacional

- Ainda nao ha evidencias claras de:
- politica de erro padronizada
- observabilidade por modulo
- validacoes de contrato entre camadas
- testes automatizados por dominio
- governanca consistente de configuracoes e segredos

## 3. Leitura estrategica

O projeto nao precisa ser descartado. Ele precisa passar de um hub funcional de crescimento organico para uma plataforma operacional modular.

Em termos empresariais, o foco nao deve ser "refatorar por elegancia". O foco deve ser:

- reduzir risco operacional
- aumentar previsibilidade de manutencao
- acelerar novas entregas
- permitir que o hub vire base duravel para a empresa

## 4. Arquitetura-alvo

## Principio central

Adotar uma arquitetura modular por dominios, com separacao explicita entre:

- experiencia web
- aplicacao/orquestracao
- servicos de dominio
- integracoes externas
- ativos legados

## Estrutura alvo sugerida

```text
src/
|- app/
|  |- (marketing|home)
|  |- dashboard/
|  |- api/
|  `- monitoring/
|- modules/
|  |- chat/
|  |- rag/
|  |- zabbix/
|  |- communication/
|  |- datalake/
|  `- dashboards/
|- shared/
|  |- ui/
|  |- config/
|  |- types/
|  |- utils/
|  |- errors/
|  `- observability/
`- infrastructure/
   |- ai/
   |- vector/
   |- database/
   |- monitoring/
   `- messaging/
```

## Papel de cada camada

### `app/`

- rotas, paginas e entrypoints HTTP
- sem regra pesada de negocio
- apenas composicao, autenticacao, validacao e resposta

### `modules/`

- dominio de negocio por contexto funcional
- casos de uso, services, mapeadores, regras e contratos
- ownership claro por modulo

### `shared/`

- primitivas reutilizaveis
- utilitarios transversais
- padroes de erro, tipos e componentes comuns

### `infrastructure/`

- adaptadores para OpenAI, Groq, Pinecone, Supabase, Zabbix e WhatsApp
- detalhes tecnicos isolados do dominio
- camada ideal para trocar provedor sem reescrever o modulo inteiro

## 5. Alvos de reestruturacao por modulo

## 5.1 Chat e RAG

### Estado atual

- forte concentracao em uma unica rota
- heuristica, RAG e resposta final misturados

### Estado alvo

- `modules/chat` para orquestracao conversacional
- `modules/rag` para retrieval, ranking e formatacao de contexto
- `infrastructure/ai` para provedores de LLM
- `infrastructure/vector` para Pinecone e embeddings

## 5.2 Zabbix

### Estado atual

- contexto operacional e resposta executiva acoplados ao chat principal

### Estado alvo

- `modules/zabbix` com casos de uso como:
- consultar alarmes
- montar resumo executivo
- normalizar eventos
- `infrastructure/monitoring/zabbix` para API e mapeamento tecnico

## 5.3 IA Comunicacao

### Estado atual

- modulo valioso, mas ainda muito preso ao app principal

### Estado alvo

- `modules/communication` com subcamadas para:
- ingestao
- analise
- resumo diario
- brief consolidado
- exportacao
- `infrastructure/messaging` para bridge e conectores

## 5.4 Dashboards e ativos legados

### Estado atual

- dashboards HTML preservados em `public/`
- integracao funcional, mas arquiteturalmente fraca

### Estado alvo

- manter legado encapsulado como adaptador temporario
- definir quais dashboards serao:
- preservados
- migrados para React
- descontinuados

## 6. Roadmap de reestruturacao

## Fase 1 - Fundacao arquitetural

Objetivo: criar estrutura sem quebrar operacao.

Entregas:

- renomear identidade tecnica do projeto para HUB NETTURBO
- criar pasta `docs/` como fonte oficial de arquitetura e plano
- definir convencoes de modulos, naming, erros, logs e configuracao
- criar mapa de dominios: chat, rag, zabbix, communication, datalake, dashboards
- estabelecer diretriz: `route.ts` nao concentra regra de negocio

## Fase 2 - Extracao de servicos criticos

Objetivo: tirar inteligencia pesada das rotas.

Entregas:

- extrair fluxo de `api/chat` para services dedicados
- separar RAG, decisao operacional e resposta final
- isolar provedores de LLM
- criar contratos de entrada e saida por caso de uso

## Fase 3 - Modularizacao por dominio

Objetivo: transformar o hub em plataforma.

Entregas:

- introduzir `modules/chat`
- introduzir `modules/rag`
- introduzir `modules/zabbix`
- introduzir `modules/communication`
- mover codigo de negocio de `src/lib` para modulos com ownership claro

## Fase 4 - Blindagem operacional

Objetivo: deixar o sistema pronto para uso serio e continuado.

Entregas:

- padrao unico de tratamento de erro
- validacao de ambiente e configuracao
- logging estruturado por modulo
- health checks por integracao
- testes minimos para fluxos criticos

## Fase 5 - Evolucao do produto

Objetivo: preparar o hub para crescer com menos custo.

Entregas:

- autorizacao e perfis por area
- dashboard realmente orientado por usuario
- camada de observabilidade operacional
- desacoplamento maior do bridge e jobs
- backlog de migracao de dashboards legados

## 7. Prioridades recomendadas

Se a reestruturacao precisar comecar de forma pragmatica, esta e a ordem ideal:

1. Organizar arquitetura e naming
2. Extrair o `api/chat` para servicos menores
3. Isolar `communication` e `zabbix` como dominios
4. Padronizar erros, configs e observabilidade
5. Planejar migracao de legado visual

## 8. Riscos de nao reestruturar

- crescimento lento e caro de novas features
- aumento de regressao ao mexer em fluxos centrais
- onboarding dificil para terceiros ou equipe interna
- dependencia excessiva de conhecimento tacito
- dificuldade para transformar o hub em ativo empresarial duravel

## 9. Decisoes arquiteturais iniciais

- O HUB NETTURBO deve continuar como aplicacao central.
- A reestruturacao deve ser incremental, sem reescrever do zero.
- O dominio deve mandar na organizacao, nao apenas a tecnologia.
- Integracoes externas devem ser tratadas como infraestrutura, nao como centro do app.
- O legado deve ser encapsulado e migrado com criterio, nao removido impulsivamente.

## 10. Proximo passo com AIOX

Depois deste documento, o fluxo recomendado no AIOX e:

1. `@architect` aprofundar a arquitetura-alvo por modulo
2. `@pm` transformar o plano em roadmap e epics
3. `@sm` quebrar as fases em stories executaveis
4. `@dev` implementar por fatias pequenas, preservando operacao
5. `@qa` validar regressao e consistencia da migracao

## 11. Primeiras historias sugeridas

- Story 1: Padronizar identidade tecnica do projeto e documentacao base
- Story 2: Extrair o fluxo de `api/chat` para services de chat, rag e zabbix
- Story 3: Criar estrutura modular inicial em `src/modules` e `src/infrastructure`
- Story 4: Isolar o modulo `communication` em camada de dominio propria
- Story 5: Introduzir padrao comum de erros, validacao de env e logging

## 12. Avanco ja realizado na copia de reestruturacao

Na copia `07.1 - HUB NETTURBO REESTRUTURACAO`, a primeira fase tecnica ja comecou:

- `api/chat` foi reduzido para papel de orquestracao
- o fluxo de conversa foi movido para `src/modules/chat/application`
- os clientes de LLM foram isolados em `src/infrastructure/ai`
- contratos compartilhados iniciais foram criados em `src/shared/types`
- `rag` e `zabbix` passaram a ter ponto de entrada por dominio em `src/modules/rag` e `src/modules/zabbix`
- `IA Comunicacao` comecou a migrar de logica espalhada em rotas para `src/modules/communication/application`

Isso ainda nao conclui a modularizacao completa, mas estabelece a base para continuar a extracao por dominio sem interromper o ambiente estavel.
