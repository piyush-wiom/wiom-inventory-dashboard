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

// Try both formats: PO/2025/34 and PO/2025/00034
const candidates = ['PO/2025/34', 'PO/2025/00034', 'PO/25-26/00034', 'PO/25-26/34'];

let matchedPO = null, rows = [];

for (const po of candidates) {
  const r = await q(`SELECT COUNT(*) FROM PYROPS_INBOUND_DATA__INWARD WHERE PONO = '${po}'`);
  const cnt = r.data?.rows?.[0]?.[0] ?? 0;
  console.log(`  ${po} → ${cnt} rows`);
  if (cnt > 0 && !matchedPO) matchedPO = po;
}

if (!matchedPO) {
  // Broader search — find POs ending in /34 or /00034
  console.log('\nSearching broader pattern (PONO ending with /34 or /00034)...');
  const r = await q(`
    SELECT DISTINCT PONO, VENDORNAME, COUNT(*) AS ROW_COUNT
    FROM PYROPS_INBOUND_DATA__INWARD
    WHERE PONO ILIKE '%/34' OR PONO ILIKE '%/00034'
    GROUP BY PONO, VENDORNAME
    LIMIT 10
  `);
  if (r.data.rows.length > 0) {
    console.log('Found:');
    for (const row of r.data.rows) console.log(` PONO: ${row[0]} | Vendor: ${row[1]} | Rows: ${row[2]}`);
    matchedPO = r.data.rows[0][0];
  } else {
    console.log('No matching PO found under any format.');
    process.exit(0);
  }
}

// Query full GRN details for matched PO
console.log(`\n${'='.repeat(65)}`);
console.log(`PO : ${matchedPO}  (searched as: PO/25-26/00034)`);
console.log(`${'='.repeat(65)}`);

const detail = await q(`
  SELECT
    GRNNUMBER,
    MIN(GRNREGISTEREDDATE)::DATE  AS GRN_DATE,
    VENDORNAME,
    ITEMNO,
    DESCRIPTION,
    SUM(TOTALQUANTITY)            AS TOTAL_QTY,
    SUM(OKQUANTITY)               AS OK_QTY,
    SUM(REJECTQUANTITY)           AS REJECT_QTY,
    STATUS
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE PONO = '${matchedPO}'
  GROUP BY GRNNUMBER, VENDORNAME, ITEMNO, DESCRIPTION, STATUS
  ORDER BY GRN_DATE ASC
`);

const dRows = detail.data.rows;
const w = [16, 12, 18, 10, 30, 10, 8, 10, 10];
const cols = ['GRN No.', 'GRN Date', 'Vendor', 'Item No.', 'Description', 'Total Qty', 'OK Qty', 'Reject Qty', 'Status'];
console.log('\n' + cols.map((c, i) => c.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
for (const row of dRows) {
  console.log(row.map((v, i) => String(v ?? '').slice(0, w[i]).padEnd(w[i])).join(' | '));
}

// Totals
const tot = await q(`
  SELECT
    COUNT(DISTINCT GRNNUMBER) AS UNIQUE_GRNS,
    SUM(TOTALQUANTITY)        AS GRAND_TOTAL,
    SUM(OKQUANTITY)           AS GRAND_OK,
    SUM(REJECTQUANTITY)       AS GRAND_REJECT
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE PONO = '${matchedPO}'
`);
const [grns, grandTotal, grandOk, grandReject] = tot.data.rows[0];
console.log(`\n${'─'.repeat(65)}`);
console.log(`  Total GRNs raised  : ${grns}`);
console.log(`  Grand Total Qty    : ${grandTotal}`);
console.log(`  Total OK Qty       : ${grandOk}`);
console.log(`  Total Rejected Qty : ${grandReject}`);
console.log(`${'='.repeat(65)}\n`);
