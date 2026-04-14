'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Activity,
  Bot,
  Building2,
  Database,
  MonitorSmartphone,
  ShieldCheck,
  Layers3,
  LayoutGrid,
  BarChart2,
  Wallet,
} from 'lucide-react';

const modules = [
  {
    title: 'RAG',
    href: '/rag',
    icon: Bot,
    description: 'Consulta de conhecimento interno com contexto da base oficial.',
  },
  {
    title: 'Dashboard',
    href: '/dashboards',
    icon: BarChart2,
    description: 'Builder e visoes do hub para montar dashboards sob demanda.',
  },
  {
    title: 'DataLake',
    href: '/datalake',
    icon: Database,
    description: 'Fontes, ingestao e consolidacao de dados para as futuras dashboards.',
  },
  {
    title: 'Zabbix',
    href: '/monitoring/zabbix',
    icon: ShieldCheck,
    description: 'Monitoramento de alarmes e eventos operacionais em tempo real.',
  },
  {
    title: 'Infra',
    href: '/dashboard/noc',
    icon: Activity,
    description: 'Saude dos servicos-base do HUB, incluindo Zabbix, Data Lake e sustentacao operacional.',
  },
  {
    title: 'IA Comunicacao',
    href: '/dashboard/comunicacao',
    icon: Layers3,
    description: 'Dashboard inicial para sentimento, palavras-chave e reunioes.',
  },
  {
    title: 'Custos',
    href: '/dashboard/custos',
    icon: Wallet,
    description: 'Painel financeiro inicial do HUB com base em servicos, modulos e ambientes.',
  },
];

const lanes = [
  'Cada usuario tera sua visao personalizada.',
  'Sem KPI global fixo nesta tela.',
  'A pagina funciona como selector de modulos.',
  'Indicadores futuros devem vir do perfil do usuario.',
];

export default function DashboardHub() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-screen">
        <div className="px-12 py-10 flex flex-col gap-10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] border border-white/5 bg-card p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Workspace</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Hub</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">Multiusuario</span>
            </div>

            <div className="mt-6 grid gap-10 xl:grid-cols-12 items-start">
              <div className="xl:col-span-7 space-y-5">
                <h1 className="text-5xl lg:text-6xl font-[1000] tracking-[-0.08em] leading-[0.95] uppercase">
                  Selecione sua area de trabalho
                </h1>
                <p className="max-w-2xl text-base lg:text-lg text-stone-400 leading-relaxed">
                  Esta pagina nao vai exibir um KPI unico para todo mundo. Ela existe para cada usuario
                  entrar no modulo certo e, no futuro, receber apenas os indicadores que forem dele.
                </p>
              </div>

              <div className="xl:col-span-5 rounded-[32px] border border-white/5 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Layers3 className="w-5 h-5 text-neon-cyan" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
                    Regra da tela
                  </p>
                </div>
                <div className="space-y-3">
                  {lanes.map((lane) => (
                    <div key={lane} className="rounded-2xl border border-white/5 bg-background/40 px-4 py-3 text-sm text-stone-300">
                      {lane}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 * index }}
                className="group rounded-[32px] border border-white/5 bg-card p-7 shadow-2xl hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                    <module.icon className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600">
                    0{index + 1}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-[950] tracking-[-0.05em] uppercase">{module.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{module.description}</p>

                <Link
                  href={module.href}
                  className="mt-7 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-neon-cyan transition-transform group-hover:translate-x-1"
                >
                  Abrir modulo <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr] pb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-[34px] border border-white/5 bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-600">Fluxo</p>
                  <h3 className="mt-2 text-2xl font-[950] tracking-[-0.05em] uppercase">Como usar a tela</h3>
                </div>
                <MonitorSmartphone className="w-7 h-7 text-neon-cyan" />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-neon-cyan" />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">Escolher modulo</h4>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-stone-400">
                    Cada area abre uma funcao especifica do hub. Nada de KPI fixo aqui.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-neon-orange" />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">Entradas por usuario</h4>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-stone-400">
                    A personalizacao real pode vir depois via perfil, permissao ou regra de negocio.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="rounded-[34px] border border-white/5 bg-white/[0.03] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-neon-orange" />
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">
                  Proxima evolucao
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                  <p className="text-sm leading-relaxed text-stone-400">
                    Quando voce quiser, a tela pode virar apenas um launcher ou ser substituida por visoes
                    individuais de usuario.
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/5 bg-background/40 p-5">
                  <p className="text-sm leading-relaxed text-stone-400">
                    O importante agora e evitar um dashboard que sugere um indicador unico para todo mundo.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}
