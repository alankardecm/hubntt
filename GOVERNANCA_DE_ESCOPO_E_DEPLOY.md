# Governanca de Escopo e Deploy

Este documento define as regras para manter o Netturbo Hub organizado, replicavel e seguro ao subir para servidor.

## 1. Regra principal

Toda funcionalidade nova precisa entrar com:

- codigo
- documentacao
- ponto de recuperacao
- checklist de deploy

Se faltar um desses itens, o projeto fica incompleto.

## 2. Estrutura minima por modulo

Cada modulo novo deve ter, no minimo:

- `README.md`
- `DOCUMENTACAO_TECNICA.md`
- `PONTO_RECUPERACAO.md`
- `CHANGELOG.md`

## 3. Regra de escopo

Antes de adicionar qualquer funcionalidade, responder:

1. Qual problema isso resolve?
2. Em qual modulo isso vive?
3. Qual dado de entrada?
4. Qual saida esperada?
5. Como isso sera validado no build?

Se a resposta estiver vaga, a feature nao deve ser expandida ainda.

## 4. Regra de integracao

Quando uma funcionalidade entrar no hub:

- a home do hub precisa apontar para ela, se for relevante
- a sidebar precisa refletir a navegacao
- a documentacao principal precisa receber o link
- o ponto de recuperacao precisa registrar a mudanca

## 5. Regra de deploy

Antes de subir para servidor:

1. confirmar variaveis de ambiente
2. confirmar se todos os arquivos do modulo existem
3. rodar build local
4. validar rotas principais
5. revisar se nada depende de arquivo local nao versionado

## 6. Regra de configuracao

Nao hardcodar:

- tokens
- senhas
- URLs privadas
- chaves de API

Tudo que for sensivel deve ir para `.env.local` no desenvolvimento e para variaveis de ambiente no servidor.

## 7. Regra de arquivos

Ao mover ou criar um modulo, conferir:

- `src/`
- `public/`
- `docs/`
- `README.md`
- `PONTO_RECUPERACAO.md`

Se o modulo depender de assets, copiar junto:

- imagens
- html
- css
- js
- arquivos de apoio

## 8. Regra de versionamento

Cada checkpoint relevante precisa registrar:

- o que foi criado
- o que foi alterado
- o que foi validado
- o que ainda falta

## 9. Regra de estabilidade

Nao ampliar o escopo sem necessidade.

Se a feature nova nao tiver:

- utilidade clara
- fonte de dados clara
- saida clara

ela deve ficar documentada, mas nao implementada de forma incompleta.

