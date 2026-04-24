import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat
} = require(resolve(__dirname, '../node_modules/docx'));

// ── Colour palette (matches dashboard) ──────────────────────────
const C = {
  navy:       '1B2A3B',
  navyLight:  '243447',
  white:      'FFFFFF',
  green:      '1B6B3A',
  greenBg:    'E8F5E9',
  red:        'B71C1C',
  redBg:      'FFEBEE',
  blue:       '1565C0',
  blueBg:     'E3F2FD',
  amber:      'E65100',
  amberBg:    'FFF3E0',
  grey:       'F5F5F5',
  greyDark:   '546E7A',
  black:      '1A1A1A',
  border:     'D0D7DE',
};

// ── Helpers ──────────────────────────────────────────────────────
const b = (style = BorderStyle.SINGLE, sz = 4, color = C.border) =>
  ({ style, size: sz, color });
const borders = (color = C.border) => ({
  top: b(BorderStyle.SINGLE, 4, color), bottom: b(BorderStyle.SINGLE, 4, color),
  left: b(BorderStyle.SINGLE, 4, color), right: b(BorderStyle.SINGLE, 4, color),
});
const noBorder = () => ({
  top: b(BorderStyle.NONE, 0, 'FFFFFF'), bottom: b(BorderStyle.NONE, 0, 'FFFFFF'),
  left: b(BorderStyle.NONE, 0, 'FFFFFF'), right: b(BorderStyle.NONE, 0, 'FFFFFF'),
});
const cellMargins = { top: 80, bottom: 80, left: 140, right: 140 };

function cell(text, opts = {}) {
  const {
    fill, bold = false, color = C.black, align = AlignmentType.LEFT,
    fontSize = 20, width, colSpan, italic = false, vAlign
  } = opts;
  return new TableCell({
    ...(colSpan ? { columnSpan: colSpan } : {}),
    ...(vAlign ? { verticalAlign: vAlign } : {}),
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    borders: borders(fill || C.border),
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: String(text), bold, color, size: fontSize, font: 'Arial', italics: italic })]
    })]
  });
}

function hdr(text, fill = C.navy, color = C.white, align = AlignmentType.CENTER, opts = {}) {
  return cell(text, { fill, bold: true, color, align, fontSize: 20, ...opts });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () =>
    new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })
  );
}

function sectionHeading(text, color = C.navy) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 28, color, font: 'Arial' })]
  });
}

function bullet(text, sub = false) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: sub ? 1 : 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: C.black })]
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: C.black, ...opts })]
  });
}

// ── Page dimensions ──────────────────────────────────────────────
const PAGE_W = 12240, PAGE_H = 15840;
const MARGIN = 1080; // 0.75 inch
const CONTENT_W = PAGE_W - MARGIN * 2; // 10080

// ── Column widths ────────────────────────────────────────────────
const kpiTableCols = [4000, 3200, 2880]; // Metric | Value | Insight
const stockCols    = [2800, 1820, 1820, 1820, 1820]; // Particulars | ONT | Router | Total
const flowCols     = [2600, 1370, 1370, 1370, 1370, 1000]; // header cols

// ── KPI Category Helper ──────────────────────────────────────────
function kpiTable(rows, colWidths, headerFill = C.navy) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((r, ri) => new TableRow({
      children: r.map((txt, ci) => {
        const isHeader = ri === 0;
        const isFirst  = ci === 0;
        const isSubtotal = typeof txt === 'string' && txt.startsWith('__');
        const cleanTxt = isSubtotal ? txt.slice(2) : txt;
        const fillColor = isHeader ? headerFill :
                          isSubtotal ? C.grey : undefined;
        return cell(cleanTxt, {
          fill: fillColor,
          bold: isHeader || isFirst || isSubtotal,
          color: isHeader ? C.white : isSubtotal ? C.navy : C.black,
          align: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          fontSize: 19,
          width: colWidths[ci],
        });
      })
    }))
  });
}

