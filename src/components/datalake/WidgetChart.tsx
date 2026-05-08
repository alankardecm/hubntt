'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, Legend, Tooltip, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { ChartType } from '@/shared/types/dashboard';

const COLORS = ['#379890', '#3f7d78', '#5b90c7', '#6aa84f', '#d4a23a', '#bf6f8d', '#7ab8b1', '#8f7edc'];

type DataPoint = { label: string; value: number };

type Props = {
  chartType: ChartType;
  data: DataPoint[];
  rawRows?: Array<Record<string, unknown>>;
  rawColumns?: string[];
  color?: string;
  height?: number;
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatAxisLabel(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `${month}/${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  }
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#143230]/8 bg-white px-4 py-2 text-xs shadow-2xl">
      <p className="font-black text-stone-500">{label ? formatAxisLabel(label) : ''}</p>
      <p className="font-mono text-[#379890]">{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  );
};

export default function WidgetChart({ chartType, data, rawRows, rawColumns, color, height = 220 }: Props) {
  const primaryColor = color || '#379890';
  const tickStyle = { fill: '#617472', fontSize: 10, fontWeight: 700 };

  if (chartType === 'metric') {
    const total = data.length === 1 ? data[0].value : data.reduce((acc, d) => acc + d.value, 0);
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-6">
        <p className="text-5xl font-black text-[#379890]">{total.toLocaleString('pt-BR')}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
          {data.length === 1 ? 'resultado' : `${data.length} series somadas`}
        </p>
      </div>
    );
  }

  if (chartType === 'table') {
    const cols = rawColumns ?? (data.length > 0 ? ['label', 'value'] : []);
    const rows = rawRows ?? data.map((d) => ({ label: d.label, value: d.value }));

    if (cols.length === 0) {
      return <p className="py-8 text-center text-xs text-stone-500">Sem dados</p>;
    }

    return (
      <div className="max-h-[220px] overflow-auto rounded-xl border border-[#143230]/8 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-[#f5f7f3]">
            <tr>
              {cols.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-black uppercase tracking-wider text-stone-500">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[#143230]/6 hover:bg-[#f6faf8]">
                {cols.map((col) => (
                  <td key={col} className="max-w-[140px] truncate px-3 py-2 text-stone-700">
                    {String((row as Record<string, unknown>)[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span style={{ color: '#617472', fontSize: 10, fontWeight: 700 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,50,48,0.08)" />
          <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatAxisLabel} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={primaryColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id={`areaGrad-${primaryColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,50,48,0.08)" />
          <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatAxisLabel} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke={primaryColor} fill={`url(#areaGrad-${primaryColor})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,50,48,0.08)" />
        <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatAxisLabel} />
        <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} width={48} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2} dot={{ r: 3, fill: primaryColor }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
