import { NextResponse } from 'next/server';
import { fetchTabRows } from '@/lib/googleSheets';
import { parseDailyReport } from '@/lib/parseDailyReport';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await fetchTabRows('Daily Reporting');
    const data = parseDailyReport(rows);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
