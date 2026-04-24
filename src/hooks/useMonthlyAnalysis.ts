'use client';

import useSWR from 'swr';
import type { MonthlyAnalysisData } from '@/types/inventory';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<MonthlyAnalysisData>;

export function useMonthlyAnalysis(year: number, months: number[]) {
  const key = `/api/monthly-analysis?year=${year}&months=${months.join(',')}`;
  const { data, error, isLoading, mutate } = useSWR<MonthlyAnalysisData>(
    months.length > 0 ? key : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 30_000 },
  );

  return { data, error, isLoading, refresh: () => mutate() };
}
