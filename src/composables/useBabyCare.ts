import { ref, computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, ActivityRecord, AppSettings, DaySummary } from '@/types'
import { defaultBaby, defaultSettings, mockFeedings, mockSleeps, mockDiapers } from '@/data/mock'

const STORAGE_KEYS = {
  baby: 'baby-care:baby',
  feedings: 'baby-care:feedings',
  sleeps: 'baby-care:sleeps',
  diapers: 'baby-care:diapers',
  settings: 'baby-care:settings',
  initialized: 'baby-care:initialized',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useBabyCare() {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized)

  const baby = ref<Baby>(load(STORAGE_KEYS.baby, defaultBaby))
  const feedings = ref<FeedingRecord[]>(initialized ? load(STORAGE_KEYS.feedings, []) : [...mockFeedings])
  const sleeps = ref<SleepRecord[]>(initialized ? load(STORAGE_KEYS.sleeps, []) : [...mockSleeps])
  const diapers = ref<DiaperRecord[]>(initialized ? load(STORAGE_KEYS.diapers, []) : [...mockDiapers])
  const settings = ref<AppSettings>(load(STORAGE_KEYS.settings, defaultSettings))

  if (!initialized) {
    save(STORAGE_KEYS.baby, baby.value)
    save(STORAGE_KEYS.feedings, feedings.value)
    save(STORAGE_KEYS.sleeps, sleeps.value)
    save(STORAGE_KEYS.diapers, diapers.value)
    save(STORAGE_KEYS.settings, settings.value)
    localStorage.setItem(STORAGE_KEYS.initialized, 'true')
  }

  function persist() {
    save(STORAGE_KEYS.baby, baby.value)
    save(STORAGE_KEYS.feedings, feedings.value)
    save(STORAGE_KEYS.sleeps, sleeps.value)
    save(STORAGE_KEYS.diapers, diapers.value)
    save(STORAGE_KEYS.settings, settings.value)
  }

  function addFeeding(record: Omit<FeedingRecord, 'id' | 'type'>) {
    feedings.value.unshift({ ...record, id: genId(), type: 'feeding' })
    persist()
  }

  function addSleep(record: Omit<SleepRecord, 'id' | 'type'>) {
    sleeps.value.unshift({ ...record, id: genId(), type: 'sleep' })
    persist()
  }

  function addDiaper(record: Omit<DiaperRecord, 'id' | 'type'>) {
    diapers.value.unshift({ ...record, id: genId(), type: 'diaper' })
    persist()
  }

  function deleteRecord(id: string) {
    feedings.value = feedings.value.filter(r => r.id !== id)
    sleeps.value = sleeps.value.filter(r => r.id !== id)
    diapers.value = diapers.value.filter(r => r.id !== id)
    persist()
  }

  function updateBaby(data: Partial<Baby>) {
    baby.value = { ...baby.value, ...data }
    persist()
  }

  function updateSettings(data: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...data }
    persist()
  }

  const allActivities = computed<ActivityRecord[]>(() => {
    const all: ActivityRecord[] = [
      ...feedings.value,
      ...sleeps.value,
      ...diapers.value,
    ]
    all.sort((a, b) => {
      const ta = a.type === 'sleep' ? (a as SleepRecord).startTime : (a as FeedingRecord | DiaperRecord).timestamp
      const tb = b.type === 'sleep' ? (b as SleepRecord).startTime : (b as FeedingRecord | DiaperRecord).timestamp
      return new Date(tb).getTime() - new Date(ta).getTime()
    })
    return all
  })

  function getDaySummary(date: Date): DaySummary {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 86400000

    const dayFeedings = feedings.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })

    const daySleeps = sleeps.value.filter(r => {
      const t = new Date(r.startTime).getTime()
      return t >= dayStart && t < dayEnd
    })

    const dayDiapers = diapers.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })

    const sleepMinutes = daySleeps.reduce((acc, s) => {
      const diff = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
      return acc + diff / 60000
    }, 0)

    return {
      feedCount: dayFeedings.length,
      totalAmount: dayFeedings.reduce((a, r) => a + r.amount, 0),
      sleepMinutes: Math.round(sleepMinutes),
      diaperCount: dayDiapers.length,
    }
  }

  function getWeekData(days: number = 7): { date: string; summary: DaySummary }[] {
    const result: { date: string; summary: DaySummary }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
      result.push({ date: dateStr, summary: getDaySummary(d) })
    }
    return result
  }

  const todaySummary = computed(() => getDaySummary(new Date()))

  const recentActivities = computed(() => allActivities.value.slice(0, 10))

  return {
    baby,
    feedings,
    sleeps,
    diapers,
    settings,
    allActivities,
    todaySummary,
    recentActivities,
    addFeeding,
    addSleep,
    addDiaper,
    deleteRecord,
    updateBaby,
    updateSettings,
    getDaySummary,
    getWeekData,
  }
}
