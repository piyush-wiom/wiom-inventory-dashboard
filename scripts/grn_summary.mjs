import { readFileSync } from 'fs';

function loadEnv(path) {
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}
loadEnv('C:\\credentials\\.env');

const METABASE_URL = process.env.METABASE_URL.replace(/\/$/, '');
const HEADERS = { 'x-api-key': process.env.METABASE_API_KEY, 'Content-Type': 'application/json' };

async function runQuery(sql) {
  const resp = await fetch(`${METABASE_URL}/api/dataset`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } })
  });
  return resp.json();
}

function printTable(result) {
  if (result.error) { console.error('Error:', result.error); return; }
  const cols = result.data.cols.map(c => c.display_name);
  const rows = result.data.rows;
  const widths = cols.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)));
  console.log(cols.map((h, i) => h.padEnd(widths[i])).join(' | '));
  console.log('-'.repeat(widths.reduce((a, b) => a + b + 3, 0)));
  for (const row of rows) console.log(row.map((v, i) => String(v ?? '').padEnd(widths[i])).join(' | '));
}

// 1. Total row count
const cnt = await runQuery(`
  SELECT COUNT(*) AS TOTAL_ROWS, COUNT(DISTINCT GRNNUMBER) AS UNIQUE_GRNS
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE GRNREGISTEREDDATE >= '2026-03-01' AND GRNREGISTEREDDATE < '2026-04-21'
`);
const [totalRows, uniqueGrns] = cnt.data.rows[0];
console.log(`\n=== GRN Data: March 1 – April 20, 2026 ===`);
console.log(`Total line items : ${totalRows}`);
console.log(`Unique GRNs      : ${uniqueGrns}\n`);

// 2. GRN-wise summary
const summ = await runQuery(`
  SELECT
    GRNNUMBER,
    MIN(GRNREGISTEREDDATE)::DATE  AS GRN_DATE,
    VENDORNAME,
    COUNT(*)                       AS LINE_ITEMS,
    SUM(TOTALQUANTITY)             AS TOTAL_QTY,
    SUM(OKQUANTITY)                AS OK_QTY,
    SUM(REJECTQUANTITY)            AS REJECT_QTY,
    SUM(HOLDQUANTITY)              AS HOLD_QTY,
    STATUS
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE GRNREGISTEREDDATE >= '2026-03-01' AND GRNREGISTEREDDATE < '2026-04-21'
  GROUP BY GRNNUMBER, VENDORNAME, STATUS
  ORDER BY GRN_DATE DESC
`);
console.log(`GRN-wise Summary (${summ.data.rows.length} GRNs):\n`);
printTable(summ);
