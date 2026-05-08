# Execucao Passo a Passo - IA Comunicacao

Este guia descreve a ordem exata para colocar o modulo em funcionamento.

## 1. Preparar os arquivos de ambiente

### Hub

Edite o `.env.local` do hub com as credenciais locais:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_CAPTURE_TOKEN`

### Bridge

O arquivo `bridge/.env` ja deve existir. Se precisar recriar, use `bridge/.env.example` como base:

```env
HUB_API_URL=http://localhost:4000
WHATSAPP_CAPTURE_TOKEN=mesmo_token_do_hub
BRIDGE_NAME=wa-intelligence-bridge
MONITOR_ALL_GROUPS=true
WA_RESET_SESSION=true
ALLOWED_GROUPS=
EXCLUDED_GROUPS=
```

O bridge carrega esse arquivo automaticamente da propria pasta `bridge/`.
O reset da sessao e aplicado apenas uma vez por execucao, para evitar apagar a autenticacao em cada reconexao.
Os nomes dos grupos sao comparados sem acento e sem diferenca de maiusculas/minusculas, e a captura usa o nome real da conversa vindo da metadata do WhatsApp.

## 2. Aplicar o schema no Supabase

Execute o arquivo:

- `supabase-schema-wa-comunicacao.sql`

Isso cria:

- `wa_groups`
- `wa_messages`
- `wa_analysis`
- `wa_daily_insights`
- `wa_keywords_config`

Se quiser armazenar o resumo diario consolidado com os campos novos, aplique tambem:

- `supabase-wa-comunicacao-daily-summary-update.sql`

### Como aplicar

1. abra o projeto no painel do Supabase
2. entre em `SQL Editor`
3. crie uma nova query
4. cole o conteudo de `supabase-schema-wa-comunicacao.sql`
5. execute a query
6. confirme se as tabelas aparecem em `Table Editor`

### Validacao esperada

- as tabelas devem existir sem erro
- o indice unico de `external_message_id` deve ser criado
- a tabela `wa_messages` deve aceitar os campos de origem do bridge

## 3. Definir o escopo dos grupos

Se quiser comecar pequeno:

- preencha `bridge/config/groups.whitelist.js`
- deixe `ALLOWED_GROUPS` com apenas um grupo de teste
- mantenha `EXCLUDED_GROUPS` para bloqueios permanentes

## 4. Subir o hub

Na raiz do hub:

```powershell
npm run dev
```

O hub sobe em:

- `http://localhost:4000`

## 5. Subir o bridge

Na raiz do hub:

```powershell
npm run wa-bridge
```

Ou com o atalho:

```powershell
.\start-wa-monitor.ps1
```

## 6. Escanear o QR

Quando o bridge mostrar o QR:

1. abrir o WhatsApp Business da empresa
2. entrar em dispositivos conectados
3. escanear o QR exibido no terminal

Se aparecer `conflict` ou `stream errored out`, feche a sessao antiga do bridge/WhatsApp Web e rode o bridge novamente para gerar um QR novo.

Para uma autenticacao limpa, use `WA_RESET_SESSION=true` apenas na primeira execucao. Depois de conectar com sucesso, altere para `false` para manter a sessao salva.

## 7. Fazer o primeiro teste

Envie uma mensagem no grupo autorizado e confirme:

- o bridge recebeu a mensagem
- o endpoint `/api/wa-monitor/inbound` respondeu `ok: true`
- o banco gravou em `wa_messages`
- a analise foi criada em `wa_analysis`

## 8. Verificar a dashboard

Abra:

- `/dashboard/comunicacao`

E confira:

- sentimento agregado
- palavras-chave
- mensagens recentes
- grupos monitorados

## 9. Gerar resumo diario em lote

Quando quiser consolidar o dia inteiro de um grupo ou de todos os grupos da whitelist, rode:

- `POST /api/wa-monitor/daily-insights/generate`

Exemplos de corpo:

```json
{
  "date": "2026-03-26"
}
```

```json
{
  "date": "2026-03-26",
  "group_name": "relacionamento nt"
}
```

Esse endpoint:

- usa contagem real de mensagens e keywords
- chama Groq apenas para a redacao do resumo
- salva o consolidado em `wa_daily_insights`

### Alternativa por npm

```powershell
npm run wa-daily-summary -- --date=2026-03-26
```

### Automacao no Windows

Para agendar a consolidacao diaria automaticamente:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts/register-wa-daily-summary-task.ps1
```

## 10. Validacao minima antes de evoluir

Antes de adicionar mais grupos:

- validar um grupo por vez
- confirmar que nao ha duplicidade
- revisar o dashboard
- revisar os registros no Supabase
