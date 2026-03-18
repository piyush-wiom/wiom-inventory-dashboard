'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  OUTWARD_DISPATCH,
  OUTWARD_RMA_OUT,
  OUTWARD_STN,
  OUTWARD_NEG_ADJ,
  OUTWARD_DISPOSAL,
} from './chartColors';
import type { DailyMovement } from '@/types/inventory';
import type { Period } from '@/hooks/usePeriodFilter';

interface OutwardBreakdownChartProps {
  movements?: DailyMovement[];
  period: Period;
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function OutwardBreakdownChart({
  movements,
  period,
  isLoading,
}: OutwardBreakdownChartProps) {
  const sliced = movements?.slice(-period) ?? [];
  const chartData = sliced.map((m) => ({
    date: formatDate(m.date),
    Dispatch: m.salesDispatch,
    'RMA Out': m.rmaOut,
    'STN Out': m.stnDispatch,
    'Neg Adj': m.negativeAdj,
    Disposal: m.disposal,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Outward Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !movements ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Dispatch" stackId="b" fill={OUTWARD_DISPATCH} />
              <Bar dataKey="RMA Out" stackId="b" fill={OUTWARD_RMA_OUT} />
              <Bar dataKey="STN Out" stackId="b" fill={OUTWARD_STN} />
              <Bar dataKey="Neg Adj" stackId="b" fill={OUTWARD_NEG_ADJ} />
              <Bar dataKey="Disposal" stackId="b" fill={OUTWARD_DISPOSAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
