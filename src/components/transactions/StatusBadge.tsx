import { Badge } from '@/components/ui/badge';
import type { ReconciliationStatus } from '@/types/inventory';

interface StatusBadgeProps {
  status: ReconciliationStatus;
}

const STATUS_CONFIG: Record<
  ReconciliationStatus,
  { label: string; className: string }
> = {
  Reconciled: {
    label: '✅ Reconciled',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  Partial: {
    label: '⚠️ Partial',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  Open: {
    label: '❌ Open',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  'Force Closed': {
    label: '🔒 Force Closed',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['Open'];
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
