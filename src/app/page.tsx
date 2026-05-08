import Link from 'next/link';
import {
  Mic, FileText, BarChart2, Database,
  ShieldAlert, MessageSquare, ArrowRight,
  LayoutGrid, Wifi
} from 'lucide-react';

const modules = [
  {
    title: 'NetMeet',
    href: '/dashboard/netmeet',
    description: 'Crie a reuniao por link, concentre transcript e gere o resumo dentro do Hub.',
    icon: Mic,
    accent: '#379890',
  },
  {
    title: 'RAG',
    href: '/rag',
    description: 'Busca semantica e contexto interno com base vetorial.',
    icon: FileText,
    accent: '#2d7d76',
  },
  {
    title: 'Dashboard',
    href: '/dashboards',
    description: 'Construcao e visualizacao das dashboards do hub.',
    icon: BarChart2,
    accent: '#379890',
  },
  {
    title: 'DataLake',
    href: '/datalake',
    description: 'Fontes, preview e construcao de dashboards.',
    icon: Database,
    accent: '#2d7d76',
  },
  {
    title: 'Zabbix',
    href: '/monitoring/zabbix',
    description: 'Monitoramento de alarmes e eventos.',
    icon: ShieldAlert,
    accent: '#379890',
  },
  {
    title: 'IA Comunicacao',
    href: '/dashboard/comunicacao',
    description: 'Sentimento, palavras-chave e analise de grupos.',
    icon: MessageSquare,
    accent: '#2d7d76',
  },
];

export default function HubHomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-[#143230]/8 bg-white p-10 shadow-[0_30px_80px_-40px_rgba(20,50,48,0.18)]">
          {/* Decorative background gradient */}
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#379890]/6 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#379890]/4 blur-2xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#379890]/20 bg-[#379890]/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#379890]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#379890] shadow-[0_0_6px_rgba(55,152,144,0.6)]" />
              Netturbo Hub · Ambiente Evolucao · Porta 4200
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] uppercase text-[#143230] lg:text-5xl">
              Hub Operacional
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Entrada principal para RAG, Dashboards, Data Lake, Zabbix e IA Comunicacao.
              Ambiente com validacoes de seguranca e monitoramento de conexoes ativo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-[#379890] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_-12px_rgba(55,152,144,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2d7d76] hover:shadow-[0_16px_36px_-12px_rgba(55,152,144,0.55)]"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Abrir Workspace
              </Link>
              <Link
                href="/dashboard/status"
                className="group inline-flex items-center gap-2 rounded-full border border-[#379890]/30 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#379890] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#379890]/60 hover:bg-[#379890]/4 hover:shadow-[0_8px_20px_-8px_rgba(55,152,144,0.2)]"
              >
                <Wifi className="h-3.5 w-3.5" />
                Status das Conexoes
              </Link>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.title}
                href={module.href}
                className="group relative overflow-hidden rounded-[24px] border border-[#143230]/8 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(20,50,48,0.12)] transition-all duration-250 hover:-translate-y-1 hover:border-[#379890]/20 hover:shadow-[0_16px_40px_-14px_rgba(55,152,144,0.2)]"
              >
                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-[#379890]/50 transition-all duration-300 group-hover:w-full" />

                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#143230]/8 bg-[#379890]/8 transition-colors duration-200 group-hover:bg-[#379890]/14">
                    <Icon className="h-4.5 w-4.5 text-[#379890]" strokeWidth={2} />
                  </div>
                  <ArrowRight className="h-4 w-4 translate-x-1 text-stone-300 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-[#379890] group-hover:opacity-100" />
                </div>

                <h2 className="mt-4 text-[15px] font-black uppercase tracking-[0.04em] text-[#143230]">
                  {module.title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">
                  {module.description}
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
