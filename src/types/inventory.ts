// ---------------------------------------------------------------------------
// Inventory Domain Types — Wiom Delhi-Saket Warehouse
// ---------------------------------------------------------------------------

export type TransactionType =
  | 'Fresh Inward'
  | 'Return Inward'
  | 'RMA Inward'
  | 'Positive Adjustment'
  | 'STN Receiving'
  | 'Sales Dispatch'
  | 'RMA Out'
  | 'STN Dispatch'
  | 'Negative Adjustment'
  | 'Disposal';

export type ReconciliationStatus = 'Reconciled' | 'Partial' | 'Open' | 'Force Closed';

export interface Transaction {
  sr: number;
  transactionType: TransactionType;
  documentNo: string;
  sourceNode: string;
  destinationNode: string;
  docDate: string; // YYYY-MM-DD
  sku: string;
  qty: number;
  stage: string;
  linkedDocNo: string;
  linkedDocType: string;
  status: ReconciliationStatus;
  remarks: string;
}

export interface DailyMovement {
  date: string; // YYYY-MM-DD
  totalInward: number;
  totalOutward: number;
  freshInward: number;
  returnInward: number;
  rmaInward: number;
  stnReceiving: number;
  positiveAdj: number;
  salesDispatch: number;
  rmaOut: number;
  stnDispatch: number;
  negativeAdj: number;
  disposal: number;
}

export interface KpiData {
  openingStock: number;
  closingStock: number;
  todayInward: number;
  todayOutward: number;
  doi: number; // Days of Inventory; -1 means Infinity (no outward)
  avgDailyOutward30d: number;
}

export interface ReconciliationSummary {
  total: number;
  reconciled: number;
  partial: number;
  open: number;
  forceClosed: number;
  reconciledPct: number;
  openStnDocNos: string[];
}

export interface InventoryApiResponse {
  kpi: KpiData;
  transactions: Transaction[];
  dailyMovements: DailyMovement[];
  reconciliation: ReconciliationSummary;
  lastRefreshed: string; // ISO datetime
}
