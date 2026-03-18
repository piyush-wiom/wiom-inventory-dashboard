import { COL, ALL_TRANSACTION_TYPES } from './constants';
import type { Transaction, TransactionType, ReconciliationStatus } from '@/types/inventory';

// ---------------------------------------------------------------------------
// Date normalisation — handle DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
// Always outputs YYYY-MM-DD
// ---------------------------------------------------------------------------
function normaliseDate(raw: string): string {
  if (!raw) return '';

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: try native Date parse
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return '';
}

function normaliseStatus(raw: string): ReconciliationStatus {
  const s = (raw ?? '').trim().toLowerCase();
  if (s.includes('reconcil')) return 'Reconciled';
  if (s.includes('partial')) return 'Partial';
  if (s.includes('force')) return 'Force Closed';
  return 'Open';
}

function normaliseTransactionType(raw: string): TransactionType | null {
  const s = (raw ?? '').trim();
  const found = ALL_TRANSACTION_TYPES.find(
    (t) => t.toLowerCase() === s.toLowerCase(),
  );
  return found ?? null;
}

// ---------------------------------------------------------------------------
// Main parser — skips header row (index 0) and empty rows
// ---------------------------------------------------------------------------
export function parseTransactions(rows: string[][]): Transaction[] {
  const [, ...dataRows] = rows; // skip header

  return dataRows
    .filter((row) => row && row.length > COL.TRANSACTION_TYPE && row[COL.TRANSACTION_TYPE]?.trim())
    .map((row, idx): Transaction | null => {
      const rawType = row[COL.TRANSACTION_TYPE] ?? '';
      const type = normaliseTransactionType(rawType);
      if (!type) return null;

      return {
        sr: parseInt(row[COL.SR] ?? String(idx + 1), 10) || idx + 1,
        transactionType: type,
        documentNo: row[COL.DOCUMENT_NO] ?? '',
        sourceNode: row[COL.SOURCE_NODE] ?? '',
        destinationNode: row[COL.DESTINATION_NODE] ?? '',
        docDate: normaliseDate(row[COL.DOC_DATE] ?? ''),
        sku: row[COL.SKU] ?? '',
        qty: parseInt(row[COL.QTY] ?? '0', 10) || 0,
        stage: row[COL.STAGE] ?? '',
        linkedDocNo: row[COL.LINKED_DOC_NO] ?? '',
        linkedDocType: row[COL.LINKED_DOC_TYPE] ?? '',
        status: normaliseStatus(row[COL.STATUS] ?? ''),
        remarks: row[COL.REMARKS] ?? '',
      };
    })
    .filter((t): t is Transaction => t !== null);
}
