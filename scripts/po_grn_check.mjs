import { readFileSync } from 'fs';
function loadEnv(p) {
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('='); if (i < 0) continue;
    const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (k && v && !process.env[k]) process.env[k] = v;
  }
}
loadEnv('C:\\credentials\\.env');
const URL = process.env.METABASE_URL.replace(/\/$/, '');
const H = { 'x-api-key': process.env.METABASE_API_KEY, 'Content-Type': 'application/json' };
async function q(sql) {
  const r = await fetch(`${URL}/api/dataset`, { method: 'POST', headers: H, body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } }) });
  return r.json();
}

const PO = 'PO/25-26/00034';

// 1. GRN-wise breakdown
const r = await q(`
  SELECT
    GRNNUMBER,
    MIN(GRNREGISTEREDDATE)::DATE   AS GRN_DATE,
    VENDORNAME,
    ITEMNO,
    DESCRIPTION,
    SUM(TOTALQUANTITY)             AS TOTAL_QTY,
    SUM(OKQUANTITY)                AS OK_QTY,
    SUM(REJECTQUANTITY)            AS REJECT_QTY,
    STATUS
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE PONO = '${PO}'
  GROUP BY GRNNUMBER, VENDORNAME, ITEMNO, DESCRIPTION, STATUS
  ORDER BY GRN_DATE ASC
`);

if (r.error) { console.error('Error:', r.error); process.exit(1); }
const rows = r.data.rows;

if (rows.length === 0) {
  // Try PONO2 as fallback
  const r2 = await q(`SELECT COUNT(*) FROM PYROPS_INBOUND_DATA__INWARD WHERE PONO2 = '${PO}'`);
  console.log(`No records found under PONO. PONO2 count: ${r2.data?.rows?.[0]?.[0] ?? 0}`);
  process.exit(0);
}

console.log(`\n${'='.repeat(65)}`);
console.log(`PO Number : ${PO}`);
console.log(`${'='.repeat(65)}`);

// GRN-wise table
const cols = ['GRN Number', 'GRN Date', 'Vendor', 'Item', 'Description', 'Total Qty', 'OK Qty', 'Reject Qty', 'Status'];
const w    = [16, 12, 18, 10, 28, 10, 8, 10, 10];
console.log('\nGRN-wise Breakdown:\n');
console.log(cols.map((c, i) => c.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
for (const row of rows) {
  console.log(row.map((v, i) => String(v ?? '').slice(0, w[i]).padEnd(w[i])).join(' | '));
}

// 2. Grand totals
const r2 = await q(`
  SELECT
    COUNT(DISTINCT GRNNUMBER)  AS UNIQUE_GRNS,
    SUM(TOTALQUANTITY)         AS GRAND_TOTAL_QTY,
    SUM(OKQUANTITY)            AS GRAND_OK_QTY,
    SUM(REJECTQUANTITY)        AS GRAND_REJECT_QTY
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE PONO = '${PO}'
`);
const [grns, totalQty, okQty, rejectQty] = r2.data.rows[0];

console.log(`\n${'─'.repeat(65)}`);
console.log(`  Unique GRNs        : ${grns}`);
console.log(`  Grand Total Qty    : ${totalQty}`);
console.log(`  Total OK Qty       : ${okQty}`);
console.log(`  Total Rejected Qty : ${rejectQty}`);
console.log(`${'='.repeat(65)}\n`);
