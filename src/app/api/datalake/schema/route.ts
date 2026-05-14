import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserAllowedTables } from '@/lib/user-registry';
import { getDatalakeOverview } from '@/modules/datalake/application/overview';

export async function GET() {
  const session = await auth()
  const email = session?.user?.email ?? ''
  const allowedTables = getUserAllowedTables(email)
  const overview = await getDatalakeOverview(allowedTables)
  return NextResponse.json(overview, { status: overview.ok ? 200 : 503 });
}
