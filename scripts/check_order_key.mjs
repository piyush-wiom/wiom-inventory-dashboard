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

// Check total rows vs distinct ORDERNO vs ORDERID vs SUBORDERID for Oct ONT Delhi
const r = await q(`
  SELECT
    COUNT(*)                  AS TOTAL_ROWS,
    COUNT(DISTINCT ORDERNO)   AS UNIQUE_ORDERNO,
    COUNT(DISTINCT ORDERID)   AS UNIQUE_ORDERID,
    COUNT(DISTINCT SUBORDERID) AS UNIQUE_SUBORDERID
  FROM PYROPS_SALE_DETAIL
  WHERE SHIPPINGPINCODE LIKE '11%'
    AND LEFT(SHIP_DATE, 7) = '2025-10'
    AND UPPER(DESCRIPTION) LIKE '%ONT%'
`);
if (r.error) { console.error('Error:', r.error); process.exit(1); }
const [totalRows, uniqueOrderNo, uniqueOrderId, uniqueSubOrderId] = r.data.rows[0];
console.log(`Total rows        : ${totalRows}`);
console.log(`Distinct ORDERNO  : ${uniqueOrderNo}`);
console.log(`Distinct ORDERID  : ${uniqueOrderId}`);
console.log(`Distinct SUBORDERID: ${uniqueSubOrderId}`);

// Also show a sample duplicate to confirm
const dup = await q(`
  SELECT ORDERNO, ORDERID, SUBORDERID, SHIPPINGPINCODE, DESCRIPTION, QUANTITY
  FROM PYROPS_SALE_DETAIL
  WHERE ORDERNO IN (
    SELECT ORDERNO FROM PYROPS_SALE_DETAIL
    WHERE SHIPPINGPINCODE LIKE '11%'
      AND LEFT(SHIP_DATE, 7) = '2025-10'
      AND UPPER(DESCRIPTION) LIKE '%ONT%'
    GROUP BY ORDERNO HAVING COUNT(*) > 1
    LIMIT 1
  )
  LIMIT 5
`);
console.log('\nSample duplicate ORDERNO rows:');
const cols = dup.data.cols.map(c => c.name);
console.log(cols.join(' | '));
for (const row of dup.data.rows) console.log(row.join(' | '));
