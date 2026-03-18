import type { TransactionType } from '@/types/inventory';

export const DOI_ALERT_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_DOI_ALERT_THRESHOLD ?? '20',
);

export const SHEET_ID =
  process.env.NEXT_PUBLIC_SHEET_ID ??
  '1XA-yPDYidXs_8DKRA8QNEbgQLA2tQbu8GkW1wn0OBL0';

export const SHEET_TAB =
  process.env.NEXT_PUBLIC_SHEET_NAME ?? 'Transaction_Master';

// ---------------------------------------------------------------------------
// Column index map (0-based) for Transaction_Master sheet
// ---------------------------------------------------------------------------
export const COL = {
  SR: 0,
  TRANSACTION_TYPE: 1,
  DOCUMENT_NO: 2,
  SOURCE_NODE: 3,
  DESTINATION_NODE: 4,
  DOC_DATE: 5,
  SKU: 6,
  QTY: 7,
  STAGE: 8,
  LINKED_DOC_NO: 9,
  LINKED_DOC_TYPE: 10,
  STATUS: 11,
  REMARKS: 12,
} as const;

// ---------------------------------------------------------------------------
// Transaction type groupings
// ---------------------------------------------------------------------------
export const INWARD_TYPES: TransactionType[] = [
  'Fresh Inward',
  'Return Inward',
  'RMA Inward',
  'Positive Adjustment',
  'STN Receiving',
];

export const OUTWARD_TYPES: TransactionType[] = [
  'Sales Dispatch',
  'RMA Out',
  'STN Dispatch',
  'Negative Adjustment',
  'Disposal',
];

export const ALL_TRANSACTION_TYPES: TransactionType[] = [
  ...INWARD_TYPES,
  ...OUTWARD_TYPES,
];
