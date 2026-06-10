import { computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, ActivityRecord, AppSettings, DaySummary } from '@/types'
import {
  babies, feedings, sleeps, diapers, settings, currentBabyId,
  currentUserId, persistData, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, canManageBabies,
  canViewRecord, canExportData, addBabyToFamily, getMemberName,
  needsJoin, isFamilyMember,
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
      persistData()
    }
  }

  function addBaby(data: Omit<Baby, 'id'>) {
    if (!canManageBabies.value && !canAddRecord.value) return null
    const newBaby: Baby = { ...data, id: genId() }
    babies.value.push(newBaby)
    currentBabyId.value = newBaby.id
    addBabyToFamily(newBaby.id)
    persistData()
    return newBaby
  }

  function updateBaby(babyId: string, data: Partial<Baby>) {
    if (!canManageBabies.value) return
    const idx = babies.value.findIndex(b => b.id === babyId)
    if (idx >= 0) {
      babies.value[idx] = { ...babies.value[idx], ...data }
      persistData()
    }
  }

  function updateCurrentBaby(data: Partial<Baby>) {
    if (currentBaby.value) {
      updateBaby(currentBaby.value.id, data)
    }
  }

  function deleteBaby(babyId: string) {
    if (!canManageBabies.value) return
    if (babies.value.length <= 1) return
    babies.value = babies.value.filter(b => b.id !== babyId)
    feedings.value = feedings.value.filter(r => r.babyId !== babyId)
    sleeps.value = sleeps.value.filter(r => r.babyId !== babyId)
    diapers.value = diapers.value.filter(r => r.babyId !== babyId)
    if (currentBabyId.value === babyId) {
      currentBabyId.value = babies.value[0]?.id || ''
    }
    persistData()
  }

  function addFeeding(record: Omit<FeedingRecord, 'id' | 'type' | 'babyId' | 'createdBy'> & { caregiverId?: string }) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    feedings.value.unshift({
      ...record,
      id: genId(),
      type: 'feeding',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      caregiverId: record.caregiverId || currentUserId.value,
    })
    persistData()
    return true
  }

  function addSleep(record: Omit<SleepRecord, 'id' | 'type' | 'babyId' | 'createdBy'> & { caregiverId?: string }) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    sleeps.value.unshift({
      ...record,
      id: genId(),
      type: 'sleep',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      caregiverId: record.caregiverId || currentUserId.value,
    })
    persistData()
    return true
  }

  function addDiaper(record: Omit<DiaperRecord, 'id' | 'type' | 'babyId' | 'createdBy'> & { caregiverId?: string }) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    diapers.value.unshift({
      ...record,
      id: genId(),
      type: 'diaper',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      caregiverId: record.caregiverId || currentUserId.value,
    })
    persistData()
    return true
  }

  function canDelete(id: string): boolean {
    if (canDeleteRecord.value) return true
    if (canEditRecord.value) {
      const createdByMe = feedings.value.some(r => r.id === id && r.createdBy === currentUserId.value)
        || sleeps.value.some(r => r.id === id && r.createdBy === currentUserId.value)
        || diapers.value.some(r => r.id === id && r.createdBy === currentUserId.value)
      return createdByMe
    }
    return false
  }

  function deleteRecord(id: string) {
    if (!canDelete(id)) return false
    feedings.value = feedings.value.filter(r => r.id !== id)
    sleeps.value = sleeps.value.filter(r => r.id !== id)
    diapers.value = diapers.value.filter(r => r.id !== id)
    persistData()
    return true
  }

  function updateSettings(data: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...data }
    persistData()
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

  function getDaySummary(date: Date, caregiverId?: string): DaySummary {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 86400000

    let dayFeedings = currentFeedings.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })
    let daySleeps = currentSleeps.value.filter(r => {
      const t = new Date(r.startTime).getTime()
      return t >= dayStart && t < dayEnd
    })
    let dayDiapers = currentDiapers.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })

    if (caregiverId) {
      dayFeedings = dayFeedings.filter(r => r.caregiverId === caregiverId)
      daySleeps = daySleeps.filter(r => r.caregiverId === caregiverId)
      dayDiapers = dayDiapers.filter(r => r.caregiverId === caregiverId)
    }

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

  function getWeekData(days: number = 7, caregiverId?: string): { date: string; summary: DaySummary }[] {
    const result: { date: string; summary: DaySummary }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
      result.push({ date: dateStr, summary: getDaySummary(d, caregiverId) })
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
    canManageBabies,
    canViewRecord,
    canExportData,
    canDelete,
    getMemberName,
    needsJoin,
    isFamilyMember,
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
