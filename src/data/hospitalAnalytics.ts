import dataset from './hospitals_data.json'

export type Granularity = 'day' | 'week' | 'month' | 'year'

export type Hospital = (typeof dataset.hospitals)[number]

export type DailyRecord = {
  date: string
  hospitalId: string
  occupiedBeds: number
  openBeds: number
  reasons: {
    emergency: number
    surgery: number
    infectious: number
    chronic: number
  }
  staffedFtes: number
  requiredFtes: number
}

type AnnualAdjustment = (typeof dataset.annualAdjustments)[number]

type PeriodPoint = {
  label: string
  occupiedBeds: number
  openBeds: number
  capacity: number
  staffedFtes: number
  requiredFtes: number
  reasons: DailyRecord['reasons']
  hospitalOccupancy: Record<string, number>
}

export type HospitalSeries = {
  label: string
  hospitalId: string
  year: number
  data: number[]
}

export type YearSeries = {
  label: string
  year: number
  data: number[]
}

export type DashboardData = {
  hospitals: Hospital[]
  labels: string[]
  years: number[]
  occupancy: HospitalSeries[]
  reasons: Array<YearSeries & { reason: keyof DailyRecord['reasons'] }>
  openBeds: YearSeries[]
  staffing: YearSeries[]
  threshold: number
  summary: {
    occupiedBeds: number
    openBeds: number
    utilization: number
    staffedFtes: number
    requiredFtes: number
    staffingCoverage: number
  }
}

export const hospitals = dataset.hospitals
export const availableYears = dataset.annualAdjustments.map(({ year }) => year)

const reasonDefinitions: Array<{
  key: keyof DailyRecord['reasons']
  label: string
}> = [
  { key: 'emergency', label: 'Emergency / trauma' },
  { key: 'surgery', label: 'Scheduled surgery' },
  { key: 'infectious', label: 'Infectious disease' },
  { key: 'chronic', label: 'Chronic condition' },
]

const yearColors: Record<number, string> = {
  2024: '#397ca5',
  2025: '#148679',
  2026: '#d47342',
}

const yearDashes: Record<number, number[]> = {
  2024: [6, 4],
  2025: [2, 3],
  2026: [],
}
const sampleRecordIndex = new Map(
  dataset.sampleRecords.map((record) => [`${record.date}:${record.hospitalId}`, record]),
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

function roundedDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function monthDayInYear(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)))
}

export function generateDailyRecords(): DailyRecord[] {
  const records: DailyRecord[] = []
  const adjustments = new Map<number, AnnualAdjustment>(
    dataset.annualAdjustments.map((adjustment) => [adjustment.year, adjustment]),
  )

  for (const hospital of hospitals) {
    for (const year of availableYears) {
      const adjustment = adjustments.get(year)!
      const date = new Date(Date.UTC(year, 0, 1))
      const end = new Date(Date.UTC(year + 1, 0, 1))
      let dayOfYear = 0

      while (date < end) {
        const month = date.getUTCMonth()
        const weekday = date.getUTCDay()
        const dailyVariation = Math.sin(dayOfYear * 0.17 + hospital.phase) * 0.016
          + Math.cos(dayOfYear * 0.043 + hospital.phase) * 0.011
          + (weekday === 0 || weekday === 6 ? 0.006 : 0)
        const utilization = clamp(
          hospital.baseOccupancy + hospital.monthlyAdjustments[month] + adjustment.occupancy + dailyVariation,
          0.5,
          0.97,
        )
        const occupiedBeds = Math.round(hospital.capacity * utilization)
        const reasonWobble = Math.sin(dayOfYear * 0.09 + hospital.phase) * 0.018
        const emergencyShare = Math.max(0.05, hospital.reasonMix.emergency + adjustment.emergency + reasonWobble)
        const infectiousShare = Math.max(0.04, hospital.reasonMix.infectious + adjustment.infectious - reasonWobble * 0.7)
        const surgeryShare = hospital.reasonMix.surgery
        const chronicShare = Math.max(0.05, 1 - emergencyShare - infectiousShare - surgeryShare)
        const reasonTotal = emergencyShare + infectiousShare + surgeryShare + chronicShare
        const emergency = Math.round(occupiedBeds * emergencyShare / reasonTotal)
        const surgery = Math.round(occupiedBeds * surgeryShare / reasonTotal)
        const infectious = Math.round(occupiedBeds * infectiousShare / reasonTotal)
        const chronic = occupiedBeds - emergency - surgery - infectious
        const requiredFtes = occupiedBeds * hospital.staffPerOccupiedBed
        const staffingVariation = Math.sin(dayOfYear * 0.13 + hospital.phase) * 0.018
        const staffedFtes = requiredFtes * (1 + adjustment.staffing + staffingVariation)

        const generatedRecord: DailyRecord = {
          date: roundedDate(date),
          hospitalId: hospital.id,
          occupiedBeds,
          openBeds: hospital.capacity - occupiedBeds,
          reasons: { emergency, surgery, infectious, chronic },
          staffedFtes: Math.round(staffedFtes * 10) / 10,
          requiredFtes: Math.round(requiredFtes * 10) / 10,
        }
        records.push(sampleRecordIndex.get(`${generatedRecord.date}:${generatedRecord.hospitalId}`) ?? generatedRecord)
        date.setUTCDate(date.getUTCDate() + 1)
        dayOfYear += 1
      }
    }
  }

  return records
}

