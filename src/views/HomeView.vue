<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
} from 'chart.js'
import { computed, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  availableYears,
  getDashboardData,
  getYearColor,
  getYearDash,
  hospitals,
  reasonLabels,
  type Granularity,
} from '../data/hospitalAnalytics'

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)

const granularityOptions: Array<{ value: Granularity; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]
const reasonColors: Record<string, string> = {
  emergency: '#c4544b',
  surgery: '#397ca5',
  infectious: '#8669a9',
  chronic: '#c99a35',
}
const anchorDate = ref('2026-09-29')
const granularity = ref<Granularity>('month')
const selectedYears = ref<number[]>([2025, 2026])
const selectedHospitalIds = ref(hospitals.map(({ id }) => id))

const dashboard = computed(() => getDashboardData({
  granularity: granularity.value,
  anchorDate: anchorDate.value,
  years: selectedYears.value,
  hospitalIds: selectedHospitalIds.value,
}))

const occupancyChart = computed<ChartData<'line', number[], string>>(() => ({
  labels: dashboard.value.labels,
  datasets: dashboard.value.occupancy.map((series) => {
    const hospital = hospitals.find(({ id }) => id === series.hospitalId)
    return {
      label: series.label,
      data: series.data,
      borderColor: hospital?.color ?? '#148679',
      backgroundColor: hospital?.color ?? '#148679',
      borderDash: getYearDash(series.year),
      borderWidth: series.year === Math.max(...dashboard.value.years) ? 2.6 : 1.8,
      pointRadius: dashboard.value.labels.length < 16 ? 2.4 : 0,
      pointHoverRadius: 4,
      tension: 0.3,
    }
  }),
}))

const reasonsChart = computed<ChartData<'bar', number[], string>>(() => ({
  labels: dashboard.value.labels,
  datasets: reasonLabels.flatMap(({ key, label }) => dashboard.value.years.map((year) => ({
    label: `${label} · ${year}`,
    data: dashboard.value.reasons.find((series) => series.year === year && series.reason === key)?.data ?? [],
    backgroundColor: reasonColors[key],
    borderRadius: 2,
    borderSkipped: false,
    stack: String(year),
    categoryPercentage: dashboard.value.years.length > 1 ? 0.76 : 0.8,
    barPercentage: 0.82,
  }))),
}))

const capacityChart = computed<ChartData<'line', number[], string>>(() => ({
  labels: dashboard.value.labels,
  datasets: [
    ...dashboard.value.openBeds.map((series) => ({
      label: series.label,
      data: series.data,
      borderColor: getYearColor(series.year),
      backgroundColor: `${getYearColor(series.year)}22`,
      borderWidth: 2,
      borderDash: getYearDash(series.year),
      pointRadius: dashboard.value.labels.length < 16 ? 2 : 0,
      pointHoverRadius: 4,
      tension: 0.32,
      fill: series.year === Math.max(...dashboard.value.years),
    })),
    {
      label: 'Critical threshold · 10% capacity',
      data: dashboard.value.labels.map(() => dashboard.value.threshold),
      borderColor: '#c4544b',
      borderWidth: 1.6,
      borderDash: [6, 5],
      pointRadius: 0,
      fill: false,
    },
  ],
}))

const staffingChart = computed<ChartData<'bar', number[], string>>(() => ({
  labels: dashboard.value.labels,
  datasets: dashboard.value.staffing.map((series) => {
    const isOnDuty = series.label.startsWith('On duty')
    const common = {
      label: series.label,
      data: series.data,
      backgroundColor: isOnDuty ? `${getYearColor(series.year)}b8` : getYearColor(series.year),
      borderColor: getYearColor(series.year),
      borderWidth: isOnDuty ? 0 : 2,
      borderDash: isOnDuty ? [] : getYearDash(series.year).length ? getYearDash(series.year) : [5, 4],
      pointRadius: isOnDuty ? 0 : 2,
      yAxisID: isOnDuty ? 'y' : 'y1',
      order: isOnDuty ? 2 : 1,
    }
    return isOnDuty
      ? { ...common, type: 'bar' as const, barPercentage: 0.64, categoryPercentage: 0.78 }
      : { ...common, type: 'line' as const, fill: false, tension: 0.25 }
  }) as unknown as ChartDataset<'bar', number[]>[],
}))

