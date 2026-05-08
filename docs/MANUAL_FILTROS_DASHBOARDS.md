# Manual de Uso dos Filtros nas Dashboards

Este manual existe para tirar a sensacao de "builder tecnico confuso" e explicar, em linguagem direta, como montar leituras no HUB.

O principio mais importante e este:

- primeiro pense na pergunta
- depois escolha a tabela
- depois monte o calculo
- por fim aplique filtro e periodo

---

## 1. Como pensar um widget

Toda montagem pode ser lida com 4 perguntas:

1. quem vai aparecer no resultado?
2. o que sera calculado?
3. qual recorte de negocio entra na conta?
4. qual periodo deve ser considerado?

Na tela, isso corresponde a:

- `Eixo ou categoria` = quem aparece
- `Calculo` = o tipo de conta
- `Coluna numerica` = sobre qual valor a conta sera feita
- `Filtro de negocio` = quais linhas entram
- `Coluna de periodo` + datas = qual janela de tempo entra

---

## 2. O que cada campo faz

### Tabela base

Escolhe de onde os dados saem.

Exemplos:

- `crm_funter` para vendas, vendedor, valor, produto e status comercial
- `fato_contratos` para carteira, contratos ativos, cancelamentos e distribuicao geografica
- `crm_solicitacoes` para chamados e solicitacoes

### Tipo de grafico

Define como a resposta sera exibida.

- `Barras`: comparar pessoas, cidades, status, tipos
- `Linha`: evolucao ao longo do tempo
- `Area`: tendencia temporal com mais peso visual
- `Pizza`: distribuicao percentual simples
- `Metrica`: numero unico, resposta direta
- `Tabela`: conferência detalhada linha a linha

### Calculo

Define qual conta sera feita.

- `COUNT`: conta quantos registros existem
- `SUM`: soma valores
- `AVG`: media
- `MIN`: menor valor
- `MAX`: maior valor
- `Sem agregacao`: mostra linhas cruas

### Eixo ou categoria

Define quem sera comparado no resultado.

Exemplos:

- `vendedor_1`
- `cidade`
- `status`
- `tipo`
- `produto`

Se ficar vazio em um widget de `Metrica`, a resposta vira um numero unico.

### Coluna numerica

So aparece quando o calculo precisa de valor numerico.

Exemplos:

- `valor`
- `receita`
- `ticket`

Se voce escolher `SUM`, `AVG`, `MIN` ou `MAX`, quase sempre vai precisar preencher isso.

### Filtro de negocio

Serve para dizer quais registros entram na conta.

Exemplos:

- `status = Aprovado`
- `cidade = Campinas`
- `tipo = Contratos BRA (36 Meses)`

### Operador

Hoje existem dois operadores principais:

- `Igual a`: exige valor exato
- `Contem`: procura um trecho de texto

Use `Igual a` quando souber exatamente o valor do status ou do tipo.

Use `Contem` quando o texto varia muito e voce quer um trecho comum.

### Coluna de periodo

Escolhe qual data sera usada para o recorte.

Exemplos:

- `dt_cadastro`
- `data_inicio`
- `data_abertura`
- `dt_termino`

Essa escolha muda completamente a leitura.

Exemplo:

- vendas por `dt_cadastro` = quando entrou
- contratos por `data_inicio` = quando comecaram
- chamados por `data_abertura` = quando foram abertos

### Data inicial e Data final

Definem a janela do recorte.

Exemplo:

- inicio: `2026-01-01`
- fim: `2026-01-31`

### Agrupamento temporal

Organiza o resultado ao longo do tempo.

- `Sem agrupamento temporal`: um resultado direto
- `Por dia`: linha diaria
- `Por mes`: linha mensal
- `Por ano`: consolidacao anual

Importante:

- se a pergunta for "quanto cada vendedor vendeu no periodo", normalmente use `Sem agrupamento temporal`
- se a pergunta for "como as vendas evoluiram no tempo", use `Por mes` ou `Por dia`

---

## 3. Exemplo real: quanto cada vendedor vendeu

Pergunta:

