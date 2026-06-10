<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Pill, Package, Plus, AlertTriangle, Clock,
  Check, X, Trash2, ShoppingCart, History, ChevronDown,
  ChevronRight, PackageCheck, AlertCircle, TrendingDown,
  Search, ArrowUpDown, BarChart3, Timer, Sparkles, Edit3,
  FileText,
} from 'lucide-vue-next'
import { useMedicine } from '@/composables/useMedicine'
import type { Medicine, MedicineCategory, MedicineSortKey, MedicineSortOrder, StockChangeType } from '@/types'
import { MEDICINE_CATEGORY_LABELS } from '@/types'

const router = useRouter()
const {
  medicines, usages, stockChanges, expiredMedicines, expiringSoonMedicines,
  lowStockMedicines, outOfStockMedicines, medicationItems,
  nursingSupplyItems, alertCount, inventorySummary, canAddRecord, canDeleteRecord, canEditRecord,
  getMemberName, getStockStatus, getDaysUntilExpiry,
  getUsageForMedicine, getRecentUsages, getStockChangesForMedicine, getRecentStockChanges,
  getMedicineAnalytics,
  searchMedicines, sortMedicines, addMedicine, deleteMedicine,
  recordUsage, restockMedicine, deleteUsage, updateMedicine,
} = useMedicine()

type TabKey = 'overview' | 'inventory' | 'usage' | 'alerts'
const activeTab = ref<TabKey>('overview')
const usageSubTab = ref<'usage' | 'stock'>('usage')

const tabs: { key: TabKey; label: string; icon: typeof Pill }[] = [
  { key: 'overview', label: '概览', icon: BarChart3 },
  { key: 'alerts', label: '预警', icon: AlertTriangle },
  { key: 'inventory', label: '库存', icon: Package },
  { key: 'usage', label: '使用记录', icon: History },
]

type CategoryFilter = 'all' | 'medication' | 'nursing_supply'
const categoryFilter = ref<CategoryFilter>('all')
const searchQuery = ref('')
const sortKey = ref<MedicineSortKey>('stock')
const sortOrder = ref<MedicineSortOrder>('asc')

const showAddMedicine = ref(false)
const showUsageModal = ref(false)
const showRestockModal = ref(false)
const showEditModal = ref(false)
const selectedMedicine = ref<Medicine | null>(null)
const expandedMedicineId = ref<string | null>(null)

const newMedicine = ref({
  name: '',
  category: 'medication' as MedicineCategory,
  unit: '粒',
  totalQuantity: 30,
  remainingQuantity: 30,
  expiryDate: '',
  lowStockThreshold: 5,
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: '',
})

const usageForm = ref({ quantity: 1, note: '' })
const restockForm = ref({ quantity: 1, newExpiryDate: '', note: '' })
const editForm = ref({
  name: '',
  category: 'medication' as MedicineCategory,
  unit: '',
  lowStockThreshold: 5,
  expiryDate: '',
  note: '',
})

const filteredMedicines = computed(() => {
  let result = searchMedicines(searchQuery.value, categoryFilter.value === 'all' ? undefined : categoryFilter.value)
  result = sortMedicines(result, sortKey.value, sortOrder.value)
  return result
})

const topRestockSuggestions = computed(() => {
  return currentMedicinesWithAnalytics.value
    .filter(item => item.analytics.restockSuggestedQuantity !== null)
    .sort((a, b) => (a.analytics.estimatedDaysLeft ?? 9999) - (b.analytics.estimatedDaysLeft ?? 9999))
    .slice(0, 5)
})

const currentMedicinesWithAnalytics = computed(() =>
  medicines.value.map(m => ({
    medicine: m,
    analytics: getMedicineAnalytics(m.id),
  }))
)

