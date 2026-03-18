import type { Transaction, DailyMovement } from '@/types/inventory';

// ---------------------------------------------------------------------------
// Build a date range array of N days ending today (IST), inclusive
// ---------------------------------------------------------------------------
function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const todayIST = new Date(
    new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }),
  );

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayIST);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Aggregate transactions into daily movement buckets
// ---------------------------------------------------------------------------
export function aggregateDailyMovements(
  transactions: Transaction[],
  days: number = 30,
): DailyMovement[] {
  const dateRange = buildDateRange(days);

  return dateRange.map((date) => {
    const dayTx = transactions.filter((t) => t.docDate === date);

    const sum = (type: string) =>
      dayTx
        .filter((t) => t.transactionType === type)
        .reduce((acc, t) => acc + t.qty, 0);

    const freshInward = sum('Fresh Inward');
    const returnInward = sum('Return Inward');
    const rmaInward = sum('RMA Inward');
    const stnReceiving = sum('STN Receiving');
    const positiveAdj = sum('Positive Adjustment');
    const salesDispatch = sum('Sales Dispatch');
    const rmaOut = sum('RMA Out');
    const stnDispatch = sum('STN Dispatch');
    const negativeAdj = sum('Negative Adjustment');
    const disposal = sum('Disposal');

    const totalInward =
      freshInward + returnInward + rmaInward + stnReceiving + positiveAdj;
    const totalOutward =
      salesDispatch + rmaOut + stnDispatch + negativeAdj + disposal;

    return {
      date,
      totalInward,
      totalOutward,
      freshInward,
      returnInward,
      rmaInward,
      stnReceiving,
      positiveAdj,
      salesDispatch,
      rmaOut,
      stnDispatch,
      negativeAdj,
      disposal,
    };
  });
}
