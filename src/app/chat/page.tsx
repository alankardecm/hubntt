'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const STORAGE_KEY = 'netturbo-chat-geral-v1';

const QUICK_PROMPTS = [
  'Reescreva esse email de forma mais profissional:',
  'Explique de forma simples o que é:',
  'Me ajude a responder essa mensagem:',
  'Resuma o seguinte texto:',
];

function formatMessage(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

export default function ChatGeral() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
        body: JSON.stringify({ messages: next }),
      });

      const data = (await res.json()) as { answer?: string };
      const answer = data.answer?.trim() || 'Não consegui gerar uma resposta. Tente novamente.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
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

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-bg text-foreground">
      <Sidebar />

      <main className="flex flex-1 flex-col min-h-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#143230]/8 bg-white/80 px-8 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#379890]/12 ring-1 ring-[#379890]/20">
              <Bot className="h-5 w-5 text-[#379890]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-[-0.03em] text-[#143230]">Assistente Netturbo</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#617472]">
                {loading ? 'Digitando...' : messages.length === 0 ? 'Pronto para ajudar' : `${messages.length} mensagens`}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-2 rounded-xl border border-[#143230]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#617472] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-8 lg:px-12">

          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#379890]/12 ring-1 ring-[#379890]/20">
                <Sparkles className="h-7 w-7 text-[#379890]" />
              </div>
              <div>
                <h2 className="text-2xl font-[950] tracking-[-0.04em] text-[#143230]">Como posso ajudar?</h2>
                <p className="mt-2 text-sm text-[#617472]">Pergunte qualquer coisa, peça para reescrever um texto, analisar uma situação...</p>
              </div>

              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => applyQuickPrompt(prompt)}
                    className="rounded-2xl border border-[#143230]/10 bg-white px-5 py-4 text-left text-[12px] font-bold text-[#143230] transition-all hover:border-[#379890]/30 hover:bg-[#379890]/5 hover:text-[#379890]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  isUser
                    ? 'bg-[#143230] text-white'
                    : 'bg-[#379890]/12 text-[#379890]'
                }`}>
                  {isUser ? 'EU' : <Bot className="h-4 w-4" />}
                </div>

                <div className={`max-w-[72%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'rounded-tr-md bg-[#143230] text-white'
                    : 'rounded-tl-md border border-[#143230]/8 bg-white text-[#143230]'
                }`}>
                  {formatMessage(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#379890]/12">
                <Bot className="h-4 w-4 text-[#379890]" />
              </div>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-md border border-[#143230]/8 bg-white px-5 py-4 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#379890]/60 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#379890]/60 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#379890]/60 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#143230]/8 bg-white/80 px-6 py-5 backdrop-blur-xl lg:px-12">
          <div className="flex items-end gap-3 rounded-3xl border border-[#143230]/12 bg-white p-3 shadow-[0_8px_30px_rgba(20,50,48,0.08)] transition-all focus-within:border-[#379890]/40 focus-within:shadow-[0_8px_30px_rgba(55,152,144,0.12)]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-[#143230] outline-none placeholder:text-[#617472]"
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#379890] text-white shadow-md transition-all hover:bg-[#2d7d77] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#617472]">
            Powered by Groq · llama-3.3-70b · Uso interno Netturbo
          </p>
        </div>
      </main>
    </div>
  );
}
