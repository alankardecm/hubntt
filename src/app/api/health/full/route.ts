import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';

export async function GET() {
  const status: {
    timestamp: string;
    services: Record<string, { status: string; message: string | null }>;
  } = {
    timestamp: new Date().toISOString(),
    services: {
      supabase: { status: 'unknown', message: null },
      mysql: { status: 'unknown', message: null },
      openai: { status: 'unknown', message: null },
    },
  };

  // 1. Test Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Test connection by fetching the session or a simple rpc if available, 
    // or just checking if we can reach the API. 
    // A reliable way without a specific table is checking for an empty select on a common system view
    // or just using the auth api to check settings.
    const { data, error } = await supabase.from('_health_check_dummy_').select('*').limit(0);
    
    // If we get an error but it's just "table not found", the connection IS working.
    // Error code 'PGRST116' is 'no rows', but table not found is also a sign of connection.
    // We'll consider it 'ok' if we don't get a network/auth error.
    const connectionError = error && (error.message.includes('fetch') || error.message.includes('Invalid API key'));
    
    status.services.supabase.status = connectionError ? 'error' : 'ok';
    if (connectionError) status.services.supabase.message = error.message;
  } catch (e: any) {
    status.services.supabase.status = 'error';
    status.services.supabase.message = e.message;
  }

  // 2. Test MySQL
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectTimeout: 5000,
    });
    await connection.ping();
    await connection.end();
    status.services.mysql.status = 'ok';
  } catch (e: any) {
    status.services.mysql.status = 'error';
    status.services.mysql.message = e.message;
  }

  // 3. Test OpenAI (Simple model list check)
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    status.services.openai.status = response.ok ? 'ok' : 'error';
    if (!response.ok) {
      const errorData = await response.json();
      status.services.openai.message = errorData.error?.message || 'Failed to connect to OpenAI';
    }
  } catch (e: any) {
    status.services.openai.status = 'error';
    status.services.openai.message = e.message;
  }

  const overallOk = Object.values(status.services).every(s => s.status === 'ok');

  return NextResponse.json({
    status: overallOk ? 'healthy' : 'degraded',
    ...status
  }, { status: overallOk ? 200 : 207 });
}