// ── Document ─────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 480, hanging: 240 }, spacing: { before: 40, after: 40 } },
                     run: { size: 20, font: 'Arial' } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 240 }, spacing: { before: 20, after: 20 } },
                     run: { size: 19, font: 'Arial' } } },
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
  },
  sections: [{
    properties: {
      page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
    },

    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy, space: 4 } },
          children: [new TextRun({ text: 'CONFIDENTIAL — Internal Use Only', size: 16, color: C.greyDark, font: 'Arial', italics: true })]
        })]
      })
    },

    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
          children: [
            new TextRun({ text: 'Wiom Inventory KPI Tracking — Project Brief  |  Page ', size: 16, color: C.greyDark, font: 'Arial' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.greyDark, font: 'Arial' }),
          ]
        })]
      })
    },

    children: [

      // ══ COVER BLOCK ══════════════════════════════════════════════
      ...spacer(2),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [CONTENT_W],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: noBorder(),
            shading: { fill: C.navy, type: ShadingType.CLEAR },
            margins: { top: 400, bottom: 400, left: 500, right: 500 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 120 },
                children: [new TextRun({ text: 'INVENTORY KPI TRACKING SYSTEM', bold: true, size: 48, color: C.white, font: 'Arial' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
                children: [new TextRun({ text: 'Project Brief & Implementation Plan', size: 28, color: 'A8C4D8', font: 'Arial', italics: true })] }),
              new Paragraph({ alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Saket Warehouse  |  Mumbai Warehouse  |  ONT & Router', size: 22, color: '7FB3CC', font: 'Arial' })] }),
            ]
          })
        ]})]
      }),
      ...spacer(1),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [CONTENT_W / 3, CONTENT_W / 3, CONTENT_W / 3],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorder(), shading: { fill: C.blueBg, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'Prepared by', size: 18, color: C.greyDark, font: 'Arial' })]}),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'Inventory Analytics Team', bold: true, size: 20, color: C.navy, font: 'Arial' })]})] }),
          new TableCell({ borders: noBorder(), shading: { fill: C.greenBg, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'Date', size: 18, color: C.greyDark, font: 'Arial' })]}),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'April 2026', bold: true, size: 20, color: C.green, font: 'Arial' })]})] }),
          new TableCell({ borders: noBorder(), shading: { fill: C.amberBg, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'Version', size: 18, color: C.greyDark, font: 'Arial' })]}),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: 'v1.0 — Draft', bold: true, size: 20, color: C.amber, font: 'Arial' })]})] }),
        ]})]
      }),
      ...spacer(2),

      // ══ 1. EXECUTIVE SUMMARY ════════════════════════════════════
      sectionHeading('1.  Executive Summary', C.navy),
      bodyText('This document outlines the design and implementation plan for a real-time Inventory KPI Tracking System for Wiom\'s Mumbai and Saket warehouses. The system will provide end-to-end visibility of device stock — specifically ONT and Router — by consolidating inbound and outbound transaction data into a unified, trackable dashboard.'),
      bodyText('The baseline for the system is set at January 2026, with all future stock movements tracked daily from that point forward.'),
      ...spacer(1),

      // ══ 2. OBJECTIVE ════════════════════════════════════════════
      sectionHeading('2.  Objective', C.navy),
      bullet('Provide real-time stock visibility for ONT and Router devices across Saket and Mumbai warehouses'),
      bullet('Enable daily tracking of stock inflows and outflows with clear categorisation'),
      bullet('Build KPIs that help leadership make data-driven procurement and dispatch decisions'),
      bullet('Identify bottlenecks such as GRN pending closure, rising return rates, and vendor quality issues'),
      bullet('Establish a reproducible, automated data pipeline using Metabase + Snowflake'),
      ...spacer(1),

      // ══ 3. DATA INFRASTRUCTURE ══════════════════════════════════
      sectionHeading('3.  Data Sources & Infrastructure', C.navy),
      bodyText('All data is sourced from the Pyrops WMS system, synced to Snowflake via Fivetran, and accessed through Metabase (https://metabase.wiom.in). Six core tables drive the entire KPI framework:'),
      ...spacer(1),
      kpiTable([
        ['Table Name', 'Transaction Type', 'Direction'],
        ['PYROPS_INBOUND_DATA__INWARD',           'Fresh GRN received from Vendor',         'INBOUND (+)'],
        ['PYROPS_INBOUND_DATA__SALES_RETURN',     'Devices returned from Partner / Customer','INBOUND (+)'],
        ['PYROPS_INBOUND_DATA__TRANSFER_RECEIPT', 'STN (inter-warehouse) receipt',           'INBOUND (+)'],
        ['PYROPS_SALE_DETAIL',                    'Dispatch to Partner',                     'OUTBOUND (-)'],
        ['PYROPS_SALE_DETAIL__TRANSFER',          'STN (inter-warehouse) dispatch',          'OUTBOUND (-)'],
        ['PYROPS_SALE_DETAIL__PURCHASE_RETURN',   'Return to Vendor (RTV)',                  'OUTBOUND (-)'],
      ], [3800, 3600, 2680]),
      ...spacer(1),
      bodyText('Device filter applied: ONT (DESCRIPTION ILIKE \'%ONT%\') and Router (DESCRIPTION ILIKE \'%ROUTER%\' or TYPE = \'ROUTER\').'),
      ...spacer(1),

      // ══ 4. MONTHLY STOCK LEDGER FORMAT ══════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('4.  Monthly Stock Ledger — Report Format', C.navy),
      bodyText('The Monthly Stock Ledger summarises all movements for a given month across device types. Opening Stock of one month equals Closing Stock of the previous month. January 2026 opening stock is treated as the baseline (0).'),
      ...spacer(1),

      // Stock ledger sample table
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: stockCols,
        rows: [
          // Month header spanning all cols
          new TableRow({ children: [new TableCell({
            columnSpan: 4,
            borders: borders(C.navy),
            shading: { fill: C.navy, type: ShadingType.CLEAR },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: 'January 2026  (Baseline Reference)', bold: true, size: 22, color: C.white, font: 'Arial' })] })]
          })]}),
          // Column headers
          new TableRow({ children: [
            hdr('PARTICULARS',    C.navyLight, C.white, AlignmentType.LEFT,   { width: stockCols[0] }),
            hdr('ONT',            C.navyLight, C.white, AlignmentType.CENTER, { width: stockCols[1] }),
            hdr('ROUTER',         C.navyLight, C.white, AlignmentType.CENTER, { width: stockCols[2] }),
            hdr('TOTAL',          C.navyLight, C.white, AlignmentType.CENTER, { width: stockCols[3] }),
          ]}),
          // Opening
          new TableRow({ children: [
            cell('Opening Stock',     { bold: true, fill: C.navy, color: C.white, width: stockCols[0] }),
            cell('0',                 { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[1] }),
            cell('0',                 { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[2] }),
            cell('0',                 { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[3] }),
          ]}),
          // Inward rows
          ...([
            ['Fresh Inward (Vendor GRN)',        '5,500', '0',     '5,500'],
            ['Return (Refurbish) Inward',         '3,710', '660',   '4,370'],
            ['Received in STN',                   '130',   '0',     '130'],
            ['Stock Received in RMA',             '1,576', '0',     '1,576'],
          ].map(([label, ont, router, total]) =>
            new TableRow({ children: [
              cell(label,  { fill: C.greenBg, width: stockCols[0] }),
              cell(ont,    { fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[1] }),
              cell(router, { fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[2] }),
              cell(total,  { fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[3] }),
            ]})
          )),
          // Total inward
          new TableRow({ children: [
            cell('TOTAL INWARD',  { bold: true, fill: C.greenBg, color: C.green, width: stockCols[0] }),
            cell('10,916',        { bold: true, fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[1] }),
            cell('660',           { bold: true, fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[2] }),
            cell('11,576',        { bold: true, fill: C.greenBg, color: C.green, align: AlignmentType.CENTER, width: stockCols[3] }),
          ]}),
          // Outward rows
          ...([
            ['Dispatch to Partner',   '0', '0', '0'],
            ['Return to Vendor (RTV)','0', '0', '0'],
            ['STN Out',               '0', '0', '0'],
          ].map(([label, ont, router, total]) =>
            new TableRow({ children: [
              cell(label,  { fill: C.redBg, width: stockCols[0] }),
              cell(ont,    { fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[1] }),
              cell(router, { fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[2] }),
              cell(total,  { fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[3] }),
            ]})
          )),
          // Total outward
          new TableRow({ children: [
            cell('TOTAL OUTWARD', { bold: true, fill: C.redBg, color: C.red, width: stockCols[0] }),
            cell('0',             { bold: true, fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[1] }),
            cell('0',             { bold: true, fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[2] }),
            cell('0',             { bold: true, fill: C.redBg, color: C.red, align: AlignmentType.CENTER, width: stockCols[3] }),
          ]}),
          // Closing
          new TableRow({ children: [
            cell('Closing Stock',  { bold: true, fill: C.navy, color: C.white, width: stockCols[0] }),
            cell('10,916',         { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[1] }),
            cell('660',            { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[2] }),
            cell('11,576',         { bold: true, fill: C.navy, color: C.white, align: AlignmentType.CENTER, width: stockCols[3] }),
          ]}),
        ]
      }),
      ...spacer(1),
      bodyText('Note: January 2026 Closing Stock (ONT: 10,916 | Router: 660 | Total: 11,576) becomes the Opening Stock for February 2026 and all subsequent months.', { italics: true, color: C.greyDark }),
      ...spacer(1),

      // ══ 5. DAILY STOCK MOVEMENT HEADERS ════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('5.  Daily Opening & Closing Stock — Column Structure', C.navy),
      bodyText('Each row in the daily report represents one warehouse + one device type combination per day. The closing stock rolls forward as the next day\'s opening stock automatically.'),
      ...spacer(1),
      kpiTable([
        ['Column Header', 'Type', 'Source Table', 'Formula / Logic'],
        ['DATE',                 'Dimension', 'All tables',                          'Transaction date'],
        ['WAREHOUSE',            'Dimension', 'LOCATIONCODE column',                 'Saket / Mumbai'],
        ['DEVICE_TYPE',          'Dimension', 'DESCRIPTION filter',                  'ONT / Router'],
        ['OPENING_STOCK',        'KPI',       'Calculated',                          'Prior day\'s Closing Stock'],
        ['FRESH_INWARD (+)',      'Inbound',   'PYROPS_INBOUND_DATA__INWARD',         'SUM(TOTALQUANTITY)'],
        ['SALES_RETURN (+)',      'Inbound',   'PYROPS_INBOUND_DATA__SALES_RETURN',   'SUM(TOTALQUANTITY)'],
        ['STN_RECEIPT (+)',       'Inbound',   'PYROPS_INBOUND_DATA__TRANSFER_RECEIPT','SUM(TOTALQUANTITY)'],
        ['RMA_RECEIPT (+)',       'Inbound',   'PYROPS_INBOUND_DATA__SALES_RETURN',   'RMA-tagged rows only'],
        ['TOTAL_INWARD',         'Subtotal',  'Calculated',                          'Sum of all (+) columns'],
        ['PARTNER_DISPATCH (-)', 'Outbound',  'PYROPS_SALE_DETAIL',                  'SUM(QUANTITY)'],
        ['STN_DISPATCH (-)',      'Outbound',  'PYROPS_SALE_DETAIL__TRANSFER',        'SUM(QUANTITY)'],
        ['RTV_VENDOR (-)',        'Outbound',  'PYROPS_SALE_DETAIL__PURCHASE_RETURN', 'SUM(QUANTITY)'],
        ['TOTAL_OUTWARD',        'Subtotal',  'Calculated',                          'Sum of all (-) columns'],
        ['CLOSING_STOCK',        'KPI',       'Calculated',                          'Opening + Inward - Outward'],
        ['NET_MOVEMENT',         'KPI',       'Calculated',                          'Total Inward - Total Outward'],
      ], [2400, 1200, 3200, 3280]),
      ...spacer(1),

      // ══ 6. KPI FRAMEWORK ════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('6.  KPI Framework — ONT & Router Only', C.navy),
      ...spacer(1),

      // Inbound KPIs
      new Paragraph({ spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: 'A.  Inbound / Procurement KPIs', bold: true, size: 22, color: C.green, font: 'Arial' })] }),
      kpiTable([
        ['KPI', 'Formula', 'Target / Insight'],
        ['PO Fulfillment Rate',       'GRN Qty / PO Qty × 100',               '> 95% — flag if vendor short-ships'],
        ['Vendor Rejection Rate',     'Reject Qty / Total GRN Qty × 100',     '< 1% — monitor per vendor'],
        ['GRN Pending Closure',       'COUNT of GRNs in Released status',      '0 — all GRNs should close within 3 days'],
        ['GRN Aging (Released)',       'Days since GRN date for Released GRNs', '> 3 days = escalate'],
        ['Month-wise Inward Volume',  'SUM(TOTALQUANTITY) per month',          'Track vs procurement plan'],
        ['Vendor-wise Inward Mix',    '% units from each vendor',              'Avoid >70% dependency on one vendor'],
      ], [2800, 3800, 3480]),
      ...spacer(1),

      // Outbound KPIs
      new Paragraph({ spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: 'B.  Outbound / Dispatch KPIs', bold: true, size: 22, color: C.blue, font: 'Arial' })] }),
      kpiTable([
        ['KPI', 'Formula', 'Target / Insight'],
        ['Monthly Dispatch Volume',   'COUNT(DISTINCT ORDERNO) per month',     'Track vs sales target'],
        ['Device-wise Dispatch Split','ONT % vs Router % of total dispatched', 'Understand product mix'],
        ['Pincode Coverage',          'COUNT(DISTINCT SHIPPINGPINCODE)',        'Geographic expansion metric'],
        ['Dispatch TAT',              'Avg days: ORDERDATE to SHIP_DATE',      '< 2 days target'],
        ['Top 10 Pincodes',           'Order count per pincode, ranked',       'Focus logistics effort'],
        ['Partner vs STN Ratio',      'SALE_DETAIL qty / TRANSFER qty',        'Track inter-warehouse balance'],
      ], [2800, 3800, 3480]),
      ...spacer(1),

      // Returns KPIs
      new Paragraph({ spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: 'C.  Returns & Quality KPIs', bold: true, size: 22, color: C.red, font: 'Arial' })] }),
      kpiTable([
        ['KPI', 'Formula', 'Target / Insight'],
        ['Sales Return Rate',         'Return Qty / Dispatch Qty × 100',       '< 2% — investigate if higher'],
        ['RTV Rate',                  'RTV Qty / GRN Qty × 100',               '< 0.5% — vendor quality flag'],
        ['Return by Device Type',     'ONT vs Router return qty',              'Identify failure-prone model'],
        ['Return by Pincode',         'Return qty grouped by pincode',         'Pinpoint field problem zones'],
        ['Return Aging',              'Days since return GRN date',            '< 7 days to refurb or dispose'],
      ], [2800, 3800, 3480]),
      ...spacer(1),

      // Stock Health
      new Paragraph({ spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: 'D.  Stock Health KPIs', bold: true, size: 22, color: C.amber, font: 'Arial' })] }),
      kpiTable([
        ['KPI', 'Formula', 'Target / Insight'],
        ['Stock on Hand',            'Opening + Inward - Outward (cumulative)', 'Real-time position by warehouse'],
        ['Days of Inventory (DOI)',  'Stock on Hand / Avg Daily Dispatch',      '> 30 days = overstocked; < 7 = risk'],
        ['Dead Stock (>90 days)',    'Stock received > 90 days ago, undispatched','0 — flag for clearance'],
        ['OK vs Rejected Stock',     'OK Qty / Total Qty × 100',              '> 99% — quality health'],
        ['STN Net Flow',             'STN Receipt - STN Dispatch per warehouse','Identifies warehouse imbalance'],
        ['Stock Turn Rate',          'Dispatched Qty / Avg Stock on Hand',    'Higher = faster moving inventory'],
      ], [2800, 3800, 3480]),
      ...spacer(1),

      // ══ 7. IMPLEMENTATION PLAN ══════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading('7.  Implementation Plan', C.navy),
      ...spacer(1),
      kpiTable([
        ['Phase', 'Activity', 'Timeline'],
        ['Phase 1', 'Data validation & baseline confirmation (Jan 2026 opening stock)',    'Week 1'],
        ['Phase 2', 'Build daily stock movement dataset from all 6 Pyrops tables',        'Week 1-2'],
        ['Phase 3', 'Develop Monthly Stock Ledger report (ONT + Router, per warehouse)',  'Week 2'],
        ['Phase 4', 'Build KPI calculation layer (rejection rate, DOI, return rate etc.)', 'Week 2-3'],
        ['Phase 5', 'Dashboard development — charts, filters, drill-downs',               'Week 3-4'],
        ['Phase 6', 'UAT, review with stakeholders, go-live',                             'Week 4'],
      ], [1400, 6200, 2480]),
      ...spacer(1),

      // ══ 8. EXPECTED BENEFITS ════════════════════════════════════
      sectionHeading('8.  Expected Benefits', C.navy),
      bullet('Real-time stock visibility — eliminate manual stock count dependencies'),
      bullet('Proactive alerts on GRN pending closure, stockouts, and overstock situations'),
      bullet('Vendor accountability — rejection rate and PO fulfillment tracked monthly'),
      bullet('Data-driven dispatch planning — DOI and trend analysis guide procurement timing'),
      bullet('End-to-end traceability — every unit tracked from vendor PO to partner delivery'),
      bullet('Scalable — framework can be extended to ONU and additional warehouses'),
      ...spacer(1),

      // ══ 9. BASELINE REFERENCE ═══════════════════════════════════
      sectionHeading('9.  January 2026 Baseline (Opening Stock for Feb 2026)', C.navy),
      bodyText('The following figures, derived from live Snowflake data, serve as the verified opening stock for February 2026:'),
      ...spacer(1),
      kpiTable([
        ['Metric', 'ONT', 'Router', 'Total'],
        ['Opening Stock (Jan 1)',      '0',      '0',     '0'],
        ['Total Inward (Jan)',         '10,916', '660',   '11,576'],
        ['Total Outward (Jan)',        'TBD',    'TBD',   'TBD'],
        ['Closing Stock = Feb Opening','10,916', '660',   '11,576'],
      ], [3000, 2360, 2360, 2360]),
      ...spacer(1),
      bodyText('Note: Outward figures for January are pending full reconciliation of dispatch data against the warehouse-level LOCATIONCODE filter. Final closing stock will be confirmed after Phase 1 validation.', { italics: true, color: C.greyDark }),
      ...spacer(2),

      // ══ SIGN-OFF ═════════════════════════════════════════════════
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [CONTENT_W / 2, CONTENT_W / 2],
        rows: [new TableRow({ children: [
          new TableCell({ borders: borders(C.border), shading: { fill: C.grey, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Prepared by:', size: 18, color: C.greyDark, font: 'Arial' })] }),
              new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'Inventory Analytics Team', bold: true, size: 22, color: C.navy, font: 'Arial' })] }),
              new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'April 2026', size: 18, color: C.greyDark, font: 'Arial' })] }),
            ]
          }),
          new TableCell({ borders: borders(C.border), shading: { fill: C.grey, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Approved by:', size: 18, color: C.greyDark, font: 'Arial' })] }),
              new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: '________________________________', size: 22, color: C.navy, font: 'Arial' })] }),
              new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'Date: _______________', size: 18, color: C.greyDark, font: 'Arial' })] }),
            ]
          }),
        ]})]
      }),
    ]
  }]
});

// Save
const outDir  = 'C:/Claude Projects/Inventory Dashboard/exports';
const outFile = `${outDir}/Wiom_Inventory_KPI_Tracking_Brief.docx`;
mkdirSync(outDir, { recursive: true });
const buffer = await Packer.toBuffer(doc);
writeFileSync(outFile, buffer);
console.log(`Document saved: ${outFile}`);
console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
