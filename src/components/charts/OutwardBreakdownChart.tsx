'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DispatchBreakdown } from '@/types/inventory';

interface OutwardBreakdownChartProps {
  data?: DispatchBreakdown;
  isLoading?: boolean;
}

const BAR_COLORS: Record<string, string> = {
  'Pending': '#94a3b8',
  'Ready': '#22c55e',
  'To Partners': '#ef4444',
  'Sold': '#f97316',
  'To Vendor': '#8b5cf6',
  'Dispose': '#1f2937',
  'Other': '#6b7280',
};

export function OutwardBreakdownChart({ data, isLoading }: OutwardBreakdownChartProps) {
  const chartData = data
    ? [
        { name: 'Pending', value: data.pending },
        { name: 'Ready', value: data.readyForDispatch },
        { name: 'To Partners', value: data.dispatchedToPartners },
        { name: 'Sold', value: data.soldToPartner },
        { name: 'To Vendor', value: data.returnedToVendor },
        { name: 'Dispose', value: data.disposeOff },
        { name: 'Other', value: data.other },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Dispatch Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [(v as number).toLocaleString('en-IN'), 'Devices']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={BAR_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
