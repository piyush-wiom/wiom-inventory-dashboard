import { readFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ExcelJS = require(resolve(__dirname, '../node_modules/exceljs'));

// Load env
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
const HEADERS = { 'x-api-key': process.env.METABASE_API_KEY, 'Content-Type': 'application/json' };

async function runQuery(sql) {
  const resp = await fetch(`${METABASE_URL}/api/dataset`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ database: 113, type: 'native', native: { query: sql } })
  });
  return resp.json();
}

console.log('Fetching March 2026 GRN data from Metabase (paginated)...');

// Paginate with OFFSET to bypass 2000-row Metabase cap
const BATCH = 2000;
let allRows = [], cols = [], offset = 0, batch = 0;

while (true) {
  process.stdout.write(`  Batch ${++batch}: rows ${offset}–${offset + BATCH - 1} ... `);
  const result = await runQuery(`
    SELECT *
    FROM PYROPS_INBOUND_DATA__INWARD
    WHERE GRNREGISTEREDDATE >= '2026-03-01'
      AND GRNREGISTEREDDATE <  '2026-04-01'
    ORDER BY GRNREGISTEREDDATE DESC
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

const rows = allRows;
console.log(`\nTotal fetched: ${rows.length} rows across ${cols.length} columns.`);

// --- Build Excel ---
const wb = new ExcelJS.Workbook();
wb.creator = 'Metabase Export';
wb.created = new Date();

// ── Sheet 1: Raw Data ──────────────────────────────────────────────────
const ws = wb.addWorksheet('March 2026 GRN Data');

// Header style
const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const headerFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
const headerAlign = { horizontal: 'center', vertical: 'middle', wrapText: true };
const bodyFont   = { name: 'Arial', size: 10 };
const borderThin = { style: 'thin', color: { argb: 'FFD9D9D9' } };
const cellBorder  = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

// Add header row
const headerRow = ws.addRow(cols);
headerRow.height = 30;
headerRow.eachCell(cell => {
  cell.fill      = headerFill;
  cell.font      = headerFont;
  cell.alignment = headerAlign;
  cell.border    = cellBorder;
});

// Auto-filter
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

// Freeze top row
ws.views = [{ state: 'frozen', ySplit: 1 }];

// Add data rows
const altFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F7FC' } };

for (let ri = 0; ri < rows.length; ri++) {
  const row = ws.addRow(rows[ri]);
  row.font = bodyFont;
  row.eachCell({ includeEmpty: true }, cell => {
    cell.border = cellBorder;
    if (ri % 2 === 1) cell.fill = altFill;
  });
}

// Auto-fit column widths (sample-based)
cols.forEach((col, ci) => {
  const maxLen = Math.min(
    40,
    Math.max(
      col.length + 2,
      ...rows.slice(0, 200).map(r => String(r[ci] ?? '').length)
    )
  );
  ws.getColumn(ci + 1).width = maxLen + 2;
});

// ── Sheet 2: Summary ──────────────────────────────────────────────────
const ss = wb.addWorksheet('Summary');

const sHeaderFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const sHeaderFont  = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const sTitleFont   = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1F4E79' } };
const sLabelFont   = { name: 'Arial', size: 10, bold: true };
const sValueFont   = { name: 'Arial', size: 10 };

ss.getColumn('A').width = 30;
ss.getColumn('B').width = 20;

ss.mergeCells('A1:B1');
const titleCell = ss.getCell('A1');
titleCell.value     = 'GRN Inward Summary — March 2026';
titleCell.font      = sTitleFont;
titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
ss.getRow(1).height = 35;

ss.addRow([]);

// Compute summaries in JS (summary sheet only — raw data sheet uses no formulas so no recalc needed)
const grnCol    = cols.findIndex(c => /grnnumber/i.test(c));
const totalQCol = cols.findIndex(c => /totalquantity/i.test(c));
const okQCol    = cols.findIndex(c => /okquantity/i.test(c));
const rejQCol   = cols.findIndex(c => /rejectquantity/i.test(c));
const holdQCol  = cols.findIndex(c => /holdquantity/i.test(c));
const vendorCol = cols.findIndex(c => /vendorname/i.test(c));
const statusCol = cols.findIndex(c => /^status$/i.test(c));

const uniqueGrns   = new Set(rows.map(r => r[grnCol])).size;
const totalQty     = rows.reduce((s, r) => s + (Number(r[totalQCol]) || 0), 0);
const okQty        = rows.reduce((s, r) => s + (Number(r[okQCol])    || 0), 0);
const rejectQty    = rows.reduce((s, r) => s + (Number(r[rejQCol])   || 0), 0);
const holdQty      = rows.reduce((s, r) => s + (Number(r[holdQCol])  || 0), 0);

const summaryStats = [
  ['Metric', 'Value'],
  ['Total Line Items', rows.length],
  ['Unique GRN Numbers', uniqueGrns],
  ['Total Quantity Received', totalQty],
  ['OK Quantity', okQty],
  ['Rejected Quantity', rejectQty],
  ['Hold Quantity', holdQty],
];

for (const [label, value] of summaryStats) {
  const r = ss.addRow([label, value]);
  if (label === 'Metric') {
    r.getCell(1).fill = sHeaderFill; r.getCell(1).font = sHeaderFont;
    r.getCell(2).fill = sHeaderFill; r.getCell(2).font = sHeaderFont;
  } else {
    r.getCell(1).font = sLabelFont;
    r.getCell(2).font = sValueFont;
    r.getCell(2).numFmt = '#,##0';
  }
  r.eachCell(c => { c.border = cellBorder; c.alignment = { vertical: 'middle' }; });
}

ss.addRow([]);

// Vendor-wise breakdown
const vendorMap = {};
for (const row of rows) {
  const v = row[vendorCol] || 'Unknown';
  if (!vendorMap[v]) vendorMap[v] = { lines: 0, total: 0, ok: 0, reject: 0 };
  vendorMap[v].lines++;
  vendorMap[v].total  += Number(row[totalQCol]) || 0;
  vendorMap[v].ok     += Number(row[okQCol])    || 0;
  vendorMap[v].reject += Number(row[rejQCol])   || 0;
}

const vHeaderRow = ss.addRow(['Vendor', 'Line Items', 'Total Qty', 'OK Qty', 'Reject Qty']);
vHeaderRow.eachCell(c => { c.fill = sHeaderFill; c.font = sHeaderFont; c.border = cellBorder; c.alignment = { horizontal: 'center' }; });
['A','B','C','D','E'].forEach((col, i) => ss.getColumn(col).width = [32, 14, 14, 14, 14][i]);

for (const [vendor, v] of Object.entries(vendorMap).sort((a, b) => b[1].total - a[1].total)) {
  const r = ss.addRow([vendor, v.lines, v.total, v.ok, v.reject]);
  r.font = sValueFont;
  r.eachCell(c => { c.border = cellBorder; c.numFmt = '#,##0'; });
  r.getCell(1).numFmt = 'General';
}

// Save file
const outDir  = 'C:/Claude Projects/Inventory Dashboard/exports';
const outFile = `${outDir}/GRN_INWARD_March2026.xlsx`;
mkdirSync(outDir, { recursive: true });
await wb.xlsx.writeFile(outFile);
console.log(`\nExcel file saved: ${outFile}`);
console.log(`Sheets: "March 2026 GRN Data" (${rows.length} rows, ${cols.length} cols) + "Summary"`);
