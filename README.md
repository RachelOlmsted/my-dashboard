# My Dashboard

A polished analytics dashboard built in Vue 3 and Vuetify to surface key business trends in a clean, executive-friendly layout.

## Live demo

- Production: https://my-dashboard-omega-roan.vercel.app
- Repository: https://github.com/RachelOlmsted/my-dashboard

## Overview

This dashboard is designed to help teams quickly understand business performance across the year. It brings together revenue, visitor growth, conversion rate, and order volume into one streamlined view that feels like a modern admin panel or ecommerce reporting dashboard.

The experience is intentionally minimal and high-contrast, with a modern dark default theme, spacious card layouts, and chart-driven storytelling that makes the data easy to scan at a glance.

## Highlights

- Full-year and single-month filtering
- Summary KPI cards for revenue, visitors, conversions, and orders
- Revenue bar chart for monthly performance
- Visitors line chart for trend analysis
- Conversion area chart for efficiency tracking
- Light/dark theme toggle
- Responsive layout for desktop and mobile screens
- Local JSON-powered data model with no external API dependency

## Tech stack

- Vue 3
- TypeScript
- Vite
- Vuetify 3
- Chart.js
- vue-chartjs

## Dataset

The dashboard uses a local dataset stored in src/data/metrics.json with monthly metrics for 2025, including:

- revenue
- visitors
- conversions
- orders

This makes the project easy to demo, iterate on, and extend without setting up a backend.

## Project structure

```text
my-dashboard/
├── src/
│   ├── data/
│   │   └── metrics.json
│   ├── views/
│   │   └── HomeView.vue
│   ├── App.vue
│   ├── main.ts
│   └── router/
│       └── index.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

## Getting started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Design intent

The app follows a clean, premium analytics aesthetic with:

- a dark-first visual system
- generous whitespace
- soft chart colors that stay cohesive and readable
- clear hierarchy between summary stats and trend charts
- a practical dashboard-first layout optimized for business insights

## Notes

This project was built to follow the brief for a single-page business dashboard, with functionality centered on data visibility, monthly filtering, and a minimal presentation that feels polished enough for portfolio and client-facing storytelling.

## License

This project is intended for demo and portfolio use.
