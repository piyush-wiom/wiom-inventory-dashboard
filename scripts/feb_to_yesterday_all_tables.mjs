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

const METABASE_URL = process.env.METABASE_URL.replace(/\/$/, '');
const H = { 'x-api-key': process.env.METABASE_API_KEY, 'Content-Type': 'application/json' };

async function query(sql) {
  const r = await fetch(`${METABASE_URL}/api/dataset`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } })
  });
  return r.json();
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

// Date range: Feb 1 2026 to yesterday (Apr 23 2026)
const FROM_DATE = '2026-02-01';
const TO_DATE   = '2026-04-23'; // yesterday (today is Apr 24)

const DATE_CANDIDATES = [
  'GRNREGISTEREDDATE', 'SHIP_DATE', 'RECEIPTDATE', 'TRANSFERDATE',
  'ORDERDATE', 'CREATEDDATE', 'CREATED_DATE', 'DATE', 'ADDED_TIME', 'DATA_MONTH'
];

const TABLES = [
  { table: 'PYROPS_INBOUND_DATA__INWARD',           file: 'Feb_Apr23_Inbound_Vendor_GRN.csv',        label: 'Inbound — Vendor GRN' },
  { table: 'PYROPS_INBOUND_DATA__SALES_RETURN',     file: 'Feb_Apr23_Inbound_Sales_Return.csv',       label: 'Inbound — Sales Return' },
  { table: 'PYROPS_INBOUND_DATA__TRANSFER_RECEIPT', file: 'Feb_Apr23_Inbound_STN_Receipt.csv',        label: 'Inbound — STN Receipt' },
  { table: 'PYROPS_SALE_DETAIL',                    file: 'Feb_Apr23_Outbound_Partner_Dispatch.csv',  label: 'Outbound — Partner Dispatch' },
  { table: 'PYROPS_SALE_DETAIL__TRANSFER',          file: 'Feb_Apr23_Outbound_STN_Dispatch.csv',      label: 'Outbound — STN Dispatch' },
  { table: 'PYROPS_SALE_DETAIL__PURCHASE_RETURN',   file: 'Feb_Apr23_Outbound_RTV_Vendor.csv',        label: 'Outbound — RTV to Vendor' },
];

const OUT_DIR = 'C:/Claude Projects/Inventory Dashboard/exports/Feb_to_Apr23_2026';
mkdirSync(OUT_DIR, { recursive: true });

const BATCH = 2000;
const summary = [];

console.log(`\nDate range: ${FROM_DATE} → ${TO_DATE}\n`);

for (const { table, file, label } of TABLES) {
  console.log(`${'='.repeat(62)}`);
  console.log(`📋 ${label}`);
  console.log(`   Table: ${table}`);

  // Step 1: Detect columns
  const inspect = await query(`SELECT * FROM ${table} LIMIT 1`);
  if (inspect.error) {
    console.log(`   ⚠️  Table error: ${inspect.error.split('\n')[0]}`);
    summary.push({ label, file, rows: 0, cols: 0, status: 'ERROR' });
    continue;
  }
  const cols = inspect.data.cols.map(c => c.name);

  // Step 2: Auto-detect date column
  const dateCol = DATE_CANDIDATES.find(d => cols.includes(d));
  if (!dateCol) {
    console.log(`   ⚠️  No date column found.`);
    summary.push({ label, file, rows: 0, cols: cols.length, status: 'SKIPPED' });
    continue;
  }
  console.log(`   Date column : ${dateCol} | Columns: ${cols.length}`);

  // Step 3: Count rows in range
  const cnt = await query(`
    SELECT COUNT(*) FROM ${table}
    WHERE CAST(${dateCol} AS DATE) >= '${FROM_DATE}'
      AND CAST(${dateCol} AS DATE) <= '${TO_DATE}'
  `);
  const total = cnt.data?.rows?.[0]?.[0] ?? 0;
  console.log(`   Rows in range: ${total}`);

  if (total === 0) {
    const csvContent = cols.map(escapeCSV).join(',') + '\r\n';
    writeFileSync(`${OUT_DIR}/${file}`, '\uFEFF' + csvContent, 'utf8');
    console.log(`   ✅ No data — header-only CSV written`);
    summary.push({ label, file, rows: 0, cols: cols.length, status: 'EMPTY' });
    continue;
  }

  // Step 4: Paginate and fetch all rows
  let allRows = [], offset = 0, batch = 0;
  while (true) {
    process.stdout.write(`   Batch ${++batch} (offset ${offset}) ... `);
    const res = await query(`
      SELECT * FROM ${table}
      WHERE CAST(${dateCol} AS DATE) >= '${FROM_DATE}'
        AND CAST(${dateCol} AS DATE) <= '${TO_DATE}'
      ORDER BY ${dateCol} DESC
      LIMIT ${BATCH} OFFSET ${offset}
    `);
    if (res.error) { console.log(`\n   ❌ ${res.error.split('\n')[0]}`); break; }
    const batchRows = res.data.rows;
    console.log(`got ${batchRows.length}`);
    allRows = allRows.concat(batchRows);
    if (batchRows.length < BATCH) break;
    offset += BATCH;
  }

  // Step 5: Write CSV
  const lines = [
    cols.map(escapeCSV).join(','),
    ...allRows.map(row => row.map(escapeCSV).join(','))
  ];
  writeFileSync(`${OUT_DIR}/${file}`, '\uFEFF' + lines.join('\r\n'), 'utf8');
  const status = allRows.length === Number(total) ? '✅ COMPLETE' : '⚠️ PARTIAL';
  console.log(`   ${status} — ${file} (${allRows.length}/${total} rows, ${cols.length} cols)`);
  summary.push({ label, file, rows: allRows.length, cols: cols.length, status });
}

// Final summary
console.log(`\n${'='.repeat(62)}`);
console.log(`EXPORT SUMMARY  |  ${FROM_DATE} → ${TO_DATE}\n`);
const w = [35, 10, 8, 12];
console.log(['Table', 'Rows', 'Cols', 'Status'].map((h, i) => h.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
for (const s of summary) {
  console.log([s.label, s.rows, s.cols, s.status].map((v, i) => String(v).padEnd(w[i])).join(' | '));
}
const totalRows = summary.reduce((a, s) => a + Number(s.rows), 0);
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
console.log(['TOTAL', totalRows, '', ''].map((v, i) => String(v).padEnd(w[i])).join(' | '));
console.log(`\nAll files saved to: ${OUT_DIR}`);