function lineOptions(yTitle: string): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#17272c', padding: 11, titleFont: { family: 'DM Sans' }, bodyFont: { family: 'DM Sans' } },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#78878b', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        title: { display: true, text: timelineAxisTitle.value, color: '#78878b', font: { family: 'DM Sans', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e9eeec' },
        border: { display: false },
        ticks: { color: '#78878b', precision: 0 },
        title: { display: true, text: yTitle, color: '#78878b', font: { family: 'DM Sans', size: 11 } },
      },
    },
  }
}

const occupancyOptions = computed(() => lineOptions('Occupied beds'))
const capacityOptions = computed(() => lineOptions('Available open beds'))
const reasonsOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#17272c', padding: 11, titleFont: { family: 'DM Sans' }, bodyFont: { family: 'DM Sans' } },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#78878b', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
      title: { display: true, text: timelineAxisTitle.value, color: '#78878b', font: { family: 'DM Sans', size: 11 } },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: { color: '#e9eeec' },
      border: { display: false },
      ticks: { color: '#78878b', precision: 0 },
      title: { display: true, text: 'Average occupied beds', color: '#78878b', font: { family: 'DM Sans', size: 11 } },
    },
  },
}))
const staffingOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#17272c', padding: 11, titleFont: { family: 'DM Sans' }, bodyFont: { family: 'DM Sans' } },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#78878b', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      title: { display: true, text: timelineAxisTitle.value, color: '#78878b', font: { family: 'DM Sans', size: 11 } },
    },
    y: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      grid: { color: '#e9eeec' },
      border: { display: false },
      ticks: { color: '#78878b', precision: 0 },
      title: { display: true, text: 'On-duty FTEs', color: '#78878b', font: { family: 'DM Sans', size: 11 } },
    },
    y1: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      border: { display: false },
      ticks: { color: '#78878b', precision: 0 },
      title: { display: true, text: 'Required FTEs', color: '#78878b', font: { family: 'DM Sans', size: 11 } },
    },
  },
}))

const timelineAxisTitle = computed(() => ({
  day: 'Consecutive days',
  week: 'Seven-day trend',
  month: 'Day of month',
  year: 'Month',
}[granularity.value]))

