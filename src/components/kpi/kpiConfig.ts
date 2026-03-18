import type { KpiData } from '@/types/inventory';
import { DOI_ALERT_THRESHOLD } from '@/lib/constants';

export interface KpiCardConfig {
  id: string;
  label: string;
  icon: string; // lucide icon name
  getValue: (kpi: KpiData) => string;
  getColour: (kpi: KpiData) => string;
  subtitle: (kpi: KpiData) => string;
}

export const KPI_CARDS: KpiCardConfig[] = [
  {
    id: 'closingStock',
    label: 'Closing Stock',
    icon: 'Package',
    getValue: (k) => k.closingStock.toLocaleString('en-IN'),
    getColour: () => 'text-slate-700',
    subtitle: (k) =>
      `Opening: ${k.openingStock.toLocaleString('en-IN')} units`,
  },
  {
    id: 'todayInward',
    label: "Today's Inward",
    icon: 'ArrowDownToLine',
    getValue: (k) => `+${k.todayInward.toLocaleString('en-IN')}`,
    getColour: () => 'text-green-600',
    subtitle: () => 'Units received today',
  },
  {
    id: 'todayOutward',
    label: "Today's Outward",
    icon: 'ArrowUpFromLine',
    getValue: (k) => `−${k.todayOutward.toLocaleString('en-IN')}`,
    getColour: () => 'text-red-600',
    subtitle: (k) =>
      `Avg 30d: ${k.avgDailyOutward30d.toLocaleString('en-IN')} units/day`,
  },
  {
    id: 'doi',
    label: 'Days of Inventory',
    icon: 'CalendarClock',
    getValue: (k) => (k.doi < 0 ? '∞' : `${k.doi}`),
    getColour: (k) =>
      k.doi < 0
        ? 'text-slate-500'
        : k.doi <= DOI_ALERT_THRESHOLD
          ? 'text-red-600'
          : k.doi <= DOI_ALERT_THRESHOLD * 1.5
            ? 'text-orange-500'
            : 'text-green-600',
    subtitle: (k) =>
      k.doi < 0
        ? 'No outward in last 30 days'
        : k.doi <= DOI_ALERT_THRESHOLD
          ? '⚠️ Below threshold — reorder now'
          : 'Stock level healthy',
  },
];
