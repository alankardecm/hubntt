# Guia das Dashboards do HUB

Este documento registra a direcao atual das dashboards do HUB Netturbo.

O objetivo nao e apenas "mostrar tabelas", mas transformar base tecnica em leitura executiva, operacional e comercial com cara de produto serio.

---

## 1. Problema que existia antes

Antes da melhoria, a experiencia de dashboards tinha alguns gargalos claros:

- nomes de tabelas e colunas muito tecnicos
- pouca proximidade com a linguagem do usuario final
- dificuldade para responder perguntas reais de negocio
- criacao de widget muito orientada a `COUNT`, `SUM` e nome de campo cru
- falta de recorte por periodo
- falta de filtro de negocio na criacao do widget
- dificuldade para entender rapidamente o que cada tabela representa

Na pratica, isso fazia a tela parecer mais um explorador tecnico de banco do que uma ferramenta de decisao.

---

## 2. Direcao de produto

A direcao adotada para `/dashboards` e:

- sair da logica "escolha uma tabela e se vire"
- entrar na logica "qual pergunta voce quer responder?"

Isso muda o papel da tela.

Ela deixa de ser apenas um builder tecnico e passa a ser uma camada de leitura analitica mais profissional, onde:

- a tabela recebe nome mais humano
- a coluna recebe rotulo mais claro
- o usuario consegue aplicar filtro e periodo
- o widget pode responder uma pergunta direta
- a leitura fica mais proxima de negocio e menos proxima de SQL mental

---

## 3. O que melhorou

## 3.1 Catalogo mais semantico

As tabelas agora aparecem com:

- nome mais legivel
- descricao do papel da tabela
- foco analitico sugerido

Exemplo:

- `fato_contratos` aparece como `Contratos`
- `crm_solicitacoes` aparece como `Solicitacoes`
- `fato_solicitacoes` aparece como `Atendimento`

Isso ajuda o usuario a entender:

- qual tabela faz sentido abrir
- para que tipo de pergunta ela serve
- qual leitura ela tende a suportar melhor

## 3.2 Colunas com linguagem mais humana

As colunas agora recebem leitura semantica.

Exemplos:

- `data_inicio` vira `Data de inicio`
- `status` vira `Status`
- `cidade` vira `Cidade`
- `valor` vira `Valor`

Quando possivel, a interface tambem indica a natureza da coluna:

- `metric`
- `dimension`
- `time`
- `status`
- `identifier`

Com isso, o usuario para de depender apenas do nome tecnico do banco.

## 3.3 Preview mais legivel

O preview da tabela agora ajuda mais na leitura, porque o cabecalho mostra:

- nome humano da coluna
- nome tecnico original

Isso melhora a transicao entre:

- entendimento do negocio
- entendimento da base

## 3.4 Builder com recorte de negocio

O painel `Novo Widget` agora permite:

- escolher a tabela base
- definir tipo de grafico
- definir calculo
- escolher categoria ou eixo
- escolher coluna numerica
- aplicar filtro de negocio
- aplicar coluna de periodo
- definir data inicial
- definir data final
- escolher agrupamento temporal

Ou seja:

- nao e mais so "coluna X + coluna Y"
- passa a ser "pergunta + recorte + leitura"

## 3.5 Widget de metrica sem agrupamento

Agora tambem e possivel criar leitura sem eixo de agrupamento para responder algo direto, por exemplo:

- quantos contratos ativos existem no periodo
- qual a soma de receita no recorte
- qual o total de solicitacoes abertas

Isso e importante porque muitas perguntas nao pedem distribuicao.

As vezes a pergunta quer apenas:

- um numero
- uma resposta objetiva
- um card executivo

## 3.6 Agrupamento temporal

Os widgets agora podem agrupar por:

- sem agrupamento temporal
- dia
- mes
- ano

Isso permite montar leituras como:

- contratos por mes
- atendimentos por dia
- evolucao anual de receita

---

## 4. Exemplo real de uso

### Pergunta

`Quantos contratos foram ativos em janeiro de 2026?`

### Caminho recomendado

