'use client';

import useSWR from 'swr';
import type { DailyReportData } from '@/types/inventory';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<DailyReportData>;

export function useDailyReport() {
  const { data, error, isLoading, mutate } = useSWR<DailyReportData>(
    '/api/daily-report',
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 30_000 },
  );

  return { data, error, isLoading, refresh: () => mutate() };
}
