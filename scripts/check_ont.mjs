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
  SELECT DISTINCT CATEGORY, DESCRIPTION, SKU
  FROM PYROPS_SALE_DETAIL
  WHERE SHIPPINGPINCODE LIKE '11%'
    AND SHIP_DATE >= '2025-10-01' AND SHIP_DATE < '2026-01-01'
    AND (UPPER(DESCRIPTION) LIKE '%ONT%' OR UPPER(CATEGORY) LIKE '%ONT%' OR UPPER(SKU) LIKE '%ONT%')
  LIMIT 20
`);
if (r.error) { console.log('Error:', r.error); process.exit(1); }
console.log('Sample ONT records (CATEGORY | DESCRIPTION | SKU):');
for (const row of r.data.rows) console.log(' ', row[0], '|', row[1], '|', row[2]);
