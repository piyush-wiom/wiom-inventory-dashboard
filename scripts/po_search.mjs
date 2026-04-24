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

// Search across PONO and PONO2 with partial match
const r = await q(`
  SELECT DISTINCT PONO, PONO2, VENDORNAME, COUNT(*) AS ROW_COUNT
  FROM PYROPS_INBOUND_DATA__INWARD
  WHERE PONO  ILIKE '%00034%'
     OR PONO2 ILIKE '%00034%'
  GROUP BY PONO, PONO2, VENDORNAME
  LIMIT 20
`);

if (r.error) { console.error('Error:', r.error); process.exit(1); }
console.log(`\nMatching PO records (PONO/PONO2 containing "00034"):\n`);
if (r.data.rows.length === 0) {
  console.log('No matches found for "00034" in PONO or PONO2.');

  // Show sample PONO values to understand the format
  const sample = await q(`
    SELECT DISTINCT PONO FROM PYROPS_INBOUND_DATA__INWARD
    WHERE PONO IS NOT NULL AND PONO != ''
    LIMIT 10
  `);
  console.log('\nSample PONO values in the table:');
  for (const row of sample.data.rows) console.log(' ', row[0]);
} else {
  for (const row of r.data.rows) console.log(' PONO:', row[0], '| PONO2:', row[1], '| Vendor:', row[2], '| Rows:', row[3]);
}
