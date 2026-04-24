'use client';

import React from 'react';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { useMonthlyAnalysis } from '@/hooks/useMonthlyAnalysis';
import type { MonthlyReportRow, MonthlyMonth } from '@/types/inventory';

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function RowClass(row: MonthlyReportRow): string {
  if (row.isHighlight) return 'bg-slate-800 text-white font-semibold';
  if (row.isInward)   return 'border-l-4 border-green-400 bg-green-50';
  if (row.isOutward)  return 'border-l-4 border-red-400 bg-red-50';
  return '';
}

function CellClass(row: MonthlyReportRow): string {
  if (row.isHighlight) return 'text-white';
  if (row.isInward)   return 'text-green-800';
  if (row.isOutward)  return 'text-red-800';
  return 'text-slate-700';
}

function SubtotalRow({ label, rows, filter }: {
  label: string;
  rows: MonthlyReportRow[];
  filter: (r: MonthlyReportRow) => boolean;
}) {
  const filtered = rows.filter(filter);
  const ont    = filtered.reduce((s, r) => s + r.qty.ont,    0);
  const onu    = filtered.reduce((s, r) => s + r.qty.onu,    0);
  const router = filtered.reduce((s, r) => s + r.qty.router, 0);
  const total  = ont + onu + router;
  const isInward  = filtered[0]?.isInward  ?? false;
  const colCls = isInward ? 'text-green-900' : 'text-red-900';
  const bgCls  = isInward ? 'bg-green-100'   : 'bg-red-100';
  return (
    <div className={`grid grid-cols-6 items-center border-t border-dashed px-3 py-1.5 text-xs font-bold ${bgCls} ${isInward ? 'border-green-300' : 'border-red-300'}`}>
      <div className={`col-span-2 uppercase tracking-wide ${colCls}`}>{label}</div>
      <div className={`text-right tabular-nums ${colCls}`}>{fmt(ont)}</div>
      <div className={`text-right tabular-nums ${colCls}`}>{fmt(onu)}</div>
      <div className={`text-right tabular-nums ${colCls}`}>{fmt(router)}</div>
      <div className={`text-right tabular-nums font-extrabold ${colCls}`}>{fmt(total)}</div>
    </div>
  );
}

