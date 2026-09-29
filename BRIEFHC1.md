# BRIEFHC1
1. System Architecture & Filter Logic
The application processes time-series data aggregated at the daily level. The front-end application handles the filtering and aggregation dynamically based on the user's selection.
Date Range & Granularity Rules
•	Day View: Displays 24-hour hourly intervals or compares individual consecutive days.
•	Week View: Aggregates daily data into a 7-day trend line or bar chart.
•	Month View: Aggregates data into daily data points across 30/31 days or stacks them by week.
•	Year View: Aggregates data into 12 monthly data points to show long-term seasonal trends.
•	3-Year Timeline: Controls allow selecting and overlaying Year 1 (2024), Year 2 (2025), and Year 3 (2026) for year-over-year (YoY) performance comparisons.
________________________________________
2. Hypothetical Dataset (hospitals_data.json)
This JSON structure represents a sample of the underlying database. To save space while demonstrating the exact schema, it includes sample entries across different years, months, and days for three hypothetical hospitals: St. Jude General, Metro Health Center, and Valley Children's.
3. Dashboard UI & Graph Specifications
The dashboard utilizes four distinct visual components to provide complete operational awareness.
Graph 1: Volume of Occupied Beds
•	Graph Type: Multi-Line Chart (with a line representing each selected hospital, or stacked lines for a cumulative view).
•	Chart Title: Hospital Bed Occupancy Trends
•	X-Axis Label: Timeline [Interval based on Filter: Day / Week / Month / Year]
•	Y-Axis Label: Number of Occupied Beds
•	Legend:
o	🔵 St. Jude General
o	🟢 Metro Health Center
o	🟠 Valley Children's Hospital
Graph 2: Reasons for Bed Occupation
•	Graph Type: Stacked Bar Chart (100% Stacked or Absolute Value Stacked).
•	Chart Title: Primary Breakdown of Admission & Bed Utilization Reasons
•	X-Axis Label: Selected Time Period
•	Y-Axis Label: Percentage (%) / Total Beds Occupied
•	Legend:
o	🟥 Emergency / Trauma
o	🟦 Scheduled Surgery
o	🟪 Infectious Disease
o	🟨 Chronic Condition Management
Graph 3: Number of Open Beds
•	Graph Type: Area Chart (to highlight safety margins and capacity thresholds).
•	Chart Title: Available / Open Bed Capacity Asset Allocation
•	X-Axis Label: Date / Time Period
•	Y-Axis Label: Number of Available Open Beds
•	Visual Threshold Marker: A dashed red horizontal line highlighting the Critical Capacity Threshold (< 10% Open Beds).
Graph 4: Aligned Staffing
•	Graph Type: Dual-Axis Combo Chart (Bars vs. Line overlay).
•	Chart Title: Staffing Alignment: Scheduled FTEs vs. Required Patient Demand
•	X-Axis Label: Timeline
•	Y-Axis Left Scale (Bars): Actual Staff On-Duty (FTEs)
•	Y-Axis Right Scale (Line Overlay): Target / Required Staffing (FTEs)
•	Interpretation Metric:
o	When the Bar is lower than the Line = Understaffed relative to active bed volume.
o	When the Bar is higher than the Line = Overstaffed / High labor variance.
________________________________________
4. Frontend Filter Logic Mockup (Pseudocode Approach)
When a user interacts with the time filter UI, the application executes an aggregation query on the JSON payload:
