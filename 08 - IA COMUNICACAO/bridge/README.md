# Bridge do WhatsApp IA

Este processo faz a ponte entre o WhatsApp Business da empresa e o hub Netturbo.

## O que ele faz

- conecta o WhatsApp Business via QR code
- escuta mensagens de grupos
- filtra somente os grupos autorizados
- envia cada mensagem para o hub em `/api/wa-monitor/inbound`
- nao responde mensagens, apenas coleta e encaminha para analise
- ao conectar, reprocessa o historico sincronizado do dia dos grupos permitidos e depois segue em tempo real
- quando nao existe ancora real no hub, usa a lista de chats recebidos no bootstrap para criar uma ancora provisoria e tentar puxar o historico do dia

## Requisitos

- Node.js instalado
- o hub rodando em `http://localhost:4000`
- o token de captura configurado no hub e no bridge
- o numero corporativo conectado ao WhatsApp Business que participa dos grupos internos

## Instalacao

Dentro da pasta `07 - HUB NETTURBO`:

```bash
npm run wa-bridge:install
```

Ou, se preferir, entre direto na pasta do bridge:

```bash
cd "08 - IA COMUNICACAO/bridge"
npm install
```

## Configuracao

Copie `.env.example` para `.env` e ajuste:

```env
HUB_API_URL=http://localhost:4000
WHATSAPP_CAPTURE_TOKEN=coloque_o_mesmo_token_do_hub
BRIDGE_NAME=wa-intelligence-bridge
MONITOR_ALL_GROUPS=true
WA_RESET_SESSION=true
WA_SYNC_FULL_HISTORY=true
```

O bridge carrega esse `.env` automaticamente da propria pasta `bridge/`, mesmo quando voce o inicia pela raiz do hub.
O reset de sessao e aplicado apenas uma vez por execucao, para nao apagar a autenticacao em cada reconexao.
Quando `WA_SYNC_FULL_HISTORY=true`, a bridge tenta recuperar o historico sincronizado de hoje dos grupos permitidos. Se voce quiser apenas fluxo ao vivo, coloque `false`.

### Grupos monitorados

Edite `config/groups.whitelist.js` se quiser:

- `ALLOWED_GROUPS`: lista branca opcional
- `EXCLUDED_GROUPS`: grupos que nunca devem ser monitorados
- os nomes sao comparados sem acento e sem diferenca de maiusculas/minusculas
- o nome do grupo real e obtido pela metadata do WhatsApp, nao pelo autor da mensagem

Se `ALLOWED_GROUPS` estiver vazio e `MONITOR_ALL_GROUPS=true`, o bridge captura todos os grupos autorizados onde o numero estiver presente, exceto os excluidos.

## Execucao

Na raiz do hub:

```bash
npm run wa-bridge
```

Quando o QR aparecer no terminal:

1. abra o WhatsApp Business da empresa
2. toque no menu do aparelho ou na funcao de dispositivos conectados
3. escaneie o QR do terminal

Se aparecer erro de `conflict` ou `stream errored out`, encerre a sessao antiga do WhatsApp Web/bridge e inicie de novo para gerar um QR novo.

Se quiser forcar uma autenticacao limpa, deixe `WA_RESET_SESSION=true` apenas na primeira subida. Depois que o QR for aceito e a sessao salvar, troque para `false` para nao perder a autenticacao a cada reinicio.

Com `WA_SYNC_FULL_HISTORY=true`, o bridge tambem tenta sincronizar as mensagens de hoje ja no boot. Isso ajuda a nao perder conversas quando o servico reinicia no meio do dia.

## Saida esperada

Quando uma mensagem de grupo for capturada, o bridge envia um payload para o hub com:

- identificador do grupo
- nome do grupo
- remetente
- texto da mensagem
- timestamp
- id da mensagem
- tipo da mensagem

## Diagnostico de grupos sem mensagens na dashboard

### Grupo nao aparece na lista lateral

O numero do bridge nao e membro do grupo. O bridge so captura mensagens de grupos em que o numero esta presente. Adicione o numero ao grupo e reinicie o bridge.

### Grupo aparece na lista mas sem mensagens

**Causa mais comum:** o bridge nao estava rodando quando as mensagens chegaram, ou o celular nao respondeu ao pedido de sincronizacao de historico.

Ao reconectar, o bridge dispara `requestFullHistorySync` e aguarda 20 segundos pelo celular. Se o celular estiver em segundo plano ou offline, o sincronismo expira com `Timeout in AwaitingInitialSync` e as mensagens passadas nao sao recuperadas.

**Para recuperar mensagens perdidas:**
1. deixe o WhatsApp aberto e ativo no celular
2. reinicie o bridge — ele vai tentar o sync novamente

**Para mensagens em tempo real:** assim que o bridge esta online (`Conexao estabelecida`), toda mensagem nova chega normalmente, independente do celular.

### seededGroups: 0 no log de boot

Indica que o bridge nao encontrou ancora de historico nos dados do hub para nenhum grupo. Isso impede o backfill incremental de grupos que ja tem mensagens no banco.

**Causa (corrigida em maio/2026):** o campo `whatsapp_jid` no banco e salvo com prefixo `whatsapp:` (ex: `whatsapp:120363xxx@g.us`), mas o socket retorna o JID puro (`120363xxx@g.us`). A comparacao falhava silenciosamente.

**Correcao aplicada:** o prefixo e removido antes da comparacao em `seedHistoryAnchorsFromParticipatingGroups`. Com isso, grupos com historico no banco recebem ancora correta e o backfill incremental funciona normalmente no proximo restart.

### WA_BACKFILL_DAYS

Controla quantos dias de historico o bridge tenta recuperar ao reiniciar. Padrao: `1` (somente hoje). Mude para `7` no `.env` para recuperar os ultimos 7 dias:

```env
WA_BACKFILL_DAYS=7
```

## Observacao

Este bridge usa o protocolo do WhatsApp Web por meio do Baileys. Isso funciona como ponte operacional para leitura interna de grupos, mas nao e a API oficial da Meta.
