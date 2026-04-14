# Migracao Quente

Esta copia foi preparada para operar em paralelo com o ambiente legado.

## Objetivo

Manter os dois ambientes ativos enquanto o novo HUB reestruturado e validado:

- legado: `07 - HUB NETTURBO`
- novo: `07.1 - HUB NETTURBO REESTRUTURACAO`

## Porta padrao

O ambiente reestruturado usa a porta `4100` por padrao.

Voce pode sobrescrever com a variavel `PORT`.

## Healthcheck

Endpoint de saude do ambiente paralelo:

```text
/api/health
```

Exemplo local:

```powershell
Invoke-WebRequest http://localhost:4100/api/health
```

## Fluxo recomendado

1. Manter o legado operando normalmente.
2. Subir a copia reestruturada na porta `4100`.
3. Validar navegacao, APIs e integracoes no novo ambiente.
4. Colocar um proxy ou rota parcial apontando apenas parte do trafego para o novo ambiente.
5. So apos estabilizacao, promover o novo como principal.

Checklist de homologacao:

```text
docs/CHECKLIST_VALIDACAO_PARALELA.md
```

Roteiro de corte parcial:

```text
docs/CORTE_PARCIAL_ROTEIRO.md
```

## Comandos

Desenvolvimento:

```powershell
$env:PORT=4100
npm run dev
```

Desenvolvimento com workaround SWC/WASM:

```powershell
$env:PORT=4100
npm run dev:wasm
```

Producao local:

```powershell
$env:PORT=4100
npm run build
npm run start
```

Build validado neste ambiente:

```powershell
$env:PORT=4100
npm run build:wasm
npm run start:parallel
```

Smoke check:

```powershell
$env:SMOKE_BASE_URL='http://localhost:4100'
npm run smoke:parallel
```
