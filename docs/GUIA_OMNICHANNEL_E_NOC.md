# Guia Omnichannel e NOC

> Atualizacao importante:
> a antiga camada visual de `NOC` do HUB foi reposicionada como `Infra`.
> este documento continua cobrindo a parte omnichannel e a base analitica que alimenta o NOC/Infra.
> a documentacao especifica da nova camada de Infra esta em `docs/GUIA_INFRA_HUB.md`.

Este documento explica de forma direta o que foi construído no HUB para WhatsApp, Outlook, visão omnichannel e base do NOC.

O objetivo é que qualquer pessoa do time consiga abrir este arquivo e entender:

- por que esse módulo existe
- como ele funciona
- onde cada parte está no projeto
- o que já está pronto
- o que ainda depende de evolução
- como operar sem precisar adivinhar

## 1. Visão geral

O módulo `IA Comunicação` deixou de ser apenas uma tela de leitura de grupos de WhatsApp.

Hoje ele é a base de uma camada omnichannel do HUB, capaz de consolidar mensagens de:

- WhatsApp
- email via Outlook / Microsoft 365
- futuros canais como webchat, SMS, Telegram e Instagram

Na prática, o módulo agora serve para três frentes ao mesmo tempo:

1. operação diária
2. leitura analítica
3. base para o NOC

## 2. Por que isso foi feito

Antes, a operação ficava fragmentada:

- grupos de WhatsApp de um lado
- email corporativo de outro
- contagem de protocolos e visão de clientes espalhadas

Isso dificultava responder perguntas simples de operação, como:

- quantos protocolos chegaram por email
- quantos chegaram por WhatsApp
- quais clientes só entram por email
- quais clientes só entram por WhatsApp
- quais clientes aparecem nos dois canais
- quais grupos estão realmente em monitoramento

O módulo foi evoluído para resolver isso dentro do HUB, em vez de depender de leitura manual em vários lugares.

## 3. O que o módulo entrega hoje

Hoje o módulo entrega:

- leitura de grupos de WhatsApp já persistidos no Supabase
- seleção visual dos grupos monitorados
- exclusão automática de grupos pessoais/teste que não devem aparecer
- exclusão permanente do grupo `NOC OCULTO`
- sincronização de emails da conta corporativa via Outlook
- leitura dos últimos emails sincronizados na tela
- fallback para leitura ao vivo do Outlook quando a persistência ainda não apareceu no banco
- análise por mensagem
  - sentimento
  - urgência
  - palavras-chave
  - resumo curto
- resumo diário por grupo
- resumo consolidado por grupo com narrativa para áudio
- exportação CSV por grupo
- painel inicial do NOC omnichannel com:
  - protocolos por email
  - protocolos por WhatsApp
  - protocolos compartilhados
  - clientes por email
  - clientes por WhatsApp
  - clientes que aparecem nos dois canais

## 4. Como pensar o módulo

### 4.1 Camada 1: captura

É a entrada dos dados.

Hoje existem duas entradas principais:

- WhatsApp pelo bridge
- Outlook pelo Microsoft Graph

### 4.2 Camada 2: persistência

Depois de capturar, o HUB tenta gravar tudo em tabelas já existentes do módulo de comunicação.

Isso foi feito assim por um motivo simples:

- reaproveitar a base existente
- não quebrar o que já funcionava
- permitir evolução incremental

### 4.3 Camada 3: análise

Cada mensagem pode receber:

- sentimento
- score
- palavras-chave
- urgência
- resumo

### 4.4 Camada 4: visualização

A dashboard `/dashboard/comunicacao` mostra o que foi consolidado:

- grupos
- resumos
- exportação
- Outlook
- inbox
- base omnichannel
- visão inicial de NOC

## 5. Fluxo do WhatsApp

## Por que existe um bridge

O WhatsApp não é lido diretamente pelo frontend.

Foi criado um bridge para:

- conectar na conta WhatsApp
- escutar grupos
- puxar histórico
- encaminhar mensagens para o HUB

## Como o fluxo funciona

