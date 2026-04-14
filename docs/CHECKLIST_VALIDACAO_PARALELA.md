# Checklist de Validacao Paralela

Use este checklist para homologar o HUB reestruturado com o legado ainda ativo.

## Ambientes

- Legado aberto e funcional na porta atual.
- Novo ambiente aberto em `http://localhost:4100`.
- Healthcheck do novo respondendo em `http://localhost:4100/api/health`.

## Navegacao base

- Home abre corretamente.
- Workspace abre corretamente.
- `RAG` abre sem erro visual.
- `DataLake` abre sem erro visual.
- `Zabbix` abre sem erro visual.
- `IA Comunicacao` abre sem erro visual.
- `FUNTER` abre corretamente.
- `NOC` abre corretamente.

## APIs

- `GET /api/health` retorna `ok: true`.
- `POST /api/chat` responde.
- `GET /api/zabbix` responde.
- `GET /api/wa-monitor/insights` responde.
- `GET /api/wa-monitor/groups` responde.
- `GET /api/wa-monitor/group-brief` responde com dados validos para um grupo conhecido.

## Comparacao com legado

- Menus principais equivalentes.
- Modulos principais equivalentes.
- Dados visiveis equivalentes onde esperado.
- Sem regressao funcional evidente no fluxo de monitoramento.
- Sem regressao funcional evidente no fluxo de comunicacao.
- Sem regressao funcional evidente no fluxo de RAG.

## Validacao operacional

- Build do novo ambiente concluido com sucesso.
- Lint do novo ambiente concluido sem erros.
- Variaveis de ambiente carregadas corretamente.
- Logs sem erros criticos na inicializacao.
- Nenhuma dependencia critica faltando em runtime.

## Go/No-Go

- `GO` apenas se navegacao, APIs e integracoes estiverem ok.
- `NO-GO` se houver divergencia critica com o legado.
- Em caso de duvida, manter o legado como principal e seguir ajustando o novo.