`Quanto cada vendedor vendeu em janeiro de 2026?`

Montagem recomendada:

- `Tabela base`: `crm_funter`
- `Tipo de grafico`: `Barras`
- `Calculo`: `SUM`
- `Eixo ou categoria`: `vendedor_1`
- `Coluna numerica`: `valor`
- `Filtro de negocio`: `status`
- `Operador`: `Igual a`
- `Valor`: `Aprovado`
- `Coluna de periodo`: `dt_cadastro`
- `Data inicial`: `2026-01-01`
- `Data final`: `2026-01-31`
- `Agrupamento temporal`: `Sem agrupamento temporal`

Resultado esperado:

- uma barra por vendedor
- a altura da barra representa o total vendido no periodo

Se quiser conferir linha a linha:

- troque o tipo para `Tabela`

---

## 4. Exemplo real: evolucao das vendas no tempo

Pergunta:

`Como as vendas aprovadas evoluiram mes a mes?`

Montagem recomendada:

- `Tabela base`: `crm_funter`
- `Tipo de grafico`: `Linha`
- `Calculo`: `SUM`
- `Eixo ou categoria`: `dt_cadastro`
- `Coluna numerica`: `valor`
- `Filtro de negocio`: `status`
- `Operador`: `Igual a`
- `Valor`: `Aprovado`
- `Coluna de periodo`: `dt_cadastro`
- `Agrupamento temporal`: `Por mes`

Resultado esperado:

- uma linha mostrando a soma de vendas em cada mes

---

## 5. Quando usar filtro e quando usar eixo

Essa e a confusao mais comum.

Use `Eixo ou categoria` quando voce quer comparar grupos.

Exemplos:

- comparar vendedores
- comparar cidades
- comparar tipos de contrato

Use `Filtro de negocio` quando voce quer restringir o universo da conta.

Exemplos:

- trazer so `Aprovado`
- trazer so `Campinas`
- trazer so um tipo especifico

Resumo simples:

- `Eixo` compara
- `Filtro` restringe

---

## 6. Quando usar periodo e quando usar agrupamento temporal

Outra confusao comum:

- `Coluna de periodo` escolhe qual data entra na conta
- `Agrupamento temporal` decide como o resultado sera quebrado ao longo do tempo

Exemplo:

Se voce quer vendas aprovadas de janeiro ate marco:

- `Coluna de periodo`: `dt_cadastro`
- `Data inicial`: `2026-01-01`
- `Data final`: `2026-03-31`

Agora:

- se quiser um total unico do trimestre, use `Sem agrupamento temporal`
- se quiser ver janeiro, fevereiro e marco separados, use `Por mes`

---

## 7. Como editar um widget ja criado

Agora os widgets aceitam revisao da montagem.

Fluxo:

1. monte o widget
2. veja o grafico no painel
3. clique no card
4. o painel lateral abrira em modo `Editar Widget`
5. altere o que quiser
6. clique em `Salvar alteracoes`

Use isso para:

- trocar o periodo
- mudar o status filtrado
- trocar o grafico de barras para tabela
- mudar o eixo de `vendedor_1` para `cidade`

---

## 8. Erros comuns

### O grafico veio zerado

Possiveis causas:

- valor do filtro nao bate com o texto real da base
- data escolhida nao tem registros
- coluna numerica errada

### O grafico veio estranho

Possiveis causas:

- usou `COUNT` quando queria `SUM`
- usou um eixo errado
- escolheu uma data inadequada para o periodo

### O card virou numero unico sem querer

Causa comum:

- `Eixo ou categoria` ficou vazio

---

## 9. Atalho mental final

Se a pergunta for:

`quanto cada vendedor vendeu no periodo?`

o mapa mental e:

- `quem`: vendedor
- `o que`: soma de valor
- `filtro`: status aprovado
- `periodo`: data de cadastro

Se a pergunta for:

`como isso evoluiu no tempo?`

o mapa mental e:

- `quem`: tempo
- `o que`: soma de valor
- `filtro`: status aprovado
- `agrupamento`: por mes
