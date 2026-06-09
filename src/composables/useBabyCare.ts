import { computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, ActivityRecord, AppSettings, DaySummary } from '@/types'
import {
  babies, feedings, sleeps, diapers, settings, currentBabyId,
  currentUserId, persist, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, addBabyToFamily,
  getMemberName,
} from './useSharedStore'

export function useBabyCare() {
  const currentBaby = computed<Baby | undefined>(() =>
    babies.value.find(b => b.id === currentBabyId.value)
  )

  const baby = computed<Baby>(() => currentBaby.value || babies.value[0] || babies.value[0])

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
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    feedings.value.unshift({
      ...record,
      id: genId(),
      type: 'feeding',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
    return true
  }

  function addSleep(record: Omit<SleepRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    sleeps.value.unshift({
      ...record,
      id: genId(),
      type: 'sleep',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
    return true
  }

  function addDiaper(record: Omit<DiaperRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    diapers.value.unshift({
      ...record,
      id: genId(),
      type: 'diaper',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persist()
    return true
  }

  function canDelete(id: string): boolean {
    if (canDeleteRecord.value) return true
    if (canEditRecord.value) {
      const isOwner = feedings.value.some(r => r.id === id && r.createdBy === currentUserId.value)
        || sleeps.value.some(r => r.id === id && r.createdBy === currentUserId.value)
        || diapers.value.some(r => r.id === id && r.createdBy === currentUserId.value)
      return isOwner
    }
    return false
  }

  function deleteRecord(id: string) {
    if (!canDelete(id)) return false
    feedings.value = feedings.value.filter(r => r.id !== id)
    sleeps.value = sleeps.value.filter(r => r.id !== id)
    diapers.value = diapers.value.filter(r => r.id !== id)
    persist()
    return true
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
    canAddRecord,
    canDeleteRecord,
    canEditRecord,
    canDelete,
    getMemberName,
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
