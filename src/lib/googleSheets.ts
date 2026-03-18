/**
 * googleSheets.ts — SERVER-ONLY module
 *
 * Loads GOOGLE_SHEETS_API_KEY from C:\credentials\.env via dotenv
 * and fetches rows from the Transaction_Master sheet.
 */

// Load credentials from centralised secure location (never from project root)
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: 'C:\\credentials\\.env' });

import { SHEET_ID, SHEET_TAB } from './constants';

export async function fetchSheetRows(): Promise<string[][]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_SHEETS_API_KEY is not set. ' +
        'Please add it to C:\\credentials\\.env',
    );
  }

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
    `/values/${encodeURIComponent(SHEET_TAB)}?key=${apiKey}`;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Google Sheets API error ${res.status}: ${body}`,
    );
  }

  const json = await res.json();
  // json.values is string[][] — first row is headers
  return (json.values ?? []) as string[][];
}
