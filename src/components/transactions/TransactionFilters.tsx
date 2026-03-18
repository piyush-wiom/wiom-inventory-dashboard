'use client';

import { Input } from '@/components/ui/input';
import { ALL_TRANSACTION_TYPES } from '@/lib/constants';

export interface FilterState {
  search: string;
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const set = (key: keyof FilterState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="flex flex-wrap gap-2 pb-3">
      <Input
        placeholder="Search doc no., remarks…"
        value={filters.search}
        onChange={set('search')}
        className="h-8 w-48 text-xs"
      />

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={set('type')}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="all">All types</option>
        {ALL_TRANSACTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={set('status')}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="all">All statuses</option>
        <option value="Reconciled">Reconciled</option>
        <option value="Partial">Partial</option>
        <option value="Open">Open</option>
        <option value="Force Closed">Force Closed</option>
      </select>

      {/* Date range */}
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={set('dateFrom')}
        className="h-8 w-36 text-xs"
        title="From date"
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={set('dateTo')}
        className="h-8 w-36 text-xs"
        title="To date"
      />
    </div>
  );
}
