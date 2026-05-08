# Custos do HUB por Cenario

Este documento traduz o levantamento tecnico de custos para uma leitura mais executiva.

Leitura recomendada em conjunto com:

- [LEVANTAMENTO_DE_CUSTOS_HUB.md](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/LEVANTAMENTO_DE_CUSTOS_HUB.md>)
- [CUSTOS_HUB_TEMPLATE.csv](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/CUSTOS_HUB_TEMPLATE.csv>)

Data de referencia: `13/04/2026`.

## 1. Objetivo

O objetivo desta pagina e ajudar a gestao a pensar custo do HUB em tres niveis:

1. `baixo`
2. `medio`
3. `alto`

Este material nao substitui o billing real dos fornecedores. Ele serve como guia de planejamento e discussao.

## 2. Como interpretar os cenarios

Cada cenario abaixo parte de uma leitura pratica do uso do HUB:

- `baixo`: uso inicial, poucas consultas, pouca indexacao, operacao ainda em validacao
- `medio`: uso recorrente, modulo de comunicacao ativo, RAG consultado com frequencia, NOC usando o HUB no dia a dia
- `alto`: uso pesado, mais usuarios, mais consultas, mais mensagens, mais resumos, mais audio e mais base vetorial

## 3. O que muda de um cenario para outro

### Cenario baixo

Normalmente significa:

- pouco volume de mensagens
- pouco volume de consultas no RAG
- poucas sincronizacoes de email
- baixo uso de TTS
- Supabase ainda em escala pequena

Maior peso esperado:

- `Supabase`
- custo basico de infraestrutura interna

### Cenario medio

Normalmente significa:

- IA Comunicacao em uso real
- Outlook sincronizando caixas com frequencia
- NOC consultando protocolos e clientes
- RAG ja sendo usado com alguma frequencia
- mais chamadas em Groq e OpenAI

Maior peso esperado:

- `Supabase`
- `Pinecone`
- `OpenAI`
- `Groq`

### Cenario alto

Normalmente significa:

- HUB como plataforma central da operacao
- alto volume de mensagens por WhatsApp e email
- varios resumos e consultas por dia
- TTS realmente usado
- RAG com base grande e consultas intensas

Maior peso esperado:

- `Supabase`
- `Pinecone`
- `OpenAI`
- `Groq`
- `Gemini embeddings`

## 4. Leitura executiva por servico

### OpenAI

Tende a crescer quando:

- houver mais resposta de IA
- houver mais TTS
- houver mais fallback da Groq para OpenAI

### Groq

Tende a crescer quando:

- a camada de resumo e analise operar em escala
- o assistente for usado com recorrencia

### Gemini Embeddings

Tende a crescer quando:

- houver mais indexacao
- o RAG for reprocessado com frequencia

### Pinecone

Tende a crescer quando:

- a base vetorial aumentar
- as consultas ficarem frequentes

### Supabase

Tende a crescer quando:

- aumentar compute
- aumentar storage
- crescer invocacao de funcoes
- crescer realtime

### Microsoft 365 / Outlook

Tende a pesar mais em:

- licenciamento
- governanca
- contas habilitadas

Nao costuma ser o principal susto financeiro por chamada isolada nesse desenho atual.

### Zabbix, Data Lake e WhatsApp Bridge

Tendem a pesar mais como:

- servidor
- manutencao
- operacao

## 5. Faixas de atencao para gestao

### Faixa 1: custo estrutural

Itens que provavelmente existirao mesmo com pouco uso:

- `Supabase`
- `infra do Zabbix`
- `infra do Data Lake`
- `infra do bridge`

### Faixa 2: custo de crescimento

Itens que sobem quando o HUB comeca a gerar valor em escala:

- `OpenAI`
- `Groq`
- `Gemini embeddings`
- `Pinecone`

### Faixa 3: custo de governanca

Itens que dependem mais de politica interna do que de token:

- `Microsoft 365 / Outlook`
- segregacao entre homologacao e producao
- controle de chaves e ambientes paralelos

## 6. Perguntas que a gestao deve responder

Antes de aprovar um numero mensal do HUB, vale responder:

- quantos usuarios realmente vao usar o HUB no dia a dia
- quantos canais vao ficar ativos em producao
- o RAG sera consultado por poucas pessoas ou pela operacao toda
- audio sera recurso pontual ou recorrente
- o ambiente paralelo vai continuar rodando por quanto tempo
- a empresa quer um app de Outlook dedicado ao HUB ou continuara reaproveitando o atual

## 7. Melhor forma de fechar o custo real

O caminho mais seguro e:

1. preencher o [CUSTOS_HUB_TEMPLATE.csv](</c:/Users/alan.moreira/Documents/00 - 2026/15 - PROJETO IA NETTURBO/07.1 - HUB NETTURBO REESTRUTURACAO/docs/CUSTOS_HUB_TEMPLATE.csv>) com dados reais do billing
2. separar por `homologacao`, `desenvolvimento` e `producao`
3. calcular media mensal
4. revisar o custo por modulo

## 8. Conclusao executiva

Hoje o HUB deve ser tratado como uma plataforma com tres naturezas de custo:

- `infraestrutura`
- `IA por consumo`
- `governanca e licenciamento`

Se a empresa quiser previsibilidade, o melhor caminho e:

1. medir consumo real por 30 dias
2. preencher a planilha-base
3. revisar o desenho do RAG, da IA e do Outlook
4. definir teto de gasto por fornecedor
