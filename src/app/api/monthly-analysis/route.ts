import { NextResponse } from 'next/server';
import { fetchSheetRows } from '@/lib/googleSheets';
import { parseDeviceRecords } from '@/lib/transformers';
import { computeMonthlyAnalysis } from '@/lib/computeMonthlyAnalysis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? '2026', 10);
    const monthsParam = searchParams.get('months') ?? '1,2,3,4';
    const monthNums = monthsParam
      .split(',')
      .map(Number)
      .filter((n) => n >= 1 && n <= 12);

    const rows = await fetchSheetRows();
    const records = parseDeviceRecords(rows);
    return NextResponse.json(computeMonthlyAnalysis(records, year, monthNums));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
