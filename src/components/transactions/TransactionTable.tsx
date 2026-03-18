'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { TransactionFilters, FilterState } from './TransactionFilters';
import type { DeviceRecord } from '@/types/inventory';

interface TransactionTableProps {
  records?: DeviceRecord[];
  isLoading?: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  search: '', assetType: 'all', dispatchStatus: 'all', condition: 'all', dateFrom: '', dateTo: '',
};

const ASSET_COLOURS: Record<string, string> = {
  ROUTER: 'bg-blue-50 text-blue-800 border-blue-200',
  ONU: 'bg-purple-50 text-purple-800 border-purple-200',
  ONT: 'bg-cyan-50 text-cyan-800 border-cyan-200',
};

export function TransactionTable({ records, isLoading }: TransactionTableProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !r.macId.toLowerCase().includes(q) &&
          !r.serialNo.toLowerCase().includes(q) &&
          !r.deviceId.toLowerCase().includes(q) &&
          !r.areaName.toLowerCase().includes(q) &&
          !r.modelNo.toLowerCase().includes(q)
        ) return false;
      }
      if (filters.assetType !== 'all' && r.assetType !== filters.assetType) return false;
      if (filters.dispatchStatus !== 'all' && r.dispatchStatus !== filters.dispatchStatus) return false;
      if (filters.condition !== 'all' && r.condition !== filters.condition) return false;
      if (filters.dateFrom && r.entryDate < filters.dateFrom) return false;
      if (filters.dateTo && r.entryDate > filters.dateTo) return false;
      return true;
    });
  }, [records, filters]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Device Log</CardTitle>
          {!isLoading && (
            <span className="text-xs text-slate-400">{filtered.length.toLocaleString('en-IN')} records</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <TransactionFilters filters={filters} onChange={(f) => { setFilters(f); setPage(0); }} />
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Entry Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Mac ID</TableHead>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-400">
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((r, i) => (
                    <TableRow key={`${r.macId}-${i}`} className="text-xs">
                      <TableCell className="whitespace-nowrap">{r.entryDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${ASSET_COLOURS[r.assetType] ?? ''}`}>
                          {r.assetType}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.modelNo}</TableCell>
                      <TableCell className="font-mono">{r.macId}</TableCell>
                      <TableCell className="font-mono">{r.serialNo}</TableCell>
                      <TableCell>{r.areaName}</TableCell>
                      <TableCell className="max-w-32 truncate text-slate-500">{r.sourceInventory}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${r.condition === 'Z-GOOD' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                          {r.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.dispatchStatus} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">← Previous</button>
                <span>Page {page + 1} of {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
