// ---------------------------------------------------------------------------
// Inventory Domain Types — Wiom Delhi-Saket Warehouse
// Based on actual sheet: "Delhi_Saket_Area Wise Inv"
// ---------------------------------------------------------------------------

export type AssetType = 'ROUTER' | 'ONU' | 'ONT';

export type SourceInventory =
  | 'Return (Refurbished)'
  | 'Vendor (Virgin)'
  | 'Received in STN'
  | 'Stock Received in RMA';

export type DispatchStatus =
  | 'Pending'
  | 'Ready for Dispatch'
  | 'Dispatched to Partners'
  | 'Sold to Partner'
  | 'Returned to Vendor'
  | 'Dispatched For Dispose Off'
  | 'To be sent to Vendor for RMA'
  | 'Will Dispose'
  | 'PDO'
  | 'Dispatched to Gurgaon office'
  | 'Transfered to Mumbai';

export type Condition = 'Z-GOOD' | 'Z-BAD';

export interface DeviceRecord {
  entryDate: string;       // YYYY-MM-DD
  macId: string;
  serialNo: string;
  deviceId: string;
  modelNo: string;
  assetType: AssetType;
  areaName: string;
  sourceInventory: SourceInventory;
  condition: Condition;
  invStickering: string;
  dispatchStatus: DispatchStatus;
  qty: number;
  dispatchDate: string;    // YYYY-MM-DD or ''
  typeOfInventory: string;
  warehouseType: string;
  remarks: string;
}

// ---------------------------------------------------------------------------
// Dashboard summary types
// ---------------------------------------------------------------------------

export interface KpiData {
  totalStock: number;          // Pending + Ready for Dispatch
  goodStock: number;           // Z-GOOD in stock
  badStock: number;            // Z-BAD in stock
  todayAdded: number;          // Entries with today's date
  totalDispatched: number;     // All dispatched statuses
  dispatchedToday: number;     // Dispatched today
  routerStock: number;
  onuStock: number;
  ontStock: number;
}

export interface SourceBreakdown {
  returnRefurbished: number;
  vendorVirgin: number;
  receivedInSTN: number;
  stockRMA: number;
}

export interface DispatchBreakdown {
  pending: number;
  readyForDispatch: number;
  dispatchedToPartners: number;
  soldToPartner: number;
  returnedToVendor: number;
  disposeOff: number;
  other: number;
}

export interface DailyEntry {
  date: string;               // YYYY-MM-DD
  added: number;              // devices entered that day
  dispatched: number;         // devices dispatched that day
  router: number;
  onu: number;
  ont: number;
}

export interface AssetBreakdown {
  router: number;
  onu: number;
  ont: number;
}

// ---------------------------------------------------------------------------
// Daily Report — mirrors Daily Reporting G-Sheet tab exactly
// ---------------------------------------------------------------------------

export interface AssetQty {
  ont: number;
  onu: number;
  router: number;
  total: number;
}

export interface AreaRow {
  area: string;
  ont: number;
  onu: number;
  router: number;
  total: number;
}

export interface VendorRow {
  vendor: string;
  ont: number;
  onu: number;
  router: number;
  total: number;
}

export interface MtdDispatchRow {
  remark: string;
  stockType: string;
  ont: number;
  router: number;
  onu: number;
}

export interface StickerReport {
  totalDevicesInWH: number;
  flashingOrDamaged: number;
  eligibleForSticker: number;
  totalStickersDone: number;
  pendingSticker: number;
  todayProductivity: number;
  returnsToday: number;
  completionPct: string;
}

export interface DailyReportData {
  reportDate: string;
  // Today's WH Report
  opening: AssetQty;
  freshInward: AssetQty;
  returnInward: AssetQty;
  receivedInSTN: AssetQty;
  stockRMA: AssetQty;
  dispatchStock: AssetQty;
  rtv: AssetQty;
  stnOut: AssetQty;
  closing: AssetQty;
  // Area Wise
  areaWise: AreaRow[];
  areaTotal: AssetQty;
  // Vendor Wise
  vendorWise: VendorRow[];
  vendorTotal: AssetQty;
  // Today vs Yesterday warehouse count
  todayCount: number;
  yDayCount: number;
  // MTD & Daily Dispatch
  mtdRows: MtdDispatchRow[];
  mtdDate: string;
  todayDispatchOnt: number;
  todayDispatchRouter: number;
  todayDispatchOnu: number;
  // Sticker report
  sticker: StickerReport;
  lastRefreshed: string;
}

export interface InventoryApiResponse {
  kpi: KpiData;
  sourceBreakdown: SourceBreakdown;
  dispatchBreakdown: DispatchBreakdown;
  dailyEntries: DailyEntry[];          // last 30 days
  assetBreakdown: AssetBreakdown;      // current in-stock by asset type
  areaBreakdown: { area: string; count: number }[];
  records: DeviceRecord[];   // most recent 500
  totalRows: number;
  lastRefreshed: string;
}
