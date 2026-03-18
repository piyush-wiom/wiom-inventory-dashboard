'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AreaBreakdownProps {
  data?: { area: string; count: number }[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6','#22c55e','#f59e0b','#8b5cf6','#06b6d4',
  '#ef4444','#f97316','#10b981','#6366f1','#ec4899',
];

export function ReconciliationSummary({ data, isLoading }: AreaBreakdownProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          In-Stock by Area (Top 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-52 w-full" />
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No area data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
              <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} tickLine={false} width={75} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [(v as number).toLocaleString('en-IN'), 'Devices']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
