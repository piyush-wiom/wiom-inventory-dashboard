import { readFileSync } from 'fs';

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

// Inspect PYROPS_SALE_DETAIL columns
const r = await q('SELECT * FROM PYROPS_SALE_DETAIL LIMIT 1');
if (r.error) { console.log('Error:', r.error); process.exit(1); }
const cols = r.data.cols.map(c => c.name);
console.log(`Total columns: ${cols.length}`);
console.log('All columns:\n' + cols.join('\n'));

// Also show sample row to understand pincode/date fields
console.log('\nSample row (key fields):');
const row = r.data.rows[0];
cols.forEach((c, i) => {
  if (/pin|date|time|dispatch|city|address|month|area/i.test(c)) {
    console.log(`  ${c}: ${row[i]}`);
  }
});
