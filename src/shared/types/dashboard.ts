export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'metric' | 'table';
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'none';

export type WidgetConfig = {
  id: string;
  title: string;
  chartType: ChartType;
  table: string;
  xColumn: string;
  metric?: string;
  aggregation: AggregationType;
  limit: number;
  color?: string;
};

export type DashboardLayout = {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
};

export type QueryResult = {
  ok: boolean;
  data: Array<{ label: string; value: number }>;
  rawRows?: Array<Record<string, unknown>>;
  rawColumns?: string[];
  error?: string;
};
