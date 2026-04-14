'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home, Grid, FileText, MessageSquare,
  Settings, Plus, LogOut,
  Activity, Database, Bell, BarChart2, Wallet,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, href: '/', label: 'Hub' },
  { icon: Grid, href: '/dashboard', label: 'Workspace' },
  { icon: BarChart2, href: '/dashboards', label: 'Dashboard' },
  { icon: Activity, href: '/dashboard/noc', label: 'Infra' },
  { icon: Wallet, href: '/dashboard/custos', label: 'Custos' },
  { icon: Bell, href: '/monitoring/zabbix', label: 'Zabbix' },
  { icon: Database, href: '/datalake', label: 'DataLake' },
  { icon: FileText, href: '/rag', label: 'RAG' },
  { icon: MessageSquare, href: '/chat', label: 'Chat' },
  { icon: Settings, href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="z-50 flex h-screen w-[104px] flex-shrink-0 flex-col items-center border-r border-[#143230]/8 bg-white/85 backdrop-blur-xl">
      <div className="relative mt-8 mb-12 flex h-18 w-18 flex-col items-center justify-center rounded-[28px] border border-[#379890]/18 bg-[#379890]/10 shadow-[0_20px_40px_-26px_rgba(55,152,144,0.45)]">
        <div className="h-7 w-7 rounded-full bg-[#379890] shadow-[0_0_22px_rgba(55,152,144,0.35)]" />
        <span className="mt-2 text-[8px] font-black uppercase tracking-[0.3em] text-[#379890]">NT</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-6">
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link key={i} href={item.href} className="group relative flex items-center justify-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-pill border transition-all duration-300 ${
                  isActive
                    ? 'border-[#379890]/20 bg-[#379890]/12 shadow-[0_20px_32px_-24px_rgba(55,152,144,0.45)]'
                    : 'border-transparent hover:border-[#143230]/8 hover:bg-[#143230]/4'
                }`}
              >
                <item.icon
                  className={`h-6 w-6 transition-all duration-300 ${
                    isActive ? 'scale-110 text-[#379890]' : 'text-stone-500 group-hover:text-[#143230]'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute -left-[31px] h-8 w-2 rounded-r-full bg-[#379890] shadow-[0_0_18px_rgba(55,152,144,0.35)]"
                />
              )}

              <div className="pointer-events-none absolute left-[82px] z-[100] -translate-x-2 whitespace-nowrap rounded-xl border border-[#143230]/8 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#143230] opacity-0 shadow-xl transition-all group-hover:translate-x-0 group-hover:opacity-100">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-6 pb-8">
        <button className="group flex h-14 w-14 items-center justify-center rounded-pill border border-[#379890]/20 bg-[#379890]/10 text-[#379890] transition-all duration-300 hover:bg-[#379890] hover:text-white">
          <Plus className="h-6 w-6 transition-transform duration-500 group-hover:rotate-90" />
        </button>
        <button className="flex h-14 w-14 items-center justify-center rounded-pill text-stone-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500">
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </aside>
  );
}
