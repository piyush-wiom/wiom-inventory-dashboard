'use client';

import useSWR from 'swr';
import type { InventoryApiResponse, DeviceRecord } from '@/types/inventory';

export type { DeviceRecord };

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<InventoryApiResponse>;

export function useInventoryData() {
  const { data, error, isLoading, mutate } = useSWR<InventoryApiResponse>(
    '/api/inventory',
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 30_000 },
  );

  return { data, error, isLoading, refresh: () => mutate() };
}
