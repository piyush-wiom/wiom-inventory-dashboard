'use client';

import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KpiData } from '@/types/inventory';
import type { KpiCardConfig } from './kpiConfig';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
};

interface KpiCardProps {
  config: KpiCardConfig;
  kpi: KpiData;
}

export function KpiCard({ config, kpi }: KpiCardProps) {
  const Icon = ICON_MAP[config.icon] ?? Package;
  const value = config.getValue(kpi);
  const colour = config.getColour(kpi);
  const subtitle = config.subtitle(kpi);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-slate-500">
          {config.label}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${colour}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
