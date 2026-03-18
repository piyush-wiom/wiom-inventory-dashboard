'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { TransactionFilters, FilterState } from './TransactionFilters';
import { INWARD_TYPES } from '@/lib/constants';
import type { Transaction } from '@/types/inventory';

interface TransactionTableProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  type: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
};

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((t) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.documentNo.toLowerCase().includes(q) &&
          !t.remarks.toLowerCase().includes(q) &&
          !t.sourceNode.toLowerCase().includes(q) &&
          !t.destinationNode.toLowerCase().includes(q) &&
          !t.sku.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.type !== 'all' && t.transactionType !== filters.type)
        return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      if (filters.dateFrom && t.docDate < filters.dateFrom) return false;
      if (filters.dateTo && t.docDate > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Transaction Log
          </CardTitle>
          {!isLoading && (
            <span className="text-xs text-slate-400">
              {filtered.length.toLocaleString('en-IN')} records
            </span>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doc No.</TableHead>
                  <TableHead>Source → Destination</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-slate-400"
                    >
                      No transactions match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((t, i) => {
                    const isInward = (INWARD_TYPES as string[]).includes(
                      t.transactionType,
                    );
                    return (
                      <TableRow key={`${t.documentNo}-${i}`} className="text-xs">
                        <TableCell className="whitespace-nowrap">{t.docDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              isInward
                                ? 'border-green-200 bg-green-50 text-green-800'
                                : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                          >
                            {t.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{t.documentNo}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {t.sourceNode}
                          {t.destinationNode ? ` → ${t.destinationNode}` : ''}
                        </TableCell>
                        <TableCell>{t.sku}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isInward ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {isInward ? '+' : '−'}
                          {t.qty.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{t.stage}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-slate-500">
                          {t.remarks}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
