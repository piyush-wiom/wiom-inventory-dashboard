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

const r = await q(`
  SELECT
    LEFT(SHIP_DATE, 7)          AS "Month",
    COUNT(DISTINCT ORDERNO)     AS "Unique Orders",
    COUNT(*)                    AS "Total Devices"
  FROM PYROPS_SALE_DETAIL
  WHERE UPPER(DESCRIPTION) LIKE '%ONT%'
    AND SHIP_DATE >= '2025-12-01'
    AND SHIP_DATE  < '2026-04-21'
  GROUP BY LEFT(SHIP_DATE, 7)
  ORDER BY 1 ASC
`);

if (r.error) { console.error('Error:', r.error); process.exit(1); }

const rows = r.data.rows;

// Month label map
const labels = { '2025-12': "Dec'25", '2026-01': "Jan'26", '2026-02': "Feb'26", '2026-03': "Mar'26", '2026-04': "Apr'26" };

console.log('\n=== ONT Orders Summary — Dec 2025 to Apr 2026 ===\n');
const cols = ['Month', 'Unique Orders', 'Total Devices'];
const w = [10, 15, 14];
console.log(cols.map((c, i) => c.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));

let totalOrders = 0, totalDevices = 0;
for (const row of rows) {
  const month  = labels[row[0]] || row[0];
  const orders = row[1];
  const devices= row[2];
  totalOrders  += Number(orders);
  totalDevices += Number(devices);
  console.log(
    month.padEnd(w[0]),  ' | ',
    String(orders).padEnd(w[1] - 2),  ' | ',
    String(devices).padEnd(w[2])
  );
}
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
console.log('TOTAL'.padEnd(w[0]), ' | ', String(totalOrders).padEnd(w[1] - 2), ' | ', String(totalDevices).padEnd(w[2]));
