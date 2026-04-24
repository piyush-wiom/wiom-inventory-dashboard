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
  return await resp.json();
}

// Step 1: Discover table — try common Snowflake schema patterns
const schemas = [
  'PYROPS_INBOUND_DATA__INWARD',
  'PROD_DB.PYROPS_INBOUND_DATA.INWARD',
  'PROD_DB.PUBLIC.PYROPS_INBOUND_DATA__INWARD',
];

let tableName = null;
let cols = [];

for (const t of schemas) {
  const r = await runQuery(`SELECT * FROM ${t} LIMIT 1`);
  if (!r.error) {
    tableName = t;
    cols = r.data.cols.map(c => c.name);
    break;
  } else {
    console.log(`Tried ${t}: ${r.error.split('\n')[0]}`);
  }
}

if (!tableName) {
  // Search across all schemas in Snowflake
  console.log('\nSearching for table across schemas...');
  const r = await runQuery(`
    SELECT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME ILIKE '%INWARD%' OR TABLE_NAME ILIKE '%INBOUND%'
    LIMIT 20
  `);
  if (!r.error && r.data.rows.length > 0) {
    console.log('Found tables:');
    for (const row of r.data.rows) console.log(` ${row[0]}.${row[1]}`);
  } else {
    console.log('No matching tables found:', r.error || 'empty result');
  }
  process.exit(1);
}

console.log(`\nTable: ${tableName}`);
console.log(`Columns (${cols.length}): ${cols.join(', ')}\n`);

// Step 2: Find date column for filtering
const dateCol = cols.find(c => /grn_date|created|date|time|received/i.test(c) && !/deleted|synced/i.test(c));
const grnCol  = cols.find(c => /grn/i.test(c));

console.log(`Date column detected : ${dateCol || 'none'}`);
console.log(`GRN  column detected : ${grnCol  || 'none'}\n`);

if (!dateCol) {
  console.log('All column names for manual review:', cols.join(', '));
  process.exit(1);
}

// Step 3: Fetch GRN data from 2026-03-01 to today (2026-04-20)
const SQL = `
SELECT *
FROM ${tableName}
WHERE "${dateCol}" >= '2026-03-01'
  AND "${dateCol}" <  '2026-04-21'
ORDER BY "${dateCol}" DESC
`;

console.log(`Running query...\n${SQL.trim()}\n`);
const result = await runQuery(SQL);

if (result.error) {
  console.error('Query error:', result.error);
  process.exit(1);
}

const rows = result.data.rows;
const headers = result.data.cols.map(c => c.display_name);

console.log(`Total rows returned: ${rows.length}\n`);

if (rows.length === 0) {
  console.log('No GRN data found for March–April 2026.');
  process.exit(0);
}

// Print formatted table
const widths = headers.map((h, i) =>
  Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length))
);
const header = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
console.log(header);
console.log('-'.repeat(header.length));
for (const row of rows) {
  console.log(row.map((v, i) => String(v ?? '').padEnd(widths[i])).join(' | '));
}
