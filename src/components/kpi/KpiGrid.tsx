'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from './KpiCard';
import { KPI_CARDS } from './kpiConfig';
import type { KpiData } from '@/types/inventory';

interface KpiGridProps {
  kpi?: KpiData;
  isLoading?: boolean;
}

export function KpiGrid({ kpi, isLoading }: KpiGridProps) {
  if (isLoading || !kpi) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_CARDS.map((c) => (
          <Skeleton key={c.id} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {KPI_CARDS.map((config) => (
        <KpiCard key={config.id} config={config} kpi={kpi} />
      ))}
    </div>
  );
}
