import { NextRequest, NextResponse } from 'next/server';
import { getMysqlPool, isMysqlConfigured, isSafeTableName, isTableAllowed } from '@/infrastructure/datalake/mysql-client';
import type { RowDataPacket } from 'mysql2';
import mysql from 'mysql2';
import type { FilterOperator, FilterWarning, QueryResult, TimeBucket } from '@/shared/types/dashboard';
import { isIdentifierColumnName, isMoneyColumnName } from '@/lib/dashboard-widget-intelligence';

const SAFE_AGGREGATIONS = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max', 'none'] as const;
const SAFE_TIME_BUCKETS = ['none', 'day', 'month', 'year'] as const;

type SafeAgg = (typeof SAFE_AGGREGATIONS)[number];

function isSafeAggregation(value: unknown): value is SafeAgg {
  return SAFE_AGGREGATIONS.includes(value as SafeAgg);
}

function isSafeTimeBucket(value: unknown): value is TimeBucket {
  return SAFE_TIME_BUCKETS.includes(value as TimeBucket);
}

function buildTimeExpression(column: string, bucket: TimeBucket) {
  if (bucket === 'day') return `DATE_FORMAT(${column}, '%Y-%m-%d')`;
  if (bucket === 'month') return `DATE_FORMAT(${column}, '%Y-%m')`;
  if (bucket === 'year') return `DATE_FORMAT(${column}, '%Y')`;
  return column;
}

function canFormatAsDate(column: string) {
  return /(data|dt_|_at$|competencia|vencimento|inicio|fim|conclusao|abertura|resposta|evento)/i.test(column);
}

