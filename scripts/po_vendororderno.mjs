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

// Check exact match on VENDORORDERNO
const exact = await q(`SELECT COUNT(*) FROM PYROPS_INBOUND_DATA__INWARD WHERE VENDORORDERNO = '${PO}'`);
console.log(`Exact match (VENDORORDERNO = '${PO}') : ${exact.data.rows[0][0]} rows`);

// Broad search in case format differs
const broad = await q(`
  SELECT DISTINCT VENDORORDERNO, COUNT(*) AS ROW_COUNT
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE VENDORORDERNO ILIKE '%00034%'
  GROUP BY VENDORORDERNO
  LIMIT 10
`);

if (broad.data.rows.length > 0) {
  console.log('\nPartial matches in VENDORORDERNO:');
  for (const row of broad.data.rows) console.log(`  ${row[0]}  →  ${row[1]} rows`);
} else {
  console.log('No partial matches found for "00034" in VENDORORDERNO either.');
  // Show sample values
  const sample = await q(`
    SELECT DISTINCT VENDORORDERNO FROM PYROPS_INBOUND_DATA__INWARD
    WHERE VENDORORDERNO IS NOT NULL AND VENDORORDERNO != ''
    LIMIT 10
  `);
  console.log('\nSample VENDORORDERNO values in table:');
  for (const row of sample.data.rows) console.log(' ', row[0]);
}

// If exact match found, show full breakdown
if (Number(exact.data.rows[0][0]) > 0) {
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
    WHERE VENDORORDERNO = '${PO}'
    GROUP BY GRNNUMBER, VENDORNAME, ITEMNO, DESCRIPTION, STATUS
    ORDER BY GRN_DATE ASC
  `);

  const tot = await q(`
    SELECT
      COUNT(DISTINCT GRNNUMBER) AS UNIQUE_GRNS,
      SUM(TOTALQUANTITY)        AS GRAND_TOTAL,
      SUM(OKQUANTITY)           AS GRAND_OK,
      SUM(REJECTQUANTITY)       AS GRAND_REJECT
    FROM PYROPS_INBOUND_DATA__INWARD
    WHERE VENDORORDERNO = '${PO}'
  `);

  const dRows = detail.data.rows;
  const w = [16, 12, 22, 10, 30, 10, 8, 10, 10];
  const cols = ['GRN No.', 'GRN Date', 'Vendor', 'Item No.', 'Description', 'Total Qty', 'OK Qty', 'Reject Qty', 'Status'];
  console.log(`\n${'='.repeat(70)}`);
  console.log(`VENDORORDERNO : ${PO}`);
  console.log(`${'='.repeat(70)}`);
  console.log('\n' + cols.map((c, i) => c.padEnd(w[i])).join(' | '));
  console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
  for (const row of dRows) {
    console.log(row.map((v, i) => String(v ?? '').slice(0, w[i]).padEnd(w[i])).join(' | '));
  }
  const [grns, grandTotal, grandOk, grandReject] = tot.data.rows[0];
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  Total GRNs raised  : ${grns}`);
  console.log(`  Grand Total Qty    : ${grandTotal}`);
  console.log(`  Total OK Qty       : ${grandOk}`);
  console.log(`  Total Rejected Qty : ${grandReject}`);
  console.log(`${'='.repeat(70)}\n`);
}
