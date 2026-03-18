/**
 * parseDailyReport.ts
 * Parses the raw rows from the "Daily Reporting" G-Sheet tab
 * into a structured DailyReportData object.
 *
 * Row layout (0-indexed) based on actual sheet structure:
 *  Row 1  : "Today's WH_Report" header
 *  Row 2  : Date header
 *  Row 3  : Column labels (Remarks | ONT | ONU | Router | Total)
 *  Row 4  : Opening Stock
 *  Row 5  : Fresh Inward
 *  Row 6  : Return (Refurbish) Inward
 *  Row 7  : Received in STN
 *  Row 8  : Stock Received in RMA
 *  Row 9  : Dispatch Stock
 *  Row 10 : Return Dispatch to Vendor (RTV)
 *  Row 11 : STN Out
 *  Row 12 : Closing Stock
 *  Row 14 : Area Wise header
 *  Row 15 : Area column labels
 *  Row 16 : Sellable
 *  Row 17 : Flashing Pending
 *  Row 18 : Damage
 *  Row 19 : Total
 *  Row 21 : Vendor Wise header
 *  Row 22 : Vendor column labels
 *  Row 23-27: Vendor rows
 *  Row 28 : Vendor Total
 *  Row 30 : Warehouse count header
 *  Row 31-33: Area count rows
 *  Row 35 : Total count row
 *  Row 47 : Month header
 *  Row 48 : MTD column labels
 *  Row 49-56: MTD rows
 *  Row 58 : MTD & Daily Dispatch header
 *  Row 59 : Date row
 *  Row 60-61: MTD dispatch rows
 *  Row 62-64: Today dispatch rows
 *  Row 66 : Sticker Change header
 *  Row 67 : Sticker column labels
 *  Row 68-82: Sticker rows
 */

import type {
  DailyReportData,
  AssetQty,
  AreaRow,
  VendorRow,
  MtdDispatchRow,
  StickerReport,
} from '@/types/inventory';

function n(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function assetRow(row: string[]): AssetQty {
  // cols: [empty, label, ONT(2), ONU(3), Router(4), Total(5)]
  const ont = n(row[2]);
  const onu = n(row[3]);
  const router = n(row[4]);
  const total = n(row[5]) || ont + onu + router;
  return { ont, onu, router, total };
}

export function parseDailyReport(rows: string[][]): DailyReportData {
  // Extract report date from row 2: "Today Warehouse Stock Report - 18-Mar-26"
  const dateRaw = rows[2]?.[1] ?? '';
  const reportDate = dateRaw.replace(/Today Warehouse Stock Report\s*-\s*/i, '').trim();

  const opening = assetRow(rows[4] ?? []);
  const freshInward = assetRow(rows[5] ?? []);
  const returnInward = assetRow(rows[6] ?? []);
  const receivedInSTN = assetRow(rows[7] ?? []);
  const stockRMA = assetRow(rows[8] ?? []);
  const dispatchStock = assetRow(rows[9] ?? []);
  const rtv = assetRow(rows[10] ?? []);
  const stnOut = assetRow(rows[11] ?? []);
  const closing = assetRow(rows[12] ?? []);

  // Area Wise (rows 16-18, total at 19)
  const areaWise: AreaRow[] = [];
  for (let i = 16; i <= 18; i++) {
    const row = rows[i];
    if (!row?.[1] || row[1].toLowerCase() === 'total') continue;
    areaWise.push({
      area: row[1],
      ont: n(row[2]),
      onu: n(row[3]),
      router: n(row[4]),
      total: n(row[5]) || n(row[2]) + n(row[3]) + n(row[4]),
    });
  }
  const areaTotal = assetRow(rows[19] ?? []);

  // Vendor Wise (rows 23-27, total at 28)
  const vendorWise: VendorRow[] = [];
  for (let i = 23; i <= 27; i++) {
    const row = rows[i];
    if (!row?.[1] || row[1].toLowerCase() === 'total') continue;
    const total = n(row[5]) || n(row[2]) + n(row[3]) + n(row[4]);
    if (total === 0) continue; // skip zero vendors
    vendorWise.push({
      vendor: row[1],
      ont: n(row[2]),
      onu: n(row[3]),
      router: n(row[4]),
      total,
    });
  }
  const vendorTotal = assetRow(rows[28] ?? []);

  // Warehouse count (today vs yesterday) at row 35
  const todayCount = n(rows[35]?.[3]);
  const yDayCount = n(rows[35]?.[4]);

  // MTD rows (rows 49-56)
  const mtdRows: MtdDispatchRow[] = [];
  for (let i = 49; i <= 56; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;
    const remark = row[1] ?? '';
    const stockType = row[2] ?? '';
    if (!remark && !stockType) continue;
    // Skip utilization % rows
    if ((row[3] ?? '').includes('%')) continue;
    mtdRows.push({
      remark,
      stockType,
      ont: n(row[3]),
      router: n(row[4]),
      onu: n(row[5]),
    });
  }

  // MTD date from row 59: ["","3/18/2026","","ONT","ROUTER","ONU"]
  const mtdDate = rows[59]?.[1] ?? '';

  // MTD totals (rows 60-61)
  const mtdSoldOnt = n(rows[60]?.[3]) + n(rows[61]?.[3]);
  const mtdSoldRouter = n(rows[60]?.[4]) + n(rows[61]?.[4]);
  const mtdSoldOnu = n(rows[60]?.[5]) + n(rows[61]?.[5]);

  // Today dispatch (rows 62-64)
  const todayDispatchOnt = n(rows[62]?.[3]) + n(rows[63]?.[3]) + n(rows[64]?.[3]);
  const todayDispatchRouter = n(rows[62]?.[4]) + n(rows[63]?.[4]) + n(rows[64]?.[4]);
  const todayDispatchOnu = n(rows[62]?.[5]) + n(rows[63]?.[5]) + n(rows[64]?.[5]);

  // Suppress unused vars
  void mtdSoldOnt; void mtdSoldRouter; void mtdSoldOnu;

  // Sticker report (rows 68-82)
  function stickerVal(rowIdx: number, col = 2) {
    return n(rows[rowIdx]?.[col]);
  }
  const sticker: StickerReport = {
    totalDevicesInWH: stickerVal(68),
    flashingOrDamaged: stickerVal(69),
    eligibleForSticker: stickerVal(70),
    totalStickersDone: stickerVal(71),
    pendingSticker: stickerVal(74),
    todayProductivity: stickerVal(78),
    returnsToday: stickerVal(79),
    completionPct: rows[80]?.[2] ?? '0%',
  };

  return {
    reportDate,
    opening,
    freshInward,
    returnInward,
    receivedInSTN,
    stockRMA,
    dispatchStock,
    rtv,
    stnOut,
    closing,
    areaWise,
    areaTotal,
    vendorWise,
    vendorTotal,
    todayCount,
    yDayCount,
    mtdRows,
    mtdDate,
    todayDispatchOnt,
    todayDispatchRouter,
    todayDispatchOnu,
    sticker,
    lastRefreshed: new Date().toISOString(),
  };
}
