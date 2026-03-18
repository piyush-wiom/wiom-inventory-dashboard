'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodToggle } from './PeriodToggle';
import { INWARD_PRIMARY, OUTWARD_PRIMARY } from './chartColors';
import type { DailyMovement } from '@/types/inventory';
import type { Period } from '@/hooks/usePeriodFilter';

interface StockMovementChartProps {
  movements?: DailyMovement[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function StockMovementChart({
  movements,
  period,
  onPeriodChange,
  isLoading,
}: StockMovementChartProps) {
  const sliced = movements?.slice(-period) ?? [];

  const chartData = sliced.map((m) => ({
    date: formatDate(m.date),
    Inward: m.totalInward,
    Outward: m.totalOutward,
    Net: m.totalInward - m.totalOutward,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Stock Movement Trend
        </CardTitle>
        <PeriodToggle period={period} onChange={onPeriodChange} />
      </CardHeader>
      <CardContent>
        {isLoading || !movements ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inwardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INWARD_PRIMARY} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={INWARD_PRIMARY} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="outwardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={OUTWARD_PRIMARY} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={OUTWARD_PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="Inward"
                stroke={INWARD_PRIMARY}
                fill="url(#inwardGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Outward"
                stroke={OUTWARD_PRIMARY}
                fill="url(#outwardGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
