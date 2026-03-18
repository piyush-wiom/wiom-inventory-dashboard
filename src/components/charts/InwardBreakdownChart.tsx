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
  INWARD_FRESH,
  INWARD_RETURN,
  INWARD_RMA,
  INWARD_STN,
  INWARD_POS_ADJ,
} from './chartColors';
import type { DailyMovement } from '@/types/inventory';
import type { Period } from '@/hooks/usePeriodFilter';

interface InwardBreakdownChartProps {
  movements?: DailyMovement[];
  period: Period;
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function InwardBreakdownChart({
  movements,
  period,
  isLoading,
}: InwardBreakdownChartProps) {
  const sliced = movements?.slice(-period) ?? [];
  const chartData = sliced.map((m) => ({
    date: formatDate(m.date),
    Fresh: m.freshInward,
    Return: m.returnInward,
    RMA: m.rmaInward,
    STN: m.stnReceiving,
    Adjustment: m.positiveAdj,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Inward Breakdown
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
              <Bar dataKey="Fresh" stackId="a" fill={INWARD_FRESH} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Return" stackId="a" fill={INWARD_RETURN} />
              <Bar dataKey="RMA" stackId="a" fill={INWARD_RMA} />
              <Bar dataKey="STN" stackId="a" fill={INWARD_STN} />
              <Bar dataKey="Adjustment" stackId="a" fill={INWARD_POS_ADJ} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
