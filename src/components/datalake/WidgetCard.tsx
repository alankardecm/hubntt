'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, X, GripVertical, AlertCircle } from 'lucide-react';
import type { WidgetConfig, QueryResult } from '@/shared/types/dashboard';
import WidgetChart from './WidgetChart';

const CHART_ICONS: Record<string, string> = {
  bar: 'BA', line: 'LI', area: 'AR', pie: 'PI', metric: 'ME', table: 'TB',
};

type Props = {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

export default function WidgetCard({ widget, onRemove, isDragging, dragHandleProps }: Props) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/datalake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: widget.table,
          xColumn: widget.xColumn,
          metric: widget.metric,
          aggregation: widget.aggregation,
          limit: widget.limit,
        }),
      });
      const data = (await response.json()) as QueryResult;
      setResult(data);
      setLastFetched(new Date().toLocaleTimeString('pt-BR'));
    } finally {
      setLoading(false);
    }
  }, [widget]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[#143230]/8 bg-white/95 shadow-[0_20px_50px_-34px_rgba(20,50,48,0.28)] transition-shadow ${
        isDragging ? 'ring-1 ring-[#379890]/30 shadow-2xl shadow-[#379890]/20' : ''
      }`}
    >
      <div className="flex items-center gap-3 border-b border-[#143230]/6 bg-[#f9faf7] px-5 py-4">
        <div
          {...dragHandleProps}
          className="cursor-grab shrink-0 text-stone-400 transition-colors hover:text-[#143230] active:cursor-grabbing"
          title="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#379890]/10 text-[10px] font-black text-[#379890]">
          {CHART_ICONS[widget.chartType] ?? 'BA'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#143230]">{widget.title}</p>
          <p className="truncate font-mono text-[9px] text-stone-500">
            {widget.table} - {widget.xColumn || 'sem coluna'} - {widget.aggregation}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-[#379890]/10 hover:text-[#379890]"
            title="Atualizar"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-red-400/10 hover:text-red-500"
            title="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-[200px] flex-1 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-3 text-stone-500">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            <span className="text-xs">Carregando dados...</span>
          </div>
        ) : result?.error ? (
          <div className="flex h-full items-center gap-3 text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs">{result.error}</p>
          </div>
        ) : !result?.ok ? (
          <div className="flex h-full items-center justify-center text-xs text-stone-500">
            Sem dados disponiveis
          </div>
        ) : (
          <WidgetChart
            chartType={widget.chartType}
            data={result.data}
            rawRows={result.rawRows}
            rawColumns={result.rawColumns}
            color={widget.color}
          />
        )}
      </div>

      {lastFetched && (
        <div className="border-t border-[#143230]/6 bg-[#f9faf7] px-5 py-2">
          <p className="font-mono text-[9px] text-stone-500">Atualizado as {lastFetched}</p>
        </div>
      )}
    </motion.div>
  );
}
