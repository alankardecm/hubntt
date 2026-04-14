# Modelo de Dados - IA Comunicacao

## Objetivo

Guardar eventos de comunicacao de forma estruturada para analise de sentimento, palavras-chave, reunioes e alertas.

## Entidades principais

### 1. `message_events`

Armazena cada mensagem recebida de uma fonte autorizada.

Campos sugeridos:

- `id`
- `source_type`
- `source_id`
- `source_name`
- `conversation_id`
- `conversation_name`
- `author_name`
- `author_id`
- `message_text`
- `message_type`
- `sent_at`
- `received_at`
- `sentiment_label`
- `sentiment_score`
- `priority`
- `keywords`
- `topics`
- `is_alert`
- `metadata`

### 2. `message_alerts`

Armazena alertas gerados a partir das mensagens.

Campos sugeridos:

- `id`
- `event_id`
- `rule_name`
- `severity`
- `title`
- `description`
- `status`
- `created_at`
- `resolved_at`

### 3. `conversation_summaries`

Resumo consolidado por conversa, grupo ou periodo.

Campos sugeridos:

- `id`
- `conversation_id`
- `conversation_name`
- `period_start`
- `period_end`
- `summary_text`
- `top_keywords`
- `sentiment_average`
- `message_count`
- `alert_count`
- `sentiment_label`
- `primary_keyword`
- `urgency_label`
- `summary_model_used`

### 4. `meeting_records`

Armazena reunioes processadas.

Campos sugeridos:

- `id`
- `title`
- `source_type`
- `audio_url`
- `transcript_text`
- `summary_text`
- `decisions`
- `tasks`
- `participants`
- `status`
- `created_at`

### 5. `tag_dictionary`

Lista de termos e tags relevantes para regras de negocio.

Campos sugeridos:

- `id`
- `term`
- `category`
- `severity`
- `enabled`

## Relacionamentos

- `message_alerts.event_id` referencia `message_events.id`
- `conversation_summaries.conversation_id` referencia a conversa agrupada
- `meeting_records` pode ser consultado pela mesma camada de busca do hub

## Exemplo de evento

```json
{
  "source_type": "whatsapp",
  "source_name": "grupo_operacao",
  "conversation_name": "Operacao NOC",
  "author_name": "Alan",
  "message_text": "O link caiu de novo e o prazo esta apertado",
  "sentiment_label": "negative",
  "sentiment_score": -0.82,
  "keywords": ["link", "prazo", "caiu"],
  "topics": ["incidente", "urgencia"],
  "is_alert": true
}
```

## Regras de armazenamento

- mensagem bruta sempre preservada
- analise de IA armazenada separadamente
- alertas gerados precisam referenciar o evento de origem
- historico deve permitir agregacao por usuario, grupo, periodo e tipo
