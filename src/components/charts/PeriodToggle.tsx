'use client';

import type { Period } from '@/hooks/usePeriodFilter';

interface PeriodToggleProps {
  period: Period;
  onChange: (p: Period) => void;
}

const PERIODS: Period[] = [7, 14, 30];

export function PeriodToggle({ period, onChange }: PeriodToggleProps) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            period === p
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          {p}D
        </button>
      ))}
    </div>
  );
}