1. o bridge identifica os grupos em que o número está
2. ele decide quais grupos podem ser monitorados
3. ele envia as mensagens para o HUB
4. o HUB persiste a mensagem
5. o HUB analisa a mensagem
6. a dashboard lê o resultado consolidado

## Onde isso está no projeto

Arquivos principais:

- `08 - IA COMUNICACAO/bridge/index.js`
- `08 - IA COMUNICACAO/bridge/config/groups.whitelist.js`
- `src/app/api/wa-monitor/inbound/route.ts`
- `src/app/api/wa-monitor/groups/route.ts`
- `src/app/api/wa-monitor/insights/route.ts`
- `src/modules/communication/application/persist-inbound-communication.ts`

## O que mudou recentemente

Antes havia uma lista fixa de grupos permitidos.

Agora a abordagem foi invertida:

- por padrão, o bridge pode capturar todos os grupos
- alguns grupos específicos são excluídos por regra

Isso foi feito porque a operação precisava enxergar mais grupos, sem depender de manutenção manual de whitelist o tempo todo.

## Regras atuais importantes

Hoje o sistema exclui por padrão:

- `NOC OCULTO`
- grupos pessoais/teste que estavam poluindo o seletor visual

Essas regras vivem em:

- `src/lib/waGroups.js`

## 6. Fluxo do Outlook

## Por que o Outlook foi integrado

O objetivo é que a leitura operacional não dependa só do WhatsApp.

O email é outro canal real de entrada de incidentes, solicitações e protocolos.

Se ele ficar fora do HUB, a visão omnichannel nunca fecha.

## Como o fluxo funciona

1. o usuário conecta a conta Microsoft 365
2. o HUB recebe `code` de autenticação
3. o HUB troca o `code` por tokens
4. o HUB chama a API do Microsoft Graph
5. os emails são lidos
6. o HUB tenta persistir esses emails no pipeline omnichannel
7. a tela mostra o que foi persistido
8. se ainda não houver persistência visível, a tela pode usar fallback ao vivo da conta conectada

## Onde isso está no projeto

Arquivos principais:

- `src/lib/outlook.ts`
- `src/app/api/communications/outlook/auth/start/route.ts`
- `src/app/api/communications/outlook/auth/callback/route.ts`
- `src/app/api/communications/outlook/status/route.ts`
- `src/app/api/communications/outlook/sync/route.ts`
- `src/app/api/communications/outlook/messages/route.ts`

## Por que existe fallback de inbox

Em alguns cenários, a sincronização consegue ler os emails da conta, mas a persistência ainda não aparece imediatamente no banco.

Para não deixar a interface vazia e confundir a operação, a rota:

- `src/app/api/communications/outlook/messages/route.ts`

faz o seguinte:

- se existir email persistido, mostra o banco
- se não existir email persistido, tenta listar diretamente da conta Outlook conectada

Isso não substitui a persistência. É um fallback operacional para a leitura visual funcionar.

## 7. Onde os dados ficam

Neste momento, o módulo reaproveita as tabelas já existentes:

- `wa_groups`
- `wa_messages`
- `wa_analysis`
- `wa_daily_insights`

Isso parece estranho à primeira vista, porque o nome das tabelas remete a WhatsApp.

Mas a decisão foi intencional:

- preservar compatibilidade com o que já existia
- não forçar migração estrutural grande no meio da evolução
- permitir que email e outros canais entrem no mesmo pipeline

O canal real de cada registro fica identificado em:

- `source_type`

Exemplos:

- `whatsapp_group`
- `whatsapp_group_history`
- `outlook_email`
- `outlook_email_live`

## 8. Seletor de grupos

## O que ele faz

A tela `Seletor de monitoramento` não decide quais grupos o bridge captura.

Ela decide quais grupos aparecem ativos na visualização da dashboard.

Ou seja:

- captura é uma coisa
- exibição operacional é outra

## Como ele funciona

- lê os grupos vindos de `/api/wa-monitor/groups`
- aplica exclusões automáticas
- exibe os grupos restantes
- permite selecionar e desselecionar visualmente
- guarda a seleção no navegador

## Onde isso está

