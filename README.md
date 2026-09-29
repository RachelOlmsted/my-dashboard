# Wardline | Hospital Operations

Wardline is a responsive hospital operations dashboard for monitoring occupied beds, available capacity, admission mix, and staffing alignment across three facilities.

## Features

- Day, week, month, and year views from daily records. Day view compares 14 consecutive days; week view shows seven days; month view shows each day; year view aggregates to 12 monthly averages.
- Year overlays for 2024, 2025, and 2026.
- Facility filters for St. Jude General, Metro Health Center, and Valley Children's Hospital.
- Network summary for average occupied beds, utilization, open beds, and staffing coverage.
- Occupancy trend lines by facility, stacked admission-reason bars, open-bed area chart with a 10% critical threshold, and a dual-axis staffing comparison.
- Locally generated, deterministic sample data. No API or backend is required.

## Stack

- Vue 3 and TypeScript
- Vite
- Chart.js with vue-chartjs

## Data and aggregation

`src/data/hospitals_data.json` defines facility capacities, monthly occupancy adjustments, reason mix, staffing ratios, and year-level adjustments. `src/data/hospitalAnalytics.ts` expands those profiles into daily records for 2024–2026 and aggregates the selected date range, facilities, and years for the dashboard.

All values are illustrative and should not be used for operational decisions. The current model produces daily snapshots; the day view compares consecutive dates rather than inventing hourly measurements.

## Development

```bash
npm install
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```
