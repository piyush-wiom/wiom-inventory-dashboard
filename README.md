# Wiom Delhi-Saket · Inventory Dashboard

A live warehouse inventory dashboard for the Delhi-Saket area, built with Next.js 14 and powered by Google Sheets as the data source.

**Live URL:** https://wiom-inventory-dashboard.vercel.app

---

## Features

| Tab | Description |
|-----|-------------|
| **Daily Report** | Today's inward/outward movement — Opening Stock, all inward categories, all outward categories, Closing Stock with ONT / ONU / Router breakdown |
| **Month Analysis** | Month-on-Month warehouse report — select any year and one or more months to see the same 9-row format per month. Closing Stock of month N equals Opening Stock of month N+1. |
| **Inventory Overview** | KPI cards, stock movement chart, inward/outward source breakdowns, area-wise reconciliation table |

---

## Data Source

- **Google Sheet:** `Delhi_Saket_Area Wise Inv` tab
- Sheet ID: `1XA-yPDYidXs_8DKRA8QNEbgQLA2tQbu8GkW1wn0OBL0`
- All 142,000+ device records are fetched via the Google Sheets API v4 on every request (no local cache, always live)

### Monthly Analysis Row Definitions

| Row | What it counts |
|-----|----------------|
| Opening Stock | Devices entered before the month AND not dispatched before the month started |
| Fresh Inward | Devices entered this month from `Vendor (Virgin)` |
| Return Inward | Devices entered this month from `Return (Refurbished)` |
| STN In | Devices entered this month from `Received in STN` |
| Stock RMA | Devices entered this month from `Stock Received in RMA` |
| Dispatch Stock | Devices dispatched this month to partners / PDO / dispose |
| RTV | Devices dispatched this month back to vendor (RTV / RMA) |
| STN Out | Devices transferred to Gurgaon office or Mumbai this month |
| Closing Stock | Devices entered on or before last day of month AND not dispatched before month end |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Data fetching:** SWR (stale-while-revalidate)
- **Charts:** Recharts
- **Data source:** Google Sheets API v4

---

## Local Development

### Prerequisites

- Node.js 18+
- A Google Sheets API key with access to the sheet

### Environment Variables

Create a file at `C:\credentials\.env` (shared credentials location) and add:

```
GOOGLE_SHEETS_API_KEY=your_api_key_here
```

The project `.env.local` (non-sensitive config only):

```
NODE_ENV=development
NEXT_PUBLIC_SHEET_ID=1XA-yPDYidXs_8DKRA8QNEbgQLA2tQbu8GkW1wn0OBL0
NEXT_PUBLIC_SHEET_NAME=Delhi_Saket_Area Wise Inv
NEXT_PUBLIC_DOI_ALERT_THRESHOLD=20
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

The project is deployed on Vercel. To redeploy after changes:

```bash
# Push to GitHub (Vercel can auto-deploy, or use CLI)
git push origin master

# Or deploy manually via CLI
vercel --prod --yes
```

### Required Vercel Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API v4 key |
| `NEXT_PUBLIC_SHEET_ID` | Google Sheet document ID |
| `NEXT_PUBLIC_SHEET_NAME` | Sheet tab name (must not have trailing whitespace) |
| `NEXT_PUBLIC_DOI_ALERT_THRESHOLD` | Days-of-inventory alert threshold |

Set them via Vercel dashboard or:
```bash
printf 'value' | vercel env add VARIABLE_NAME production --yes
```
> Use `printf` (not `echo`) to avoid trailing newline in the value.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── inventory/          # KPI + overview data
│   │   ├── daily-report/       # Today's warehouse report
│   │   └── monthly-analysis/   # Month-on-month analysis
│   └── page.tsx
├── components/
│   ├── daily/                  # Daily Report tab
│   ├── monthly/                # Month Analysis tab
│   ├── kpi/                    # KPI cards
│   ├── charts/                 # Stock movement + breakdown charts
│   ├── reconciliation/         # Area-wise table
│   └── layout/                 # Header
├── hooks/                      # SWR data-fetching hooks
├── lib/
│   ├── constants.ts            # Column indices, sheet config
│   ├── googleSheets.ts         # Sheets API fetch
│   ├── transformers.ts         # Raw rows → DeviceRecord[]
│   ├── computeKpi.ts           # KPI calculations
│   ├── computeDailyReport.ts   # Daily report calculations
│   └── computeMonthlyAnalysis.ts # Monthly calculations
└── types/
    └── inventory.ts            # All TypeScript types
```

---

## Notes

- **Column indices** in `constants.ts` are verified against the live sheet. If the sheet structure changes (columns added/removed), update `COL` in `src/lib/constants.ts`.
- **IST timezone** is applied using a UTC+5:30 offset (`Date.now() + 5.5 * 60 * 60 * 1000`) since Vercel servers run in UTC.
- **Data discrepancy** between Month Analysis and Daily WH Report is expected — Month Analysis is computed from device records while the Daily Report may be manually maintained by the warehouse team.
