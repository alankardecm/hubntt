import { NextRequest, NextResponse } from 'next/server';
import { getMysqlPool, getMysqlConfig, isMysqlConfigured, isSafeTableName, isTableAllowed } from '@/infrastructure/datalake/mysql-client';
import type { RowDataPacket } from 'mysql2';
import mysql from 'mysql2';
import type { QueryResult } from '@/shared/types/dashboard';

const SAFE_AGGREGATIONS = ['count', 'sum', 'avg', 'min', 'max', 'none'] as const;
type SafeAgg = (typeof SAFE_AGGREGATIONS)[number];

function isSafeAggregation(value: unknown): value is SafeAgg {
  return SAFE_AGGREGATIONS.includes(value as SafeAgg);
}

export async function POST(request: NextRequest) {
  try {
    if (!isMysqlConfigured()) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'MySQL não configurado.' }, { status: 503 });
    }

    const body = (await request.json()) as {
      table?: string;
      xColumn?: string;
      metric?: string;
      aggregation?: string;
      limit?: number;
    };

    const { table = '', xColumn = '', metric = '', aggregation = 'count', limit = 20 } = body;

    // Validate table
    if (!table || !isSafeTableName(table) || !isTableAllowed(table)) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'Tabela inválida ou não permitida.' }, { status: 400 });
    }

    // Validate aggregation
    if (!isSafeAggregation(aggregation)) {
      return NextResponse.json<QueryResult>({ ok: false, data: [], error: 'Agregação inválida.' }, { status: 400 });
    }

    // Validate column names (only alphanumeric + underscore)
    const safeXColumn = isSafeTableName(xColumn) ? xColumn : '';
    const safeMetric = metric && isSafeTableName(metric) ? metric : '';
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 200);

    const pool = getMysqlPool();
    const config = getMysqlConfig();
    const escapedTable = mysql.escapeId(table);

    // MODE: raw table preview
    if (aggregation === 'none' || !safeXColumn) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${escapedTable} LIMIT ${safeLimit}`
      );

      const rawColumns = rows.length > 0 ? Object.keys(rows[0] as object) : [];

      return NextResponse.json<QueryResult>({
        ok: true,
        data: [],
        rawRows: rows as Array<Record<string, unknown>>,
        rawColumns,
      });
    }

    // MODE: aggregated query
    const escapedX = mysql.escapeId(safeXColumn);
    let selectExpr: string;

    if (aggregation === 'count') {
      selectExpr = `${escapedX} AS label, COUNT(*) AS value`;
    } else if (safeMetric) {
      const escapedMetric = mysql.escapeId(safeMetric);
      selectExpr = `${escapedX} AS label, ${aggregation.toUpperCase()}(${escapedMetric}) AS value`;
    } else {
      selectExpr = `${escapedX} AS label, COUNT(*) AS value`;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectExpr} FROM ${escapedTable}
       GROUP BY ${escapedX}
       ORDER BY value DESC
       LIMIT ${safeLimit}`
    );

    const data = (rows as Array<Record<string, unknown>>).map((row) => ({
      label: String(row.label ?? ''),
      value: Number(row.value ?? 0),
    }));

    return NextResponse.json<QueryResult>({ ok: true, data });
  } catch (error) {
    return NextResponse.json<QueryResult>(
      { ok: false, data: [], error: error instanceof Error ? error.message : 'Erro na query.' },
      { status: 500 }
    );
  }
}
