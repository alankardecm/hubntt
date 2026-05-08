# Documentação do HUB NTT - Ambiente de Evolução

Este documento detalha a arquitetura, segurança e os processos do **HUB NTT (Versão 07.2)**, focado em alta disponibilidade, facilidade de uso e governança para deploy em servidores locais.

## 1. Visão Geral do Ambiente
Para garantir a continuidade da operação, o projeto foi espelhado em um ambiente de evolução:
- **Pasta:** `07.2 - HUB NETTURBO REESTRUTURACAO EVOLUCAO`
- **Porta Padrão:** `4200` (evita conflito com o ambiente legado na porta 4100).
- **Stack:** Next.js 16, React 19, Supabase, MySQL (Data Lake), OpenAI.

## 2. Melhorias de Usabilidade (Onboarding)
O processo de setup foi automatizado para facilitar o uso por qualquer desenvolvedor ou administrador:

### Script de Setup
Execute `npm run setup` para:
1. Verificar a existência do arquivo `.env`.
2. Criar uma cópia do `.env.example` caso necessário.
3. Receber instruções claras sobre as credenciais pendentes.

### Validação de Ambiente
Implementamos uma camada de validação baseada em **Zod** em `src/lib/env.ts`.
- O sistema não sobe em produção se houver variáveis críticas faltando.
- Em desenvolvimento, logs claros indicam quais chaves precisam de atenção.

## 3. Monitoramento de Saúde (Health Check)
Centralizamos o monitoramento de conexões externas em uma interface visual amigável:
- **Interface Visual:** Localizada em `/dashboard/status`, acessível diretamente pela Home Page.
- **Endpoint de API:** `/api/health/full` (formato JSON para integrações).
- **Serviços Monitorados:**
    - **Supabase:** Verifica conectividade com a API de banco operacional.
    - **MySQL (Data Lake):** Testa o ping direto com o servidor 10.250.x.x.
    - **OpenAI:** Valida a chave de API e a disponibilidade dos modelos.
- **Feedback:** Cards visuais com indicadores de "Conectado" ou "Erro", facilitando o diagnóstico para usuários não-técnicos.

## 4. Melhorias de Interface (UI/UX)
Para tornar o Hub mais acessível a qualquer usuário da empresa, realizamos as seguintes evoluções:

### Barra Lateral (Sidebar) Inteligente
- **Rótulos Visíveis:** A barra lateral foi expandida para exibir nomes claros (ex: Workspace, Monitoramento, DataLake) ao lado dos ícones. Isso elimina a necessidade de "adivinhar" a função de cada botão.
- **Design Responsivo:** Em telas grandes, os nomes permanecem fixos; em dispositivos móveis, a barra se recolhe automaticamente para priorizar o conteúdo.
- **Navegação Simplificada:** Removido o item "NOC 360" por redundância, e o módulo de infraestrutura foi renomeado para "Monitoramento", termo mais amigável.

## 5. Segurança e Governança
Preparado para deploy em infraestrutura local seguindo boas práticas:

- **Sanitização:** O arquivo `.env.example` não contém mais credenciais reais.
- **Isolamento de Erros:** O sistema utiliza *Error Boundaries*, garantindo que se um serviço (ex: Zabbix) cair, os outros módulos (ex: RAG) continuem funcionando.
- **Configuração de Porta:** Centralizada em `scripts/dev-start.mjs`, permitindo fácil alteração conforme a necessidade da infraestrutura da empresa.

## 5. Como Iniciar (Guia Rápido)
1. Navegue até a pasta do projeto.
2. Execute `npm run setup`.
3. Preencha o arquivo `.env` com as chaves reais da empresa.
4. Instale as dependências: `npm install --legacy-peer-deps`.
5. Inicie em desenvolvimento: `npm run dev`.
6. Para produção: `npm run build` seguido de `npm run start`.

## 6. Estrutura de Arquivos Relevante
- `src/lib/env.ts`: Schema de validação das variáveis de ambiente.
- `src/app/api/health/full/route.ts`: Lógica de teste de conectividade.
- `scripts/setup-check.mjs`: Script de boas-vindas e verificação inicial.

## 8. IA Comunicação Avançada (WhatsApp Bridge v2)
O módulo de comunicação foi evoluído para suportar dados não estruturados complexos:

### Transcrição de Áudio (Whisper)
- **Fluxo:** O bridge captura buffers de áudio (`audioMessage`) e envia via Base64 para o HUB.
- **Processamento:** O HUB utiliza o modelo `whisper-1` da OpenAI para transcrever o áudio em português.
- **Resultado:** A transcrição é anexada ao texto da mensagem para indexação e análise de sentimento.

### Visão Computacional (Vision OCR)
- **Fluxo:** Prints de telas, fotos de equipamentos ou erros são capturados.
- **Processamento:** O HUB utiliza `gpt-4o` para analisar a imagem e extrair contexto técnico (erros, status de LEDs, IDs de equipamentos).
- **Resultado:** A descrição da IA é prefixada com `[IA Vision]` no corpo da mensagem.

### Gestão Dinâmica de Grupos
- **Configuração:** O Bridge não depende mais apenas de listas estáticas.
- **API de Configuração:** `/api/wa-monitor/bridge/config` fornece ao bridge a lista de grupos ativos (`is_active`) direto do banco de dados.
- **Sincronização:** O bridge atualiza sua lista de monitoramento automaticamente a cada 5 minutos.

## 9. Módulo WhatsApp (wa-bridge)
O módulo de IA Comunicação depende do `wa-bridge` para capturar mensagens.
- **Configuração:** O arquivo `.env` dentro de `08 - IA COMUNICACAO/bridge/` já foi configurado para apontar para a porta `4200`.
- **Instalação:** 
    ```bash
    npm run wa-bridge:install
    ```
- **Execução:**
    ```bash
    npm run wa-bridge
    ```
Isso abrirá um QR Code no terminal para vinculação do WhatsApp Business.

---
*Documentação atualizada em: 06 de Maio de 2026*