1. abrir `/dashboards`
2. selecionar a base `Contratos`
3. criar um novo widget
4. definir um titulo claro:
   - `Contratos ativos em janeiro de 2026`
5. escolher:
   - calculo: `COUNT`
   - sem eixo de agrupamento
6. aplicar filtro:
   - coluna: `Status`
   - operador: `Igual a`
   - valor: `ativo`
7. aplicar periodo:
   - coluna de periodo: `Data de inicio` ou a data que fizer sentido no DW
   - data inicial: `2026-01-01`
   - data final: `2026-01-31`
8. escolher `Metrica`

### Resultado esperado

O widget responde a pergunta com um numero direto, sem o usuario ter que adivinhar SQL, coluna tecnica ou modelagem de banco.

---

## 5. Acoes rapidas

Para acelerar o uso, a tela passou a sugerir acoes mais proximas da intencao de negocio.

No caso de `Contratos`, por exemplo, a tela pode sugerir leituras como:

- contratos ativos em janeiro/2026
- ativacoes por mes
- contratos ativos por cidade

Isso ajuda a reduzir friccao e acelera a primeira entrega de valor.

Mais recentemente, a experiencia tambem ganhou:

- acao rapida para `vendas por vendedor no periodo`
- clique no widget para revisar como ele foi montado
- modo `Editar Widget` para alterar e salvar sem recriar tudo

Para uso diario, o material principal de apoio agora e:

- [MANUAL_FILTROS_DASHBOARDS.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/MANUAL_FILTROS_DASHBOARDS.md>)

Esse manual explica, em linguagem operacional:

- o que e `eixo ou categoria`
- quando usar `filtro de negocio`
- como pensar `coluna de periodo`
- quando usar `agrupamento temporal`
- como montar leituras reais no `crm_funter`

---

## 6. O que faz uma dashboard parecer profissional aqui

Uma dashboard boa no HUB nao deve parecer um monte de grafico aleatorio.

Ela precisa ter:

- pergunta clara
- nomes compreensiveis
- recorte consistente
- leitura visual limpa
- widgets com finalidade
- contexto suficiente para decisao

Em outras palavras:

- menos cenografia
- menos "query builder cru"
- mais leitura orientada a operacao

Se uma pessoa abrir a tela e pensar "isso parece ferramenta pronta de verdade", estamos no caminho certo.

---

## 7. Limites atuais

Mesmo com a evolucao, ainda existem limites importantes.

Hoje o builder:

- cruza muito melhor dados dentro de uma mesma tabela
- aceita filtro e periodo
- aceita leitura temporal
- aceita card de metrica

Mas ainda nao faz, de forma nativa:

- `join` real entre multiplas tabelas no mesmo widget
- modelagem assistida de metricas compostas
- biblioteca oficial de metricas de negocio padronizadas
- camada completa de semantic layer centralizada
- sugestao automatica de melhor data de referencia por tabela

Ou seja:

ja saiu do nivel "tela torta",
mas ainda nao chegou no nivel final de analytics corporativo.

---

## 8. Proximos passos recomendados

Para amadurecer ainda mais essa frente, o caminho mais forte e:

1. definir um dicionario oficial de negocio por tabela
2. criar rotulos oficiais para colunas-chave
3. mapear colunas de tempo preferenciais por dominio
4. criar biblioteca de widgets prontos por area:
   - comercial
   - contratos
   - atendimento
   - operacao
5. permitir widgets compostos com mais de uma tabela
6. permitir salvar dashboards nomeadas por area
7. criar modo executivo com visual ainda mais limpo

---

## 9. Resumo executivo

Se alguem perguntar o que mudou na area de dashboards do HUB, a resposta curta e:

Antes, a experiencia era muito tecnica e pouco intuitiva.

Agora, ela comeca a funcionar como uma ferramenta de leitura profissional:

- mais semantica
- mais clara
- mais orientada a pergunta
- mais proxima de negocio
- mais forte para recorte de periodo e filtro

Ainda ha espaco para evoluir, principalmente em widgets que cruzem multiplas tabelas, mas a base atual ja permite montar algo muito mais serio do que antes.
