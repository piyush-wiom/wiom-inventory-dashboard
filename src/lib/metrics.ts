import { IN_STOCK_STATUSES, DISPATCHED_STATUSES } from './constants';
import type {
  DeviceRecord,
  KpiData,
  SourceBreakdown,
  DispatchBreakdown,
  AssetBreakdown,
} from '@/types/inventory';

function todayIST(): string {
  // IST = UTC + 5h30m — reliable cross-platform calculation
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + istOffset).toISOString().slice(0, 10);
}

function isInStock(r: DeviceRecord) {
  return IN_STOCK_STATUSES.includes(r.dispatchStatus);
}

function isDispatched(r: DeviceRecord) {
  return DISPATCHED_STATUSES.includes(r.dispatchStatus);
}

// ---------------------------------------------------------------------------
// KPI summary
// ---------------------------------------------------------------------------
export function computeKpi(records: DeviceRecord[], today = todayIST()): KpiData {
  const inStock = records.filter(isInStock);
  const dispatched = records.filter(isDispatched);

  return {
    totalStock: inStock.length,
    goodStock: inStock.filter((r) => r.condition === 'Z-GOOD').length,
    badStock: inStock.filter((r) => r.condition === 'Z-BAD').length,
    todayAdded: records.filter((r) => r.entryDate === today).length,
    totalDispatched: dispatched.length,
    dispatchedToday: dispatched.filter((r) => r.dispatchDate === today).length,
    routerStock: inStock.filter((r) => r.assetType === 'ROUTER').length,
    onuStock: inStock.filter((r) => r.assetType === 'ONU').length,
    ontStock: inStock.filter((r) => r.assetType === 'ONT').length,
  };
}

// ---------------------------------------------------------------------------
// Source breakdown (how inventory arrived)
// ---------------------------------------------------------------------------
export function computeSourceBreakdown(records: DeviceRecord[]): SourceBreakdown {
  return {
    returnRefurbished: records.filter((r) => r.sourceInventory === 'Return (Refurbished)').length,
    vendorVirgin: records.filter((r) => r.sourceInventory === 'Vendor (Virgin)').length,
    receivedInSTN: records.filter((r) => r.sourceInventory === 'Received in STN').length,
    stockRMA: records.filter((r) => r.sourceInventory === 'Stock Received in RMA').length,
  };
}

// ---------------------------------------------------------------------------
// Dispatch status breakdown
// ---------------------------------------------------------------------------
export function computeDispatchBreakdown(records: DeviceRecord[]): DispatchBreakdown {
  return {
    pending: records.filter((r) => r.dispatchStatus === 'Pending').length,
    readyForDispatch: records.filter((r) => r.dispatchStatus === 'Ready for Dispatch').length,
    dispatchedToPartners: records.filter((r) => r.dispatchStatus === 'Dispatched to Partners').length,
    soldToPartner: records.filter((r) => r.dispatchStatus === 'Sold to Partner').length,
    returnedToVendor: records.filter((r) => r.dispatchStatus === 'Returned to Vendor').length,
    disposeOff: records.filter((r) =>
      ['Dispatched For Dispose Off', 'Will Dispose'].includes(r.dispatchStatus),
    ).length,
    other: records.filter((r) =>
      ['To be sent to Vendor for RMA', 'PDO', 'Dispatched to Gurgaon office', 'Transfered to Mumbai'].includes(r.dispatchStatus),
    ).length,
  };
}

// ---------------------------------------------------------------------------
// In-stock asset type breakdown
// ---------------------------------------------------------------------------
export function computeAssetBreakdown(records: DeviceRecord[]): AssetBreakdown {
  const inStock = records.filter(isInStock);
  return {
    router: inStock.filter((r) => r.assetType === 'ROUTER').length,
    onu: inStock.filter((r) => r.assetType === 'ONU').length,
    ont: inStock.filter((r) => r.assetType === 'ONT').length,
  };
}

// ---------------------------------------------------------------------------
// Area-wise breakdown (in-stock only, top 10)
// ---------------------------------------------------------------------------
export function computeAreaBreakdown(records: DeviceRecord[]): { area: string; count: number }[] {
  const inStock = records.filter(isInStock);
  const map = new Map<string, number>();
  for (const r of inStock) {
    const area = r.areaName || 'Unknown';
    map.set(area, (map.get(area) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
