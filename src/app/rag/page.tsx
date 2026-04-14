'use client';

import { useEffect, useState } from 'react';
import { Bot, Database, Image as ImageIcon, Search, Send } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type RagSource = {
  title: string;
  source: string;
  score?: number;
  imageUrl?: string;
};

type RagSession = {
  sessionId: string;
  messages: ChatMessage[];
  topic: string;
  summary: string;
};

const CHAT_SESSION_KEY = 'netturbo-rag-session-v1';
const INITIAL_PROMPT = 'como configurar o ATA Grandstream HT818 de 8 portas';

const BASE_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Estou pronto para consultar a base oficial. Me faca uma pergunta tecnica e eu respondo com contexto do Pinecone.',
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferTopic(message: string) {
  const normalized = normalizeText(message);
  const matchers = [
    /ata\s+grandstream\s+ht818/,
    /profile\s+sip/,
    /ip\s+estatico/,
    /habilitar\s+icmp/,
    /porta\s+wan/,
    /porta\s+lan/,
    /fxs\s+ports?/,
    /basic\s+settings/,
  ];

  for (const matcher of matchers) {
    const matched = normalized.match(matcher);
    if (matched) return matched[0];
  }

  const stopwords = new Set([
    'como',
    'quais',
    'qual',
    'para',
    'no',
    'na',
    'os',
    'as',
    'de',
    'do',
    'da',
    'dos',
    'das',
    'o',
    'a',
    'um',
    'uma',
    'preciso',
    'precisa',
    'precisamos',
    'precisam',
    'faz',
    'fazer',
    'sobre',
    'essa',
    'esse',
    'isso',
    'isto',
    'pode',
    'podemos',
    'me',
    'e',
    'em',
    'por',
  ]);

  const meaningful = normalized.split(' ').filter((term) => term.length > 2 && !stopwords.has(term));
  return meaningful.slice(0, 4).join(' ') || 'consulta geral';
}

function buildSessionSummary(topic: string, userMessage: string, assistantMessage: string) {
  const userSnippet = userMessage.trim().slice(0, 140);
  const assistantSnippet = assistantMessage.trim().slice(0, 180);
  return `Tema: ${topic}. Ultima pergunta: ${userSnippet}. Ultima resposta: ${assistantSnippet}.`;
}