const dailyRecords = generateDailyRecords()
const recordIndex = new Map<string, DailyRecord[]>()
for (const record of dailyRecords) {
  const dayRecords = recordIndex.get(record.date) ?? []
  dayRecords.push(record)
  recordIndex.set(record.date, dayRecords)
}

function getBuckets(granularity: Granularity, anchorDate: string, year: number) {
  const [, monthText, dayText] = anchorDate.split('-')
  const month = Number(monthText)
  const day = Number(dayText)

  if (granularity === 'year') {
    return Array.from({ length: 12 }, (_, index) => {
      const currentMonth = index + 1
      const count = new Date(Date.UTC(year, currentMonth, 0)).getUTCDate()
      return {
        label: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, index, 1))),
        dates: Array.from({ length: count }, (_, offset) => `${year}-${String(currentMonth).padStart(2, '0')}-${String(offset + 1).padStart(2, '0')}`),
      }
    })
  }

  if (granularity === 'month') {
    const dateCount = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return Array.from({ length: dateCount }, (_, offset) => ({
      label: String(offset + 1),
      dates: [`${year}-${String(month).padStart(2, '0')}-${String(offset + 1).padStart(2, '0')}`],
    }))
  }

  const anchor = monthDayInYear(year, month, day)
  const count = granularity === 'week' ? 7 : 14
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(anchor)
    date.setUTCDate(date.getUTCDate() - count + offset + 1)
    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date),
      dates: [roundedDate(date)],
    }
  })
}

function summarizeBucket(dates: string[], selectedHospitalIds: Set<string>): PeriodPoint {
  const dayRecords = dates.flatMap((date) => recordIndex.get(date) ?? [])
    .filter((record) => selectedHospitalIds.has(record.hospitalId))
  const selectedHospitalData = hospitals.filter((hospital) => selectedHospitalIds.has(hospital.id))
  const meanFor = (field: keyof Pick<DailyRecord, 'occupiedBeds' | 'openBeds' | 'staffedFtes' | 'requiredFtes'>) =>
    average(dates.map((date) => (recordIndex.get(date) ?? [])
      .filter((record) => selectedHospitalIds.has(record.hospitalId))
      .reduce((total, record) => total + record[field], 0)))

  const reasons = Object.fromEntries(reasonDefinitions.map(({ key }) => [
    key,
    average(dates.map((date) => (recordIndex.get(date) ?? [])
      .filter((record) => selectedHospitalIds.has(record.hospitalId))
      .reduce((total, record) => total + record.reasons[key], 0))),
  ])) as DailyRecord['reasons']

  return {
    label: '',
    occupiedBeds: meanFor('occupiedBeds'),
    openBeds: meanFor('openBeds'),
    capacity: selectedHospitalData.reduce((total, hospital) => total + hospital.capacity, 0),
    staffedFtes: meanFor('staffedFtes'),
    requiredFtes: meanFor('requiredFtes'),
    reasons,
    hospitalOccupancy: Object.fromEntries(selectedHospitalData.map((hospital) => {
      const values = dayRecords.filter((record) => record.hospitalId === hospital.id).map((record) => record.occupiedBeds)
      return [hospital.id, average(values)]
    })),
  }
}

