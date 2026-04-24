import type { DeviceRecord, AssetQty, MonthlyReportRow, MonthlyMonth, MonthlyAnalysisData } from '@/types/inventory';

// Dispatch statuses that count as "Dispatch Stock" (to partners / disposal)
const DISPATCH_OUT = [
  'Dispatched to Partners',
  'Sold to Partner',
  'PDO',
  'Dispatched For Dispose Off',
  'Will Dispose',
];

// Dispatch statuses that count as Return to Vendor
const RTV_STATUSES = ['Returned to Vendor', 'To be sent to Vendor for RMA'];

// Dispatch statuses that count as STN Out (inter-office transfers)
const STN_OUT_STATUSES = ['Dispatched to Gurgaon office', 'Transfered to Mumbai'];

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function lastDayOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
  return `${yearMonth}-${String(d).padStart(2, '0')}`;
}

function inMonth(date: string, startOfM: string, endOfM: string): boolean {
  return date >= startOfM && date <= endOfM;
}

function countByAsset(
  records: DeviceRecord[],
  predicate: (r: DeviceRecord) => boolean,
): AssetQty {
  let ont = 0, onu = 0, router = 0;
  for (const r of records) {
    if (!predicate(r)) continue;
    if (r.assetType === 'ONT') ont++;
    else if (r.assetType === 'ONU') onu++;
    else if (r.assetType === 'ROUTER') router++;
  }
  return { ont, onu, router, total: ont + onu + router };
}

function buildRows(records: DeviceRecord[], monthKey: string): MonthlyReportRow[] {
  const startOfM = `${monthKey}-01`;
  const endOfM = lastDayOfMonth(monthKey);

  const opening = countByAsset(
    records,
    (r) => r.entryDate < startOfM && (r.dispatchDate === '' || r.dispatchDate >= startOfM),
  );

  const freshInward = countByAsset(
    records,
    (r) => inMonth(r.entryDate, startOfM, endOfM) && r.sourceInventory === 'Vendor (Virgin)',
  );

  const returnInward = countByAsset(
    records,
    (r) => inMonth(r.entryDate, startOfM, endOfM) && r.sourceInventory === 'Return (Refurbished)',
  );

  const receivedInSTN = countByAsset(
    records,
    (r) => inMonth(r.entryDate, startOfM, endOfM) && r.sourceInventory === 'Received in STN',
  );

  const stockRMA = countByAsset(
    records,
    (r) => inMonth(r.entryDate, startOfM, endOfM) && r.sourceInventory === 'Stock Received in RMA',
  );

  const dispatchStock = countByAsset(
    records,
    (r) => r.dispatchDate !== '' && inMonth(r.dispatchDate, startOfM, endOfM) && DISPATCH_OUT.includes(r.dispatchStatus),
  );

  const rtv = countByAsset(
    records,
    (r) => r.dispatchDate !== '' && inMonth(r.dispatchDate, startOfM, endOfM) && RTV_STATUSES.includes(r.dispatchStatus),
  );

  const stnOut = countByAsset(
    records,
    (r) => r.dispatchDate !== '' && inMonth(r.dispatchDate, startOfM, endOfM) && STN_OUT_STATUSES.includes(r.dispatchStatus),
  );

  const closing = countByAsset(
    records,
    (r) => r.entryDate <= endOfM && (r.dispatchDate === '' || r.dispatchDate > endOfM),
  );

  return [
    { label: 'Opening Stock',             isInward: false, isOutward: false, isHighlight: true,  qty: opening },
    { label: 'Fresh Inward',              isInward: true,  isOutward: false, isHighlight: false, qty: freshInward },
    { label: 'Return (Refurbish) Inward', isInward: true,  isOutward: false, isHighlight: false, qty: returnInward },
    { label: 'Received in STN',           isInward: true,  isOutward: false, isHighlight: false, qty: receivedInSTN },
    { label: 'Stock Received in RMA',     isInward: true,  isOutward: false, isHighlight: false, qty: stockRMA },
    { label: 'Dispatch Stock',            isInward: false, isOutward: true,  isHighlight: false, qty: dispatchStock },
    { label: 'Return to Vendor (RTV)',    isInward: false, isOutward: true,  isHighlight: false, qty: rtv },
    { label: 'STN Out',                   isInward: false, isOutward: true,  isHighlight: false, qty: stnOut },
    { label: 'Closing Stock',             isInward: false, isOutward: false, isHighlight: true,  qty: closing },
  ];
}

export function computeMonthlyAnalysis(
  records: DeviceRecord[],
  year: number = 2026,
  monthNums: number[] = [1, 2, 3, 4],
): MonthlyAnalysisData {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const lastRefreshed = new Date(Date.now() + istOffset).toISOString();

  const months: MonthlyMonth[] = monthNums.map((m) => {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    return {
      monthKey: key,
      monthLabel: `${MONTH_NAMES[m]} ${year}`,
      rows: buildRows(records, key),
    };
  });

  return { months, lastRefreshed };
}
