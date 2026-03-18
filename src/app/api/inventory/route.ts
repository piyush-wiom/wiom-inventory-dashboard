import { NextResponse } from 'next/server';
import { fetchSheetRows } from '@/lib/googleSheets';
import { parseDeviceRecords } from '@/lib/transformers';
import {
  computeKpi,
  computeSourceBreakdown,
  computeDispatchBreakdown,
  computeAssetBreakdown,
  computeAreaBreakdown,
} from '@/lib/metrics';
import { aggregateDailyEntries } from '@/lib/chartData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await fetchSheetRows();
    const records = parseDeviceRecords(rows);

    // Sort by entryDate descending, take most recent 500 for the table
    const recentRecords = [...records]
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
      .slice(0, 500);

    return NextResponse.json({
      kpi: computeKpi(records),
      sourceBreakdown: computeSourceBreakdown(records),
      dispatchBreakdown: computeDispatchBreakdown(records),
      dailyEntries: aggregateDailyEntries(records, 30),
      assetBreakdown: computeAssetBreakdown(records),
      areaBreakdown: computeAreaBreakdown(records),
      records: recentRecords,
      totalRows: records.length,
      lastRefreshed: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