export function getDashboardData({
  granularity,
  anchorDate,
  years,
  hospitalIds,
}: {
  granularity: Granularity
  anchorDate: string
  years: number[]
  hospitalIds: string[]
}): DashboardData {
  const selectedYears = availableYears.filter((year) => years.includes(year))
  const selectedHospitalIds = new Set(hospitalIds.length ? hospitalIds : hospitals.map(({ id }) => id))
  const selectedHospitals = hospitals.filter(({ id }) => selectedHospitalIds.has(id))
  const yearBuckets = selectedYears.map((year) => ({ year, buckets: getBuckets(granularity, anchorDate, year) }))
  const labels = yearBuckets[0]?.buckets.map(({ label }) => label) ?? []
  const pointsByYear = new Map<number, PeriodPoint[]>()

  for (const { year, buckets } of yearBuckets) {
    pointsByYear.set(year, buckets.map((bucket) => ({ ...summarizeBucket(bucket.dates, selectedHospitalIds), label: bucket.label })))
  }

  const occupancy = selectedYears.flatMap((year) => selectedHospitals.map((hospital) => ({
    label: `${hospital.name} · ${year}`,
    hospitalId: hospital.id,
    year,
    data: (pointsByYear.get(year) ?? []).map(({ hospitalOccupancy }) => hospitalOccupancy[hospital.id] ?? 0),
  })))

  const reasons = selectedYears.flatMap((year) => reasonDefinitions.map(({ key, label }) => ({
    label: `${label} · ${year}`,
    reason: key,
    year,
    data: (pointsByYear.get(year) ?? []).map((point) => point.reasons[key]),
  })))

  const openBeds = selectedYears.map((year) => ({
    label: `Open beds · ${year}`,
    year,
    data: (pointsByYear.get(year) ?? []).map(({ openBeds }) => openBeds),
  }))

  const staffing = selectedYears.flatMap((year) => {
    const points = pointsByYear.get(year) ?? []
    return [
      { label: `On duty · ${year}`, year, data: points.map(({ staffedFtes }) => staffedFtes) },
      { label: `Required · ${year}`, year, data: points.map(({ requiredFtes }) => requiredFtes) },
    ]
  })

  const summaryRecords = yearBuckets.flatMap(({ buckets }) => buckets.flatMap(({ dates }) =>
    dates.flatMap((date) => recordIndex.get(date) ?? []).filter(({ hospitalId }) => selectedHospitalIds.has(hospitalId))))
  const summary = {
    occupiedBeds: average(summaryRecords.map(({ occupiedBeds }) => occupiedBeds)),
    openBeds: average(summaryRecords.map(({ openBeds }) => openBeds)),
    utilization: average(summaryRecords.map(({ occupiedBeds }) => {
      const capacity = selectedHospitals.find(({ id }) => id === summaryRecords[0]?.hospitalId)?.capacity ?? 1
      return occupiedBeds / capacity
    })),
    staffedFtes: average(summaryRecords.map(({ staffedFtes }) => staffedFtes)),
    requiredFtes: average(summaryRecords.map(({ requiredFtes }) => requiredFtes)),
    staffingCoverage: 0,
  }

  const meanCapacity = selectedHospitals.reduce((total, hospital) => total + hospital.capacity, 0)
  const dailyTotals = new Map<string, { occupied: number; open: number; staffed: number; required: number }>()
  for (const record of summaryRecords) {
    const daily = dailyTotals.get(record.date) ?? { occupied: 0, open: 0, staffed: 0, required: 0 }
    daily.occupied += record.occupiedBeds
    daily.open += record.openBeds
    daily.staffed += record.staffedFtes
    daily.required += record.requiredFtes
    dailyTotals.set(record.date, daily)
  }
  const dailyValues = [...dailyTotals.values()]
  summary.occupiedBeds = average(dailyValues.map(({ occupied }) => occupied))
  summary.openBeds = average(dailyValues.map(({ open }) => open))
  summary.utilization = meanCapacity ? summary.occupiedBeds / meanCapacity : 0
  summary.staffedFtes = average(dailyValues.map(({ staffed }) => staffed))
  summary.requiredFtes = average(dailyValues.map(({ required }) => required))
  summary.staffingCoverage = summary.requiredFtes ? summary.staffedFtes / summary.requiredFtes : 0

  return {
    hospitals: selectedHospitals,
    labels,
    years: selectedYears,
    occupancy,
    reasons,
    openBeds,
    staffing,
    threshold: meanCapacity * 0.1,
    summary,
  }
}

export function getYearColor(year: number) {
  return yearColors[year] ?? '#148679'
}

export function getYearDash(year: number) {
  return yearDashes[year] ?? []
}

export const reasonLabels = reasonDefinitions