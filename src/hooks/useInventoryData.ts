'use client';

import useSWR from 'swr';
import type { InventoryApiResponse } from '@/types/inventory';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<InventoryApiResponse>;

export function useInventoryData() {
  const { data, error, isLoading, mutate } = useSWR<InventoryApiResponse>(
    '/api/inventory',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000, // 30 s
    },
  );

  const refresh = () => mutate();

  return { data, error, isLoading, refresh };
}