function normalizeAssistantText(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function createSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `rag-session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RagExplorer() {
  const [sessionId, setSessionId] = useState(() => createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(BASE_MESSAGES);
  const [input, setInput] = useState(INITIAL_PROMPT);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pinecone' | 'empty' | 'error'>('idle');
  const [statusDetail, setStatusDetail] = useState('Pronto para conversar com a base oficial.');
  const [sources, setSources] = useState<RagSource[]>([]);
  const [sessionTopic, setSessionTopic] = useState('consulta geral');
  const [sessionSummary, setSessionSummary] = useState('Tema: consulta geral. Aguardando primeira troca.');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(CHAT_SESSION_KEY);
      if (!rawSession) return;

      const parsed = JSON.parse(rawSession) as RagSession;
      if (typeof parsed?.sessionId === 'string' && parsed.sessionId.trim()) {
        setSessionId(parsed.sessionId.trim());
      }
      if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
      }
      if (typeof parsed?.topic === 'string' && parsed.topic.trim()) {
        setSessionTopic(parsed.topic);
      }
      if (typeof parsed?.summary === 'string' && parsed.summary.trim()) {
        setSessionSummary(parsed.summary);
      }
    } catch {
      window.localStorage.removeItem(CHAT_SESSION_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const payload: RagSession = {
      sessionId,
      messages: messages.slice(-20),
      topic: sessionTopic,
      summary: sessionSummary,
    };

    window.localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(payload));
  }, [messages, hydrated, sessionId, sessionTopic, sessionSummary]);

  const headerBadge =
    status === 'pinecone'
      ? 'Pinecone ativo'
      : status === 'empty'
        ? 'Sem contexto util'
        : status === 'error'
          ? 'Erro na consulta'
          : 'Chat pronto';

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || searching) return;

    const nextTopic = inferTopic(trimmed);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];

    setMessages(nextMessages);
    setSessionTopic(nextTopic);
    setInput('');
    setSearching(true);
    setStatus('idle');
    setStatusDetail('Consultando Pinecone...');
    setSources([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages,
          sessionTopic: nextTopic,
          sessionSummary,
        }),
      });

      const payload = (await response.json()) as {
        answer?: string;
        provider?: 'pinecone' | 'empty';
        diagnostics?: string[];
        sources?: RagSource[];
      };

      const assistantMessage = normalizeAssistantText(
        payload.answer?.trim() || 'Nao encontrei contexto suficiente na base oficial.',
      );

      setMessages((current) => [...current, { role: 'assistant', content: assistantMessage }]);
      setSources(payload.sources || []);
      setStatus(payload.provider || 'empty');
      setStatusDetail(
        payload.diagnostics?.join(' • ') || 'Resposta gerada pelo chat do hub usando o contexto recuperado.',
      );
      setSessionSummary(buildSessionSummary(nextTopic, trimmed, assistantMessage));
    } catch (error) {
      setStatus('error');
      setStatusDetail(error instanceof Error ? error.message : 'Falha desconhecida');
      setMessages((current) => [...current, { role: 'assistant', content: 'Nao foi possivel executar a busca neste momento.' }]);
    } finally {
      setSearching(false);
    }
  }

  function clearSession() {
    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);
    setMessages(BASE_MESSAGES);
    setSources([]);
    setStatus('idle');
    setStatusDetail('Sessao limpa. Conversa anterior encerrada. Pronto para uma nova conversa.');
    setSessionTopic('consulta geral');
    setSessionSummary('Tema: consulta geral. Aguardando primeira troca.');
    setInput(INITIAL_PROMPT);
    window.localStorage.removeItem(CHAT_SESSION_KEY);
  }

  const quickPrompts = [
    INITIAL_PROMPT,
    'Quais sao os passos para o acesso inicial?',
    'Quais campos preciso preencher no profile SIP?',
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-foreground">
      <Sidebar />

      <main className="custom-scrollbar flex flex-1 flex-col gap-10 overflow-y-auto px-12 py-12">
        <header className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              <span>Inteligencia Capital</span>
              <span className="text-primary">Pinecone RAG</span>
            </div>
            <h1 className="text-4xl font-[950] leading-tight tracking-[-0.05em] text-foreground">
              Netturbo <span className="text-primary italic">Assistant</span>
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Conversa operacional com a base oficial, em formato de mensagens, com fontes e evidencias ao lado.
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Tema atual: <span className="text-foreground">{sessionTopic}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="rounded-[28px] border border-border/70 bg-surface/90 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground shadow-[0_18px_45px_rgba(55,152,144,0.08)]">
              {headerBadge}
            </div>
            <button
              onClick={clearSession}
              className="rounded-full border border-border bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              Limpar sessao
            </button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="flex min-h-[760px] flex-col rounded-[36px] border border-border/70 bg-card p-5 shadow-[0_28px_70px_rgba(42,57,52,0.14)]">
            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-border/70 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.03em] text-foreground">Netturbo Assistant</h2>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{statusDetail}</p>
                </div>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {headerBadge}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="custom-scrollbar mt-5 flex max-h-[480px] flex-1 flex-col gap-4 overflow-y-auto rounded-[28px] border border-border/70 bg-gradient-to-br from-white via-[#f7fbfa] to-[#eef6f4] p-4 pr-3">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[78%] break-words rounded-[24px] border p-4 shadow-xl ${
                      isUser
                        ? 'ml-auto rounded-br-md border-primary/20 bg-primary text-white'
                        : 'rounded-bl-md border-border bg-white text-foreground'
                    }`}
                  >
                    <div className={`mb-2 text-[9px] font-black uppercase tracking-[0.3em] ${isUser ? 'text-white/75' : 'text-muted-foreground'}`}>
                      {isUser ? 'Voce' : 'Netturbo'}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-[30px] border border-border/70 bg-white/80 p-3 shadow-[0_18px_45px_rgba(42,57,52,0.08)]">
              <div className="group relative">
                <div className="absolute -inset-1 rounded-[26px] bg-gradient-to-r from-primary/25 to-[#7fd3cb]/20 blur-2xl opacity-0 transition-all duration-700 group-focus-within:opacity-100" />
                <div className="relative flex items-center gap-3 rounded-[26px] border border-border bg-white p-3 shadow-xl backdrop-blur-xl">
                  <Search className="ml-4 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-foreground outline-none placeholder:font-semibold placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={searching}
                    className="inline-flex h-12 items-center gap-2 rounded-[20px] bg-primary px-8 text-[11px] font-[1000] uppercase tracking-[0.3em] text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {searching ? 'Enviando...' : 'Enviar'}
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="neon-card flex flex-col gap-5 p-8">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <h4 className="text-[11px] font-[1000] uppercase tracking-[0.3em] text-muted-foreground">Fontes usadas</h4>
              </div>
              <div className="space-y-3">
                {sources.length > 0 ? (
                  sources.map((source, index) => (
                    <div
                      key={`${source.title}-${source.source}-${index}`}
                      className="rounded-[24px] border border-border bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground">{source.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{source.source}</p>
                        </div>
                        {typeof source.score === 'number' ? (
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {source.score.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                      {source.imageUrl ? (
                        <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-[#f7fbfa]">
                          <img src={source.imageUrl} alt={source.title} className="h-44 w-full object-contain bg-[#f7fbfa]" />
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-border bg-white p-4 text-sm text-muted-foreground">
                    As fontes recuperadas aparecem aqui depois de cada resposta.
                  </div>
                )}
              </div>
            </div>

            <div className="neon-card flex flex-col gap-4 p-8">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-[#d58a1b]" />
                <h4 className="text-[11px] font-[1000] uppercase tracking-[0.3em] text-muted-foreground">Imagens</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Se o Pinecone devolver <code>image_url</code>, a imagem aparece aqui junto da fonte correspondente.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
