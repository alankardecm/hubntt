# Arquitetura Hub - IA Comunicacao

## 1. Objetivo

Monitorar grupos internos de WhatsApp, analisar sentimento e palavras-chave e publicar os resultados no Netturbo Hub.

Sem resposta automatica.
Sem chatbot.
Somente leitura, analise e dashboard.

## 2. Visao de implementacao

O modulo precisa ser dividido em 4 blocos:

1. Captura das mensagens dos grupos
2. Analise de IA
3. Persistencia e agregacao
4. Dashboard e alertas no hub

## 3. Como isso entra no hub

### Frontend

- rota principal: `/dashboard/comunicacao`
- cards de sentimento
- palavras-chave mais recorrentes
- conversas com maior risco
- eventos recentes

### Backend

O hub precisa expor rotas para:

- receber eventos de mensagens
- registrar analises
- consultar resumos
- listar dashboards e alertas
- consolidar resumo diario em lote por grupo

### Processamento

Uma camada de worker deve:

- receber a mensagem bruta
- normalizar o texto
- classificar sentimento
- extrair keywords
- gerar score
- salvar resultado no banco
- preparar o resumo diario com Groq quando o lote for fechado

## 4. Captura de grupos

Como o objetivo e monitorar grupos internos, a entrada precisa vir de uma ponte de captura autorizada.

O sistema deve tratar a origem como:

- `whatsapp_group`
- `group_id`
- `group_name`
- `author`
- `message_text`
- `timestamp`

## 5. Fluxo tecnico recomendado

```text
Grupo interno
  ->
ponte de captura autorizada
  ->
API do hub
  ->
fila de processamento
  ->
IA de analise
  ->
Supabase
  ->
dashboard
```

## 6. Componentes que precisam existir

### Dentro do hub

- pagina da dashboard
- endpoints de recebimento
- endpoints de consulta
- componentes visuais

### Fora do hub

- coletor das mensagens
- fila de processamento, se houver volume
- storage de logs

## 7. Estado dos dados

Cada mensagem deve ser salva em tres niveis:

1. bruto
2. analisado
3. agregado

## 8. Resultado esperado

O hub deve permitir:

- ver grupos com mais sentimento negativo
- ver palavras mais citadas
- acompanhar alertas
- consultar historico por grupo e periodo
