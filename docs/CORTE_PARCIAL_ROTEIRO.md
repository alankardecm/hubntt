# Corte Parcial

Este documento organiza a entrada gradual do HUB reestruturado sem desligar o ambiente legado.

## Objetivo

Permitir que os dois ambientes convivam:

- legado como principal
- novo como ambiente de validacao e depois de trafego parcial

## Estrategias recomendadas

### 1. Porta paralela local

Use quando a validacao ainda e interna.

- legado em `4000`
- novo em `4100`

### 2. Subdominio paralelo

Use quando quiser compartilhar com time interno ou cliente sem trocar o principal.

Exemplos:

- `hub.netturbo.local` para o legado
- `hub-next.netturbo.local` para o novo

### 3. Rota parcial

Use quando quiser expor so parte do novo ambiente.

Exemplos:

- manter o legado em `/`
- expor o novo em `/novo`
- ou expor apenas paginas especificas do novo por proxy

### 4. Grupo piloto

Use quando quiser validar com poucas pessoas primeiro.

- equipe interna
- operacao
- gestor responsavel

## Ordem recomendada

1. Subir o novo ambiente em paralelo.
2. Rodar smoke check.
3. Rodar checklist manual.
4. Liberar para grupo piloto.
5. Liberar modulo a modulo.
6. So depois promover como principal.

## Modulos sugeridos para entrada gradual

Entrada mais segura:

1. `dashboard`
2. `monitoring/zabbix`
3. `dashboard/comunicacao`
4. `rag`
5. APIs mais sensiveis

## Go/No-Go por etapa

Promover etapa apenas se:

- healthcheck ok
- smoke check ok
- build ok
- lint sem erros
- navegacao principal sem regressao
- integracoes criticas respondendo

## Comando de smoke check

```powershell
$env:SMOKE_BASE_URL='http://localhost:4100'
npm run smoke:parallel
```
