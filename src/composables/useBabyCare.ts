import { computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, ActivityRecord, AppSettings, DaySummary, SleepGoal, SleepGoalDailyAchievement, SleepGoalWeeklyStats } from '@/types'
import {
  babies, feedings, sleeps, diapers, settings, currentBabyId,
  currentUserId, persistData, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, canManageBabies,
  canViewRecord, canExportData, addBabyToFamily, getMemberName,
  needsJoin, isFamilyMember, sleepGoals,
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

  const currentSleepGoal = computed<SleepGoal | null>(() => {
    if (!currentBabyId.value) return null
    const goals = sleepGoals.value.filter(g => g.babyId === currentBabyId.value)
    if (goals.length === 0) return null
    return goals.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  })

  function setSleepGoal(data: Omit<SleepGoal, 'id' | 'babyId' | 'createdAt' | 'updatedAt'> & { babyId?: string }) {
    if (!canManageBabies.value && !canAddRecord.value) return null
    const bid = data.babyId || currentBabyId.value
    if (!bid) return null
    const now = new Date().toISOString()
    const existingIdx = sleepGoals.value.findIndex(g => g.babyId === bid)
    if (existingIdx >= 0) {
      sleepGoals.value[existingIdx] = {
        ...sleepGoals.value[existingIdx],
        ...data,
        babyId: bid,
        updatedAt: now,
      }
      persistData()
      return sleepGoals.value[existingIdx]
    }
    const newGoal: SleepGoal = {
      ...data,
      id: genId(),
      babyId: bid,
      createdAt: now,
      updatedAt: now,
    }
    sleepGoals.value.push(newGoal)
    persistData()
    return newGoal
  }

  function parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  function minutesToTimeStr(min: number): string {
    const h = Math.floor(((min % 1440) + 1440) % 1440 / 60)
    const m = ((min % 1440) + 1440) % 1440 % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  function getTimeDeviation(actual: string | null, target: string, tolerance: number): { achieved: boolean; deviation: number } {
    if (!actual) return { achieved: false, deviation: 999 }
    const actualMin = parseTimeToMinutes(actual)
    const targetMin = parseTimeToMinutes(target)
    let deviation = actualMin - targetMin
    if (deviation > 720) deviation -= 1440
    if (deviation < -720) deviation += 1440
    return {
      achieved: Math.abs(deviation) <= tolerance,
      deviation,
    }
  }

  function getDaySleepTimes(date: Date, caregiverId?: string): { bedtime: string | null; wakeTime: string | null; totalSleepMinutes: number } {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime()
    const dayEnd = dayStart + 86400000
    let daySleeps = currentSleeps.value.filter(r => {
      const t = new Date(r.startTime).getTime()
      return t >= dayStart && t < dayEnd
    })
    if (caregiverId) {
      daySleeps = daySleeps.filter(r => r.caregiverId === caregiverId)
    }
    if (daySleeps.length === 0) {
      return { bedtime: null, wakeTime: null, totalSleepMinutes: 0 }
    }
    daySleeps.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const bedtimeDate = new Date(daySleeps[0].startTime)
    const bedtime = `${bedtimeDate.getHours().toString().padStart(2, '0')}:${bedtimeDate.getMinutes().toString().padStart(2, '0')}`
    const lastSleep = daySleeps[daySleeps.length - 1]
    const wakeTimeDate = new Date(lastSleep.endTime)
    const wakeTime = `${wakeTimeDate.getHours().toString().padStart(2, '0')}:${wakeTimeDate.getMinutes().toString().padStart(2, '0')}`
    const totalSleepMinutes = daySleeps.reduce((acc, s) => {
      const diff = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
      return acc + diff / 60000
    }, 0)
    return { bedtime, wakeTime, totalSleepMinutes: Math.round(totalSleepMinutes) }
  }

  function getSleepGoalDailyAchievement(date: Date, caregiverId?: string): SleepGoalDailyAchievement | null {
    const goal = currentSleepGoal.value
    if (!goal) return null
    const { bedtime, wakeTime, totalSleepMinutes } = getDaySleepTimes(date, caregiverId)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const bedtimeResult = getTimeDeviation(bedtime, goal.targetBedtime, goal.bedtimeToleranceMin)
    const wakeTimeResult = getTimeDeviation(wakeTime, goal.targetWakeTime, goal.wakeTimeToleranceMin)
    const targetSleepMin = goal.targetSleepHours * 60
    const sleepHoursDeviation = totalSleepMinutes - targetSleepMin
    const sleepHoursAchieved = Math.abs(sleepHoursDeviation) <= 60
    return {
      date: dateStr,
      bedtime,
      wakeTime,
      sleepHours: parseFloat((totalSleepMinutes / 60).toFixed(1)),
      bedtimeAchieved: bedtimeResult.achieved,
      wakeTimeAchieved: wakeTimeResult.achieved,
      sleepHoursAchieved,
      bedtimeDeviationMin: bedtimeResult.deviation,
      wakeTimeDeviationMin: wakeTimeResult.deviation,
      sleepHoursDeviationMin: sleepHoursDeviation,
    }
  }

  function getSleepGoalWeeklyStats(days: number = 7, caregiverId?: string): SleepGoalWeeklyStats | null {
    const goal = currentSleepGoal.value
    if (!goal) return null
    const dailyAchievements: SleepGoalDailyAchievement[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const ach = getSleepGoalDailyAchievement(d, caregiverId)
      if (ach) dailyAchievements.push(ach)
    }
    const validDays = dailyAchievements.filter(a => a.bedtime !== null || a.wakeTime !== null || a.sleepHours > 0)
    const bedtimeAchieveRate = validDays.length > 0
      ? validDays.filter(a => a.bedtimeAchieved).length / validDays.length
      : 0
    const wakeTimeAchieveRate = validDays.length > 0
      ? validDays.filter(a => a.wakeTimeAchieved).length / validDays.length
      : 0
    const sleepHoursAchieveRate = validDays.length > 0
      ? validDays.filter(a => a.sleepHoursAchieved).length / validDays.length
      : 0
    const overallAchieveRate = validDays.length > 0
      ? validDays.filter(a => a.bedtimeAchieved && a.wakeTimeAchieved && a.sleepHoursAchieved).length / validDays.length
      : 0
    function calcAvg(arr: number[]) {
      const valid = arr.filter(v => Math.abs(v) < 900)
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
    }
    function calcStd(arr: number[]) {
      const valid = arr.filter(v => Math.abs(v) < 900)
      if (valid.length === 0) return 0
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length
      return Math.sqrt(valid.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / valid.length)
    }
    const avgBedtimeDev = calcAvg(validDays.map(d => d.bedtimeDeviationMin))
    const avgWakeTimeDev = calcAvg(validDays.map(d => d.wakeTimeDeviationMin))
    const avgSleepHoursDev = calcAvg(validDays.map(d => d.sleepHoursDeviationMin))
    return {
      bedtimeAchievementRate: parseFloat((bedtimeAchieveRate * 100).toFixed(0)),
      wakeTimeAchievementRate: parseFloat((wakeTimeAchieveRate * 100).toFixed(0)),
      sleepHoursAchievementRate: parseFloat((sleepHoursAchieveRate * 100).toFixed(0)),
      overallAchievementRate: parseFloat((overallAchieveRate * 100).toFixed(0)),
      avgBedtimeDeviationMin: parseFloat(avgBedtimeDev.toFixed(0)),
      avgWakeTimeDeviationMin: parseFloat(avgWakeTimeDev.toFixed(0)),
      avgSleepHoursDeviationMin: parseFloat(avgSleepHoursDev.toFixed(0)),
      bedtimeStandardDeviationMin: parseFloat(calcStd(validDays.map(d => d.bedtimeDeviationMin)).toFixed(0)),
      wakeTimeStandardDeviationMin: parseFloat(calcStd(validDays.map(d => d.wakeTimeDeviationMin)).toFixed(0)),
      sleepHoursStandardDeviationMin: parseFloat(calcStd(validDays.map(d => d.sleepHoursDeviationMin)).toFixed(0)),
      dailyAchievements,
    }
  }

  return {
    babies,
    baby,
    currentBabyId,
    currentBaby,
    feedings,
    sleeps,
    diapers,
    settings,
    sleepGoals,
    currentSleepGoal,
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
    setSleepGoal,
    getSleepGoalDailyAchievement,
    getSleepGoalWeeklyStats,
    getDaySleepTimes,
    parseTimeToMinutes,
    minutesToTimeStr,
  }
}
