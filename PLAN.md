# Wardline Project Plan

## Current State

Wardline is a Vue 3 and TypeScript dashboard using Chart.js. It currently generates deterministic sample records for 2024–2026 and supports day, week, month, and year views, facility selection, year comparisons, and four operational charts. The dataset is illustrative and is not suitable for clinical or staffing decisions.

## Roadmap

### 1. Define and validate operational data

- Document the daily record contract, including facility capacity, occupied and open beds, admission-reason counts, actual FTEs, and required FTEs.
- Validate incoming records and enforce reconciliation rules, including occupied plus open beds equaling facility capacity and reason counts reconciling to occupied beds.
- Define timezone, reporting-day, missing-data, and late-arriving-data behavior.
- Keep all demo data clearly labeled as synthetic.

### 2. Connect a production data source

- Add a server-side API boundary for facility metrics; do not expose database credentials in the browser.
- Return only the aggregated operational data needed by the dashboard.
- Add loading, empty, stale-data, and recoverable error states.
- Document access control, retention, and privacy requirements before using real facility data. Do not send patient-identifiable information to this dashboard.

### 3. Strengthen operational interpretation

- Confirm whether each chart represents a daily census, average occupied beds, or bed-days, and label the measure consistently.
- Make the critical open-capacity threshold configurable by facility or network policy.
- Define understaffing and overstaffing tolerances with operational stakeholders; distinguish meaningful variance from rounding noise.
- Surface threshold status in the summary and chart tooltips without relying on color alone.

### 4. Add automated quality checks

- Unit-test date bucket generation and aggregation for day, week, month, year, leap years, and year boundaries.
- Test facility/year filters, capacity reconciliation, reason totals, and staffing comparisons.
- Add browser tests for filter interactions, chart presence, keyboard access, and mobile layouts.
- Run type checking, tests, and the production build in continuous integration.

### 5. Prepare reliable releases

- Use preview deployments for review and a separate production deployment path.
- Store API credentials and deployment secrets only in the hosting provider's secret manager.
- Add a release checklist for data freshness, metric definitions, access review, and rollback readiness.
- Monitor API failures and stale data while keeping logs free of sensitive information.

## Completion Criteria

- Every displayed metric has a documented definition and aggregation rule.
- Invalid or incomplete records are detected and clearly represented rather than silently treated as zero.
- Facility, date-range, and year filters produce consistent results across all charts and summary values.
- The dashboard remains usable with keyboard navigation and at mobile widths.
- CI validates the data logic and production build, and deployment configuration contains no committed secrets.