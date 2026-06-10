import { computed } from 'vue'
import type { Medicine, MedicineUsage, MedicineCategory, MedicineAnalytics, MedicineSortKey, MedicineSortOrder, StockChangeRecord } from '@/types'
import {
  medicines, medicineUsages, stockChanges, currentBabyId,
  currentUserId, persistData, genId,
  canAddRecord, canDeleteRecord, canEditRecord, getMemberName,
} from './useSharedStore'

const EXPIRY_WARNING_DAYS = 30
const RESTOCK_BUFFER_DAYS = 7

export function useMedicine() {
  const currentMedicines = computed(() =>
    medicines.value
      .filter(m => m.babyId === currentBabyId.value)
      .sort((a, b) => {
        const aLow = a.remainingQuantity <= a.lowStockThreshold ? 0 : 1
        const bLow = b.remainingQuantity <= b.lowStockThreshold ? 0 : 1
        return aLow - bLow
      })
  )

  const currentUsages = computed(() =>
    medicineUsages.value
      .filter(u => u.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const currentStockChanges = computed(() =>
    stockChanges.value
      .filter(c => c.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const expiredMedicines = computed(() =>
    currentMedicines.value.filter(m => {
      if (!m.expiryDate) return false
      return new Date(m.expiryDate).getTime() < Date.now()
    })
  )

  const expiringSoonMedicines = computed(() =>
    currentMedicines.value.filter(m => {
      if (!m.expiryDate) return false
      const expiry = new Date(m.expiryDate).getTime()
      const now = Date.now()
      return expiry >= now && expiry < now + EXPIRY_WARNING_DAYS * 86400000
    })
  )

  const lowStockMedicines = computed(() =>
    currentMedicines.value.filter(m => m.remainingQuantity <= m.lowStockThreshold)
  )

  const outOfStockMedicines = computed(() =>
    currentMedicines.value.filter(m => m.remainingQuantity <= 0)
  )

  const medicationItems = computed(() =>
    currentMedicines.value.filter(m => m.category === 'medication')
  )

  const nursingSupplyItems = computed(() =>
    currentMedicines.value.filter(m => m.category === 'nursing_supply')
  )

  const alertCount = computed(() =>
    expiredMedicines.value.length +
    outOfStockMedicines.value.length +
    lowStockMedicines.value.filter(m => m.remainingQuantity > 0).length +
    expiringSoonMedicines.value.length
  )

  const inventorySummary = computed(() => {
    const total = currentMedicines.value.length
    const normal = currentMedicines.value.filter(m => getStockStatus(m) === 'normal').length
    const medicationCount = medicationItems.value.length
    const supplyCount = nursingSupplyItems.value.length
    const totalRemaining = currentMedicines.value.reduce((s, m) => s + m.remainingQuantity, 0)
    return { total, normal, alertCount: alertCount.value, medicationCount, supplyCount, totalRemaining }
  })

  function getMedicineAnalytics(medicineId: string): MedicineAnalytics {
    const medicine = medicines.value.find(m => m.id === medicineId)
    const usages = currentUsages.value.filter(u => u.medicineId === medicineId)

    const now = Date.now()
    const day7 = now - 7 * 86400000
    const day30 = now - 30 * 86400000

    const usageLast7Days = usages
      .filter(u => new Date(u.timestamp).getTime() >= day7)
      .reduce((s, u) => s + u.quantity, 0)

    const usageLast30Days = usages
      .filter(u => new Date(u.timestamp).getTime() >= day30)
      .reduce((s, u) => s + u.quantity, 0)

    const firstUsageTs = usages.length > 0 ? new Date(usages[usages.length - 1].timestamp).getTime() : null
    const totalDays = firstUsageTs ? Math.max(1, Math.round((now - firstUsageTs) / 86400000)) : 0
    const totalUsageQty = usages.reduce((s, u) => s + u.quantity, 0)

    let avgDailyUsage = 0
    if (totalDays > 0 && totalUsageQty > 0) {
      avgDailyUsage = totalUsageQty / totalDays
    } else if (usageLast7Days > 0) {
      avgDailyUsage = usageLast7Days / 7
    } else if (usageLast30Days > 0) {
      avgDailyUsage = usageLast30Days / 30
    }

    let estimatedDaysLeft: number | null = null
    let estimatedDepletionDate: string | null = null
    if (medicine && avgDailyUsage > 0) {
      estimatedDaysLeft = Math.round(medicine.remainingQuantity / avgDailyUsage)
      const depletionDate = new Date(now + estimatedDaysLeft * 86400000)
      estimatedDepletionDate = depletionDate.toISOString()
      if (medicine.expiryDate) {
        const expiryMs = new Date(medicine.expiryDate).getTime()
        if (expiryMs < now + estimatedDaysLeft * 86400000) {
          estimatedDaysLeft = Math.round((expiryMs - now) / 86400000)
          estimatedDepletionDate = medicine.expiryDate
        }
      }
    }

    let restockSuggestedQuantity: number | null = null
    if (medicine && avgDailyUsage > 0) {
      const targetDays = RESTOCK_BUFFER_DAYS * 4
      const neededForTarget = Math.ceil(avgDailyUsage * targetDays)
      if (medicine.remainingQuantity < neededForTarget) {
        restockSuggestedQuantity = neededForTarget - medicine.remainingQuantity
      }
    }

    return {
      avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
      estimatedDaysLeft,
      estimatedDepletionDate,
      usageLast7Days,
      usageLast30Days,
      restockSuggestedQuantity,
    }
  }

  function getStockStatus(medicine: Medicine): 'expired' | 'out_of_stock' | 'low_stock' | 'expiring_soon' | 'normal' {
    if (medicine.expiryDate && new Date(medicine.expiryDate).getTime() < Date.now()) return 'expired'
    if (medicine.remainingQuantity <= 0) return 'out_of_stock'
    if (medicine.remainingQuantity <= medicine.lowStockThreshold) return 'low_stock'
    if (medicine.expiryDate) {
      const expiry = new Date(medicine.expiryDate).getTime()
      const now = Date.now()
      if (expiry < now + EXPIRY_WARNING_DAYS * 86400000) return 'expiring_soon'
    }
    return 'normal'
  }

  function getDaysUntilExpiry(medicine: Medicine): number | null {
    if (!medicine.expiryDate) return null
    return Math.round((new Date(medicine.expiryDate).getTime() - Date.now()) / 86400000)
  }

  function getUsageForMedicine(medicineId: string): MedicineUsage[] {
    return currentUsages.value.filter(u => u.medicineId === medicineId)
  }

  function getRecentUsages(limit: number = 20): MedicineUsage[] {
    return currentUsages.value.slice(0, limit)
  }

  function getStockChangesForMedicine(medicineId: string): StockChangeRecord[] {
    return currentStockChanges.value.filter(c => c.medicineId === medicineId)
  }

  function getRecentStockChanges(limit: number = 20): StockChangeRecord[] {
    return currentStockChanges.value.slice(0, limit)
  }

  function searchMedicines(query: string, category?: MedicineCategory): Medicine[] {
    const q = query.toLowerCase().trim()
    return currentMedicines.value.filter(m => {
      if (category && m.category !== category) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.note.toLowerCase().includes(q)
    })
  }

  function sortMedicines(items: Medicine[], key: MedicineSortKey, order: MedicineSortOrder): Medicine[] {
    const sorted = [...items]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (key) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'zh')
          break
        case 'stock': {
          const aPct = a.totalQuantity > 0 ? a.remainingQuantity / a.totalQuantity : 0
          const bPct = b.totalQuantity > 0 ? b.remainingQuantity / b.totalQuantity : 0
          cmp = aPct - bPct
          break
        }
        case 'expiry': {
          const aDays = a.expiryDate ? getDaysUntilExpiry(a) ?? 9999 : 9999
          const bDays = b.expiryDate ? getDaysUntilExpiry(b) ?? 9999 : 9999
          cmp = aDays - bDays
          break
        }
        case 'usage': {
          const aAnalytics = getMedicineAnalytics(a.id)
          const bAnalytics = getMedicineAnalytics(b.id)
          cmp = aAnalytics.avgDailyUsage - bAnalytics.avgDailyUsage
          break
        }
      }
      return order === 'asc' ? cmp : -cmp
    })
    return sorted
  }

  function addMedicine(record: Omit<Medicine, 'id' | 'babyId' | 'createdBy'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    medicines.value.push({
      ...record,
      id: genId(),
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
    })
    persistData()
    return true
  }

  function updateMedicine(id: string, data: Partial<Medicine>) {
    if (!canEditRecord.value) return false
    const idx = medicines.value.findIndex(m => m.id === id)
    if (idx < 0) return false
    medicines.value[idx] = { ...medicines.value[idx], ...data }
    persistData()
    return true
  }

  function deleteMedicine(id: string) {
    if (!canDeleteRecord.value) return false
    medicines.value = medicines.value.filter(m => m.id !== id)
    medicineUsages.value = medicineUsages.value.filter(u => u.medicineId !== id)
    stockChanges.value = stockChanges.value.filter(c => c.medicineId !== id)
    persistData()
    return true
  }

  function recordUsage(medicineId: string, quantity: number, note: string = '') {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    const medicine = medicines.value.find(m => m.id === medicineId)
    if (!medicine) return false

    const prevQty = medicine.remainingQuantity
    medicine.remainingQuantity = Math.max(0, medicine.remainingQuantity - quantity)
    const newQty = medicine.remainingQuantity

    medicineUsages.value.unshift({
      id: genId(),
      medicineId,
      babyId: currentBabyId.value,
      quantity,
      timestamp: new Date().toISOString(),
      note,
      createdBy: currentUserId.value,
    })

    stockChanges.value.unshift({
      id: genId(),
      medicineId,
      babyId: currentBabyId.value,
      changeType: 'usage',
      quantity: -quantity,
      previousQuantity: prevQty,
      newQuantity: newQty,
      note: note || '使用消耗',
      createdBy: currentUserId.value,
      timestamp: new Date().toISOString(),
    })

    persistData()
    return true
  }

  function restockMedicine(medicineId: string, quantity: number, newExpiryDate?: string, note: string = '') {
    if (!canEditRecord.value) return false
    const medicine = medicines.value.find(m => m.id === medicineId)
    if (!medicine) return false

    const prevQty = medicine.remainingQuantity
    const prevExpiry = medicine.expiryDate

    medicine.remainingQuantity += quantity
    medicine.totalQuantity += quantity
    medicine.purchaseDate = new Date().toISOString()

    if (newExpiryDate) {
      medicine.expiryDate = newExpiryDate
    } else if (prevExpiry && new Date(prevExpiry).getTime() < Date.now()) {
      medicine.expiryDate = undefined
    }

    stockChanges.value.unshift({
      id: genId(),
      medicineId,
      babyId: currentBabyId.value,
      changeType: 'restock',
      quantity,
      previousQuantity: prevQty,
      newQuantity: medicine.remainingQuantity,
      previousExpiryDate: prevExpiry,
      newExpiryDate: medicine.expiryDate,
      note: note || (newExpiryDate ? `补货${quantity}${medicine.unit}，更新有效期` : `补货${quantity}${medicine.unit}`),
      createdBy: currentUserId.value,
      timestamp: new Date().toISOString(),
    })

    persistData()
    return true
  }

  function deleteUsage(id: string) {
    if (!canDeleteRecord.value) return false
    const usage = medicineUsages.value.find(u => u.id === id)
    if (!usage) return false
    const medicine = medicines.value.find(m => m.id === usage.medicineId)
    if (medicine) {
      medicine.remainingQuantity = Math.min(
        medicine.totalQuantity,
        medicine.remainingQuantity + usage.quantity
      )
    }
    medicineUsages.value = medicineUsages.value.filter(u => u.id !== id)
    persistData()
    return true
  }

  return {
    medicines: currentMedicines,
    usages: currentUsages,
    stockChanges: currentStockChanges,
    expiredMedicines,
    expiringSoonMedicines,
    lowStockMedicines,
    outOfStockMedicines,
    medicationItems,
    nursingSupplyItems,
    alertCount,
    inventorySummary,
    canAddRecord,
    canDeleteRecord,
    canEditRecord,
    getMemberName,
    getStockStatus,
    getDaysUntilExpiry,
    getUsageForMedicine,
    getRecentUsages,
    getStockChangesForMedicine,
    getRecentStockChanges,
    getMedicineAnalytics,
    searchMedicines,
    sortMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    recordUsage,
    restockMedicine,
    deleteUsage,
  }
}
