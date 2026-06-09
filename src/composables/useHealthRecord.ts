import { computed } from 'vue'
import type { GrowthRecord, VaccineRecord, CheckupRecord } from '@/types'
import {
  growths, vaccines, checkups, currentBabyId,
  currentUserId, persistData, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, getMemberName,
} from './useSharedStore'

export function useHealthRecord() {
  const currentGrowths = computed(() =>
    growths.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  )

  const currentVaccines = computed(() =>
    vaccines.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
  )

  const currentCheckups = computed(() =>
    checkups.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const latestGrowth = computed<GrowthRecord | undefined>(() => {
    const arr = currentGrowths.value
    return arr.length > 0 ? arr[arr.length - 1] : undefined
  })

  const upcomingVaccines = computed(() =>
    currentVaccines.value.filter(v => v.status === 'planned')
  )

  const doneVaccines = computed(() =>
    currentVaccines.value.filter(v => v.status === 'done')
  )

  function addGrowth(record: Omit<GrowthRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    growths.value.push({
      ...record,
      id: genId(),
      type: 'growth',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persistData()
    return true
  }

  function updateGrowth(id: string, data: Partial<GrowthRecord>) {
    if (!canEditRecord.value) return false
    const idx = growths.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    growths.value[idx] = { ...growths.value[idx], ...data }
    persistData()
    return true
  }

  function deleteGrowth(id: string) {
    if (!canDeleteRecord.value) return false
    growths.value = growths.value.filter(r => r.id !== id)
    persistData()
    return true
  }

  function addVaccine(record: Omit<VaccineRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    vaccines.value.push({
      ...record,
      id: genId(),
      type: 'vaccine',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persistData()
    return true
  }

  function updateVaccine(id: string, data: Partial<VaccineRecord>) {
    if (!canEditRecord.value) return false
    const idx = vaccines.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    vaccines.value[idx] = { ...vaccines.value[idx], ...data }
    persistData()
    return true
  }

  function markVaccineDone(id: string, actualDate: string) {
    return updateVaccine(id, { status: 'done', actualDate })
  }

  function deleteVaccine(id: string) {
    if (!canDeleteRecord.value) return false
    vaccines.value = vaccines.value.filter(r => r.id !== id)
    persistData()
    return true
  }

  function addCheckup(record: Omit<CheckupRecord, 'id' | 'type' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    checkups.value.unshift({
      ...record,
      id: genId(),
      type: 'checkup',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persistData()
    return true
  }

  function updateCheckup(id: string, data: Partial<CheckupRecord>) {
    if (!canEditRecord.value) return false
    const idx = checkups.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    checkups.value[idx] = { ...checkups.value[idx], ...data }
    persistData()
    return true
  }

  function deleteCheckup(id: string) {
    if (!canDeleteRecord.value) return false
    checkups.value = checkups.value.filter(r => r.id !== id)
    persistData()
    return true
  }

  const growthTrend = computed(() => {
    const data = currentGrowths.value
    if (data.length === 0) return { labels: [], heights: [], weights: [], headCircumferences: [] }
    return {
      labels: data.map(r => {
        const d = new Date(r.timestamp)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      heights: data.map(r => r.height),
      weights: data.map(r => r.weight),
      headCircumferences: data.map(r => r.headCircumference ?? 0),
    }
  })

  const weightGainRate = computed(() => {
    const data = currentGrowths.value
    if (data.length < 2) return null
    const latest = data[data.length - 1]
    const prev = data[data.length - 2]
    const daysDiff = (new Date(latest.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 86400000
    if (daysDiff === 0) return null
    return {
      weightGain: latest.weight - prev.weight,
      heightGain: latest.height - prev.height,
      daysDiff: Math.round(daysDiff),
    }
  })

  return {
    growths: currentGrowths,
    vaccines: currentVaccines,
    checkups: currentCheckups,
    latestGrowth,
    upcomingVaccines,
    doneVaccines,
    growthTrend,
    weightGainRate,
    canAddRecord,
    canDeleteRecord,
    canEditRecord,
    getMemberName,
    addGrowth,
    updateGrowth,
    deleteGrowth,
    addVaccine,
    updateVaccine,
    markVaccineDone,
    deleteVaccine,
    addCheckup,
    updateCheckup,
    deleteCheckup,
  }
}
