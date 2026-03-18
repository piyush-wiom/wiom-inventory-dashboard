'use client';

import { Badge } from '@/components/ui/badge';

interface OpenStnListProps {
  docNos: string[];
}

export function OpenStnList({ docNos }: OpenStnListProps) {
  if (docNos.length === 0) return null;

  return (
    <details className="mt-3 w-full">
      <summary className="cursor-pointer select-none py-2 text-sm font-medium text-red-700 hover:text-red-800">
        Open STNs ({docNos.length})
      </summary>
      <div className="flex flex-wrap gap-2 pt-2">
        {docNos.map((doc) => (
          <Badge
            key={doc}
            variant="outline"
            className="border-red-200 bg-red-50 font-mono text-xs text-red-700"
          >
            {doc}
          </Badge>
        ))}
      </div>
    </details>
  );
}
