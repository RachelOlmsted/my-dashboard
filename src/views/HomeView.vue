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
} from 'chart.js'
import { computed, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { useTheme } from 'vuetify'
import metricsData from '../data/metrics.json'

type Metric = {
  month: string
  year: number
  revenue: number
  visitors: number
  conversions: number
  orders: number
}

ChartJS.register(BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)

const metrics = metricsData as Metric[]
const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')
const selectedMonth = ref('all')

const monthOptions = [
  { title: 'Full Year', value: 'all' },
  ...metrics.map((metric) => ({ title: `${metric.month} ${metric.year}`, value: metric.month })),
]

const filteredMetrics = computed(() =>
  selectedMonth.value === 'all'
    ? metrics
    : metrics.filter((metric) => metric.month === selectedMonth.value),
)

const summary = computed(() => {
  const data = filteredMetrics.value
  return {
    revenue: data.reduce((total, metric) => total + metric.revenue, 0),
    visitors: data.reduce((total, metric) => total + metric.visitors, 0),
    conversions: data.reduce((total, metric) => total + metric.conversions, 0) / data.length,
    orders: data.reduce((total, metric) => total + metric.orders, 0),
  }
})

const comparisonMetrics = computed(() => {
  if (selectedMonth.value === 'all') {
    return metrics.slice(-2)
  }

  const selectedIndex = metrics.findIndex((metric) => metric.month === selectedMonth.value)
  return selectedIndex > 0 ? metrics.slice(selectedIndex - 1, selectedIndex + 1) : []
})

function changeFor(key: keyof Metric) {
  const [previous, current] = comparisonMetrics.value
  if (!previous || !current) return null

  const previousValue = previous[key] as number
  const currentValue = current[key] as number
  const change = key === 'conversions'
    ? currentValue - previousValue
    : ((currentValue - previousValue) / previousValue) * 100

  return {
    value: change,
    label: key === 'conversions' ? `${change >= 0 ? '+' : ''}${change.toFixed(1)} pts` : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    positive: change >= 0,
  }
}

const cards = computed(() => [
  { label: 'Revenue', value: formatCurrency(summary.value.revenue), symbol: '$', change: changeFor('revenue') },
  { label: 'Visitors', value: formatNumber(summary.value.visitors), symbol: '◉', change: changeFor('visitors') },
  { label: 'Conversions', value: `${summary.value.conversions.toFixed(1)}%`, symbol: '%', change: changeFor('conversions') },
  { label: 'Orders', value: formatNumber(summary.value.orders), symbol: '#', change: changeFor('orders') },
])

const chartLabels = computed(() => filteredMetrics.value.map((metric) => metric.month))

const revenueChart = computed(() => ({
  labels: chartLabels.value,
  datasets: [{
    label: 'Revenue',
    data: filteredMetrics.value.map((metric) => metric.revenue),
    backgroundColor: '#5b8cff',
    borderRadius: 5,
    borderSkipped: false,
  }],
}))

const visitorsChart = computed(() => ({
  labels: chartLabels.value,
  datasets: [{
    label: 'Visitors',
    data: filteredMetrics.value.map((metric) => metric.visitors),
    borderColor: '#6dd7c3',
    backgroundColor: 'rgba(109, 215, 195, 0.12)',
    fill: false,
    tension: 0.35,
    pointRadius: 3,
    pointBackgroundColor: '#6dd7c3',
  }],
}))

const conversionsChart = computed(() => ({
  labels: chartLabels.value,
  datasets: [{
    label: 'Conversions',
    data: filteredMetrics.value.map((metric) => metric.conversions),
    borderColor: '#b19aff',
    backgroundColor: 'rgba(177, 154, 255, 0.2)',
    fill: true,
    tension: 0.35,
    pointRadius: 3,
    pointBackgroundColor: '#b19aff',
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' as const } },
  scales: {
    x: { grid: { display: false }, ticks: { color: isDark.value ? '#9aa7ba' : '#667085' } },
    y: { beginAtZero: true, grid: { color: isDark.value ? '#293548' : '#e7ebf2' }, ticks: { color: isDark.value ? '#9aa7ba' : '#667085' } },
  },
}))

const conversionOptions = computed(() => ({
  ...chartOptions.value,
  scales: {
    ...chartOptions.value.scales,
    y: { ...chartOptions.value.scales.y, min: 0, max: 5, ticks: { ...chartOptions.value.scales.y.ticks, callback: (value: string | number) => `${value}%` } },
  },
}))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <v-app>
    <v-app-bar flat border>
      <v-container class="d-flex align-center px-4 px-md-8" fluid>
        <v-spacer />
        <v-select v-model="selectedMonth" :items="monthOptions" density="compact" hide-details label="Month" variant="outlined" width="180" />
        <v-btn class="ml-2" :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'" variant="text" @click="toggleTheme">
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="dashboard-container px-4 py-8 px-md-8" fluid>
        <div class="mb-8">
          <p class="text-overline text-primary mb-1">Analytics overview</p>
          <h1 class="text-h4 text-md-h3 font-weight-bold">Business performance</h1>
          <p class="text-body-1 text-medium-emphasis mt-2">Track revenue, audience growth, and conversion performance across 2025.</p>
        </div>

        <v-row>
          <v-col v-for="card in cards" :key="card.label" cols="12" sm="6" md="3">
            <v-card class="pa-5 h-100" rounded="lg">
              <div class="d-flex align-start justify-space-between">
                <v-avatar color="primary" variant="tonal" rounded="lg" size="42" class="metric-symbol">
                  {{ card.symbol }}
                </v-avatar>
                <span v-if="selectedMonth !== 'all' && card.change" class="change-indicator text-caption font-weight-bold" :class="card.change.positive ? 'text-success' : 'text-error'">
                  {{ card.change.positive ? 'Trending up' : 'Trending down' }} {{ card.change.label }}
                </span>
              </div>
              <p class="text-body-2 text-medium-emphasis mt-5">{{ card.label }}</p>
              <p class="text-h4 font-weight-bold mt-1">{{ card.value }}</p>
              <p class="text-caption text-medium-emphasis mt-2">{{ selectedMonth === 'all' ? 'Full Year' : 'Compared with previous month' }}</p>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="chart-card pa-5 pa-md-6 h-100" rounded="lg">
              <div class="mb-5"><h2 class="text-h6 font-weight-bold">Monthly revenue</h2><p class="text-body-2 text-medium-emphasis">Revenue by month in USD</p></div>
              <div class="chart-wrap"><Bar :data="revenueChart" :options="chartOptions" /></div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="chart-card pa-5 pa-md-6 h-100" rounded="lg">
              <div class="mb-5"><h2 class="text-h6 font-weight-bold">Visitors over time</h2><p class="text-body-2 text-medium-emphasis">Monthly audience activity</p></div>
              <div class="chart-wrap"><Line :data="visitorsChart" :options="chartOptions" /></div>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card class="pa-5 pa-md-6" rounded="lg">
              <div class="mb-5"><h2 class="text-h6 font-weight-bold">Conversion trend</h2><p class="text-body-2 text-medium-emphasis">Percentage of visitors who placed an order</p></div>
              <div class="area-chart-wrap"><Line :data="conversionsChart" :options="conversionOptions" /></div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
}

.chart-wrap,
.area-chart-wrap {
  width: 100%;
  min-width: 0;
  height: 300px;
}

.chart-card {
  min-width: 0;
  overflow: hidden;
}

.chart-wrap :deep(canvas),
.area-chart-wrap :deep(canvas) {
  max-width: 100%;
}

.area-chart-wrap {
  height: 260px;
}

.change-indicator {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.metric-symbol {
  font-size: 1.15rem;
  font-weight: 700;
}

@media (max-width: 599px) {
  .chart-wrap {
    height: 250px;
  }

  .area-chart-wrap {
    height: 220px;
  }
}
</style>