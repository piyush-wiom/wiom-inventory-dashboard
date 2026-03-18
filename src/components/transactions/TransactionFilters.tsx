'use client';

import { Input } from '@/components/ui/input';

export interface FilterState {
  search: string;
  assetType: string;
  dispatchStatus: string;
  condition: string;
  dateFrom: string;
  dateTo: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const ASSET_TYPES = ['ROUTER', 'ONU', 'ONT'];
const DISPATCH_STATUSES = [
  'Pending', 'Ready for Dispatch', 'Dispatched to Partners', 'Sold to Partner',
  'Returned to Vendor', 'Dispatched For Dispose Off', 'To be sent to Vendor for RMA',
  'Will Dispose', 'PDO', 'Dispatched to Gurgaon office', 'Transfered to Mumbai',
];

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const set = (key: keyof FilterState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...filters, [key]: e.target.value });

  const selectCls = 'h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div className="flex flex-wrap gap-2 pb-3">
      <Input placeholder="Search Mac ID, Serial, Area…" value={filters.search} onChange={set('search')} className="h-8 w-48 text-xs" />
      <select value={filters.assetType} onChange={set('assetType')} className={selectCls}>
        <option value="all">All Asset Types</option>
        {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filters.dispatchStatus} onChange={set('dispatchStatus')} className={selectCls}>
        <option value="all">All Statuses</option>
        {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.condition} onChange={set('condition')} className={selectCls}>
        <option value="all">All Conditions</option>
        <option value="Z-GOOD">Z-GOOD</option>
        <option value="Z-BAD">Z-BAD</option>
      </select>
      <Input type="date" value={filters.dateFrom} onChange={set('dateFrom')} className="h-8 w-36 text-xs" title="From date" />
      <Input type="date" value={filters.dateTo} onChange={set('dateTo')} className="h-8 w-36 text-xs" title="To date" />
    </div>
  );
}
