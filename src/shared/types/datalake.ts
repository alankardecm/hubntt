export type DatalakeConnectionStatus = 'connected' | 'disconnected' | 'error';

export type DatalakeTableInfo = {
  name: string;
  rows: number | null;
  updatedAt: string | null;
  engine: string | null;
};

export type DatalakeOverview = {
  ok: boolean;
  status: DatalakeConnectionStatus;
  database: string | null;
  host: string | null;
  port: number | null;
  tableCount: number;
  tables: DatalakeTableInfo[];
  previewLimit: number;
  message?: string;
};

export type DatalakePreviewColumn = {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
};

export type DatalakePreviewResult = {
  ok: boolean;
  table: string;
  limit: number;
  columns: DatalakePreviewColumn[];
  rows: Array<Record<string, unknown>>;
};

export type DashboardSuggestion = {
  title: string;
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'table' | 'metric';
  table: string;
  x?: string;
  y?: string;
  metric?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  rationale: string;
};

export type DashboardSuggestionResponse = {
  ok: boolean;
  prompt: string;
  suggestions: DashboardSuggestion[];
  source: 'ai' | 'heuristic';
};
