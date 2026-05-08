'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { CalendarClock, ExternalLink, FileText, Link2, Mic, Sparkles, UploadCloud, WandSparkles } from 'lucide-react';

type ActionItem = {
  owner: string;
  task: string;
  due_date?: string | null;
  status: string;
};

type Meeting = {
  id: string;
  title: string;
  meetingLink: string;
  classification: string;
  transcript: string;
  summary: string;
  decisions: string[];
  risks: string[];
  nextSteps: string[];
  actionItems: ActionItem[];
  provider: string;
  publishedToTeams: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NetMeetHubPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [classification, setClassification] = useState('interno');
  const [transcript, setTranscript] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const loadMeetings = useCallback(async () => {
    const response = await fetch('/api/netmeet/meetings');
    const payload = await response.json();
    if (!payload?.ok) throw new Error(payload?.error || 'Falha ao carregar reunioes.');
    setMeetings(payload.meetings || []);
    if (!selectedMeetingId && payload.meetings?.length) {
      setSelectedMeetingId(payload.meetings[0].id);
    }
  }, [selectedMeetingId]);

  useEffect(() => {
    loadMeetings().catch((err) => setError(String(err)));
  }, [loadMeetings]);

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId) || null,
    [meetings, selectedMeetingId]
  );

  useEffect(() => {
    if (selectedMeeting) {
      setTranscript(selectedMeeting.transcript || '');
      setClassification(selectedMeeting.classification || 'interno');
    }
  }, [selectedMeeting]);

  async function createMeeting() {
    setBusy('create');
    setError('');
    setFeedback('');
    try {
      const response = await fetch('/api/netmeet/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, meetingLink, classification }),
      });
      const payload = await response.json();
      if (!payload?.ok) throw new Error(payload?.error || 'Falha ao criar reuniao.');
      setFeedback('Reuniao criada com sucesso.');
      setTitle('');
      setMeetingLink('');
      await loadMeetings();
      setSelectedMeetingId(payload.meeting.id);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy('');
    }
  }

  async function saveTranscript() {
    if (!selectedMeeting) return;
    setBusy('transcript');
    setError('');
    setFeedback('');
    try {
      const response = await fetch(`/api/netmeet/meetings/${selectedMeeting.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const payload = await response.json();
      if (!payload?.ok) throw new Error(payload?.error || 'Falha ao salvar transcript.');
      setFeedback('Transcript salvo com sucesso.');
      await loadMeetings();
      setSelectedMeetingId(selectedMeeting.id);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy('');
    }
  }

  async function processMeeting() {
    if (!selectedMeeting) return;
    setBusy('process');
    setError('');
    setFeedback('');
    try {
      const response = await fetch(`/api/netmeet/meetings/${selectedMeeting.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification, webhookUrl }),
      });
      const payload = await response.json();
      if (!payload?.ok) throw new Error(payload?.error || 'Falha ao processar reuniao.');
      setFeedback(payload.publishedToTeams ? 'Resumo gerado e enviado para o Teams.' : 'Resumo gerado com sucesso.');
      await loadMeetings();
      setSelectedMeetingId(selectedMeeting.id);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy('');
    }
  }

  function handleTranscriptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((content) => setTranscript(content)).catch(() => setError('Falha ao ler o arquivo enviado.'));
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-12 py-10 flex flex-col gap-8">
          <section className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">NetMeet</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Reunioes</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Hub</span>
            </div>

            <div className="mt-6 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <h1 className="text-5xl lg:text-6xl font-[1000] tracking-[-0.08em] leading-[0.95] uppercase">
                  Resumo de reunioes dentro do Hub
                </h1>
                <p className="max-w-3xl text-base lg:text-lg text-stone-400 leading-relaxed">
                  Cole o link da reuniao, concentre o transcript e gere o resumo sem sair do Hub Netturbo.
                  O historico da reuniao fica salvo no proprio modulo para a demo e para consultas rapidas.
                </p>
              </div>

              <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <WandSparkles className="w-5 h-5 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                    Fluxo rapido
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    'Criar reuniao com nome e link',
                    'Colar ou subir transcript',
                    'Gerar resumo com Groq ou fallback local',
                    'Publicar no Teams pelo webhook/workflow',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/5 bg-background/40 px-4 py-3 text-sm text-stone-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/5 bg-card p-7 shadow-2xl">
                <div className="flex items-center gap-3">
                  <CalendarClock className="w-5 h-5 text-neon-cyan" />
                  <h2 className="text-xl font-[950] tracking-[-0.05em] uppercase">Nova reuniao</h2>
                </div>

                <div className="mt-6 space-y-4">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Nome da reuniao"
                    className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
                  />
                  <input
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="https://teams.microsoft.com/..."
                    className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
                  />
                  <select
                    value={classification}
                    onChange={(event) => setClassification(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="interno">interno</option>
                    <option value="comercial">comercial</option>
                    <option value="suporte">suporte</option>
                    <option value="produto">produto</option>
                  </select>
                  <button
                    onClick={createMeeting}
                    disabled={busy === 'create'}
                    className="w-full rounded-2xl bg-[#379890] px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white"
                  >
                    {busy === 'create' ? 'Criando...' : 'Criar reuniao'}
                  </button>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/5 bg-card p-7 shadow-2xl">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-neon-orange" />
                  <h2 className="text-xl font-[950] tracking-[-0.05em] uppercase">Historico</h2>
                </div>

                <div className="mt-6 space-y-3">
                  {meetings.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-sm text-stone-400">
                      Nenhuma reuniao criada ainda.
                    </div>
                  ) : (
                    meetings.map((meeting) => (
                      <button
                        key={meeting.id}
                        onClick={() => setSelectedMeetingId(meeting.id)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                          selectedMeetingId === meeting.id
                            ? 'border-[#379890]/30 bg-[#379890]/10'
                            : 'border-white/5 bg-white/[0.03] hover:border-white/10'
                        }`}
                      >
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-white">{meeting.title}</p>
                        <p className="mt-2 text-xs text-stone-400">{meeting.classification} | {meeting.updatedAt}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl">
              {selectedMeeting ? (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">Reuniao selecionada</p>
                      <h2 className="mt-3 text-3xl font-[950] tracking-[-0.05em] uppercase">{selectedMeeting.title}</h2>
                      <p className="mt-3 text-sm text-stone-400">
                        {selectedMeeting.summary || 'Ainda sem resumo gerado. Cole ou suba o transcript e processe a reuniao.'}
                      </p>
                    </div>

                    {selectedMeeting.meetingLink ? (
                      <a
                        href={selectedMeeting.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-neon-cyan"
                      >
                        Abrir reuniao <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null}
                  </div>

                  {(feedback || error) && (
                    <div className={`rounded-2xl px-4 py-3 text-sm ${error ? 'bg-red-500/10 text-red-300' : 'bg-[#379890]/10 text-[#8ee2dc]'}`}>
                      {error || feedback}
                    </div>
                  )}

                  <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                      <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-neon-cyan" />
                          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Transcript</h3>
                        </div>

                        <textarea
                          value={transcript}
                          onChange={(event) => setTranscript(event.target.value)}
                          placeholder="Cole aqui a transcricao da reuniao..."
                          className="mt-4 h-64 w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
                        />

                        <div className="mt-4 flex flex-wrap gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-stone-300">
                            <UploadCloud className="w-4 h-4" />
                            Upload .txt
                            <input type="file" accept=".txt,.md" className="hidden" onChange={handleTranscriptUpload} />
                          </label>

                          <button
                            onClick={saveTranscript}
                            disabled={busy === 'transcript'}
                            className="rounded-full bg-[#379890] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white"
                          >
                            {busy === 'transcript' ? 'Salvando...' : 'Salvar transcript'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-neon-orange" />
                          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Resumo e Teams</h3>
                        </div>

                        <div className="mt-4 space-y-4">
                          <select
                            value={classification}
                            onChange={(event) => setClassification(event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none"
                          >
                            <option value="interno">interno</option>
                            <option value="comercial">comercial</option>
                            <option value="suporte">suporte</option>
                            <option value="produto">produto</option>
                          </select>
                          <input
                            value={webhookUrl}
                            onChange={(event) => setWebhookUrl(event.target.value)}
                            placeholder="Webhook/Workflow do Teams (opcional)"
                            className="w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500"
                          />
                          <button
                            onClick={processMeeting}
                            disabled={busy === 'process'}
                            className="w-full rounded-2xl bg-[#379890] px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white"
                          >
                            {busy === 'process' ? 'Processando...' : 'Gerar resumo e publicar'}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-5">
                          <div className="flex items-center gap-3">
                            <Mic className="w-5 h-5 text-neon-cyan" />
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">Provider</p>
                          </div>
                          <p className="mt-4 text-lg font-black uppercase tracking-[-0.04em]">{selectedMeeting.provider}</p>
                        </div>

                        <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-5">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-neon-orange" />
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">Teams</p>
                          </div>
                          <p className="mt-4 text-lg font-black uppercase tracking-[-0.04em]">
                            {selectedMeeting.publishedToTeams ? 'Publicado' : 'Nao publicado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Decisoes</h3>
                      <div className="mt-4 space-y-2 text-sm text-stone-300">
                        {selectedMeeting.decisions.length ? selectedMeeting.decisions.map((item) => <div key={item}>- {item}</div>) : <div>Nenhuma decisao identificada.</div>}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Riscos</h3>
                      <div className="mt-4 space-y-2 text-sm text-stone-300">
                        {selectedMeeting.risks.length ? selectedMeeting.risks.map((item) => <div key={item}>- {item}</div>) : <div>Nenhum risco identificado.</div>}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Action Items</h3>
                      <div className="mt-4 space-y-3 text-sm text-stone-300">
                        {selectedMeeting.actionItems.length ? selectedMeeting.actionItems.map((item, index) => (
                          <div key={`${item.task}-${index}`} className="rounded-2xl border border-white/5 bg-background/40 px-3 py-3">
                            <div className="font-semibold text-white">{item.task}</div>
                            <div className="mt-1 text-xs text-stone-400">{item.owner} | {item.status}</div>
                          </div>
                        )) : <div>Nenhum action item identificado.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-8 text-sm text-stone-400">
                  Crie a primeira reuniao para habilitar o modulo NetMeet dentro do Hub.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
