'use client';

import { useInventoryData } from '@/hooks/useInventoryData';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { Header } from '@/components/layout/Header';
import { DoiAlertBanner } from '@/components/layout/DoiAlertBanner';
import { KpiGrid } from '@/components/kpi/KpiGrid';
import { StockMovementChart } from '@/components/charts/StockMovementChart';
import { InwardBreakdownChart } from '@/components/charts/InwardBreakdownChart';
import { OutwardBreakdownChart } from '@/components/charts/OutwardBreakdownChart';
import { ReconciliationSummary } from '@/components/reconciliation/ReconciliationSummary';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { AlertCircle } from 'lucide-react';

export function DashboardClient() {
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

      {data?.kpi && <DoiAlertBanner doi={data.kpi.doi} />}

      <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6">
        {/* Error state */}
        {hasError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Failed to load inventory data</p>
              <p className="mt-0.5 font-mono text-xs text-red-500">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <KpiGrid kpi={data?.kpi} isLoading={isLoading} />

        {/* Trend chart (full width) */}
        <StockMovementChart
          movements={data?.dailyMovements}
          period={period}
          onPeriodChange={setPeriod}
          isLoading={isLoading}
        />

        {/* Breakdown charts (side by side) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InwardBreakdownChart
            movements={data?.dailyMovements}
            period={period}
            isLoading={isLoading}
          />
          <OutwardBreakdownChart
            movements={data?.dailyMovements}
            period={period}
            isLoading={isLoading}
          />
        </div>

        {/* Reconciliation */}
        <ReconciliationSummary
          data={data?.reconciliation}
          isLoading={isLoading}
        />

        {/* Transaction table */}
        <TransactionTable
          transactions={data?.transactions}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
