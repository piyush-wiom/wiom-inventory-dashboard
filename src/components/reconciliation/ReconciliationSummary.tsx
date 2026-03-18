'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OpenStnList } from './OpenStnList';
import {
  COLOR_RECONCILED,
  COLOR_PARTIAL,
  COLOR_OPEN,
  COLOR_FORCE_CLOSED,
} from '@/components/charts/chartColors';
import type { ReconciliationSummary as RecSummaryType } from '@/types/inventory';

interface ReconciliationSummaryProps {
  data?: RecSummaryType;
  isLoading?: boolean;
}

export function ReconciliationSummary({ data, isLoading }: ReconciliationSummaryProps) {
  if (isLoading || !data) {
    return <Skeleton className="h-44 w-full rounded-lg" />;
  }

  const pieData = [
    { name: 'Reconciled', value: data.reconciled, color: COLOR_RECONCILED },
    { name: 'Partial', value: data.partial, color: COLOR_PARTIAL },
    { name: 'Open', value: data.open, color: COLOR_OPEN },
    { name: 'Force Closed', value: data.forceClosed, color: COLOR_FORCE_CLOSED },
  ].filter((d) => d.value > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Reconciliation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Donut chart */}
          <div className="relative h-36 w-36 flex-shrink-0 mx-auto sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v) => [
                    `${v} (${Math.round(((v as number) / data.total) * 100)}%)`,
                    '',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* centre text */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-800">
                {data.reconciledPct}%
              </span>
              <span className="text-xs text-slate-500">done</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Stat label="Total" value={data.total} />
            <Stat label="✅ Reconciled" value={data.reconciled} colour="text-green-700" />
            <Stat label="⚠️ Partial" value={data.partial} colour="text-amber-600" />
            <Stat label="❌ Open" value={data.open} colour="text-red-600" />
            <Stat label="🔒 Force Closed" value={data.forceClosed} colour="text-gray-500" />
          </div>
        </div>

        <OpenStnList docNos={data.openStnDocNos} />
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  colour = 'text-slate-700',
}: {
  label: string;
  value: number;
  colour?: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${colour}`}>
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}