const healthScore = computed(() => {
  const total = medicines.value.length
  if (total === 0) return 100
  const normal = inventorySummary.value.normal
  return Math.round((normal / total) * 100)
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getStockPercent(medicine: Medicine) {
  if (medicine.totalQuantity === 0) return 0
  return Math.round((medicine.remainingQuantity / medicine.totalQuantity) * 100)
}

function getStatusColor(status: ReturnType<typeof getStockStatus>) {
  switch (status) {
    case 'expired': return 'bg-red-100 dark:bg-red-500/20 text-red-500'
    case 'out_of_stock': return 'bg-red-100 dark:bg-red-500/20 text-red-500'
    case 'low_stock': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-500'
    case 'expiring_soon': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'
    default: return 'bg-mint-100 dark:bg-mint-500/20 text-mint-500'
  }
}

function getStatusLabel(status: ReturnType<typeof getStockStatus>) {
  switch (status) {
    case 'expired': return '已过期'
    case 'out_of_stock': return '已用完'
    case 'low_stock': return '库存不足'
    case 'expiring_soon': return '即将过期'
    default: return '正常'
  }
}

function getStockBarColor(medicine: Medicine) {
  const status = getStockStatus(medicine)
  switch (status) {
    case 'expired': return 'bg-red-400'
    case 'out_of_stock': return 'bg-red-400'
    case 'low_stock': return 'bg-amber-400'
    case 'expiring_soon': return 'bg-orange-400'
    default: return 'bg-mint-400'
  }
}

function getHealthColor(score: number) {
  if (score >= 80) return 'text-mint-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

function getHealthBg(score: number) {
  if (score >= 80) return 'bg-mint-50 dark:bg-mint-500/10'
  if (score >= 50) return 'bg-amber-50 dark:bg-amber-500/10'
  return 'bg-red-50 dark:bg-red-500/10'
}

function toggleSort(key: MedicineSortKey) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

function handleAddMedicine() {
  addMedicine({
    name: newMedicine.value.name,
    category: newMedicine.value.category,
    unit: newMedicine.value.unit,
    totalQuantity: newMedicine.value.totalQuantity,
    remainingQuantity: newMedicine.value.remainingQuantity,
    expiryDate: newMedicine.value.expiryDate || undefined,
    lowStockThreshold: newMedicine.value.lowStockThreshold,
    purchaseDate: new Date(newMedicine.value.purchaseDate).toISOString(),
    note: newMedicine.value.note,
  })
  showAddMedicine.value = false
  newMedicine.value = {
    name: '',
    category: 'medication',
    unit: '粒',
    totalQuantity: 30,
    remainingQuantity: 30,
    expiryDate: '',
    lowStockThreshold: 5,
    purchaseDate: new Date().toISOString().slice(0, 10),
    note: '',
  }
}

function openUsageModal(medicine: Medicine) {
  selectedMedicine.value = medicine
  usageForm.value = { quantity: 1, note: '' }
  showUsageModal.value = true
}

function handleRecordUsage() {
  if (!selectedMedicine.value) return
  if (usageForm.value.quantity <= 0 || usageForm.value.quantity > selectedMedicine.value.remainingQuantity) return
  const ok = recordUsage(selectedMedicine.value.id, usageForm.value.quantity, usageForm.value.note)
  if (!ok) return
  showUsageModal.value = false
  selectedMedicine.value = null
}

function openRestockModal(medicine: Medicine, suggestedQty?: number) {
  selectedMedicine.value = medicine
  const isExpired = medicine.expiryDate ? new Date(medicine.expiryDate).getTime() < Date.now() : false
  restockForm.value = {
    quantity: suggestedQty || 1,
    newExpiryDate: '',
    note: '',
  }
  if (isExpired) {
    restockForm.value.note = '新批次替换过期物品'
  }
  showRestockModal.value = true
}

function handleRestock() {
  if (!selectedMedicine.value) return
  const newExpiry = restockForm.value.newExpiryDate
    ? new Date(restockForm.value.newExpiryDate).toISOString()
    : undefined
  restockMedicine(selectedMedicine.value.id, restockForm.value.quantity, newExpiry, restockForm.value.note)
  showRestockModal.value = false
  selectedMedicine.value = null
}

function openEditModal(medicine: Medicine) {
  selectedMedicine.value = medicine
  editForm.value = {
    name: medicine.name,
    category: medicine.category,
    unit: medicine.unit,
    lowStockThreshold: medicine.lowStockThreshold,
    expiryDate: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '',
    note: medicine.note,
  }
  showEditModal.value = true
}

function handleEdit() {
  if (!selectedMedicine.value) return
  updateMedicine(selectedMedicine.value.id, {
    name: editForm.value.name,
    category: editForm.value.category,
    unit: editForm.value.unit,
    lowStockThreshold: editForm.value.lowStockThreshold,
    expiryDate: editForm.value.expiryDate ? new Date(editForm.value.expiryDate).toISOString() : undefined,
    note: editForm.value.note,
  })
  showEditModal.value = false
  selectedMedicine.value = null
}

function toggleExpand(id: string) {
  expandedMedicineId.value = expandedMedicineId.value === id ? null : id
}

function handleDeleteMedicine(id: string) {
  if (confirm('确定删除此物品？相关使用记录也将一并删除。')) {
    deleteMedicine(id)
  }
}

function handleDeleteUsage(id: string) {
  deleteUsage(id)
}

const STOCK_CHANGE_LABELS: Record<StockChangeType, string> = {
  restock: '补货',
  usage: '使用',
  adjustment: '调整',
  expiry_clear: '过期清理',
}

function getChangeTypeStyle(type: StockChangeType) {
  switch (type) {
    case 'restock': return 'bg-mint-100 dark:bg-mint-500/20 text-mint-500'
    case 'usage': return 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
    case 'adjustment': return 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-100'
    case 'expiry_clear': return 'bg-red-100 dark:bg-red-500/20 text-red-500'
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Pill :size="20" class="text-peach-400" />
        药品与护理用品
      </h1>
      <div v-if="alertCount > 0" class="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
        {{ alertCount }}
      </div>
    </header>

    <div class="flex gap-1 mb-4 bg-cream-100 dark:bg-warm-500/10 rounded-xl p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all"
        :class="activeTab === tab.key
          ? 'bg-white dark:bg-[#2a1f1a] text-peach-500 shadow-sm'
          : 'text-warm-300 dark:text-warm-200'"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
        <span v-if="tab.key === 'alerts' && alertCount > 0" class="ml-0.5 px-1 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-500 text-[10px]">{{ alertCount }}</span>
      </button>
    </div>

    <!-- Overview Tab -->
    <section v-if="activeTab === 'overview'">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">库存健康度</h2>
          <span class="text-2xl font-extrabold font-display" :class="getHealthColor(healthScore)">{{ healthScore }}%</span>
        </div>
        <div class="h-2 bg-cream-200 dark:bg-warm-500/20 rounded-full overflow-hidden mb-3">
          <div class="h-full rounded-full transition-all" :class="healthScore >= 80 ? 'bg-mint-400' : healthScore >= 50 ? 'bg-amber-400' : 'bg-red-400'" :style="{ width: healthScore + '%' }"></div>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div class="rounded-xl py-2" :class="getHealthBg(healthScore)">
            <p class="text-lg font-extrabold font-display text-warm-500 dark:text-cream-100">{{ inventorySummary.total }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">总物品</p>
          </div>
          <div class="rounded-xl py-2 bg-mint-50 dark:bg-mint-500/10">
            <p class="text-lg font-extrabold font-display text-mint-500">{{ inventorySummary.normal }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">正常</p>
          </div>
          <div class="rounded-xl py-2 bg-peach-50 dark:bg-peach-500/10">
            <p class="text-lg font-extrabold font-display text-peach-500">{{ inventorySummary.medicationCount }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">药品</p>
          </div>
          <div class="rounded-xl py-2 bg-cream-100 dark:bg-cream-300/10">
            <p class="text-lg font-extrabold font-display text-warm-400 dark:text-cream-300">{{ inventorySummary.supplyCount }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">护理用品</p>
          </div>
        </div>
      </div>

      <div v-if="alertCount > 0" class="mb-4">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 flex items-center gap-1">
          <AlertCircle :size="14" class="text-red-400" /> 预警摘要
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <div v-if="expiredMedicines.length > 0" class="bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2.5 border border-red-200 dark:border-red-500/20">
            <p class="text-lg font-extrabold font-display text-red-500">{{ expiredMedicines.length }}</p>
            <p class="text-[10px] text-red-400">已过期</p>
          </div>
          <div v-if="outOfStockMedicines.length > 0" class="bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2.5 border border-red-200 dark:border-red-500/20">
            <p class="text-lg font-extrabold font-display text-red-500">{{ outOfStockMedicines.length }}</p>
            <p class="text-[10px] text-red-400">已用完</p>
          </div>
          <div v-if="lowStockMedicines.filter(m => m.remainingQuantity > 0).length > 0" class="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-500/20">
            <p class="text-lg font-extrabold font-display text-amber-500">{{ lowStockMedicines.filter(m => m.remainingQuantity > 0).length }}</p>
            <p class="text-[10px] text-amber-400">库存不足</p>
          </div>
          <div v-if="expiringSoonMedicines.length > 0" class="bg-orange-50 dark:bg-orange-500/10 rounded-xl px-3 py-2.5 border border-orange-200 dark:border-orange-500/20">
            <p class="text-lg font-extrabold font-display text-orange-500">{{ expiringSoonMedicines.length }}</p>
            <p class="text-[10px] text-orange-400">即将过期</p>
          </div>
        </div>
      </div>

      <div v-if="topRestockSuggestions.length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 flex items-center gap-1">
          <Sparkles :size="14" class="text-peach-400" /> 补货建议
        </h2>
        <div class="space-y-2">
          <div
            v-for="item in topRestockSuggestions"
            :key="item.medicine.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ item.medicine.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">剩余 {{ item.medicine.remainingQuantity }}{{ item.medicine.unit }}</span>
                  <span v-if="item.analytics.estimatedDaysLeft !== null" class="text-[10px] text-amber-500 font-bold">
                    约{{ item.analytics.estimatedDaysLeft }}天用完
                  </span>
                  <span class="text-[10px] text-peach-400">日均{{ item.analytics.avgDailyUsage }}{{ item.medicine.unit }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-peach-100 dark:bg-peach-500/20 text-peach-500">
                  建议补{{ item.analytics.restockSuggestedQuantity }}{{ item.medicine.unit }}
                </span>
                <button v-if="canEditRecord" @click="openRestockModal(item.medicine, item.analytics.restockSuggestedQuantity || undefined)" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500">
                  补货
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="medicines.length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 flex items-center gap-1">
          <Timer :size="14" class="text-mint-400" /> 消耗速率
        </h2>
        <div class="space-y-2">
          <div
            v-for="item in currentMedicinesWithAnalytics.filter(i => i.analytics.avgDailyUsage > 0).sort((a, b) => b.analytics.avgDailyUsage - a.analytics.avgDailyUsage).slice(0, 6)"
            :key="item.medicine.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-2.5 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-warm-500 dark:text-cream-100 truncate">{{ item.medicine.name }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">7日: {{ item.analytics.usageLast7Days }}{{ item.medicine.unit }}</span>
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">30日: {{ item.analytics.usageLast30Days }}{{ item.medicine.unit }}</span>
                </div>
              </div>
              <span class="text-xs font-bold text-peach-500">{{ item.analytics.avgDailyUsage }}{{ item.medicine.unit }}/天</span>
            </div>
          </div>
          <div v-if="currentMedicinesWithAnalytics.filter(i => i.analytics.avgDailyUsage > 0).length === 0" class="text-center py-6">
            <BarChart3 :size="24" class="mx-auto text-warm-300 dark:text-warm-200 mb-1" />
            <p class="text-[10px] text-warm-300 dark:text-warm-200">暂无消耗数据</p>
          </div>
        </div>
      </div>

      <div v-if="alertCount === 0 && medicines.length > 0" class="text-center py-8">
        <PackageCheck :size="40" class="mx-auto text-mint-300 dark:text-mint-400 mb-2" />
        <p class="text-sm font-bold text-mint-500 dark:text-mint-400">库存状态良好</p>
        <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">没有过期、低库存预警</p>
      </div>
      <div v-if="medicines.length === 0" class="text-center py-8">
        <Package :size="40" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm font-bold text-warm-300 dark:text-warm-200">暂无物品</p>
        <button v-if="canAddRecord" @click="showAddMedicine = true" class="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">
          <Plus :size="14" class="inline mr-1" />添加物品
        </button>
      </div>
    </section>

    <!-- Alerts Tab -->
    <section v-if="activeTab === 'alerts'">
      <div v-if="expiredMedicines.length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-red-500 dark:text-red-400 mb-2 flex items-center gap-1">
          <AlertCircle :size="14" /> 已过期 ({{ expiredMedicines.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="med in expiredMedicines"
            :key="med.id"
            class="bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 border border-red-200 dark:border-red-500/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-red-600 dark:text-red-400">{{ med.name }}</p>
                <p class="text-[10px] text-red-400 dark:text-red-300 mt-0.5">
                  过期日期: {{ med.expiryDate ? formatDate(med.expiryDate) : '无' }} · 剩余 {{ med.remainingQuantity }}{{ med.unit }}
                </p>
              </div>
              <div class="flex gap-1.5">
                <button v-if="canEditRecord" @click="openRestockModal(med)" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500">
                  补货
                </button>
                <button v-if="canDeleteRecord" @click="handleDeleteMedicine(med.id)" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-500">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="outOfStockMedicines.length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-red-500 dark:text-red-400 mb-2 flex items-center gap-1">
          <X :size="14" /> 已用完 ({{ outOfStockMedicines.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="med in outOfStockMedicines"
            :key="med.id"
            class="bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 border border-red-200 dark:border-red-500/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-red-600 dark:text-red-400">{{ med.name }}</p>
                <p class="text-[10px] text-red-400 dark:text-red-300 mt-0.5">
                  {{ MEDICINE_CATEGORY_LABELS[med.category] }} · 请尽快补货
                </p>
              </div>
              <button v-if="canEditRecord" @click="openRestockModal(med)" class="px-2 py-1 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500">
                补货
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="lowStockMedicines.filter(m => m.remainingQuantity > 0).length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-amber-500 dark:text-amber-400 mb-2 flex items-center gap-1">
          <TrendingDown :size="14" /> 库存不足 ({{ lowStockMedicines.filter(m => m.remainingQuantity > 0).length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="med in lowStockMedicines.filter(m => m.remainingQuantity > 0)"
            :key="med.id"
            class="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-500/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-amber-600 dark:text-amber-400">{{ med.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 bg-amber-200 dark:bg-amber-500/20 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 rounded-full" :style="{ width: getStockPercent(med) + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-amber-500 font-bold">{{ med.remainingQuantity }}/{{ med.totalQuantity }}{{ med.unit }}</span>
                </div>
              </div>
              <button v-if="canEditRecord" @click="openRestockModal(med)" class="ml-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500">
                补货
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="expiringSoonMedicines.length > 0" class="mb-4">
        <h2 class="text-sm font-bold text-orange-500 dark:text-orange-400 mb-2 flex items-center gap-1">
          <Clock :size="14" /> 即将过期 ({{ expiringSoonMedicines.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="med in expiringSoonMedicines"
            :key="med.id"
            class="bg-orange-50 dark:bg-orange-500/10 rounded-xl px-4 py-3 border border-orange-200 dark:border-orange-500/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">{{ med.name }}</p>
                <p class="text-[10px] text-orange-400 dark:text-orange-300 mt-0.5">
                  还有 {{ getDaysUntilExpiry(med) }} 天过期 · 剩余 {{ med.remainingQuantity }}{{ med.unit }}
                </p>
              </div>
              <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-500">
                {{ getDaysUntilExpiry(med) }}天
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="alertCount === 0" class="text-center py-16">
        <PackageCheck :size="48" class="mx-auto text-mint-300 dark:text-mint-400 mb-3" />
        <p class="text-lg font-bold text-mint-500 dark:text-mint-400">库存状态良好</p>
        <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">没有过期、低库存预警</p>
      </div>
    </section>

    <!-- Inventory Tab -->
    <section v-if="activeTab === 'inventory'">
      <div class="mb-3">
        <div class="relative mb-2">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-warm-300 dark:text-warm-200" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索物品名称或备注..."
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl pl-9 pr-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 shadow-sm"
          />
        </div>
        <div class="flex items-center justify-between">
          <div class="flex gap-1.5">
            <button
              v-for="cf in ([
                { key: 'all', label: '全部' },
                { key: 'medication', label: '药品' },
                { key: 'nursing_supply', label: '护理用品' },
              ] as const)"
              :key="cf.key"
              @click="categoryFilter = cf.key"
              class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
              :class="categoryFilter === cf.key
                ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
                : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
            >
              {{ cf.label }}
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="toggleSort('stock')" class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
              :class="sortKey === 'stock' ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500' : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'">
              <ArrowUpDown :size="10" /> 库存
            </button>
            <button @click="toggleSort('expiry')" class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
              :class="sortKey === 'expiry' ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500' : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'">
              <ArrowUpDown :size="10" /> 效期
            </button>
            <button @click="toggleSort('usage')" class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
              :class="sortKey === 'usage' ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500' : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'">
              <ArrowUpDown :size="10" /> 用量
            </button>
            <button
              v-if="canAddRecord"
              @click="showAddMedicine = !showAddMedicine"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-peach-100 dark:bg-peach-500/20 text-peach-500"
            >
              <Plus :size="12" /> 添加
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAddMedicine" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">物品名称</label>
          <input v-model="newMedicine.name" type="text" placeholder="如：伊可新维生素AD滴剂"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">分类</label>
            <select v-model="newMedicine.category"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300">
              <option value="medication">药品</option>
              <option value="nursing_supply">护理用品</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">单位</label>
            <input v-model="newMedicine.unit" type="text" placeholder="粒/瓶/片/包"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">总数量</label>
            <input v-model.number="newMedicine.totalQuantity" type="number" min="1"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">剩余数量</label>
            <input v-model.number="newMedicine.remainingQuantity" type="number" min="0"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">低库存阈值</label>
            <input v-model.number="newMedicine.lowStockThreshold" type="number" min="0"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">购入日期</label>
            <input v-model="newMedicine.purchaseDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">有效期</label>
          <input v-model="newMedicine.expiryDate" type="date"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="newMedicine.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showAddMedicine = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddMedicine" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div v-if="filteredMedicines.length === 0" class="text-center py-10">
        <Package :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">{{ searchQuery ? '未找到匹配物品' : '暂无物品' }}</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="med in filteredMedicines"
          :key="med.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl shadow-sm overflow-hidden"
        >
          <button
            @click="toggleExpand(med.id)"
            class="w-full px-4 py-3 flex items-center gap-3"
          >
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              :class="med.category === 'medication'
                ? 'bg-peach-100 dark:bg-peach-500/20'
                : 'bg-mint-100 dark:bg-mint-500/20'"
            >
              <Pill v-if="med.category === 'medication'" :size="16" class="text-peach-500" />
              <Package v-else :size="16" class="text-mint-500" />
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">{{ med.name }}</p>
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                  :class="getStatusColor(getStockStatus(med))"
                >{{ getStatusLabel(getStockStatus(med)) }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <div class="flex-1 h-1.5 bg-cream-200 dark:bg-warm-500/20 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" :class="getStockBarColor(med)" :style="{ width: getStockPercent(med) + '%' }"></div>
                </div>
                <span class="text-[10px] text-warm-300 dark:text-warm-200 font-semibold shrink-0">{{ med.remainingQuantity }}/{{ med.totalQuantity }}{{ med.unit }}</span>
              </div>
            </div>
            <component :is="expandedMedicineId === med.id ? ChevronDown : ChevronRight" :size="16" class="text-warm-300 dark:text-warm-200 shrink-0" />
          </button>

          <div v-if="expandedMedicineId === med.id" class="px-4 pb-3 border-t border-cream-100 dark:border-warm-500/10">
            <div class="flex flex-wrap gap-x-4 gap-y-1 py-2 text-[10px] text-warm-300 dark:text-warm-200">
              <span>分类: {{ MEDICINE_CATEGORY_LABELS[med.category] }}</span>
              <span>购入: {{ formatDate(med.purchaseDate) }}</span>
              <span v-if="med.expiryDate">有效期至: {{ formatDate(med.expiryDate) }}</span>
              <span>低库存阈值: {{ med.lowStockThreshold }}{{ med.unit }}</span>
            </div>
            <p v-if="med.note" class="text-[10px] text-warm-300 dark:text-warm-200 mb-2">{{ med.note }}</p>

            <div v-if="getMedicineAnalytics(med.id).avgDailyUsage > 0" class="mb-2 bg-cream-50 dark:bg-warm-500/10 rounded-lg p-2">
              <p class="text-[10px] font-bold text-warm-400 dark:text-warm-100 mb-1 flex items-center gap-1">
                <BarChart3 :size="10" /> 消耗分析
              </p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="text-xs font-bold text-peach-500">{{ getMedicineAnalytics(med.id).avgDailyUsage }}{{ med.unit }}</p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">日均</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-amber-500">{{ getMedicineAnalytics(med.id).usageLast7Days }}{{ med.unit }}</p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">近7日</p>
                </div>
                <div>
                  <p class="text-xs font-bold" :class="getMedicineAnalytics(med.id).estimatedDaysLeft !== null && getMedicineAnalytics(med.id).estimatedDaysLeft! <= 14 ? 'text-red-500' : 'text-mint-500'">
                    {{ getMedicineAnalytics(med.id).estimatedDaysLeft !== null ? getMedicineAnalytics(med.id).estimatedDaysLeft + '天' : '—' }}
                  </p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">预计用完</p>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                v-if="canAddRecord && med.remainingQuantity > 0"
                @click="openUsageModal(med)"
                class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-peach-100 dark:bg-peach-500/20 text-peach-500 hover:bg-peach-200 dark:hover:bg-peach-500/30"
              >
                <Check :size="12" /> 记录使用
              </button>
              <button
                v-if="canEditRecord"
                @click="openRestockModal(med)"
                class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500 hover:bg-mint-200 dark:hover:bg-mint-500/30"
              >
                <ShoppingCart :size="12" /> 补货
              </button>
              <button
                @click="openEditModal(med)"
                class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-100 hover:bg-cream-200 dark:hover:bg-warm-500/20"
              >
                <Edit3 :size="12" />
              </button>
              <button
                v-if="canDeleteRecord"
                @click="handleDeleteMedicine(med.id)"
                class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
              >
                <Trash2 :size="12" />
              </button>
            </div>

            <div v-if="getUsageForMedicine(med.id).length > 0" class="mt-3 pt-2 border-t border-cream-100 dark:border-warm-500/10">
              <p class="text-[10px] font-bold text-warm-400 dark:text-warm-100 mb-1.5">使用记录</p>
              <div class="space-y-1">
                <div
                  v-for="usage in getUsageForMedicine(med.id).slice(0, 5)"
                  :key="usage.id"
                  class="flex items-center justify-between text-[10px]"
                >
                  <span class="text-warm-300 dark:text-warm-200">{{ formatTime(usage.timestamp) }}</span>
                  <span class="text-warm-400 dark:text-warm-100">-{{ usage.quantity }}{{ med.unit }}</span>
                  <span v-if="usage.note" class="text-warm-300 dark:text-warm-200 truncate max-w-[80px]">{{ usage.note }}</span>
                  <button v-if="canDeleteRecord" @click="handleDeleteUsage(usage.id)" class="text-warm-300 hover:text-red-400">
                    <X :size="10" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="getStockChangesForMedicine(med.id).length > 0" class="mt-3 pt-2 border-t border-cream-100 dark:border-warm-500/10">
              <p class="text-[10px] font-bold text-warm-400 dark:text-warm-100 mb-1.5 flex items-center gap-1">
                <FileText :size="10" /> 库存变动
              </p>
              <div class="space-y-1">
                <div
                  v-for="change in getStockChangesForMedicine(med.id).slice(0, 5)"
                  :key="change.id"
                  class="flex items-center justify-between text-[10px]"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="px-1 py-0.5 rounded text-[8px] font-bold" :class="getChangeTypeStyle(change.changeType)">{{ STOCK_CHANGE_LABELS[change.changeType] }}</span>
                    <span class="text-warm-300 dark:text-warm-200">{{ formatTime(change.timestamp) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="font-bold" :class="change.quantity > 0 ? 'text-mint-500' : 'text-peach-500'">
                      {{ change.quantity > 0 ? '+' : '' }}{{ change.quantity }}
                    </span>
                    <span class="text-warm-300 dark:text-warm-200">{{ change.previousQuantity }}→{{ change.newQuantity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage Tab -->
    <section v-if="activeTab === 'usage'">
      <div class="flex gap-1.5 mb-3">
        <button
          @click="usageSubTab = 'usage'"
          class="px-3 py-1 rounded-lg text-[10px] font-bold transition-colors"
          :class="usageSubTab === 'usage' ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500' : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
        >使用记录</button>
        <button
          @click="usageSubTab = 'stock'"
          class="px-3 py-1 rounded-lg text-[10px] font-bold transition-colors"
          :class="usageSubTab === 'stock' ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500' : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
        >库存变动</button>
      </div>

      <template v-if="usageSubTab === 'usage'">
        <div v-if="getRecentUsages().length === 0" class="text-center py-10">
          <History :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
          <p class="text-sm text-warm-300 dark:text-warm-200">暂无使用记录</p>
        </div>

        <div class="space-y-2">
          <div
            v-for="usage in getRecentUsages()"
            :key="usage.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">
                  {{ medicines.find(m => m.id === usage.medicineId)?.name || '未知物品' }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ formatTime(usage.timestamp) }}</span>
                  <span class="text-[10px] font-bold text-peach-500">-{{ usage.quantity }}{{ medicines.find(m => m.id === usage.medicineId)?.unit || '' }}</span>
                </div>
                <p v-if="usage.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">{{ usage.note }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ getMemberName(usage.createdBy) }}</span>
                <button v-if="canDeleteRecord" @click="handleDeleteUsage(usage.id)" class="text-warm-300 hover:text-red-400">
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="usageSubTab === 'stock'">
        <div v-if="getRecentStockChanges().length === 0" class="text-center py-10">
          <FileText :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
          <p class="text-sm text-warm-300 dark:text-warm-200">暂无库存变动记录</p>
        </div>

        <div class="space-y-2">
          <div
            v-for="change in getRecentStockChanges()"
            :key="change.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="getChangeTypeStyle(change.changeType)">{{ STOCK_CHANGE_LABELS[change.changeType] }}</span>
                  <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">
                    {{ medicines.find(m => m.id === change.medicineId)?.name || '未知物品' }}
                  </p>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ formatTime(change.timestamp) }}</span>
                  <span class="text-[10px] font-bold" :class="change.quantity > 0 ? 'text-mint-500' : 'text-peach-500'">
                    {{ change.quantity > 0 ? '+' : '' }}{{ change.quantity }}{{ medicines.find(m => m.id === change.medicineId)?.unit || '' }}
                  </span>
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ change.previousQuantity }}→{{ change.newQuantity }}</span>
                </div>
                <p v-if="change.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">{{ change.note }}</p>
                <div v-if="change.previousExpiryDate || change.newExpiryDate" class="flex items-center gap-1 mt-0.5 text-[10px]">
                  <span v-if="change.previousExpiryDate" class="text-warm-300 dark:text-warm-200">效期: {{ formatDate(change.previousExpiryDate) }}</span>
                  <span v-if="change.previousExpiryDate && change.newExpiryDate" class="text-warm-300 dark:text-warm-200">→</span>
                  <span v-if="change.newExpiryDate" class="text-warm-400 dark:text-warm-100">{{ formatDate(change.newExpiryDate) }}</span>
                </div>
              </div>
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ getMemberName(change.createdBy) }}</span>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- Usage Modal -->
    <div v-if="showUsageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showUsageModal = false">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 w-[90%] max-w-sm shadow-xl">
        <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-3">记录使用 - {{ selectedMedicine?.name }}</h3>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">使用数量 ({{ selectedMedicine?.unit }})</label>
          <input v-model.number="usageForm.quantity" type="number" min="1" :max="selectedMedicine?.remainingQuantity || 1"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">当前剩余: {{ selectedMedicine?.remainingQuantity }}{{ selectedMedicine?.unit }} · 最多可使用 {{ selectedMedicine?.remainingQuantity }}{{ selectedMedicine?.unit }}</p>
          <p v-if="usageForm.quantity > (selectedMedicine?.remainingQuantity ?? 0)" class="text-[10px] text-red-500 font-bold mt-1">
            使用数量不能超过剩余库存（{{ selectedMedicine?.remainingQuantity }}{{ selectedMedicine?.unit }}）
          </p>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="usageForm.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showUsageModal = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button
            @click="handleRecordUsage"
            :disabled="usageForm.quantity <= 0 || usageForm.quantity > (selectedMedicine?.remainingQuantity ?? 0)"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >确认</button>
        </div>
      </div>
    </div>

    <!-- Restock Modal -->
    <div v-if="showRestockModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showRestockModal = false">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 w-[90%] max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
        <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-3">补货 - {{ selectedMedicine?.name }}</h3>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">补货数量 ({{ selectedMedicine?.unit }})</label>
          <input v-model.number="restockForm.quantity" type="number" min="1"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">当前剩余: {{ selectedMedicine?.remainingQuantity }}{{ selectedMedicine?.unit }}</p>
          <p v-if="selectedMedicine && getMedicineAnalytics(selectedMedicine.id).restockSuggestedQuantity" class="text-[10px] text-peach-400 mt-0.5">
            智能建议: 补 {{ getMedicineAnalytics(selectedMedicine.id).restockSuggestedQuantity }}{{ selectedMedicine?.unit }}
            <button @click="restockForm.quantity = getMedicineAnalytics(selectedMedicine!.id).restockSuggestedQuantity!" class="ml-1 text-peach-500 font-bold underline">采纳</button>
          </p>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">新批次有效期</label>
          <input v-model="restockForm.newExpiryDate" type="date"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          <p v-if="selectedMedicine?.expiryDate" class="text-[10px] mt-1"
            :class="new Date(selectedMedicine.expiryDate).getTime() < Date.now() ? 'text-red-400' : 'text-warm-300 dark:text-warm-200'">
            当前有效期: {{ formatDate(selectedMedicine.expiryDate) }}
            <span v-if="new Date(selectedMedicine.expiryDate).getTime() < Date.now()" class="font-bold">（已过期，补货后将清除过期状态）</span>
            <span v-else>（留空则保持不变）</span>
          </p>
          <p v-else class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">暂无有效期信息（留空则不设置）</p>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="restockForm.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div v-if="selectedMedicine && getStockChangesForMedicine(selectedMedicine.id).length > 0" class="mb-3 border-t border-cream-200 dark:border-warm-500/20 pt-3">
          <p class="text-[10px] font-bold text-warm-400 dark:text-warm-100 mb-1.5 flex items-center gap-1">
            <FileText :size="10" /> 最近库存变动
          </p>
          <div class="space-y-1">
            <div
              v-for="change in getStockChangesForMedicine(selectedMedicine.id).slice(0, 5)"
              :key="change.id"
              class="flex items-center justify-between text-[10px]"
            >
              <div class="flex items-center gap-1.5">
                <span class="px-1 py-0.5 rounded text-[8px] font-bold" :class="getChangeTypeStyle(change.changeType)">{{ STOCK_CHANGE_LABELS[change.changeType] }}</span>
                <span class="text-warm-300 dark:text-warm-200">{{ formatTime(change.timestamp) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold" :class="change.quantity > 0 ? 'text-mint-500' : 'text-peach-500'">
                  {{ change.quantity > 0 ? '+' : '' }}{{ change.quantity }}
                </span>
                <span class="text-warm-300 dark:text-warm-200">({{ change.previousQuantity }}→{{ change.newQuantity }})</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="showRestockModal = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleRestock" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-mint-400 hover:bg-mint-500 shadow-md shadow-mint-200 dark:shadow-mint-500/20">确认补货</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showEditModal = false">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 w-[90%] max-w-sm shadow-xl">
        <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-3">编辑 - {{ selectedMedicine?.name }}</h3>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">物品名称</label>
          <input v-model="editForm.name" type="text"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">分类</label>
            <select v-model="editForm.category"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300">
              <option value="medication">药品</option>
              <option value="nursing_supply">护理用品</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">单位</label>
            <input v-model="editForm.unit" type="text"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">低库存阈值</label>
            <input v-model.number="editForm.lowStockThreshold" type="number" min="0"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">有效期</label>
            <input v-model="editForm.expiryDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="editForm.note" type="text"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showEditModal = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleEdit" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