- `src/app/dashboard/comunicacao/page.tsx`
- `src/app/api/wa-monitor/groups/route.ts`

## Importante

Se um grupo não aparece na tela, normalmente será por um destes motivos:

1. ainda não foi persistido no banco
2. foi excluído por regra
3. o bridge ainda não foi reiniciado depois de uma mudança de captura

## 9. Inbox sincronizada

## O que ela mostra

A seção `Últimos emails analisados` mostra:

- remetente
- assunto / nome da conversa
- resumo do texto
- sentimento
- urgência
- palavras-chave
- data/hora

## Onde isso está

- frontend:
  - `src/app/dashboard/comunicacao/page.tsx`
- backend:
  - `src/app/api/communications/outlook/messages/route.ts`

## O que significa quando aparece “0 emails na tela”

Isso quer dizer que, naquele momento:

- ou não havia emails persistidos no banco
- ou a conta conectada não retornou mensagens
- ou o fallback ao vivo não encontrou conteúdo suficiente

Ou seja: não é necessariamente falha de login. Pode ser ausência de persistência ou lista vazia no recorte.

## 10. Painel NOC omnichannel

## Por que ele foi criado

O NOC, agora reposicionado dentro da camada `Infra`, precisa começar a responder perguntas operacionais que atravessam canais.

Exemplos:

- quantos protocolos vieram por email
- quantos vieram por WhatsApp
- quais protocolos são os mesmos nos dois canais
- quais clientes entram só por email
- quais entram só por WhatsApp
- quais aparecem nos dois

## Como isso funciona hoje

Foi criada uma rota de consolidação:

- `src/app/api/communications/omnichannel/summary/route.ts`

Ela faz leitura do histórico e usa heurísticas para:

- extrair protocolos
- inferir canal
- inferir cliente por grupo ou remetente
- consolidar presença por canal

## Importante sobre precisão

Hoje isso ainda é uma camada inicial de inteligência.

Ela funciona por heurística, não por chave de negócio oficial.

Isso significa:

- é útil para começar
- ajuda a operação
- mas ainda não deve ser tratada como verdade absoluta para auditoria formal

## Como protocolos são detectados

A rota procura padrões como:

- `protocolo`
- `prot`
- `ticket`
- `chamado`
- `os`
- sequências numéricas compatíveis

## Como clientes são inferidos

No WhatsApp:

- pelo nome do grupo

No email:

- pelo remetente
- pelo endereço de email

## Onde isso aparece

Na tela `/dashboard/comunicacao`, em um bloco específico:

- contadores
- protocolos detectados
- clientes por email
- clientes por WhatsApp
- clientes nos dois canais

## 11. Resumo diário e resumo consolidado

O módulo possui dois tipos de resumo.

### Resumo diário

Objetivo:

- consolidar o dia por grupo

Saída:

- total de mensagens
- sentimento
- urgência
- keyword principal
- texto executivo curto

Rotas / arquivos:

- `src/app/api/wa-monitor/daily-insights/generate/route.ts`
- `src/modules/communication/application/daily-summary.ts`

### Resumo consolidado

Objetivo:

- consolidar um período de conversa

Saída:

- título
- resumo
- highlights
- riscos
- próximos passos
- keywords
- script de áudio

Rotas / arquivos:

- `src/app/api/wa-monitor/group-brief/route.ts`
- `src/modules/communication/application/conversation-brief.ts`

## 12. Exportações

Hoje o usuário pode exportar por grupo:

- mensagens
- resumo diário
- palavras-chave

Arquivos principais:

- `src/app/api/wa-monitor/export/route.ts`
- `src/app/dashboard/comunicacao/page.tsx`

## 13. Variáveis de ambiente mais importantes

## WhatsApp / bridge

- `WHATSAPP_CAPTURE_TOKEN`
- `MONITOR_ALL_GROUPS`
- `ALLOWED_GROUPS`
- `EXCLUDED_GROUPS`
- `WA_SYNC_FULL_HISTORY`

## Outlook

- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_REDIRECT_URI`
- `MS_POST_AUTH_REDIRECT`
- `MS_LOGIN_HINT`

## Plataforma

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## IA

- `OPENAI_API_KEY`
- `GROQ_API_KEY`

## 14. O que precisa reiniciar quando algo muda

## Reiniciar só o HUB

Quando mudar:

- frontend
- rotas do Next
- lógica da dashboard
- Outlook
- APIs internas do HUB

## Reiniciar HUB e bridge

Quando mudar:

- regras de grupos
- exclusões de grupos
- captura do WhatsApp
- bootstrap de histórico
- comportamento do bridge

## 15. Limitações atuais

Este é o estado honesto da solução hoje.

### 1. Os emails ainda estão em fase de maturação operacional

Mesmo com login funcionando, a persistência e a visualização ainda estão em ajuste fino.

### 2. O NOC omnichannel ainda usa heurística

Os protocolos e clientes ainda não são extraídos por integração oficial de CRM.

### 3. A base física ainda reaproveita tabelas de WhatsApp

Funciona, mas não é o desenho final ideal de dados.

### 4. A descoberta de todos os grupos ainda depende do bridge

Se o bridge não estiver atualizado ou reiniciado, a tela não terá visão completa.

## 16. Próximos passos recomendados

Para transformar isso em uma camada operacional mais forte, o caminho ideal é:

1. criar uma entidade mais explícita de canal e conversa
2. separar persistência de email e WhatsApp de forma mais clara
3. padronizar identificação de protocolo
4. padronizar identificação de cliente
5. criar uma visão própria de inbox do Outlook
6. criar filtros por canal, período e cliente
7. conectar o NOC a fontes oficiais de CRM / protocolo, quando houver

## 17. Arquivos mais importantes para manutenção

Se alguém novo entrar no projeto, estes são os arquivos que mais valem conhecer:

### Dashboard

- `src/app/dashboard/comunicacao/page.tsx`

### WhatsApp

- `src/app/api/wa-monitor/groups/route.ts`
- `src/app/api/wa-monitor/insights/route.ts`
- `src/app/api/wa-monitor/export/route.ts`
- `src/app/api/wa-monitor/daily-insights/generate/route.ts`
- `src/app/api/wa-monitor/group-brief/route.ts`
- `08 - IA COMUNICACAO/bridge/index.js`
- `src/lib/waGroups.js`

### Outlook

- `src/lib/outlook.ts`
- `src/app/api/communications/outlook/auth/start/route.ts`
- `src/app/api/communications/outlook/auth/callback/route.ts`
- `src/app/api/communications/outlook/status/route.ts`
- `src/app/api/communications/outlook/sync/route.ts`
- `src/app/api/communications/outlook/messages/route.ts`

### Omnichannel / NOC

- `src/app/api/communications/inbound/route.ts`
- `src/modules/communication/application/persist-inbound-communication.ts`
- `src/app/api/communications/omnichannel/summary/route.ts`

## 18. Relacao com a camada Infra

Hoje existem duas leituras complementares no HUB:

- `IA Comunicacao`
- `Infra`

### IA Comunicacao

Olha para:

- canais
- mensagens
- grupos
- emails
- protocolos
- clientes
- resumos

### Infra

Olha para:

- Zabbix
- Data Lake
- Outlook configurado/conectado
- sink operacional
- servicos-base do HUB

Em resumo:

- `IA Comunicacao` olha para o fluxo operacional por canal
- `Infra` olha para a sustentacao do HUB

## 19. Resumo executivo

Se alguém perguntar “o que este módulo faz hoje?”, a resposta curta é:

O `IA Comunicação` já é a base operacional do omnichannel da Netturbo dentro do HUB. Ele lê grupos de WhatsApp, conecta email corporativo via Outlook, analisa mensagens, gera resumos, exporta dados e começa a dar ao NOC uma visão cruzada de protocolos e clientes por canal.

Se alguém perguntar “o que ainda falta?”, a resposta curta é:

Falta amadurecer a persistência final do email, fortalecer a identificação de protocolos/clientes e transformar a heurística atual em uma camada de negócio mais confiável para operação de larga escala.
