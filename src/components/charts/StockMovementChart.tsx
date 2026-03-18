'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodToggle } from './PeriodToggle';
import { INWARD_PRIMARY, OUTWARD_PRIMARY } from './chartColors';
import type { DailyEntry } from '@/types/inventory';
import type { Period } from '@/hooks/usePeriodFilter';

interface StockMovementChartProps {
  entries?: DailyEntry[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  isLoading?: boolean;
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short',
  });
}

export function StockMovementChart({ entries, period, onPeriodChange, isLoading }: StockMovementChartProps) {
  const data = (entries?.slice(-period) ?? []).map((e) => ({
    date: fmtDate(e.date),
    Added: e.added,
    Dispatched: e.dispatched,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Daily Stock Movement
        </CardTitle>
        <PeriodToggle period={period} onChange={onPeriodChange} />
      </CardHeader>
      <CardContent>
        {isLoading || !entries ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INWARD_PRIMARY} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={INWARD_PRIMARY} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="dispatchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={OUTWARD_PRIMARY} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={OUTWARD_PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Added" stroke={INWARD_PRIMARY} fill="url(#addedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Dispatched" stroke={OUTWARD_PRIMARY} fill="url(#dispatchGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
