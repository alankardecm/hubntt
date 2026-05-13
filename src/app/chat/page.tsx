'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, Sparkles, BookOpen, MessageSquare, ExternalLink, ZoomIn, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type Mode = 'geral' | 'interno';

type Source = {
  title: string;
  source: string;
  score?: number;
  imageUrl?: string;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
};

const STORAGE_KEY = 'netturbo-chat-geral-v1';

const QUICK_PROMPTS: Record<Mode, string[]> = {
  geral: [
    'Reescreva esse email de forma mais profissional:',
    'Explique de forma simples o que é:',
    'Me ajude a responder essa mensagem:',
    'Resuma o seguinte texto:',
  ],
  interno: [
    'Como configurar o ATA Grandstream HT818?',
    'Como acessar o Zabbix?',
    'Como configurar um F612?',
    'Quais são os passos para configurar SIP?',
  ],
};

function formatMessage(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function ChatGeral() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('geral');
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/chat-geral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, mode }),
      });

      const data = (await res.json()) as { answer?: string; sources?: Source[] };
      const answer = data.answer?.trim() || 'Não consegui gerar uma resposta. Tente novamente.';
      const sources = data.sources ?? [];

      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erro de conexão. Verifique a API e tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function applyQuickPrompt(prompt: string) {
    setInput(prompt + ' ');
    textareaRef.current?.focus();
  }

  const isInterno = mode === 'interno';

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background text-foreground">
      <Sidebar />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-4 -right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 z-10">
              <X className="h-4 w-4" />
            </button>
            <p className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{lightbox.title}</p>
            <img src={lightbox.url} alt={lightbox.title} className="max-h-[85vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col min-h-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#404040]/8 bg-white/80 px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8DC63F]/12 ring-1 ring-[#8DC63F]/20">
              <Bot className="h-5 w-5 text-[#8DC63F]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-[-0.03em] text-[#404040]">Assistente Netturbo</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                {loading
                  ? 'Consultando...'
                  : messages.length === 0
                  ? isInterno ? 'Base interna ativa' : 'Pronto para ajudar'
                  : `${messages.length} mensagens`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle de modo */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setMode('geral')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                  !isInterno
                    ? 'bg-white text-[#404040] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                Geral
              </button>
              <button
                onClick={() => setMode('interno')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                  isInterno
                    ? 'bg-[#8DC63F] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <BookOpen className="h-3 w-3" />
                Consulta Interna
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-2 rounded-xl border border-[#404040]/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Faixa de modo interno */}
        {isInterno && (
          <div className="border-b border-[#8DC63F]/20 bg-[#8DC63F]/6 px-8 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DC63F]">
              Consultando TurboDocs · Pinecone como fallback
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-8 lg:px-12">

          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#8DC63F]/12 ring-1 ring-[#8DC63F]/20">
                {isInterno ? <BookOpen className="h-7 w-7 text-[#8DC63F]" /> : <Sparkles className="h-7 w-7 text-[#8DC63F]" />}
              </div>
              <div>
                <h2 className="text-2xl font-[950] tracking-[-0.04em] text-[#404040]">
                  {isInterno ? 'Consulta à base interna' : 'Como posso ajudar?'}
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  {isInterno
                    ? 'Pergunte sobre procedimentos, configurações e processos documentados no TurboDocs.'
                    : 'Pergunte qualquer coisa, peça para reescrever um texto, analisar uma situação...'}
                </p>
              </div>

              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
                {QUICK_PROMPTS[mode].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => applyQuickPrompt(prompt)}
                    className="rounded-2xl border border-[#404040]/10 bg-white px-5 py-4 text-left text-[12px] font-bold text-[#404040] transition-all hover:border-[#8DC63F]/30 hover:bg-[#8DC63F]/5 hover:text-[#8DC63F]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const hasSources = !isUser && msg.sources && msg.sources.length > 0;

            return (
              <div key={i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  isUser ? 'bg-[#404040] text-white' : 'bg-[#8DC63F]/12 text-[#8DC63F]'
                }`}>
                  {isUser ? 'EU' : <Bot className="h-4 w-4" />}
                </div>

                <div className="flex max-w-[72%] flex-col gap-2">
                  <div className={`rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'rounded-tr-md bg-[#404040] text-white'
                      : 'rounded-tl-md border border-[#404040]/8 bg-white text-[#404040]'
                  }`}>
                    {formatMessage(msg.content)}
                  </div>

                  {/* Fontes + imagens */}
                  {hasSources && (
                    <div className="flex flex-col gap-2 pl-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Fontes ({msg.sources!.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources!.slice(0, 6).map((src, si) => (
                          <a
                            key={si}
                            href={src.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-full border border-[#8DC63F]/25 bg-[#8DC63F]/8 px-2.5 py-1 text-[10px] font-bold text-[#8DC63F] transition-colors hover:bg-[#8DC63F]/15"
                          >
                            <BookOpen className="h-2.5 w-2.5" />
                            {src.title.length > 30 ? src.title.slice(0, 30) + '…' : src.title}
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        ))}
                      </div>
                      {/* Imagens das fontes */}
                      {msg.sources!.some(s => s.imageUrl) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.sources!.filter(s => s.imageUrl).slice(0, 4).map((src, si) => (
                            <div
                              key={si}
                              className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                              style={{ width: 120, height: 80 }}
                              onClick={() => setLightbox({ url: src.imageUrl!, title: src.title })}
                            >
                              <img src={src.imageUrl} alt={src.title} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                <ZoomIn className="h-5 w-5 text-white opacity-0 drop-shadow group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#8DC63F]/12">
                <Bot className="h-4 w-4 text-[#8DC63F]" />
              </div>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-md border border-[#404040]/8 bg-white px-5 py-4 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8DC63F]/60 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8DC63F]/60 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#8DC63F]/60 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#404040]/8 bg-white/80 px-6 py-5 backdrop-blur-xl lg:px-12">
          <div className={`flex items-end gap-3 rounded-3xl border p-3 shadow-[0_8px_30px_rgba(64,64,64,0.08)] transition-all ${
            isInterno
              ? 'border-[#8DC63F]/30 focus-within:border-[#8DC63F]/60 focus-within:shadow-[0_8px_30px_rgba(141,198,63,0.15)]'
              : 'border-[#404040]/12 focus-within:border-[#8DC63F]/40 focus-within:shadow-[0_8px_30px_rgba(141,198,63,0.12)]'
          } bg-white`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              placeholder={isInterno
                ? 'Pergunte sobre um procedimento ou configuração...'
                : 'Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)'}
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#404040] outline-none placeholder:text-gray-400"
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#8DC63F] text-white shadow-md transition-all hover:bg-[#7ab030] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            {isInterno
              ? 'Consulta Interna · TurboDocs + Pinecone · Groq llama-3.3-70b'
              : 'Assistente Geral · Groq llama-3.3-70b · Uso interno Netturbo'}
          </p>
        </div>
      </main>
    </div>
  );
}
