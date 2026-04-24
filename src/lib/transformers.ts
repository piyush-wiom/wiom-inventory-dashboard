import { COL } from './constants';
import type { DeviceRecord, AssetType, SourceInventory, DispatchStatus, Condition } from '@/types/inventory';

// ---------------------------------------------------------------------------
// Date normalisation: handles MM/DD/YYYY → YYYY-MM-DD
// ---------------------------------------------------------------------------
function normaliseDate(raw: string): string {
  if (!raw?.trim()) return '';

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();

  // MM/DD/YYYY (sheet format)
  const mdyMatch = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MM-YYYY fallback
  const dmyMatch = raw.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Parse raw sheet rows into DeviceRecord[]
// Skips header row (index 0) and empty rows
// ---------------------------------------------------------------------------
export function parseDeviceRecords(rows: string[][]): DeviceRecord[] {
  const [, ...dataRows] = rows; // skip header

  return dataRows
    .filter((row) => row && row.length > COL.DISPATCH_STATUS && row[COL.ASSET_TYPE]?.trim())
    .map((row): DeviceRecord => ({
      entryDate: normaliseDate(row[COL.DATE] ?? ''),
      macId: row[COL.MAC_ID] ?? '',
      serialNo: row[COL.SERIAL_NO] ?? '',
      deviceId: row[COL.DEVICE_ID] ?? '',
      modelNo: row[COL.MODEL_NO] ?? '',
      assetType: (row[COL.ASSET_TYPE]?.trim().toUpperCase() as AssetType) ?? 'ROUTER',
      areaName: row[COL.AREA_NAME] ?? '',
      sourceInventory: (row[COL.SOURCE_INV]?.trim() as SourceInventory) ?? 'Vendor (Virgin)',
      condition: (row[COL.CONDITION]?.trim() as Condition) ?? 'Z-GOOD',
      invStickering: '',
      dispatchStatus: (row[COL.DISPATCH_STATUS]?.trim() as DispatchStatus) ?? 'Pending',
      qty: parseInt(row[COL.QTY] ?? '1', 10) || 1,
      dispatchDate: normaliseDate(row[COL.DISPATCH_DATE] ?? ''),
      typeOfInventory: row[COL.TYPE_OF_INVENTORY] ?? '',
      warehouseType: row[COL.WAREHOUSE_TYPE] ?? '',
      remarks: row[COL.REMARKS] ?? '',
    }));
}
