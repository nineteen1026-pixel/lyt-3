import { computed } from 'vue'
import type { TemperatureRecord, TemperatureDailyStats, TemperatureWeeklyTrend, TemperatureLevel, TemperatureAnomaly, TemperatureReminderSettings } from '@/types'
import { TEMPERATURE_LEVEL_LABELS } from '@/types'
import {
  temperatures, temperatureReminderSettings, currentBabyId,
  currentUserId, persistData, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, getMemberName,
} from './useSharedStore'

export function useTemperature() {
  const currentTemperatures = computed(() =>
    temperatures.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const latestTemperature = computed<TemperatureRecord | undefined>(() => {
    const arr = currentTemperatures.value
    return arr.length > 0 ? arr[0] : undefined
  })

  const todayRecords = computed(() => {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    return currentTemperatures.value.filter(r => r.timestamp.slice(0, 10) === todayStr)
  })

  const todayStats = computed(() => {
    const records = todayRecords.value
    if (records.length === 0) {
      return {
        count: 0,
        avgTemperature: 0,
        maxTemperature: 0,
        minTemperature: 0,
        feverCount: 0,
        highFeverCount: 0,
      }
    }
    const temps = records.map(r => r.temperature)
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length
    const max = Math.max(...temps)
    const min = Math.min(...temps)
    const feverCount = records.filter(r => r.temperature >= temperatureReminderSettings.value.feverThreshold).length
    const highFeverCount = records.filter(r => r.temperature >= temperatureReminderSettings.value.highFeverThreshold).length
    return {
      count: records.length,
      avgTemperature: parseFloat(avg.toFixed(1)),
      maxTemperature: max,
      minTemperature: min,
      feverCount,
      highFeverCount,
    }
  })

  const weeklyStats = computed((): TemperatureDailyStats[] => {
    const days: TemperatureDailyStats[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayRecords = currentTemperatures.value.filter(r => r.timestamp.slice(0, 10) === dateStr)
      if (dayRecords.length > 0) {
        const temps = dayRecords.map(r => r.temperature)
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length
        const max = Math.max(...temps)
        const min = Math.min(...temps)
        const feverCount = dayRecords.filter(r => r.temperature >= temperatureReminderSettings.value.feverThreshold).length
        const highFeverCount = dayRecords.filter(r => r.temperature >= temperatureReminderSettings.value.highFeverThreshold).length
        days.push({
          date: dateStr,
          count: dayRecords.length,
          avgTemperature: parseFloat(avg.toFixed(1)),
          maxTemperature: max,
          minTemperature: min,
          feverCount,
          highFeverCount,
          records: dayRecords,
        })
      } else {
        days.push({
          date: dateStr,
          count: 0,
          avgTemperature: 0,
          maxTemperature: 0,
          minTemperature: 0,
          feverCount: 0,
          highFeverCount: 0,
          records: [],
        })
      }
    }
    return days
  })

  const weeklyTrend = computed((): TemperatureWeeklyTrend => {
    const stats = weeklyStats.value
    const labels = stats.map(s => {
      const d = new Date(s.date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const avgTemperatures = stats.map(s => s.avgTemperature)
    const maxTemperatures = stats.map(s => s.maxTemperature)
    const minTemperatures = stats.map(s => s.minTemperature)
    const temperaturesList = stats.flatMap(s => s.records.map(r => r.temperature))
    return {
      labels,
      temperatures: temperaturesList,
      avgTemperatures,
      maxTemperatures,
      minTemperatures,
    }
  })

  const anomalies = computed((): TemperatureAnomaly[] => {
    const result: TemperatureAnomaly[] = []
    const settings = temperatureReminderSettings.value
    for (const record of currentTemperatures.value) {
      if (record.temperature >= settings.highFeverThreshold) {
        result.push({
          id: `anomaly-${record.id}`,
          recordId: record.id,
          level: 'danger',
          temperature: record.temperature,
          timestamp: record.timestamp,
          description: `体温 ${record.temperature}℃，达到高热标准，请及时就医`,
        })
      } else if (record.temperature >= settings.feverThreshold) {
        result.push({
          id: `anomaly-${record.id}`,
          recordId: record.id,
          level: 'warning',
          temperature: record.temperature,
          timestamp: record.timestamp,
          description: `体温 ${record.temperature}℃，属于低热范围，请注意观察`,
        })
      }
    }
    return result
  })

  const hasFeverToday = computed(() => todayStats.value.feverCount > 0)
  const hasHighFeverToday = computed(() => todayStats.value.highFeverCount > 0)

  function getTemperatureLevel(temp: number): TemperatureLevel {
    const settings = temperatureReminderSettings.value
    if (temp >= 41) return 'hyperthermia'
    if (temp >= settings.highFeverThreshold + 0.5) return 'high'
    if (temp >= settings.feverThreshold) return 'moderate'
    if (temp >= settings.feverThreshold - 0.3) return 'low_grade'
    return 'normal'
  }

  function getTemperatureLevelLabel(temp: number): string {
    return TEMPERATURE_LEVEL_LABELS[getTemperatureLevel(temp)]
  }

  function getTemperatureColor(temp: number): string {
    const level = getTemperatureLevel(temp)
    switch (level) {
      case 'normal': return 'text-mint-500'
      case 'low_grade': return 'text-amber-500'
      case 'moderate': return 'text-orange-500'
      case 'high': return 'text-rose-500'
      case 'hyperthermia': return 'text-red-600'
      default: return 'text-warm-400'
    }
  }

  function getTemperatureBgColor(temp: number): string {
    const level = getTemperatureLevel(temp)
    switch (level) {
      case 'normal': return 'bg-mint-50 dark:bg-mint-500/10'
      case 'low_grade': return 'bg-amber-50 dark:bg-amber-500/10'
      case 'moderate': return 'bg-orange-50 dark:bg-orange-500/10'
      case 'high': return 'bg-rose-50 dark:bg-rose-500/10'
      case 'hyperthermia': return 'bg-red-50 dark:bg-red-500/10'
      default: return 'bg-cream-100'
    }
  }

  function addTemperature(record: Omit<TemperatureRecord, 'id' | 'type' | 'babyId' | 'createdBy'> & { caregiverId?: string }) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    const newRecord: TemperatureRecord = {
      ...record,
      id: genId(),
      type: 'temperature',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      caregiverId: record.caregiverId || currentUserId.value,
    }
    temperatures.value.push(newRecord)
    persistData()
    return true
  }

  function updateTemperature(id: string, data: Partial<TemperatureRecord>) {
    if (!canEditRecord.value) return false
    const idx = temperatures.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    temperatures.value[idx] = { ...temperatures.value[idx], ...data }
    persistData()
    return true
  }

  function deleteTemperature(id: string) {
    if (!canDeleteRecord.value) return false
    temperatures.value = temperatures.value.filter(r => r.id !== id)
    persistData()
    return true
  }

  function updateReminderSettings(settings: Partial<TemperatureReminderSettings>) {
    temperatureReminderSettings.value = { ...temperatureReminderSettings.value, ...settings }
    persistData()
  }

  return {
    temperatures: currentTemperatures,
    latestTemperature,
    todayRecords,
    todayStats,
    weeklyStats,
    weeklyTrend,
    anomalies,
    hasFeverToday,
    hasHighFeverToday,
    reminderSettings: temperatureReminderSettings,
    canAddRecord,
    canDeleteRecord,
    canEditRecord,
    getMemberName,
    getTemperatureLevel,
    getTemperatureLevelLabel,
    getTemperatureColor,
    getTemperatureBgColor,
    addTemperature,
    updateTemperature,
    deleteTemperature,
    updateReminderSettings,
  }
}
