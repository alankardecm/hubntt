# Guia Infra do HUB

Este documento explica a camada `Infra` do HUB NETTURBO.

A ideia aqui e simples: qualquer pessoa do time deve conseguir abrir este arquivo e entender:

- por que a tela existe
- o que ela monitora de verdade
- o que ainda nao monitora
- quais fontes alimentam a leitura
- onde isso esta no codigo
- como manter e evoluir essa camada sem adivinhar

## 1. Visao geral

A tela `Infra` substitui a antiga leitura generica de `NOC`.

O motivo da troca foi pratico:

- o nome `NOC` estava amplo demais
- a tela antiga era mais cenografica do que operacional
- a operacao precisava enxergar a sustentacao real do HUB

Hoje a proposta da pagina e acompanhar os componentes-base que mantem o HUB de pe.

Em outras palavras:

- se o `Zabbix` falha, a monitoracao fica cega
- se o `Data Lake` falha, as dashboards perdem base analitica
- se o `Outlook` falha, o omnichannel perde um canal relevante
- se o `sink operacional` falha, o ecossistema perde trilha de conexoes recentes

## 2. O que a tela monitora hoje

Hoje a camada `Infra` mostra sinais reais de quatro blocos:

- `Zabbix`
- `Data Lake MySQL`
- `Outlook corporativo`
- `Sink operacional do HUB`

Ela tambem organiza a leitura em quatro visoes:

1. KPIs executivos
2. camada de sustentacao
3. incidentes relevantes
4. inventario tecnico

## 3. Por que a tela existe

Antes, a pagina antiga usava informacoes visuais genericas como:

- POPs estaticos
- latencias ilustrativas
- capacidade total ficticia
- logs simulados

Isso ajudava na apresentacao, mas nao ajudava na decisao.

O objetivo da nova tela e inverter essa logica:

- menos cenografia
- mais sinal real
- mais proximidade com as fontes que o HUB realmente usa

## 4. O que entra na leitura de Infra

## 4.1 Zabbix

O Zabbix e a fonte principal de monitoramento operacional da infraestrutura observavel pelo HUB.

Hoje a tela usa o endpoint:

- `/api/zabbix`

Com estas visoes:

- `view=summary`
- `view=hosts`
- `view=problems`

Com isso a pagina consegue mostrar:

- total de hosts monitorados
- hosts `up`
- hosts `down`
- hosts `unknown`
- total de problemas ativos
- incidentes criticos
- inventario dos hosts retornados

## 4.2 Data Lake

O Data Lake entra como camada de base analitica.

Hoje a leitura e feita por:

- `/api/datalake/schema`

Esse endpoint usa o overview do MySQL para responder:

- se a conexao esta ativa
- nome do banco
- host
- porta
- quantidade de tabelas liberadas
- lista de tabelas
- volume aproximado por tabela
- horario de atualizacao

Na pratica, isso transforma a tela de Infra em um lugar onde se responde rapido:

- o Data Lake esta acessivel?
- qual base esta conectada?
- quantas tabelas estao visiveis?
- quais tabelas parecem mais relevantes agora?

## 4.3 Outlook corporativo

O Outlook nao e um servidor tradicional, mas e um servico de sustentacao do omnichannel.

Por isso ele entra na camada `Infra`.

A leitura atual usa:

- `/api/communications/outlook/status`

Ela informa:

- se a configuracao existe
- se ha conta conectada
- qual conta esta autenticada

Isso ajuda a operacao a entender se o email do omnichannel esta apto a funcionar ou nao.

## 4.4 Sink operacional do HUB

O sink operacional foi mantido porque ele da visibilidade sobre trilhas recentes de conexao no ambiente.

Hoje essa leitura vem da tabela:

- `connections`

via `Supabase`.

Na tela, isso aparece como:

- conexoes recentes
- cidade
- usuario
- MAC
- status conectado/offline

Esse bloco nao substitui monitoramento de infraestrutura classico, mas ajuda a validar se a trilha operacional do ecossistema continua respondendo.

## 5. O que a tela nao monitora ainda

E importante deixar isso documentado com honestidade.

Hoje a pagina `Infra` ainda nao monitora, de forma real e dedicada:

- `CPU` real do servidor do Zabbix
- `memoria` real do servidor do Zabbix
- `disco` real do servidor do Zabbix
- `CPU`, `memoria` e `disco` dedicados do servidor do Data Lake
- disponibilidade do `bridge` de WhatsApp por healthcheck proprio
- disponibilidade do `RAG` por healthcheck proprio
- disponibilidade do `Pinecone` por healthcheck proprio
- disponibilidade do `OpenAI` ou `Groq` por healthcheck proprio

Isso significa que a tela atual e uma `camada de Infra orientada aos servicos-base do HUB`, e nao ainda um observability center completo.

