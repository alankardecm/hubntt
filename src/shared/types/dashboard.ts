export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'metric' | 'table';
export type AggregationType = 'count' | 'count_distinct' | 'sum' | 'avg' | 'min' | 'max' | 'none';
export type FilterOperator = 'eq' | 'contains' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt';
export type TimeBucket = 'none' | 'day' | 'month' | 'year';

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
  filterColumn?: string;
  filterOperator?: FilterOperator;
  filterValue?: string;
  filter2Column?: string;
  filter2Operator?: FilterOperator;
  filter2Value?: string;
  dateColumn?: string;
  dateFrom?: string;
  dateTo?: string;
  timeBucket?: TimeBucket;
  numericBucketSize?: number;
};

export type DashboardLayout = {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
};

export type FilterWarning = {
  column: string;
  operator: string;
  value: string;
  existingValues: string[];
};

export type QueryResult = {
  ok: boolean;
  data: Array<{ label: string; value: number }>;
  rawRows?: Array<Record<string, unknown>>;
  rawColumns?: string[];
  queryLabel?: string;
  error?: string;
  filterWarning?: FilterWarning;
  configWarning?: string;
};
