'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Home, Grid, FileText, MessageSquare,
  Settings, LogOut,
  Activity, Database, Bell, BarChart2, Wallet,
  Mic, Bot, TriangleAlert
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,          href: '/',                    label: 'Hub' },
  { icon: Grid,          href: '/dashboard',            label: 'Workspace' },
  { icon: BarChart2,     href: '/dashboards',           label: 'Dashboard' },
  { icon: Activity,      href: '/dashboard/noc',        label: 'Monitoramento' },
  { icon: Bell,          href: '/monitoring/zabbix',    label: 'Zabbix' },
  { icon: Bot,           href: '/dashboard/comunicacao',label: 'IA Comunicação' },
  { icon: TriangleAlert, href: '/dashboard/alertas',    label: 'Alertas' },
  { icon: Wallet,        href: '/dashboard/custos',     label: 'Custos' },
  { icon: Mic,           href: '/dashboard/netmeet',    label: 'NetMeet' },
  { icon: Database,      href: '/datalake',             label: 'DataLake' },
  { icon: FileText,      href: '/rag',                  label: 'RAG' },
  { icon: MessageSquare, href: '/chat',                 label: 'Chat' },
  { icon: Settings,      href: '/settings',             label: 'Diagnóstico' },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
              isActive
                ? 'bg-[#379890]/10 text-[#379890]'
                : 'text-stone-400 hover:bg-[#143230]/5 hover:text-[#143230]'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#379890]" />
            )}
            <item.icon
              className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-150 ${
                isActive ? 'text-[#379890]' : 'group-hover:text-[#143230]'
              }`}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span className={`hidden lg:block text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap ${
              isActive ? 'text-[#379890]' : 'text-stone-500 group-hover:text-[#143230]'
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <aside className="z-50 flex h-full w-[72px] lg:w-60 flex-shrink-0 flex-col border-r border-[#143230]/8 bg-white backdrop-blur-xl transition-all duration-300">

      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[#143230]/6 px-4 py-6 lg:px-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#379890]/12 ring-1 ring-[#379890]/20">
          <div className="h-4 w-4 rounded-full bg-[#379890] shadow-[0_0_10px_rgba(55,152,144,0.4)]" />
        </div>
        <div className="hidden lg:block min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#143230]">Netturbo</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#379890]">Hub Operacional</p>
        </div>
      </div>

      {/* Nav — isolado em Suspense para que usePathname não dispare antes do router inicializar */}
      <Suspense fallback={
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <div key={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-30">
              <item.icon className="h-[18px] w-[18px] flex-shrink-0 text-stone-400" strokeWidth={1.8} />
              <span className="hidden lg:block text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </nav>
      }>
        <SidebarNav />
      </Suspense>

      {/* Footer */}
      <div className="border-t border-[#143230]/6 p-2">
        <button
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500"
          title="Sair"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-150 group-hover:scale-110" strokeWidth={1.8} />
          <span className="hidden lg:block text-[11px] font-bold uppercase tracking-[0.1em]">Sair</span>
        </button>
      </div>
    </aside>
  );
}
