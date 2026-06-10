import { computed, ref } from 'vue'
import type { ReminderItem, MissedRecord, PatternSummary, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'
import {
  feedings, sleeps, diapers, reminders, missedRecords,
  currentBabyId, currentUserId, settings, persistData, genId,
} from './useSharedStore'

function timeAgo(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  return `${d}天前`
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function useReminder() {
  const lastFeeding = computed<FeedingRecord | undefined>(() => {
    const list = feedings.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return list[0]
  })

  const feedingIntervalMin = computed(() => {
    return settings.value.feedingReminder?.intervalMinutes || pattern.value.avgFeedingIntervalMin || 180
  })

  const lastDiaper = computed<DiaperRecord | undefined>(() => {
    const list = diapers.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return list[0]
  })

  const lastSleepEnd = computed<SleepRecord | undefined>(() => {
    const list = sleeps.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    return list[0]
  })

  const pattern = computed<PatternSummary>(() => {
    const now = Date.now()
    const threeDaysAgo = now - 3 * 86400000

    const babyFeedings = feedings.value
      .filter(r => r.babyId === currentBabyId.value && new Date(r.timestamp).getTime() > threeDaysAgo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const babySleeps = sleeps.value
      .filter(r => r.babyId === currentBabyId.value && new Date(r.startTime).getTime() > threeDaysAgo)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const babyDiapers = diapers.value
      .filter(r => r.babyId === currentBabyId.value && new Date(r.timestamp).getTime() > threeDaysAgo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const feedingIntervals: number[] = []
    for (let i = 1; i < babyFeedings.length; i++) {
      const diff = new Date(babyFeedings[i].timestamp).getTime() - new Date(babyFeedings[i - 1].timestamp).getTime()
      if (diff > 0 && diff < 8 * 3600000) feedingIntervals.push(diff)
    }
    const avgFeedingIntervalMin = feedingIntervals.length > 0 ? median(feedingIntervals) / 60000 : 180

    const sleepDurations: number[] = []
    for (const s of babySleeps) {
      const dur = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
      if (dur > 0 && dur < 12 * 3600000) sleepDurations.push(dur)
    }
    const avgSleepDurationMin = sleepDurations.length > 0 ? median(sleepDurations) / 60000 : 90

    const diaperIntervals: number[] = []
    for (let i = 1; i < babyDiapers.length; i++) {
      const diff = new Date(babyDiapers[i].timestamp).getTime() - new Date(babyDiapers[i - 1].timestamp).getTime()
      if (diff > 0 && diff < 8 * 3600000) diaperIntervals.push(diff)
    }
    const avgDiaperIntervalMin = diaperIntervals.length > 0 ? median(diaperIntervals) / 60000 : 180

    const daySet = new Set<string>()
    for (const f of babyFeedings) {
      daySet.add(new Date(f.timestamp).toISOString().slice(0, 10))
    }
    const avgDailyFeedings = daySet.size > 0 ? babyFeedings.length / daySet.size : 5

    const diaperDaySet = new Set<string>()
    for (const d of babyDiapers) {
      diaperDaySet.add(new Date(d.timestamp).toISOString().slice(0, 10))
    }
    const avgDailyDiapers = diaperDaySet.size > 0 ? babyDiapers.length / diaperDaySet.size : 5

    const customInterval = settings.value.feedingReminder?.enabled
      ? (settings.value.feedingReminder.intervalMinutes || avgFeedingIntervalMin)
      : avgFeedingIntervalMin
    const nextFeedingTime = lastFeeding.value
      ? new Date(new Date(lastFeeding.value.timestamp).getTime() + customInterval * 60000).toISOString()
      : null

    const nextDiaperTime = lastDiaper.value
      ? new Date(new Date(lastDiaper.value.timestamp).getTime() + avgDiaperIntervalMin * 60000).toISOString()
      : null

    const nextSleepTime = lastSleepEnd.value
      ? new Date(new Date(lastSleepEnd.value.endTime).getTime() + (avgSleepDurationMin > 120 ? 120 : 90) * 60000).toISOString()
      : null

    return {
      avgFeedingIntervalMin: Math.round(avgFeedingIntervalMin),
      avgSleepDurationMin: Math.round(avgSleepDurationMin),
      avgDiaperIntervalMin: Math.round(avgDiaperIntervalMin),
      avgDailyFeedings: Math.round(avgDailyFeedings * 10) / 10,
      avgDailyDiapers: Math.round(avgDailyDiapers * 10) / 10,
      nextFeedingTime,
      nextDiaperTime,
      nextSleepTime,
    }
  })

  const pendingReminders = computed(() =>
    reminders.value
      .filter(r => r.babyId === currentBabyId.value && r.status === 'pending')
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
  )

  const overdueReminders = computed(() =>
    reminders.value
      .filter(r => r.babyId === currentBabyId.value && r.status === 'overdue')
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
  )

  const pendingMissed = computed(() =>
    missedRecords.value
      .filter(r => r.babyId === currentBabyId.value && r.status === 'pending')
      .sort((a, b) => new Date(a.suggestedTime).getTime() - new Date(b.suggestedTime).getTime())
  )

  const timeSinceLastFeeding = computed(() => {
    if (!lastFeeding.value) return null
    return Date.now() - new Date(lastFeeding.value.timestamp).getTime()
  })

  const timeSinceLastDiaper = computed(() => {
    if (!lastDiaper.value) return null
    return Date.now() - new Date(lastDiaper.value.timestamp).getTime()
  })

  const timeSinceLastSleepEnd = computed(() => {
    if (!lastSleepEnd.value) return null
    return Date.now() - new Date(lastSleepEnd.value.endTime).getTime()
  })

  function deduplicateReminders() {
    const seen = new Set<string>()
    const before = reminders.value.length
    reminders.value = reminders.value.filter(r => {
      if (r.status !== 'pending' && r.status !== 'overdue') return true
      const key = `${r.type}-${r.scheduledTime}-${r.babyId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (reminders.value.length < before) persistData()
  }

  function generateReminders() {
    const now = new Date()
    const newItems: ReminderItem[] = []

    const existingKeys = new Set(
      reminders.value
        .filter(r => (r.status === 'pending' || r.status === 'overdue') && r.babyId === currentBabyId.value)
        .map(r => `${r.type}-${r.scheduledTime}`)
    )

    if (pattern.value.nextFeedingTime) {
      const nextTime = new Date(pattern.value.nextFeedingTime)
      const key = `feeding-${pattern.value.nextFeedingTime}`
      if (nextTime > now && !existingKeys.has(key)) {
        const minsUntil = Math.round((nextTime.getTime() - now.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'feeding',
          title: '该喂奶了',
          description: `距离上次喂奶已过${timeAgo(timeSinceLastFeeding.value || 0)}，预计${minsUntil}分钟后需要喂奶`,
          scheduledTime: pattern.value.nextFeedingTime,
          status: 'pending',
          priority: minsUntil < 15 ? 'high' : minsUntil < 30 ? 'medium' : 'low',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
      if (nextTime <= now && !existingKeys.has(key)) {
        const overdueMins = Math.round((now.getTime() - nextTime.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'feeding',
          title: '喂奶提醒（已超时）',
          description: `已超过预计喂奶时间${overdueMins}分钟，请尽快喂奶`,
          scheduledTime: pattern.value.nextFeedingTime,
          status: 'overdue',
          priority: 'high',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
    }

    if (pattern.value.nextDiaperTime) {
      const nextTime = new Date(pattern.value.nextDiaperTime)
      const key = `diaper-${pattern.value.nextDiaperTime}`
      if (nextTime > now && !existingKeys.has(key)) {
        const minsUntil = Math.round((nextTime.getTime() - now.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'diaper',
          title: '该换尿布了',
          description: `距离上次换尿布已过${timeAgo(timeSinceLastDiaper.value || 0)}，预计${minsUntil}分钟后需要更换`,
          scheduledTime: pattern.value.nextDiaperTime,
          status: 'pending',
          priority: minsUntil < 15 ? 'high' : minsUntil < 30 ? 'medium' : 'low',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
      if (nextTime <= now && !existingKeys.has(key)) {
        const overdueMins = Math.round((now.getTime() - nextTime.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'diaper',
          title: '尿布提醒（已超时）',
          description: `已超过预计换尿布时间${overdueMins}分钟，请检查`,
          scheduledTime: pattern.value.nextDiaperTime,
          status: 'overdue',
          priority: 'high',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
    }

    if (pattern.value.nextSleepTime) {
      const nextTime = new Date(pattern.value.nextSleepTime)
      const key = `sleep-${pattern.value.nextSleepTime}`
      if (nextTime > now && !existingKeys.has(key)) {
        const minsUntil = Math.round((nextTime.getTime() - now.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'sleep',
          title: '该哄睡了',
          description: `距离上次醒来自由活动${timeAgo(timeSinceLastSleepEnd.value || 0)}，预计${minsUntil}分钟后需要入睡`,
          scheduledTime: pattern.value.nextSleepTime,
          status: 'pending',
          priority: minsUntil < 15 ? 'high' : minsUntil < 30 ? 'medium' : 'low',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
      if (nextTime <= now && !existingKeys.has(key)) {
        const overdueMins = Math.round((now.getTime() - nextTime.getTime()) / 60000)
        newItems.push({
          id: genId(),
          type: 'sleep',
          title: '睡眠提醒（已超时）',
          description: `已超过预计入睡时间${overdueMins}分钟，请尽快哄睡`,
          scheduledTime: pattern.value.nextSleepTime,
          status: 'overdue',
          priority: 'high',
          babyId: currentBabyId.value,
          createdAt: now.toISOString(),
        })
      }
    }

    if (newItems.length > 0) {
      reminders.value.push(...newItems)
      persistData()
    }

    return newItems
  }

  function detectMissedRecords() {
    const now = Date.now()
    const oneDayAgo = now - 86400000
    const newMissed: MissedRecord[] = []

    const existingMissedKeys = new Set(
      missedRecords.value
        .filter(r => r.status === 'pending' && r.babyId === currentBabyId.value)
        .map(r => `${r.type}-${r.suggestedTime}`)
    )

    const babyFeedings = feedings.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const avgFeedInterval = pattern.value.avgFeedingIntervalMin * 60000
    for (let i = 1; i < babyFeedings.length; i++) {
      const gap = new Date(babyFeedings[i].timestamp).getTime() - new Date(babyFeedings[i - 1].timestamp).getTime()
      if (gap > avgFeedInterval * 2.2) {
        const suggestedTime = new Date(new Date(babyFeedings[i - 1].timestamp).getTime() + avgFeedInterval).toISOString()
        const key = `feeding-${suggestedTime}`
        if (!existingMissedKeys.has(key)) {
          newMissed.push({
            id: genId(),
            type: 'feeding',
            suggestedTime,
            description: `喂奶间隔异常（${Math.round(gap / 60000)}分钟 vs 平均${pattern.value.avgFeedingIntervalMin}分钟），可能漏记`,
            babyId: currentBabyId.value,
            status: 'pending',
          })
        }
      }
    }

    if (babyFeedings.length > 0) {
      const lastFeedTime = new Date(babyFeedings[babyFeedings.length - 1].timestamp).getTime()
      if (lastFeedTime < oneDayAgo && now - lastFeedTime > avgFeedInterval * 2.2) {
        const suggestedTime = new Date(lastFeedTime + avgFeedInterval).toISOString()
        const key = `feeding-${suggestedTime}`
        if (!existingMissedKeys.has(key)) {
          newMissed.push({
            id: genId(),
            type: 'feeding',
            suggestedTime,
            description: `距上次喂奶已${Math.round((now - lastFeedTime) / 60000)}分钟，可能漏记`,
            babyId: currentBabyId.value,
            status: 'pending',
          })
        }
      }
    }

    const babyDiapers = diapers.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const avgDiaperInterval = pattern.value.avgDiaperIntervalMin * 60000
    for (let i = 1; i < babyDiapers.length; i++) {
      const gap = new Date(babyDiapers[i].timestamp).getTime() - new Date(babyDiapers[i - 1].timestamp).getTime()
      if (gap > avgDiaperInterval * 2.5) {
        const suggestedTime = new Date(new Date(babyDiapers[i - 1].timestamp).getTime() + avgDiaperInterval).toISOString()
        const key = `diaper-${suggestedTime}`
        if (!existingMissedKeys.has(key)) {
          newMissed.push({
            id: genId(),
            type: 'diaper',
            suggestedTime,
            description: `尿布间隔异常（${Math.round(gap / 60000)}分钟 vs 平均${pattern.value.avgDiaperIntervalMin}分钟），可能漏记`,
            babyId: currentBabyId.value,
            status: 'pending',
          })
        }
      }
    }

    const babySleeps = sleeps.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    for (let i = 1; i < babySleeps.length; i++) {
      const prevEnd = new Date(babySleeps[i - 1].endTime).getTime()
      const currStart = new Date(babySleeps[i].startTime).getTime()
      const awakeDuration = currStart - prevEnd
      if (awakeDuration > 5 * 3600000) {
        const suggestedStart = new Date(prevEnd + 2 * 3600000).toISOString()
        const suggestedEnd = new Date(prevEnd + 3.5 * 3600000).toISOString()
        const key = `sleep-${suggestedStart}`
        if (!existingMissedKeys.has(key)) {
          newMissed.push({
            id: genId(),
            type: 'sleep',
            suggestedTime: suggestedStart,
            endTime: suggestedEnd,
            description: `清醒时间过长（${Math.round(awakeDuration / 3600000)}小时），可能漏记一次睡眠`,
            babyId: currentBabyId.value,
            status: 'pending',
          })
        }
      }
    }

    if (newMissed.length > 0) {
      missedRecords.value.push(...newMissed)
      persistData()
    }

    return newMissed
  }

  function dismissReminder(id: string) {
    const r = reminders.value.find(item => item.id === id)
    if (r) {
      r.status = 'dismissed'
      persistData()
    }
  }

  function completeReminder(id: string) {
    const r = reminders.value.find(item => item.id === id)
    if (r) {
      r.status = 'done'
      persistData()
    }
  }

  function dismissMissed(id: string) {
    const r = missedRecords.value.find(item => item.id === id)
    if (r) {
      r.status = 'dismissed'
      persistData()
    }
  }

  function markMissedAsFilled(id: string) {
    const r = missedRecords.value.find(item => item.id === id)
    if (r) {
      r.status = 'filled'
      persistData()
    }
  }

  function fillMissedFeeding(missedId: string, feedingType: 'breast' | 'formula' | 'mixed', duration: number, amount: number, breastSide?: 'left' | 'right' | 'both' | 'alternate') {
    const missed = missedRecords.value.find(r => r.id === missedId)
    if (!missed || missed.type !== 'feeding') return false
    const isBreast = feedingType === 'breast' || feedingType === 'mixed'
    const isFormula = feedingType === 'formula' || feedingType === 'mixed'
    feedings.value.unshift({
      id: genId(),
      type: 'feeding',
      babyId: currentBabyId.value,
      timestamp: missed.suggestedTime,
      feedingType,
      duration: isBreast ? duration : 0,
      amount: isFormula ? amount : 0,
      breastSide: isBreast ? (breastSide || 'alternate') : undefined,
      note: '漏记补录',
      createdBy: 'system',
      caregiverId: currentUserId.value,
    })
    missed.status = 'filled'
    persistData()
    return true
  }

  function fillMissedSleep(missedId: string, quality: 'deep' | 'light' | 'fussy') {
    const missed = missedRecords.value.find(r => r.id === missedId)
    if (!missed || missed.type !== 'sleep') return false
    const startTime = new Date(missed.suggestedTime)
    const endTime = missed.endTime
      ? new Date(missed.endTime)
      : new Date(startTime.getTime() + pattern.value.avgSleepDurationMin * 60000)
    sleeps.value.unshift({
      id: genId(),
      type: 'sleep',
      babyId: currentBabyId.value,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      quality,
      note: '漏记补录',
      createdBy: 'system',
      caregiverId: currentUserId.value,
    })
    missed.status = 'filled'
    persistData()
    return true
  }

  function fillMissedDiaper(missedId: string, diaperType: 'wet' | 'dirty' | 'mixed') {
    const missed = missedRecords.value.find(r => r.id === missedId)
    if (!missed || missed.type !== 'diaper') return false
    diapers.value.unshift({
      id: genId(),
      type: 'diaper',
      babyId: currentBabyId.value,
      timestamp: missed.suggestedTime,
      diaperType,
      note: '漏记补录',
      createdBy: 'system',
      caregiverId: currentUserId.value,
    })
    missed.status = 'filled'
    persistData()
    return true
  }

  let notifPermissionGranted = ref(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  async function requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') {
      notifPermissionGranted.value = true
      return true
    }
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    notifPermissionGranted.value = result === 'granted'
    return result === 'granted'
  }

  function sendNotification(title: string, body: string) {
    if (!settings.value.notifications) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `baby-care-${Date.now()}`,
      })
    } catch {}
  }

  function pushReminders() {
    const now = Date.now()
    let pushed = 0
    for (const r of reminders.value) {
      if (r.status !== 'pending' || r.babyId !== currentBabyId.value) continue
      const scheduled = new Date(r.scheduledTime).getTime()
      if (scheduled <= now) {
        r.status = 'overdue'
        sendNotification(r.title, r.description)
        pushed++
      }
    }
    if (pushed > 0) persistData()
    return pushed
  }

  function refreshAll() {
    deduplicateReminders()
    const newReminders = generateReminders()
    const newMissed = detectMissedRecords()
    const pushed = pushReminders()
    return { newReminders, newMissed, pushed }
  }

  return {
    pattern,
    pendingReminders,
    overdueReminders,
    pendingMissed,
    lastFeeding,
    lastDiaper,
    lastSleepEnd,
    timeSinceLastFeeding,
    timeSinceLastDiaper,
    timeSinceLastSleepEnd,
    notifPermissionGranted,
    feedingIntervalMin,
    generateReminders,
    detectMissedRecords,
    dismissReminder,
    completeReminder,
    dismissMissed,
    markMissedAsFilled,
    fillMissedFeeding,
    fillMissedSleep,
    fillMissedDiaper,
    requestNotificationPermission,
    sendNotification,
    pushReminders,
    refreshAll,
  }
}
