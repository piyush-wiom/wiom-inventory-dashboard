import type { DeviceRecord, DailyEntry } from '@/types/inventory';
import { DISPATCHED_STATUSES } from './constants';

function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  // IST = UTC + 5h30m — reliable cross-platform calculation
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(Date.now() + istOffset);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayIST);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function aggregateDailyEntries(
  records: DeviceRecord[],
  days = 30,
): DailyEntry[] {
  const dateRange = buildDateRange(days);

  return dateRange.map((date) => {
    const added = records.filter((r) => r.entryDate === date);
    const dispatched = records.filter(
      (r) =>
        r.dispatchDate === date &&
        DISPATCHED_STATUSES.includes(r.dispatchStatus),
    );

    return {
      date,
      added: added.length,
      dispatched: dispatched.length,
      router: added.filter((r) => r.assetType === 'ROUTER').length,
      onu: added.filter((r) => r.assetType === 'ONU').length,
      ont: added.filter((r) => r.assetType === 'ONT').length,
    };
  });
}
