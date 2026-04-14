# Fluxo de Ingestao - IA Comunicacao

## Objetivo

Definir como as mensagens e reunioes entram no sistema sem misturar fontes nem criar dependencias soltas.

## Fontes permitidas

### WhatsApp

- fonte autorizada via webhook
- exportacao manual
- integracao de uma fila intermediaria

Observacao:

- se a origem for grupo, o fluxo deve respeitar regras de acesso e consentimento
- nada deve depender de leitura automatica sem definir a fonte autorizada

### Reunioes

- upload de audio
- upload de video com audio extraido
- importacao de arquivo transcrito
- webhook de sistema de reunioes

## Pipeline

```text
Fonte autorizada
    ->
Normalizacao
    ->
Historico de hoje dos grupos permitidos
    ->
Classificacao de sentimento
    ->
Extracao de palavras-chave
    ->
Geracao de alerta ou resumo
    ->
Persistencia
    ->
Dashboard / pesquisa
```

## Etapas detalhadas

### 1. Entrada

Recebe:

- texto puro
- audio
- metadados de origem

No WhatsApp, a bridge pode reapresentar o historico de hoje dos grupos permitidos ao subir, antes de entrar no fluxo ao vivo.

### 2. Normalizacao

Converte tudo para um formato unico:

- texto limpo
- timestamps padronizados
- origem identificada
- autor identificado

### 3. Analise de IA

Executa:

- sentimento
- keywords
- entidades
- prioridade
- tema

### 4. Regras

Se houver:

- palavra critica
- sentimento muito negativo
- recorrencia alta

gerar alerta.

### 5. Persistencia

Salvar:

- evento bruto
- analise
- resumo
- alerta

### 6. Saida

Enviar para:

- dashboard de sentimento
- dashboard de keywords
- fila de alertas
- busca historica

## Regra de estabilidade

Se uma fonte nova entrar, ela precisa seguir o mesmo contrato de ingestao.
Assim o hub nao vira um conjunto de excecoes por canal.
