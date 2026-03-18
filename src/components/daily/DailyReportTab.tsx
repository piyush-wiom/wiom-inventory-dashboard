'use client';

import { useDailyReport } from '@/hooks/useDailyReport';
import type { AssetQty, AreaRow, VendorRow } from '@/types/inventory';
import { AlertCircle, RefreshCw } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

// ─── sub-components ─────────────────────────────────────────────────────────

function AssetCell({ val }: { val: number }) {
  return (
    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
      {fmt(val)}
    </td>
  );
}

function SectionHeader({ label, cols = 5 }: { label: string; cols?: number }) {
  return (
    <tr className="bg-slate-700">
      <td colSpan={cols} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
        {label}
      </td>
    </tr>
  );
}

function AssetRow({
  label,
  data,
  highlight = false,
  color,
}: {
  label: string;
  data: AssetQty;
  highlight?: boolean;
  color?: string;
}) {
  const bg = highlight ? 'bg-slate-100' : 'bg-white';
  const labelStyle = color ?? 'text-slate-700';
  return (
    <tr className={`${bg} border-b border-slate-100`}>
      <td className={`px-3 py-2 text-sm font-medium ${labelStyle}`}>{label}</td>
      <AssetCell val={data.ont} />
      <AssetCell val={data.onu} />
      <AssetCell val={data.router} />
      <AssetCell val={data.total} />
    </tr>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
        {cols.map((c) => (
          <th
            key={c}
            className={`px-3 py-2 ${c === cols[0] ? 'text-left' : 'text-right'} font-semibold`}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function DailyReportTab() {
  const { data, error, isLoading, refresh } = useDailyReport();

  const hasError = error || (data as { error?: string })?.error;
  const errorMsg =
    (data as { error?: string })?.error ??
    (error instanceof Error ? error.message : 'Failed to load Daily Report');

  // Show skeletons while loading OR on the initial render frame before SWR
  // starts the first fetch (isLoading can briefly be false before useEffect fires)
  if (isLoading || (!data && !error)) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Failed to load Daily Report</p>
          <p className="mt-0.5 font-mono text-xs text-red-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tableClass =
    'w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-sm shadow-sm';

  return (
    <div className="space-y-6">

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daily WH Report</h2>
          <p className="text-xs text-slate-500">Date: {data.reportDate}</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Today's WH Report ─────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <TableHead cols={["Movement", "ONT", "ONU", "Router", "Total"]} />
          <tbody>
            <SectionHeader label="Today's Warehouse Report" />
            <AssetRow label="Opening Stock"          data={data.opening}       highlight />
            <AssetRow label="Fresh Inward"           data={data.freshInward}   color="text-green-700" />
            <AssetRow label="Return (Refurbish) Inward" data={data.returnInward} color="text-blue-700" />
            <AssetRow label="Received in STN"        data={data.receivedInSTN} color="text-cyan-700" />
            <AssetRow label="Stock Received in RMA"  data={data.stockRMA}      color="text-violet-700" />
            <AssetRow label="Dispatch Stock"         data={data.dispatchStock} color="text-red-700" />
            <AssetRow label="Return to Vendor (RTV)" data={data.rtv}           color="text-orange-700" />
            <AssetRow label="STN Out"                data={data.stnOut}        color="text-yellow-700" />
            <AssetRow label="Closing Stock"          data={data.closing}       highlight />
          </tbody>
        </table>
      </div>

      {/* ── Area Wise + Vendor Wise side by side ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Area Wise */}
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <TableHead cols={["Area / Condition", "ONT", "ONU", "Router", "Total"]} />
            <tbody>
              <SectionHeader label="Area Wise Stock" />
              {data.areaWise.map((row: AreaRow) => (
                <tr key={row.area} className="border-b border-slate-100 bg-white">
                  <td className="px-3 py-2 text-sm font-medium text-slate-700">{row.area}</td>
                  <AssetCell val={row.ont} />
                  <AssetCell val={row.onu} />
                  <AssetCell val={row.router} />
                  <AssetCell val={row.total} />
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold">
                <td className="px-3 py-2 text-sm text-slate-800">Total</td>
                <AssetCell val={data.areaTotal.ont} />
                <AssetCell val={data.areaTotal.onu} />
                <AssetCell val={data.areaTotal.router} />
                <AssetCell val={data.areaTotal.total} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vendor Wise */}
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <TableHead cols={["Vendor", "ONT", "ONU", "Router", "Total"]} />
            <tbody>
              <SectionHeader label="Vendor Wise Stock" />
              {data.vendorWise.map((row: VendorRow) => (
                <tr key={row.vendor} className="border-b border-slate-100 bg-white">
                  <td className="px-3 py-2 text-sm font-medium text-slate-700">{row.vendor}</td>
                  <AssetCell val={row.ont} />
                  <AssetCell val={row.onu} />
                  <AssetCell val={row.router} />
                  <AssetCell val={row.total} />
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold">
                <td className="px-3 py-2 text-sm text-slate-800">Total</td>
                <AssetCell val={data.vendorTotal.ont} />
                <AssetCell val={data.vendorTotal.onu} />
                <AssetCell val={data.vendorTotal.router} />
                <AssetCell val={data.vendorTotal.total} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Warehouse count ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Today's Count"     value={data.todayCount} color="text-green-700" />
        <KpiCard label="Yesterday's Count" value={data.yDayCount}  color="text-slate-600" />
        <KpiCard label="Today Dispatch ONT"    value={data.todayDispatchOnt}    color="text-blue-700" />
        <KpiCard label="Today Dispatch Router" value={data.todayDispatchRouter} color="text-orange-700" />
      </div>

      {/* ── MTD Dispatch ──────────────────────────────────────────────── */}
      {data.mtdRows.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            MTD &amp; Daily Dispatch
            {data.mtdDate && (
              <span className="ml-2 font-normal text-slate-400">({data.mtdDate})</span>
            )}
          </h3>
          <table className={tableClass}>
            <TableHead cols={["Remark", "Stock Type", "ONT", "Router", "ONU"]} />
            <tbody>
              {data.mtdRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 bg-white">
                  <td className="px-3 py-2 text-sm text-slate-700">{row.remark}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{row.stockType}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt(row.ont)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt(row.router)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt(row.onu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sticker Report ────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Device Sticker Change Report</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StickerCard label="Total Devices in WH"  value={data.sticker.totalDevicesInWH} />
          <StickerCard label="Flashing / Damaged"   value={data.sticker.flashingOrDamaged} color="text-red-600" />
          <StickerCard label="Eligible for Sticker" value={data.sticker.eligibleForSticker} />
          <StickerCard label="Total Stickers Done"  value={data.sticker.totalStickersDone} color="text-green-700" />
          <StickerCard label="Pending Sticker"      value={data.sticker.pendingSticker} color="text-orange-600" />
          <StickerCard label="Today Productivity"   value={data.sticker.todayProductivity} color="text-blue-700" />
          <StickerCard label="Returns Today"        value={data.sticker.returnsToday} />
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500">Completion %</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{data.sticker.completionPct}</p>
          </div>
        </div>
      </div>

      {/* last refreshed */}
      <p className="text-right text-xs text-slate-400">
        Last refreshed: {new Date(data.lastRefreshed).toLocaleTimeString('en-IN')}
      </p>
    </div>
  );
}

// ─── tiny card helpers ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color = 'text-slate-800',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function StickerCard({
  label,
  value,
  color = 'text-slate-800',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}
