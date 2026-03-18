'use client';

import { useState } from 'react';

export type Period = 7 | 14 | 30;

export function usePeriodFilter(initial: Period = 30) {
  const [period, setPeriod] = useState<Period>(initial);
  return { period, setPeriod };
}