const formattedPeriod = computed(() => {
  const date = new Date(`${anchorDate.value}T12:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    month: granularity.value === 'year' ? undefined : 'long',
    year: 'numeric',
    ...(granularity.value === 'day' ? { day: 'numeric' } : {}),
  }).format(date)
})

const metrics = computed(() => {
  const data = dashboard.value.summary
  const capacity = data.occupiedBeds + data.openBeds
  return [
    {
      label: 'Beds occupied',
      value: formatNumber(data.occupiedBeds),
      note: `of ${formatNumber(capacity)} network beds`,
      tone: 'blue',
    },
    {
      label: 'Capacity utilization',
      value: formatPercent(data.utilization),
      note: 'network average in selected period',
      tone: 'green',
    },
    {
      label: 'Open beds',
      value: formatNumber(data.openBeds),
      note: `${formatPercent(capacity ? data.openBeds / capacity : 0)} of total capacity`,
      tone: data.openBeds / (capacity || 1) < 0.1 ? 'red' : 'amber',
    },
    {
      label: 'Staffing coverage',
      value: formatPercent(data.staffingCoverage),
      note: `${formatNumber(data.staffedFtes)} / ${formatNumber(data.requiredFtes)} FTEs`,
      tone: data.staffingCoverage < 0.95 ? 'red' : 'green',
    },
  ]
})

const chartLegends = computed(() => dashboard.value.occupancy.map((series) => ({
  label: series.label,
  color: hospitals.find(({ id }) => id === series.hospitalId)?.color ?? '#148679',
  dash: getYearDash(series.year),
})))

const dateMaximum = `${Math.max(...availableYears)}-12-31`

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function toggleYear(year: number) {
  if (selectedYears.value.includes(year)) {
    if (selectedYears.value.length > 1) selectedYears.value = selectedYears.value.filter((item) => item !== year)
    return
  }
  selectedYears.value = [...selectedYears.value, year].sort()
}

function toggleHospital(id: string) {
  if (selectedHospitalIds.value.includes(id)) {
    if (selectedHospitalIds.value.length > 1) selectedHospitalIds.value = selectedHospitalIds.value.filter((item) => item !== id)
    return
  }
  selectedHospitalIds.value = [...selectedHospitalIds.value, id]
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Wardline home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="brand-name">wardline</span>
        <span class="brand-divider"></span>
        <span class="brand-context">Hospital operations</span>
      </a>
      <div class="topbar-meta"><span class="status-dot"></span> Sample network <span class="topbar-separator">/</span> 2024–26</div>
    </header>

    <main id="top" class="dashboard">
      <section class="page-heading">
        <div>
          <p class="eyebrow">Network overview <span>•</span> {{ formattedPeriod }}</p>
          <h1>Capacity &amp; staffing</h1>
          <p class="heading-description">A daily view of inpatient demand, open capacity, and workforce alignment.</p>
        </div>
        <div class="report-stamp"><span class="stamp-label">REPORTING PERIOD</span><strong>{{ formattedPeriod }}</strong></div>
      </section>

      <section class="filters" aria-label="Dashboard filters">
        <div class="filter-row filter-primary">
          <div class="filter-group">
            <span class="filter-label">Time scale</span>
            <div class="segmented" role="group" aria-label="Time scale">
              <button
                v-for="option in granularityOptions"
                :key="option.value"
                type="button"
                :aria-pressed="granularity === option.value"
                :class="{ active: granularity === option.value }"
                @click="granularity = option.value"
              >{{ option.label }}</button>
            </div>
          </div>
          <label class="date-filter">
            <span class="filter-label">Reference date</span>
            <input v-model="anchorDate" type="date" min="2024-01-01" :max="dateMaximum" aria-label="Reference date" />
          </label>
          <fieldset class="year-filter">
            <legend class="filter-label">Compare years</legend>
            <label v-for="year in availableYears" :key="year" class="year-option">
              <input type="checkbox" :checked="selectedYears.includes(year)" :disabled="selectedYears.length === 1 && selectedYears.includes(year)" @change="toggleYear(year)" />
              <span class="year-swatch" :style="{ '--swatch': getYearColor(year), '--dash': getYearDash(year).length ? 'dashed' : 'solid' }"></span>
              <span>{{ year }}</span>
            </label>
          </fieldset>
        </div>

        <div class="filter-row facility-filter">
          <span class="filter-label">Facilities</span>
          <div class="facility-options">
            <label v-for="hospital in hospitals" :key="hospital.id" class="facility-option" :class="{ selected: selectedHospitalIds.includes(hospital.id) }">
              <input type="checkbox" :checked="selectedHospitalIds.includes(hospital.id)" :disabled="selectedHospitalIds.length === 1 && selectedHospitalIds.includes(hospital.id)" @change="toggleHospital(hospital.id)" />
              <span class="facility-dot" :style="{ backgroundColor: hospital.color }"></span>
              {{ hospital.name }}
            </label>
          </div>
          <span class="filter-summary">{{ selectedHospitalIds.length }} of {{ hospitals.length }} selected</span>
        </div>
      </section>

      <section class="metrics-grid" aria-label="Network summary">
        <article v-for="(metric, index) in metrics" :key="metric.label" class="metric-card" :class="[`tone-${metric.tone}`, { 'metric-featured': index === 0 }]">
          <div class="metric-top"><span class="metric-label">{{ metric.label }}</span><span class="metric-index">0{{ index + 1 }}</span></div>
          <strong class="metric-value">{{ metric.value }}</strong>
          <span class="metric-note">{{ metric.note }}</span>
        </article>
      </section>

      <section class="chart-grid" aria-label="Hospital operations charts">
        <article class="chart-panel occupancy-panel">
          <div class="panel-heading">
            <div><p class="panel-kicker">01 / DEMAND</p><h2>Hospital bed occupancy trends</h2><p class="panel-description">Occupied beds by facility across the selected timeline.</p></div>
            <span class="panel-unit">BEDS</span>
          </div>
          <div class="chart-area occupancy-chart" role="img" aria-label="Line chart of occupied beds at selected hospitals">
            <Line :data="occupancyChart" :options="occupancyOptions" />
          </div>
          <div class="chart-legend facility-legend">
            <span v-for="item in chartLegends" :key="item.label" class="legend-item">
              <i class="legend-line" :style="{ '--legend-color': item.color, '--line-style': item.dash.length ? 'dashed' : 'solid' }"></i>{{ item.label }}
            </span>
          </div>
        </article>

        <article class="chart-panel reasons-panel">
          <div class="panel-heading">
            <div><p class="panel-kicker">02 / CASE MIX</p><h2>Admission &amp; bed utilization</h2><p class="panel-description">Average daily occupied beds by primary reason.</p></div>
            <span class="panel-unit">BEDS</span>
          </div>
          <div class="chart-area reasons-chart" role="img" aria-label="Stacked bar chart of occupied beds by admission reason">
            <Bar :data="reasonsChart" :options="reasonsOptions" />
          </div>
          <div class="chart-legend reason-legend">
            <span v-for="reason in reasonLabels" :key="reason.key" class="legend-item"><i class="legend-square" :style="{ backgroundColor: reasonColors[reason.key] }"></i>{{ reason.label }}</span>
          </div>
        </article>

        <article class="chart-panel capacity-panel">
          <div class="panel-heading">
            <div><p class="panel-kicker">03 / RESERVE</p><h2>Available open bed capacity</h2><p class="panel-description">Network reserve with a 10% critical capacity threshold.</p></div>
            <span class="panel-unit">OPEN BEDS</span>
          </div>
          <div class="chart-area capacity-chart" role="img" aria-label="Area chart of available beds and the critical capacity threshold">
            <Line :data="capacityChart" :options="capacityOptions" />
          </div>
          <div class="chart-legend">
            <span v-for="item in dashboard.openBeds" :key="item.year" class="legend-item"><i class="legend-line" :style="{ '--legend-color': getYearColor(item.year), '--line-style': getYearDash(item.year).length ? 'dashed' : 'solid' }"></i>Open beds · {{ item.year }}</span>
            <span class="legend-item"><i class="legend-line threshold-line"></i>Critical · {{ formatNumber(dashboard.threshold) }} beds</span>
          </div>
        </article>

        <article class="chart-panel staffing-panel">
          <div class="panel-heading">
            <div><p class="panel-kicker">04 / WORKFORCE</p><h2>Staffing alignment</h2><p class="panel-description">On-duty FTEs against patient-demand requirements.</p></div>
            <span class="panel-unit">FTE</span>
          </div>
          <div class="chart-area staffing-chart" role="img" aria-label="Combined bar and line chart comparing on-duty and required staffing">
            <Bar :data="staffingChart" :options="staffingOptions" />
          </div>
          <div class="chart-legend staffing-legend">
            <span v-for="year in dashboard.years" :key="year" class="legend-item"><i class="legend-square" :style="{ backgroundColor: getYearColor(year) }"></i>On duty · {{ year }}</span>
            <span v-for="year in dashboard.years" :key="`${year}-required`" class="legend-item"><i class="legend-line" :style="{ '--legend-color': getYearColor(year), '--line-style': 'dashed' }"></i>Required · {{ year }}</span>
          </div>
        </article>
      </section>

      <footer class="dashboard-footer"><span>WARDLINE <i></i> HOSPITAL OPERATIONS</span><span>Illustrative synthetic data · Daily snapshots · All figures are averages within selected periods</span></footer>
    </main>
  </div>
</template>