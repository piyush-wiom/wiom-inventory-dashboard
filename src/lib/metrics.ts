import { INWARD_TYPES, OUTWARD_TYPES } from './constants';
import type { Transaction, KpiData, ReconciliationSummary } from '@/types/inventory';

// ---------------------------------------------------------------------------
// Helper: today's date in IST as YYYY-MM-DD
// ---------------------------------------------------------------------------
function todayIST(): string {
  return new Date(
    new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }),
  )
    .toISOString()
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Compute KPIs
// ---------------------------------------------------------------------------
export function computeKpi(
  transactions: Transaction[],
  today: string = todayIST(),
): KpiData {
  let openingInward = 0;
  let openingOutward = 0;
  let todayInward = 0;
  let todayOutward = 0;
  let outward30d = 0;

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff30 = thirtyDaysAgo.toISOString().slice(0, 10);

  for (const t of transactions) {
    const isInward = (INWARD_TYPES as string[]).includes(t.transactionType);
    const isOutward = (OUTWARD_TYPES as string[]).includes(t.transactionType);

    if (t.docDate < today) {
      if (isInward) openingInward += t.qty;
      if (isOutward) openingOutward += t.qty;
    }

    if (t.docDate === today) {
      if (isInward) todayInward += t.qty;
      if (isOutward) todayOutward += t.qty;
    }

    if (t.docDate >= cutoff30 && t.docDate < today && isOutward) {
      outward30d += t.qty;
    }
  }

  const openingStock = openingInward - openingOutward;
  const closingStock = openingStock + todayInward - todayOutward;
  const avgDailyOutward30d = outward30d / 30;

  const doi =
    avgDailyOutward30d > 0
      ? Math.round((closingStock / avgDailyOutward30d) * 10) / 10
      : -1; // -1 = Infinity (no outward in last 30d)

  return {
    openingStock,
    closingStock,
    todayInward,
    todayOutward,
    doi,
    avgDailyOutward30d: Math.round(avgDailyOutward30d * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Compute reconciliation summary
// ---------------------------------------------------------------------------
export function computeReconciliation(
  transactions: Transaction[],
): ReconciliationSummary {
  let reconciled = 0;
  let partial = 0;
  let open = 0;
  let forceClosed = 0;
  const openStnDocNos: string[] = [];

  for (const t of transactions) {
    switch (t.status) {
      case 'Reconciled':
        reconciled++;
        break;
      case 'Partial':
        partial++;
        break;
      case 'Force Closed':
        forceClosed++;
        break;
      default:
        open++;
        if (
          t.transactionType.toLowerCase().includes('stn') &&
          t.documentNo
        ) {
          openStnDocNos.push(t.documentNo);
        }
    }
  }

  const total = transactions.length;
  const reconciledPct =
    total > 0 ? Math.round((reconciled / total) * 1000) / 10 : 0;

  return {
    total,
    reconciled,
    partial,
    open,
    forceClosed,
    reconciledPct,
    openStnDocNos: Array.from(new Set(openStnDocNos)), // deduplicate
  };
}
