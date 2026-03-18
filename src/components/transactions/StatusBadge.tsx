import { Badge } from '@/components/ui/badge';
import type { DispatchStatus } from '@/types/inventory';

interface StatusBadgeProps {
  status: DispatchStatus;
}

const IN_STOCK = ['Pending', 'Ready for Dispatch'];
const DISPATCHED = ['Dispatched to Partners', 'Sold to Partner'];

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = IN_STOCK.includes(status)
    ? 'bg-green-50 text-green-800 border-green-200'
    : DISPATCHED.includes(status)
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <Badge variant="outline" className={`whitespace-nowrap text-xs font-medium ${cls}`}>
      {status}
    </Badge>
  );
}