async function getFilterDistinctValues(
  pool: ReturnType<typeof getMysqlPool>,
  escapedTable: string,
  column: string,
): Promise<string[]> {
  try {
    const escapedCol = mysql.escapeId(column);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT ${escapedCol} AS v FROM ${escapedTable} WHERE ${escapedCol} IS NOT NULL ORDER BY ${escapedCol} LIMIT 25`,
    );
    return (rows as Array<Record<string, unknown>>)
      .map((r) => String(r.v ?? ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isMysqlConfigured()) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'MySQL nao configurado.' }, { status: 503 });
    }

    const body = (await request.json()) as {
      table?: string;
      xColumn?: string;
      metric?: string;
      aggregation?: string;
      limit?: number;
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

    const {
      table = '',
      xColumn = '',
      metric = '',
      aggregation = 'count',
      limit = 20,
      filterColumn = '',
      filterOperator = 'eq',
      filterValue = '',
      filter2Column = '',
      filter2Operator = 'eq',
      filter2Value = '',
      dateColumn = '',
      dateFrom = '',
      dateTo = '',
      timeBucket = 'none',
      numericBucketSize,
    } = body;

    if (!table || !isSafeTableName(table) || !isTableAllowed(table)) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'Tabela invalida ou nao permitida.' }, { status: 400 });
    }

    if (!isSafeAggregation(aggregation)) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'Agregacao invalida.' }, { status: 400 });
    }

    if (!isSafeTimeBucket(timeBucket)) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'Agrupamento temporal invalido.' }, { status: 400 });
    }

    const safeXColumn = isSafeTableName(xColumn) ? xColumn : '';
    const safeMetric = metric && isSafeTableName(metric) && !isIdentifierColumnName(metric) ? metric : '';
    const safeFilterColumn = filterColumn && isSafeTableName(filterColumn) ? filterColumn : '';
    const safeFilter2Column = filter2Column && isSafeTableName(filter2Column) ? filter2Column : '';
    const safeDateColumn = dateColumn && isSafeTableName(dateColumn) ? dateColumn : '';
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 200);
    const safeNumericBucketSize =
      numericBucketSize && Number.isFinite(Number(numericBucketSize)) && Number(numericBucketSize) > 0
        ? Math.round(Number(numericBucketSize))
        : safeXColumn && isMoneyColumnName(safeXColumn)
          ? 100
          : 0;
    const aggregationFallback = aggregation !== 'none' && aggregation !== 'count' && aggregation !== 'count_distinct' && !safeMetric;
    const effectiveAggregation = aggregationFallback ? 'count' : aggregation;
    const configWarning = aggregationFallback
      ? `${aggregation.toUpperCase()} sem coluna numerica: usando COUNT(*) como fallback. Selecione uma coluna de valor no editor do widget.`
      : undefined;
    const effectiveTimeBucket: TimeBucket = safeXColumn && canFormatAsDate(safeXColumn)
      ? timeBucket === 'none' ? 'month' : timeBucket
      : 'none';

    const pool = getMysqlPool();
    const escapedTable = mysql.escapeId(table);
    const whereClauses: string[] = [];
    const whereParams: string[] = [];

    function buildFilterClause(column: string, operator: string, value: string) {
      const escaped = mysql.escapeId(column);
      if (operator === 'contains') return { sql: `${escaped} LIKE ?`, param: `%${value}%` };
      if (operator === 'neq') return { sql: `${escaped} != ?`, param: value };
      if (operator === 'gte') return { sql: `${escaped} >= ?`, param: value };
      if (operator === 'lte') return { sql: `${escaped} <= ?`, param: value };
      if (operator === 'gt') return { sql: `${escaped} > ?`, param: value };
      if (operator === 'lt') return { sql: `${escaped} < ?`, param: value };
      return { sql: `${escaped} = ?`, param: value };
    }

    if (safeFilterColumn && filterValue) {
      const { sql, param } = buildFilterClause(safeFilterColumn, filterOperator, filterValue);
      whereClauses.push(sql);
      whereParams.push(param);
    }

    if (safeFilter2Column && filter2Value) {
      const { sql, param } = buildFilterClause(safeFilter2Column, filter2Operator, filter2Value);
      whereClauses.push(sql);
      whereParams.push(param);
    }

    if (safeDateColumn && dateFrom) {
      whereClauses.push(`${mysql.escapeId(safeDateColumn)} >= ?`);
      whereParams.push(dateFrom);
    }

    if (safeDateColumn && dateTo) {
      whereClauses.push(`${mysql.escapeId(safeDateColumn)} <= ?`);
      whereParams.push(dateTo);
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    if (effectiveAggregation === 'none') {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${escapedTable}${whereSql} LIMIT ${safeLimit}`,
        whereParams
      );

      const rawColumns = rows.length > 0 ? Object.keys(rows[0] as object) : [];

      return NextResponse.json<QueryResult>({
        ok: true,
        data: [],
        rawRows: rows as Array<Record<string, unknown>>,
        rawColumns,
      });
    }

    if (!safeXColumn) {
      const selectExpr =
        effectiveAggregation === 'count'
          ? 'COUNT(*) AS value'
          : effectiveAggregation === 'count_distinct' && safeMetric
            ? `COUNT(DISTINCT ${mysql.escapeId(safeMetric)}) AS value`
            : safeMetric
              ? `${effectiveAggregation.toUpperCase()}(${mysql.escapeId(safeMetric)}) AS value`
              : 'COUNT(*) AS value';

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${selectExpr} FROM ${escapedTable}${whereSql}`,
        whereParams
      );

      const mainValue = Number(rows[0]?.value ?? 0);

      let filterWarning: FilterWarning | undefined;
      if (mainValue === 0 && safeFilterColumn && filterOperator === 'eq' && filterValue) {
        const existingValues = await getFilterDistinctValues(pool, escapedTable, safeFilterColumn);
        if (existingValues.length > 0 && !existingValues.some((v) => v.toLowerCase() === filterValue.toLowerCase())) {
          filterWarning = { column: safeFilterColumn, operator: filterOperator, value: filterValue, existingValues };
        }
      }

      return NextResponse.json<QueryResult>({
        ok: true,
        data: [{ label: 'resultado', value: mainValue }],
        filterWarning,
        configWarning,
      });
    }

    const escapedX = mysql.escapeId(safeXColumn);
    const isNumericBucket = safeNumericBucketSize > 0;
    const labelExpression = isNumericBucket
      ? `FLOOR(${escapedX} / ${safeNumericBucketSize}) * ${safeNumericBucketSize}`
      : buildTimeExpression(escapedX, effectiveTimeBucket);

    const selectExpr =
      effectiveAggregation === 'count'
        ? `${labelExpression} AS label, COUNT(*) AS value`
        : effectiveAggregation === 'count_distinct' && safeMetric
          ? `${labelExpression} AS label, COUNT(DISTINCT ${mysql.escapeId(safeMetric)}) AS value`
          : safeMetric
            ? `${labelExpression} AS label, ${effectiveAggregation.toUpperCase()}(${mysql.escapeId(safeMetric)}) AS value`
            : `${labelExpression} AS label, COUNT(*) AS value`;

    const orderBySql = isNumericBucket || effectiveTimeBucket !== 'none' ? 'label ASC' : 'value DESC';

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectExpr}
       FROM ${escapedTable}${whereSql}
       GROUP BY label
       ORDER BY ${orderBySql}
       LIMIT ${safeLimit}`,
      whereParams
    );

    const data = (rows as Array<Record<string, unknown>>).map((row) => ({
      label: isNumericBucket
        ? `${Number(row.label).toLocaleString('pt-BR')} – ${(Number(row.label) + safeNumericBucketSize - 1).toLocaleString('pt-BR')}`
        : String(row.label ?? ''),
      value: Number(row.value ?? 0),
    }));

    let filterWarning: FilterWarning | undefined;
    if (data.length === 0 && safeFilterColumn && filterOperator === 'eq' && filterValue) {
      const existingValues = await getFilterDistinctValues(pool, escapedTable, safeFilterColumn);
      if (existingValues.length > 0 && !existingValues.some((v) => v.toLowerCase() === filterValue.toLowerCase())) {
        filterWarning = { column: safeFilterColumn, operator: filterOperator, value: filterValue, existingValues };
      }
    }

    return NextResponse.json<QueryResult>({ ok: true, data, filterWarning, configWarning });
  } catch (error) {
    return NextResponse.json<QueryResult>(
      { ok: false, data: [], error: error instanceof Error ? error.message : 'Erro na query.' },
      { status: 500 }
    );
  }
}
