import { ref, computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, ActivityRecord, AppSettings, DaySummary } from '@/types'
import { defaultBaby, defaultSettings, mockFeedings, mockSleeps, mockDiapers } from '@/data/mock'
import { useFamily } from '@/composables/useFamily'

const STORAGE_KEYS = {
  babies: 'baby-care:babies',
  feedings: 'baby-care:feedings',
  sleeps: 'baby-care:sleeps',
  diapers: 'baby-care:diapers',
  settings: 'baby-care:settings',
  initialized: 'baby-care:initialized',
  currentBabyId: 'baby-care:current-baby-id',
  currentUserId: 'baby-care:current-user',
}

const SYNC_CHANNEL = 'baby-care:data-sync'

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

let dataSyncChannel: BroadcastChannel | null = null

export function useBabyCare() {
  const { currentUserId, addBabyToFamily } = useFamily()

  const initialized = localStorage.getItem(STORAGE_KEYS.initialized)

  const defaultBabyWithId: Baby = { ...defaultBaby, id: defaultBaby.id || genId() }
  const babies = ref<Baby[]>(load(STORAGE_KEYS.babies, [defaultBabyWithId]))

  const currentBabyId = ref<string>(load(STORAGE_KEYS.currentBabyId, babies.value[0]?.id || ''))

  const feedings = ref<FeedingRecord[]>(initialized ? load(STORAGE_KEYS.feedings, []) : [...mockFeedings])
  const sleeps = ref<SleepRecord[]>(initialized ? load(STORAGE_KEYS.sleeps, []) : [...mockSleeps])
  const diapers = ref<DiaperRecord[]>(initialized ? load(STORAGE_KEYS.diapers, []) : [...mockDiapers])
  const settings = ref<AppSettings>(load(STORAGE_KEYS.settings, defaultSettings))

  if (!initialized) {
    save(STORAGE_KEYS.babies, babies.value)
    save(STORAGE_KEYS.feedings, feedings.value)
    save(STORAGE_KEYS.sleeps, sleeps.value)
    save(STORAGE_KEYS.diapers, diapers.value)
    save(STORAGE_KEYS.settings, settings.value)
    save(STORAGE_KEYS.currentBabyId, currentBabyId.value)
    localStorage.setItem(STORAGE_KEYS.initialized, 'true')
  }

  if (!dataSyncChannel) {
    try {
      dataSyncChannel = new BroadcastChannel(SYNC_CHANNEL)
      dataSyncChannel.onmessage = () => {
        feedings.value = load(STORAGE_KEYS.feedings, [])
        sleeps.value = load(STORAGE_KEYS.sleeps, [])
        diapers.value = load(STORAGE_KEYS.diapers, [])
        babies.value = load(STORAGE_KEYS.babies, [])
      }
    } catch {
      dataSyncChannel = null
    }
  }

  function persist() {
    save(STORAGE_KEYS.babies, babies.value)
    save(STORAGE_KEYS.feedings, feedings.value)
    save(STORAGE_KEYS.sleeps, sleeps.value)
    save(STORAGE_KEYS.diapers, diapers.value)
    save(STORAGE_KEYS.settings, settings.value)
    save(STORAGE_KEYS.currentBabyId, currentBabyId.value)
    if (dataSyncChannel) {
      dataSyncChannel.postMessage({ type: 'data-updated', timestamp: Date.now() })
    }
  }

  const currentBaby = computed<Baby | undefined>(() => {
    return babies.value.find(b => b.id === currentBabyId.value)
  })

  const baby = computed<Baby>(() => currentBaby.value || babies.value[0] || defaultBabyWithId)

  function switchBaby(babyId: string) {
    const target = babies.value.find(b => b.id === babyId)
    if (target) {
      currentBabyId.value = babyId
      persist()
    }
  }

  function addBaby(data: Omit<Baby, 'id'>) {
    const newBaby: Baby = { ...data, id: genId() }
    babies.value.push(newBaby)
    currentBabyId.value = newBaby.id
    addBabyToFamily(newBaby.id)
    persist()
    return newBaby
  }

  function updateBaby(babyId: string, data: Partial<Baby>) {
    const idx = babies.value.findIndex(b => b.id === babyId)
    if (idx >= 0) {
      babies.value[idx] = { ...babies.value[idx], ...data }
      persist()
    }
  }

  function updateCurrentBaby(data: Partial<Baby>) {
    if (currentBaby.value) {
      updateBaby(currentBaby.value.id, data)
    }
  }

  function deleteBaby(babyId: string) {
    if (babies.value.length <= 1) return
    babies.value = babies.value.filter(b => b.id !== babyId)
    feedings.value = feedings.value.filter(r => r.babyId !== babyId)
    sleeps.value = sleeps.value.filter(r => r.babyId !== babyId)
    diapers.value = diapers.value.filter(r => r.babyId !== babyId)
    if (currentBabyId.value === babyId) {
      currentBabyId.value = babies.value[0]?.id || ''
    }
    persist()
  }

  function addFeeding(record: Omit<FeedingRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!currentBabyId.value) return
    feedings.value.unshift({
      ...record,
      id: genId(),
      type: 'feeding',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
  }

  function addSleep(record: Omit<SleepRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!currentBabyId.value) return
    sleeps.value.unshift({
      ...record,
      id: genId(),
      type: 'sleep',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
  }

  function addDiaper(record: Omit<DiaperRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!currentBabyId.value) return
    diapers.value.unshift({
      ...record,
      id: genId(),
      type: 'diaper',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
  }

  function deleteRecord(id: string) {
    feedings.value = feedings.value.filter(r => r.id !== id)
    sleeps.value = sleeps.value.filter(r => r.id !== id)
    diapers.value = diapers.value.filter(r => r.id !== id)
    persist()
  }

  function updateSettings(data: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...data }
    persist()
  }

  const currentFeedings = computed(() =>
    feedings.value.filter(r => r.babyId === currentBabyId.value)
  )
  const currentSleeps = computed(() =>
    sleeps.value.filter(r => r.babyId === currentBabyId.value)
  )
  const currentDiapers = computed(() =>
    diapers.value.filter(r => r.babyId === currentBabyId.value)
  )

  const allActivities = computed<ActivityRecord[]>(() => {
    const all: ActivityRecord[] = [
      ...currentFeedings.value,
      ...currentSleeps.value,
      ...currentDiapers.value,
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

    const dayFeedings = currentFeedings.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })

    const daySleeps = currentSleeps.value.filter(r => {
      const t = new Date(r.startTime).getTime()
      return t >= dayStart && t < dayEnd
    })

    const dayDiapers = currentDiapers.value.filter(r => {
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
    babies,
    baby,
    currentBabyId,
    currentBaby,
    feedings,
    sleeps,
    diapers,
    settings,
    allActivities,
    todaySummary,
    recentActivities,
    switchBaby,
    addBaby,
    updateBaby,
    updateCurrentBaby,
    deleteBaby,
    addFeeding,
    addSleep,
    addDiaper,
    deleteRecord,
    updateSettings,
    getDaySummary,
    getWeekData,
  }
}
