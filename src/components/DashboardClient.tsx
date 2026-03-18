'use client';

import { useState } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { Header } from '@/components/layout/Header';
import { KpiGrid } from '@/components/kpi/KpiGrid';
import { StockMovementChart } from '@/components/charts/StockMovementChart';
import { InwardBreakdownChart } from '@/components/charts/InwardBreakdownChart';
import { OutwardBreakdownChart } from '@/components/charts/OutwardBreakdownChart';
import { ReconciliationSummary } from '@/components/reconciliation/ReconciliationSummary';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { DailyReportTab } from '@/components/daily/DailyReportTab';
import { AlertCircle } from 'lucide-react';

type Tab = 'daily' | 'overview' | 'log';

const TABS: { id: Tab; label: string }[] = [
  { id: 'daily',    label: '📋 Daily Report' },
  { id: 'overview', label: '📊 Inventory Overview' },
  { id: 'log',      label: '📝 Device Log' },
];

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const { data, error, isLoading, refresh } = useInventoryData();
  const { period, setPeriod } = usePeriodFilter(30);

  const hasError = error || (data as { error?: string })?.error;
  const errorMsg =
    (data as { error?: string })?.error ??
    (error instanceof Error ? error.message : 'Failed to load data');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        lastRefreshed={data?.lastRefreshed}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      {/* top-[60px] offsets below the sticky header (header ≈ 60px tall) */}
      <div className="sticky top-[60px] z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl gap-0 px-4 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6">

        {/* ── Daily Report tab ──────────────────────────────────────────── */}
        {activeTab === 'daily' && <DailyReportTab />}

        {/* ── Inventory Overview tab ────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {hasError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Failed to load inventory data</p>
                  <p className="mt-0.5 font-mono text-xs text-red-500">{errorMsg}</p>
                </div>
              </div>
            )}

            {data?.totalRows && !hasError && (
              <p className="text-xs text-slate-400">
                📊 Loaded{' '}
                <span className="font-semibold text-slate-600">
                  {data.totalRows.toLocaleString('en-IN')}
                </span>{' '}
                device records from Google Sheets
              </p>
            )}

            <KpiGrid kpi={data?.kpi} isLoading={isLoading} />

            <StockMovementChart
              entries={data?.dailyEntries}
              period={period}
              onPeriodChange={setPeriod}
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <InwardBreakdownChart data={data?.sourceBreakdown} isLoading={isLoading} />
              <OutwardBreakdownChart data={data?.dispatchBreakdown} isLoading={isLoading} />
            </div>

            <ReconciliationSummary data={data?.areaBreakdown} isLoading={isLoading} />
          </>
        )}

        {/* ── Device Log tab ────────────────────────────────────────────── */}
        {activeTab === 'log' && (
          <>
            {hasError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Failed to load device records</p>
                  <p className="mt-0.5 font-mono text-xs text-red-500">{errorMsg}</p>
                </div>
              </div>
            )}
            <TransactionTable records={data?.records} isLoading={isLoading} />
          </>
        )}
      </main>
    </div>
  );
}
