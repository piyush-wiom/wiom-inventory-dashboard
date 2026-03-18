import type { KpiData } from '@/types/inventory';

export interface KpiCardConfig {
  id: string;
  label: string;
  icon: string;
  getValue: (k: KpiData) => string;
  getColour: (k: KpiData) => string;
  subtitle: (k: KpiData) => string;
}

export const KPI_CARDS: KpiCardConfig[] = [
  {
    id: 'totalStock',
    label: 'Current Stock',
    icon: 'Package',
    getValue: (k) => k.totalStock.toLocaleString('en-IN'),
    getColour: () => 'text-slate-700',
    subtitle: (k) =>
      `✅ ${k.goodStock.toLocaleString('en-IN')} Good  ·  ❌ ${k.badStock.toLocaleString('en-IN')} Bad`,
  },
  {
    id: 'assetBreakdown',
    label: 'By Asset Type',
    icon: 'Layers',
    getValue: (k) => `${k.routerStock + k.onuStock + k.ontStock}`,
    getColour: () => 'text-blue-700',
    subtitle: (k) =>
      `Router: ${k.routerStock}  ·  ONU: ${k.onuStock}  ·  ONT: ${k.ontStock}`,
  },
  {
    id: 'todayAdded',
    label: "Today's Additions",
    icon: 'ArrowDownToLine',
    getValue: (k) => `+${k.todayAdded.toLocaleString('en-IN')}`,
    getColour: () => 'text-green-600',
    subtitle: (k) => `Dispatched today: ${k.dispatchedToday.toLocaleString('en-IN')}`,
  },
  {
    id: 'totalDispatched',
    label: 'Total Dispatched',
    icon: 'ArrowUpFromLine',
    getValue: (k) => k.totalDispatched.toLocaleString('en-IN'),
    getColour: () => 'text-red-600',
    subtitle: (k) => {
      const total = k.totalStock + k.totalDispatched;
      const pct = total > 0 ? Math.round((k.totalDispatched / total) * 100) : 0;
      return `${pct}% of all ${total.toLocaleString('en-IN')} devices`;
    },
  },
];
