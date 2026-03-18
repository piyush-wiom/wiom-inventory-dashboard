import { NextResponse } from 'next/server';
import { fetchSheetRows } from '@/lib/googleSheets';
import { parseTransactions } from '@/lib/transformers';
import { computeKpi, computeReconciliation } from '@/lib/metrics';
import { aggregateDailyMovements } from '@/lib/chartData';

// Never cache this route — always return fresh data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await fetchSheetRows();
    const transactions = parseTransactions(rows);

    const kpi = computeKpi(transactions);
    const reconciliation = computeReconciliation(transactions);
    const dailyMovements = aggregateDailyMovements(transactions, 30);

    return NextResponse.json({
      kpi,
      transactions,
      dailyMovements,
      reconciliation,
      lastRefreshed: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
