'use client';

import { AlertTriangle } from 'lucide-react';
import { DOI_ALERT_THRESHOLD } from '@/lib/constants';

interface DoiAlertBannerProps {
  doi: number;
}

export function DoiAlertBanner({ doi }: DoiAlertBannerProps) {
  if (doi < 0 || doi > DOI_ALERT_THRESHOLD) return null;

  return (
    <div className="animate-pulse bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      ALERT: Days of Inventory (DOI) is{' '}
      <strong>{doi} days</strong> — Stock critically low. Reorder immediately!
    </div>
  );
}
