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

const r = await q(`
  SELECT
    GRNNUMBER,
    MIN(GRNREGISTEREDDATE)::DATE  AS GRN_DATE,
    SUM(TOTALQUANTITY)            AS TOTAL_QTY,
    SUM(OKQUANTITY)               AS OK_QTY,
    SUM(REJECTQUANTITY)           AS REJECT_QTY,
    STATUS,
    MAX(MODIFYBY) AS LAST_MODIFIED_BY
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE VENDORORDERNO = '${PO}'
  GROUP BY GRNNUMBER, STATUS
  ORDER BY GRN_DATE ASC
`);

if (r.error) { console.error('Error:', r.error); process.exit(1); }

const rows = r.data.rows;
const w = [18, 12, 10, 8, 10, 12, 32];
const cols = ['GRN Number', 'GRN Date', 'Total Qty', 'OK Qty', 'Reject', 'Status', 'Modified By'];

console.log(`\nPO: ${PO} — Live GRN Status Check\n`);
console.log(cols.map((c, i) => c.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));

let closed = 0, released = 0;
for (const row of rows) {
  const status = String(row[5] ?? '');
  if (status === 'Closed') closed++;
  else released++;
  const marker = status === 'Released' ? ' ⬅ STILL RELEASED' : '';
  console.log(row.map((v, i) => String(v ?? '').slice(0, w[i]).padEnd(w[i])).join(' | ') + marker);
}

console.log(`\n  Total GRNs   : ${rows.length}`);
console.log(`  Closed       : ${closed}`);
console.log(`  Released     : ${released} ${released > 0 ? '⚠️  (not yet updated in Snowflake)' : '✅'}`);
