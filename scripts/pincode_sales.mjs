import { readFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ExcelJS = require(resolve(__dirname, '../node_modules/exceljs'));

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

async function q(sql) {
  const r = await fetch(`${URL}/api/dataset`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } })
  });
  return r.json();
}

console.log('Querying Delhi pincode-wise sales Oct–Dec 2025...');

const result = await q(`
  SELECT
    SHIPPINGPINCODE                                                                       AS "Pincode",
    COUNT(DISTINCT CASE WHEN LEFT(SHIP_DATE, 7) = '2025-10' THEN ORDERNO END)            AS "Oct'25",
    COUNT(DISTINCT CASE WHEN LEFT(SHIP_DATE, 7) = '2025-11' THEN ORDERNO END)            AS "Nov'25",
    COUNT(DISTINCT CASE WHEN LEFT(SHIP_DATE, 7) = '2025-12' THEN ORDERNO END)            AS "Dec'25",
    COUNT(DISTINCT ORDERNO)                                                               AS "Total"
  FROM PYROPS_SALE_DETAIL
  WHERE SHIPPINGPINCODE LIKE '11%'
    AND SHIP_DATE >= '2025-10-01'
    AND SHIP_DATE  < '2026-01-01'
    AND UPPER(DESCRIPTION) LIKE '%ONT%'
  GROUP BY SHIPPINGPINCODE
  HAVING COUNT(DISTINCT ORDERNO) > 0
  ORDER BY "Total" DESC
`);

if (result.error) { console.error('Query error:', result.error); process.exit(1); }

const cols = result.data.cols.map(c => c.display_name);
const rows = result.data.rows;
console.log(`Found ${rows.length} Delhi pincodes.\n`);

// Print preview in terminal
const w = cols.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] ?? 0).length)));
console.log(cols.map((h, i) => h.padEnd(w[i])).join(' | '));
console.log('-'.repeat(w.reduce((a, b) => a + b + 3, 0)));
for (const row of rows) console.log(row.map((v, i) => String(v ?? 0).padEnd(w[i])).join(' | '));

// ── Build Excel ──────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'Metabase Export';
wb.created = new Date();

const ws = wb.addWorksheet('Pincode Sales Oct-Dec 2025');

// Styles
const hFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const hFont  = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
const hAlign = { horizontal: 'center', vertical: 'middle' };
const body   = { name: 'Arial', size: 10 };
const numFmt = '#,##0';
const border = { top:{style:'thin',color:{argb:'FFD9D9D9'}}, left:{style:'thin',color:{argb:'FFD9D9D9'}},
                 bottom:{style:'thin',color:{argb:'FFD9D9D9'}}, right:{style:'thin',color:{argb:'FFD9D9D9'}} };
const altFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F7FC' } };
const totalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

// Header
const hRow = ws.addRow(cols);
hRow.height = 25;
hRow.eachCell(c => { c.fill = hFill; c.font = hFont; c.alignment = hAlign; c.border = border; });

// Freeze & filter
ws.views = [{ state: 'frozen', ySplit: 1 }];
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

// Data rows
for (let ri = 0; ri < rows.length; ri++) {
  const row = ws.addRow(rows[ri]);
  row.font = body;
  row.eachCell({ includeEmpty: true }, (cell, ci) => {
    cell.border = border;
    if (ri % 2 === 1) cell.fill = altFill;
    if (ci > 1) cell.numFmt = numFmt; // numeric cols
    if (ci > 1) cell.alignment = { horizontal: 'center' };
  });
}

// Totals row
const totalRow = ws.addRow([
  'TOTAL',
  ...cols.slice(1).map((_, ci) => rows.reduce((s, r) => s + (Number(r[ci + 1]) || 0), 0))
]);
totalRow.height = 20;
totalRow.font = { name: 'Arial', size: 10, bold: true };
totalRow.eachCell({ includeEmpty: true }, (cell, ci) => {
  cell.fill = totalFill;
  cell.border = border;
  if (ci > 1) { cell.numFmt = numFmt; cell.alignment = { horizontal: 'center' }; }
});

// Column widths
ws.getColumn(1).width = 14; // Pincode
for (let c = 2; c <= cols.length; c++) ws.getColumn(c).width = 12;

// Save
const outDir  = 'C:/Claude Projects/Inventory Dashboard/exports';
const outFile = `${outDir}/Delhi_Pincode_ONT_UniqueOrders_Oct-Dec2025.xlsx`;
mkdirSync(outDir, { recursive: true });
await wb.xlsx.writeFile(outFile);
console.log(`\nExcel saved: ${outFile}`);