## 6. Como pensar a precisao da tela

A confiabilidade hoje varia por bloco.

### Alta confiabilidade

- status do Data Lake via overview MySQL
- status do Outlook configurado/conectado
- leitura de conexoes recentes no Supabase

### Boa confiabilidade operacional

- total de hosts e problemas ativos do Zabbix

### Ainda dependente de evolucao

- metricas reais de servidor
- telemetria detalhada por host critico
- monitoracao de componentes como bridge, RAG e APIs externas

## 7. Como a tela esta organizada

## 7.1 Cards executivos

Os cards superiores mostram:

- hosts monitorados
- problemas criticos
- Data Lake
- cobertura de Infra

Esses cards foram desenhados para responder rapido:

- a base esta de pe?
- a monitoracao esta de pe?
- ha incidente critico agora?
- quantos blocos-base estao validos?

## 7.2 Camada de sustentacao

Esse bloco lista os servicos-base do HUB:

- Zabbix Monitor
- Data Lake MySQL
- Outlook corporativo
- Sink operacional do HUB

Cada card mostra:

- nome do servico
- status
- leitura resumida
- detalhe de apoio

## 7.3 Incidentes

Esse bloco mostra os problemas ativos retornados pelo Zabbix.

O foco aqui e:

- nome do incidente
- host relacionado
- desde quando existe
- severidade

## 7.4 Inventario e tabelas

Na metade inferior, a tela mostra:

- hosts acompanhados pelo Zabbix
- tabelas mais relevantes do Data Lake
- trilhas recentes do sink operacional
- leitura executiva com pendencias detectadas

## 8. Onde isso esta no codigo

Arquivos principais:

- `src/app/dashboard/noc/page.tsx`
- `src/app/api/zabbix/route.ts`
- `src/lib/zabbix.ts`
- `src/app/api/datalake/schema/route.ts`
- `src/modules/datalake/application/overview.ts`
- `src/app/api/communications/outlook/status/route.ts`
- `src/components/Sidebar.tsx`
- `src/app/dashboard/page.tsx`

## 9. Por que a rota ainda e /dashboard/noc

Mesmo com o nome visual `Infra`, a rota continua:

- `/dashboard/noc`

Isso foi mantido por compatibilidade e para evitar quebrar links internos ou referencias antigas durante a transicao.

Ou seja:

- nome do modulo: `Infra`
- rota atual: `/dashboard/noc`

Se o time quiser, no futuro pode haver migracao para algo como:

- `/dashboard/infra`

Mas isso nao foi feito agora para preservar estabilidade.

## 10. Decisoes de design

## 10.1 Mesmo tema visual do HUB

A tela foi alinhada ao tema claro do restante do projeto.

O motivo:

- manter consistencia visual
- evitar a sensacao de modulo isolado
- reduzir atrito de navegacao

## 10.2 Sem metricas inventadas

A pagina antiga mostrava metricas bonitas, mas nem sempre reais.

A nova abordagem segue esta regra:

- se a metrica for real, ela entra
- se ainda nao houver fonte confiavel, ela nao deve ser vendida como verdade

Essa decisao e importante porque essa camada serve para operacao, nao so para demonstracao.

## 11. Limites atuais

Hoje a tela ainda tem estes limites:

1. depende do que o endpoint do Zabbix ja entrega
2. ainda nao separa servidores criticos por classe
3. ainda nao tem healthcheck proprio do bridge
4. ainda nao valida RAG, Pinecone, OpenAI e Groq como componentes de Infra
5. ainda nao mostra uso de CPU, memoria e disco reais dos hosts-chave

## 12. Proximos passos recomendados

Se a ideia for amadurecer essa tela para uma camada de Infra mais forte, o caminho recomendado e:

1. criar um recorte oficial de hosts criticos do HUB
2. puxar itens reais do Zabbix para CPU, memoria, disco e ping
3. identificar explicitamente o host do Zabbix server
4. identificar explicitamente o host do Data Lake server
5. criar healthchecks dedicados para:
   - bridge de WhatsApp
   - RAG
   - Pinecone
   - OpenAI
   - Groq
6. criar um bloco de dependencias externas do HUB
7. separar severidade operacional de severidade analitica

## 13. Resumo executivo

Se alguem perguntar:

### O que a tela Infra faz hoje?

Ela mostra a sustentacao real do HUB com foco em Zabbix, Data Lake, Outlook e sink operacional, usando leituras reais dos endpoints internos do sistema.

### O que ela nao faz ainda?

Ela ainda nao e uma observability suite completa de servidores. Faltam metricas dedicadas de CPU, memoria, disco e healthchecks proprios para alguns componentes.

### Qual foi a grande mudanca?

A tela deixou de ser um NOC visual generico e passou a ser uma camada de Infra coerente com o que o HUB realmente usa para operar.
