// ---------------------------------------------------------------------------
// Constants — Wiom Inventory Dashboard
// ---------------------------------------------------------------------------

export const SHEET_ID =
  process.env.NEXT_PUBLIC_SHEET_ID ??
  '1XA-yPDYidXs_8DKRA8QNEbgQLA2tQbu8GkW1wn0OBL0';

export const SHEET_TAB =
  process.env.NEXT_PUBLIC_SHEET_NAME ?? 'Delhi_Saket_Area Wise Inv';

// Column indices (0-based) for "Delhi_Saket_Area Wise Inv"
// Verified against live sheet headers on 24-Apr-2026
// INV_STICKERING column was removed; everything from col 9 onwards shifted left by 1
export const COL = {
  DATE: 0,             // Date (MM/DD/YYYY) of Entry
  MAC_ID: 1,
  SERIAL_NO: 2,
  DEVICE_ID: 3,
  MODEL_NO: 4,
  ASSET_TYPE: 5,       // ROUTER | ONU | ONT
  AREA_NAME: 6,
  SOURCE_INV: 7,       // Return (Refurbished) | Vendor (Virgin) | Received in STN | Stock Received in RMA
  CONDITION: 8,        // Z-GOOD | Z-BAD
  DISPATCH_STATUS: 9,  // Pending | Ready for Dispatch | Dispatched to Partners | ...
  QTY: 10,
  DISPATCH_DATE: 11,   // Dispatch Date (MM/DD/YYYY)
  DISPATCHED_MONTH: 12,
  YEAR: 13,
  TYPE_OF_INVENTORY: 14,
  WAREHOUSE_TYPE: 15,
  REMARKS: 19,
} as const;

// Statuses that mean the item is STILL IN STOCK
export const IN_STOCK_STATUSES = ['Pending', 'Ready for Dispatch'];

// Statuses that mean the item has LEFT the warehouse
export const DISPATCHED_STATUSES = [
  'Dispatched to Partners',
  'Sold to Partner',
  'Returned to Vendor',
  'Dispatched For Dispose Off',
  'To be sent to Vendor for RMA',
  'Will Dispose',
  'PDO',
  'Dispatched to Gurgaon office',
  'Transfered to Mumbai',
];