function MonthCard({ month }: { month: MonthlyMonth }) {
  const inwardRows  = month.rows.filter(r => r.isInward);
  const outwardRows = month.rows.filter(r => r.isOutward);

  // Build ordered sections: rows with subtotals injected after each group
  const lastInwardIdx  = month.rows.map(r => r.isInward).lastIndexOf(true);
  const lastOutwardIdx = month.rows.map(r => r.isOutward).lastIndexOf(true);

  const sections: React.ReactNode[] = [];
  month.rows.forEach((row, idx) => {
    sections.push(
      <div
        key={row.label}
        className={`grid grid-cols-6 items-center px-3 py-2 text-sm ${RowClass(row)}`}
      >
        <div className={`col-span-2 font-medium ${row.isHighlight ? 'text-white' : 'text-slate-700'}`}>
          {row.label}
        </div>
        <div className={`text-right tabular-nums ${CellClass(row)}`}>{fmt(row.qty.ont)}</div>
        <div className={`text-right tabular-nums ${CellClass(row)}`}>{fmt(row.qty.onu)}</div>
        <div className={`text-right tabular-nums ${CellClass(row)}`}>{fmt(row.qty.router)}</div>
        <div className={`text-right tabular-nums font-semibold ${CellClass(row)}`}>{fmt(row.qty.total)}</div>
      </div>
    );
    if (idx === lastInwardIdx && inwardRows.length > 0) {
      sections.push(
        <SubtotalRow key="total-inward" label="Total Inward" rows={month.rows} filter={r => r.isInward} />
      );
    }
    if (idx === lastOutwardIdx && outwardRows.length > 0) {
      sections.push(
        <SubtotalRow key="total-outward" label="Total Outward" rows={month.rows} filter={r => r.isOutward} />
      );
    }
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="bg-slate-800 px-4 py-3">
        <h3 className="text-base font-bold text-white">{month.monthLabel}</h3>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <div className="col-span-2">Particulars</div>
        <div className="text-right">ONT</div>
        <div className="text-right">ONU</div>
        <div className="text-right">Router</div>
        <div className="text-right">Total</div>
      </div>

      {/* Data rows + subtotals */}
      <div className="divide-y divide-slate-100">{sections}</div>
    </div>
  );
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const AVAILABLE_YEARS = [2025, 2026];
const IST_NOW = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
const CURRENT_YEAR  = IST_NOW.getUTCFullYear();
const CURRENT_MONTH = IST_NOW.getUTCMonth() + 1; // 1-12

function defaultMonths(year: number): number[] {
  const maxMonth = year === CURRENT_YEAR ? CURRENT_MONTH : 12;
  return Array.from({ length: maxMonth }, (_, i) => i + 1);
}

export function MonthlyAnalysisTab() {
  const [selectedYear,   setSelectedYear]   = React.useState<number>(CURRENT_YEAR);
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>(() => defaultMonths(CURRENT_YEAR));

  const { data, error, isLoading, refresh } = useMonthlyAnalysis(selectedYear, selectedMonths);

  function toggleMonth(m: number) {
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  }

  function changeYear(y: number) {
    setSelectedYear(y);
    setSelectedMonths(defaultMonths(y));
  }

  const hasError = error || (data as { error?: string })?.error;
  const errorMsg =
    (data as { error?: string })?.error ??
    (error instanceof Error ? error.message : 'Failed to load monthly data');

  const colCount = Math.min(selectedMonths.length, 4);
  const gridCls =
    colCount === 1 ? 'grid-cols-1' :
    colCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
    colCount === 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' :
    'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-800">Month-on-Month Warehouse Report</h2>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-slate-400">
              Synced: {new Date(data.lastRefreshed).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
            </span>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Year selector */}
        <div className="mb-3 flex items-center gap-3">
          <span className="w-14 text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
          <div className="flex gap-2">
            {AVAILABLE_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => changeYear(y)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                  selectedYear === y
                    ? 'bg-slate-800 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Month pills */}
        <div className="flex items-center gap-3">
          <span className="w-14 text-xs font-semibold uppercase tracking-wide text-slate-500">Month</span>
          <div className="flex flex-wrap gap-2">
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1;
              const isFuture = selectedYear === CURRENT_YEAR && m > CURRENT_MONTH;
              const isSelected = selectedMonths.includes(m);
              return (
                <button
                  key={m}
                  disabled={isFuture}
                  onClick={() => toggleMonth(m)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isFuture
                      ? 'cursor-not-allowed opacity-30 border border-slate-200 text-slate-400'
                      : isSelected
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSelectedMonths(defaultMonths(selectedYear))}
            className="ml-auto text-xs text-slate-400 underline hover:text-slate-600"
          >
            Select All
          </button>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-green-400 bg-green-50" />
          Inward movement
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-red-400 bg-red-50" />
          Outward movement
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-slate-800" />
          Opening / Closing stock
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {selectedMonths.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
          Select at least one month to view the report.
        </div>
      ) : isLoading ? (
        <div className={`grid gap-6 ${gridCls}`}>
          {selectedMonths.map((m) => (
            <div key={m} className="h-96 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : hasError ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load monthly analysis</p>
            <p className="mt-0.5 font-mono text-xs text-red-500">{errorMsg}</p>
          </div>
        </div>
      ) : data ? (
        <div className={`grid gap-6 ${gridCls}`}>
          {data.months.map((month) => (
            <MonthCard key={month.monthKey} month={month} />
          ))}
        </div>
      ) : null}

      <p className="text-xs text-slate-400">
        * Closing Stock of each month = Opening Stock of the following month. Data computed from live device records.
      </p>
    </div>
  );
}
