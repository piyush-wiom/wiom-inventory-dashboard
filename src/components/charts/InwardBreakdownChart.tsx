'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SourceBreakdown } from '@/types/inventory';

interface InwardBreakdownChartProps {
  data?: SourceBreakdown;
  isLoading?: boolean;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#f59e0b'];

export function InwardBreakdownChart({ data, isLoading }: InwardBreakdownChartProps) {
  const pieData = data
    ? [
        { name: 'Return (Refurb)', value: data.returnRefurbished },
        { name: 'Vendor (Virgin)', value: data.vendorVirgin },
        { name: 'STN Receiving', value: data.receivedInSTN },
        { name: 'RMA Stock', value: data.stockRMA },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Source Breakdown (All Inventory)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={75} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [(v as number).toLocaleString('en-IN'), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
