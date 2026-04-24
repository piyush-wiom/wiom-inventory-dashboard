import { readFileSync, mkdirSync, writeFileSync } from 'fs';

function loadEnv(path) {
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (k && v && !process.env[k]) process.env[k] = v;
  }
}
loadEnv('C:\\credentials\\.env');

const URL = process.env.METABASE_URL.replace(/\/$/, '');
const H = { 'x-api-key': process.env.METABASE_API_KEY, 'Content-Type': 'application/json' };

async function runQuery(sql) {
  const r = await fetch(`${URL}/api/dataset`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } })
  });
  return r.json();
}

// Get total count first
const cnt = await runQuery(`
  SELECT COUNT(*) AS TOTAL
  FROM PYROPS_SALE_DETAIL
  WHERE SHIPPINGPINCODE LIKE '11%'
    AND LEFT(SHIP_DATE, 7) = '2025-10'
    AND UPPER(DESCRIPTION) LIKE '%ONT%'
`);
const total = cnt.data.rows[0][0];
console.log(`Total rows to fetch: ${total}`);

// Paginate in batches of 2000
const BATCH = 2000;
let allRows = [], cols = [], offset = 0, batch = 0;

while (true) {
  process.stdout.write(`  Batch ${++batch}: rows ${offset}–${offset + BATCH - 1} ... `);
  const result = await runQuery(`
    SELECT *
    FROM PYROPS_SALE_DETAIL
    WHERE SHIPPINGPINCODE LIKE '11%'
      AND LEFT(SHIP_DATE, 7) = '2025-10'
      AND UPPER(DESCRIPTION) LIKE '%ONT%'
    ORDER BY SHIP_DATE DESC
    LIMIT ${BATCH} OFFSET ${offset}
  `);
  if (result.error) { console.error('\nQuery error:', result.error); process.exit(1); }
  const batchRows = result.data.rows;
  if (cols.length === 0) cols = result.data.cols.map(c => c.display_name);
  console.log(`got ${batchRows.length} rows`);
  allRows = allRows.concat(batchRows);
  if (batchRows.length < BATCH) break;
  offset += BATCH;
}

console.log(`\nTotal fetched: ${allRows.length} / ${total} rows`);

// Build CSV
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const csvLines = [
  cols.map(escapeCSV).join(','),
  ...allRows.map(row => row.map(escapeCSV).join(','))
];
const csvContent = csvLines.join('\r\n');

const outDir  = 'C:/Claude Projects/Inventory Dashboard/exports';
const outFile = `${outDir}/Delhi_ONT_Oct2025_Raw.csv`;
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, '\uFEFF' + csvContent, 'utf8'); // BOM for Excel UTF-8 compatibility

console.log(`\nCSV saved: ${outFile}`);
console.log(`Rows: ${allRows.length} | Columns: ${cols.length}`);
