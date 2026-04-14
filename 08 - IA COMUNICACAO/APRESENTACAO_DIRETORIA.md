# Apresentação Executiva - IA Comunicacao

## Objetivo
Criar uma camada de inteligência para leitura, análise e resumo das comunicações internas da empresa, com foco em:
- grupos internos do WhatsApp
- sentimento das mensagens
- palavras mais recorrentes
- resumo diário por grupo
- consulta conversacional da base técnica

## O que já existe
### 1. Hub central
O hub Netturbo concentra os módulos principais do ecossistema:
- RAG conversacional
- IA Comunicacao
- monitoramento
- dashboards futuras

### 2. RAG conversacional
O módulo de conhecimento já está funcionando como assistente operacional:
- consulta o Pinecone
- responde em formato de chat
- mostra fontes e imagens recuperadas
- mantém memória curta de sessão

### 3. IA Comunicacao
O módulo de grupos internos já está operando com:
- captura das mensagens dos grupos autorizados
- classificação de sentimento
- detecção de termos críticos
- mapa de palavras
- resumo diário por grupo

## Valor para a empresa
### Operacional
- reduz tempo de consulta manual
- centraliza conhecimento e comunicação
- facilita acompanhamento de grupos críticos

### Gestão
- mostra tendências de conversa por grupo
- destaca temas recorrentes
- ajuda a identificar pressão, incidentes e urgências

### Conhecimento
- preserva manuais e procedimentos internos
- transforma documentação em consulta conversacional
- prepara a base para voz e reunião no futuro

## Status atual
- Hub em funcionamento
- RAG em modo conversacional
- Pinecone integrado
- IA Comunicacao lendo grupos da whitelist
- resumo diário preparado
- documentação e ponto de recuperação atualizados

## Decisões técnicas já tomadas
- Pinecone é o vetor principal do RAG
- Supabase fica para módulos transacionais e analíticos
- Groq pode ser usado para sentimento e resumo diário
- memória curta fica no próprio hub, não no n8n
- n8n fica reservado para automações assíncronas no futuro

## Próximos passos
1. consolidar a interface executiva para diretoria
2. conectar o resumo diário em rotina agendada
3. evoluir a análise de áudio e reuniões
4. refinar alertas por grupo e por termo crítico

## Mensagem para diretoria
O hub já deixou de ser uma ideia e passou a ser uma base funcional de operação e conhecimento. A próxima etapa é consolidar usabilidade, rotina e governança para transformar isso em uma plataforma interna de produtividade e inteligência.
