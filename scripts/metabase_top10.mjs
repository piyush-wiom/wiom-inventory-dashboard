import { readFileSync } from 'fs';

// Load env vars from C:\credentials\.env
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.error(`ERROR: Could not read env file at ${path}: ${e.message}`);
    process.exit(1);
  }
}

loadEnv('C:\\credentials\\.env');

const METABASE_URL = (process.env.METABASE_URL || '').replace(/\/$/, '');
const METABASE_API_KEY = process.env.METABASE_API_KEY || '';

if (!METABASE_URL || !METABASE_API_KEY) {
  console.error('ERROR: METABASE_URL or METABASE_API_KEY missing from C:\\credentials\\.env');
  process.exit(1);
}

const HEADERS = {
  'x-api-key': METABASE_API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Find the PROD_DB database ID
const dbResp = await fetch(`${METABASE_URL}/api/database`, { headers: HEADERS });
if (!dbResp.ok) {
  console.error(`ERROR: GET /api/database returned ${dbResp.status}: ${await dbResp.text()}`);
  process.exit(1);
}
const dbData = await dbResp.json();
const databases = dbData.data ?? dbData;

let dbId = null;
for (const db of databases) {
  const name = (db.name || '').toUpperCase();
  if (name.includes('PROD_DB') || name.includes('PROD') || name.includes('SNOWFLAKE')) {
    dbId = db.id;
    console.log(`Found database: ${db.name} (id=${dbId})`);
    break;
  }
}

if (!dbId) {
  console.log('Available databases:');
  for (const db of databases) {
    console.log(`  id=${db.id}  name=${db.name}`);
  }
  console.error('ERROR: Could not find PROD_DB. Check the database names above.');
  process.exit(1);
}

// Step 2a: Inspect columns with LIMIT 1
const inspectSQL = `SELECT * FROM PROD_DB.POSTGRES_RDS_INVENTORY_INVENTORY.T_DEVICE_AUDIT LIMIT 1`;
const inspectResp = await fetch(`${METABASE_URL}/api/dataset`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ database: dbId, type: 'native', native: { query: inspectSQL } }),
});
const inspectResult = await inspectResp.json();
if (inspectResult.error) {
  console.error(`Schema inspect error: ${inspectResult.error}`);
  process.exit(1);
}
const allCols = inspectResult.data.cols.map(c => c.name);
console.log('Available columns:', allCols.join(', '));

// No QTY column — this is a device audit log. Order by ADDED_TIME DESC (most recent).
const orderCol = allCols.find(c => /added_time|created_at|modified_time/i.test(c)) || 'ID';
console.log(`No QTY column found. Ordering by: ${orderCol} DESC (most recent entries)\n`);

// Step 2: Run native SQL — top 10 most recent audit entries
const SQL = `
SELECT *
FROM PROD_DB.POSTGRES_RDS_INVENTORY_INVENTORY.T_DEVICE_AUDIT
ORDER BY "${orderCol}" DESC
LIMIT 10
`.trim();

const queryResp = await fetch(`${METABASE_URL}/api/dataset`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({
    database: dbId,
    type: 'native',
    native: { query: SQL },
  }),
});
if (!queryResp.ok) {
  console.error(`ERROR: POST /api/dataset returned ${queryResp.status}: ${await queryResp.text()}`);
  process.exit(1);
}
const result = await queryResp.json();

if (result.error) {
  console.error(`Query error: ${result.error}`);
  process.exit(1);
}

const cols = result.data.cols.map(c => c.display_name);
const rows = result.data.rows;

if (!rows || rows.length === 0) {
  console.log('Query returned no rows.');
  process.exit(0);
}

// Step 3: Print as formatted table
console.log(`\nTop 10 rows from T_DEVICE_AUDIT (by QTY DESC):\n`);

const widths = cols.map((col, i) =>
  Math.max(col.length, ...rows.map(r => String(r[i] ?? '').length))
);

const header = cols.map((col, i) => col.padEnd(widths[i])).join(' | ');
console.log(header);
console.log('-'.repeat(header.length));
for (const row of rows) {
  console.log(row.map((val, i) => String(val ?? '').padEnd(widths[i])).join(' | '));
}
