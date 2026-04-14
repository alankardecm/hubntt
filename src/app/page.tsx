import Link from 'next/link';

const modules = [
  {
    title: 'RAG',
    href: '/rag',
    description: 'Busca semantica e contexto interno com base vetorial.',
  },
  {
    title: 'Dashboard',
    href: '/dashboards',
    description: 'Construcao e visualizacao das dashboards do hub.',
  },
  {
    title: 'DataLake',
    href: '/datalake',
    description: 'Fontes, preview e construcao de dashboards.',
  },
  {
    title: 'Zabbix',
    href: '/monitoring/zabbix',
    description: 'Monitoramento de alarmes e eventos.',
  },
  {
    title: 'IA Comunicacao',
    href: '/dashboard/comunicacao',
    description: 'Sentimento, palavras-chave e analise de grupos.',
  },
];

export default function HubHomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-[36px] border border-[#143230]/8 bg-white/85 p-10 shadow-[0_30px_70px_-40px_rgba(20,50,48,0.24)]">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#379890]">Netturbo Hub</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] uppercase text-[#143230]">
            Hub operacional da empresa
          </h1>
          <p className="mt-4 max-w-3xl text-stone-600">
            Entrada principal para RAG, dashboards, Data Lake, Zabbix e o modulo de IA Comunicacao em uma identidade visual mais alinhada a Netturbo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[#379890] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_38px_-20px_rgba(55,152,144,0.45)]"
            >
              Abrir Workspace
            </Link>
            <Link
              href="/rag"
              className="rounded-full border border-[#143230]/10 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#143230]"
            >
              Abrir RAG
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-[28px] border border-[#143230]/8 bg-white/80 p-6 shadow-[0_24px_55px_-38px_rgba(20,50,48,0.2)] transition-all hover:-translate-y-0.5 hover:border-[#379890]/18 hover:bg-white"
            >
              <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-[#143230]">{module.title}</h2>
              <p className="mt-3 text-sm text-stone-600">{module.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
