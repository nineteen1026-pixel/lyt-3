<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Ruler, Syringe, Stethoscope, TrendingUp,
  Plus, Check, X, Calendar, MapPin, User, ChevronDown, ChevronRight,
  Activity, Heart, Clock,
} from 'lucide-vue-next'
import { useHealthRecord } from '@/composables/useHealthRecord'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { VaccineRecord } from '@/types'

const router = useRouter()
const {
  growths, vaccines, checkups, latestGrowth,
  upcomingVaccines, doneVaccines,
  growthTrend, weightGainRate,
  canAddRecord, addGrowth, addVaccine, addCheckup,
  markVaccineDone, getMemberName,
} = useHealthRecord()
const { settings } = useBabyCare()
const { family, currentUserId } = useFamily()

const caregiverId = ref(settings.value.defaultCaregiverId || currentUserId.value)
const showCaregiverPicker = ref(false)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const caregiverName = computed(() => getMemberName(caregiverId.value))

function selectCaregiver(id: string) {
  caregiverId.value = id
  showCaregiverPicker.value = false
}

type TabKey = 'growth' | 'vaccine' | 'checkup' | 'trend'
const activeTab = ref<TabKey>('growth')

const tabs: { key: TabKey; label: string; icon: typeof Ruler }[] = [
  { key: 'growth', label: '身高体重', icon: Ruler },
  { key: 'vaccine', label: '疫苗计划', icon: Syringe },
  { key: 'checkup', label: '体检记录', icon: Stethoscope },
  { key: 'trend', label: '趋势曲线', icon: TrendingUp },
]

const showAddGrowth = ref(false)
const showAddVaccine = ref(false)
const showAddCheckup = ref(false)

const newGrowth = ref({ height: 67, weight: 7.5, headCircumference: 42, note: '' })
const newGrowthDate = ref(new Date().toISOString().slice(0, 10))

const newVaccine = ref({ name: '', plannedDate: new Date().toISOString().slice(0, 10), location: '社区卫生中心', note: '' })
const newCheckup = ref({ hospital: '', doctor: '', items: '' as string, result: '', note: '' })
const newCheckupDate = ref(new Date().toISOString().slice(0, 10))

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getDaysUntil(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 86400000
  if (diff < 0) return `逾期${Math.abs(Math.round(diff))}天`
  if (diff === 0) return '今天'
  return `${Math.round(diff)}天后`
}

function handleAddGrowth() {
  addGrowth({
    timestamp: new Date(newGrowthDate.value).toISOString(),
    height: newGrowth.value.height,
    weight: newGrowth.value.weight,
    headCircumference: newGrowth.value.headCircumference || undefined,
    note: newGrowth.value.note,
    caregiverId: caregiverId.value,
  })
  showAddGrowth.value = false
  newGrowth.value = { height: 67, weight: 7.5, headCircumference: 42, note: '' }
}

function handleAddVaccine() {
  addVaccine({
    name: newVaccine.value.name,
    plannedDate: new Date(newVaccine.value.plannedDate).toISOString(),
    status: 'planned',
    location: newVaccine.value.location || undefined,
    note: newVaccine.value.note,
    caregiverId: caregiverId.value,
  })
  showAddVaccine.value = false
  newVaccine.value = { name: '', plannedDate: new Date().toISOString().slice(0, 10), location: '社区卫生中心', note: '' }
}

function handleAddCheckup() {
  addCheckup({
    timestamp: new Date(newCheckupDate.value).toISOString(),
    hospital: newCheckup.value.hospital,
    doctor: newCheckup.value.doctor || undefined,
    items: newCheckup.value.items.split('，').map(s => s.trim()).filter(Boolean),
    result: newCheckup.value.result,
    note: newCheckup.value.note,
    caregiverId: caregiverId.value,
  })
  showAddCheckup.value = false
  newCheckup.value = { hospital: '', doctor: '', items: '', result: '', note: '' }
}

function handleMarkDone(vaccine: VaccineRecord) {
  markVaccineDone(vaccine.id, new Date().toISOString())
}

const vaccineFilter = ref<'all' | 'planned' | 'done'>('all')
const filteredVaccines = computed(() => {
  if (vaccineFilter.value === 'planned') return upcomingVaccines.value
  if (vaccineFilter.value === 'done') return doneVaccines.value
  return vaccines.value
})

const svgW = 320
const svgH = 180
const padL = 40
const padR = 16
const padT = 16
const padB = 28
const plotW = svgW - padL - padR
const plotH = svgH - padT - padB

function buildPolyline(data: number[]): string {
  if (data.length === 0) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = padL + (i / (data.length - 1 || 1)) * plotW
    const y = padT + plotH - ((v - min) / range) * plotH
    return `${x},${y}`
  }).join(' ')
}

function yLabels(data: number[]): { y: number; label: string }[] {
  if (data.length === 0) return []
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => {
    const val = min + (range / steps) * i
    const y = padT + plotH - (i / steps) * plotH
    return { y, label: val.toFixed(1) }
  })
}

const selectedTrend = ref<'height' | 'weight' | 'head'>('weight')

const trendData = computed(() => {
  if (selectedTrend.value === 'height') return { values: growthTrend.value.heights, unit: 'cm', color: '#ff8a80' }
  if (selectedTrend.value === 'weight') return { values: growthTrend.value.weights, unit: 'kg', color: '#66bb6a' }
  return { values: growthTrend.value.headCircumferences, unit: 'cm', color: '#a5d6a7' }
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Heart :size="20" class="text-peach-400" />
        成长健康档案
      </h1>
    </header>

    <div v-if="latestGrowth" class="bg-gradient-to-br from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl p-4 mb-4">
      <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">最新数据</p>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <Ruler :size="16" class="mx-auto text-peach-400 mb-1" />
          <p class="text-xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ latestGrowth.height }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">身高 cm</p>
        </div>
        <div class="text-center">
          <Activity :size="16" class="mx-auto text-mint-500 mb-1" />
          <p class="text-xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ latestGrowth.weight }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">体重 kg</p>
        </div>
        <div class="text-center">
          <TrendingUp :size="16" class="mx-auto text-warm-400 mb-1" />
          <p class="text-xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ latestGrowth.headCircumference || '-' }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">头围 cm</p>
        </div>
      </div>
      <div v-if="weightGainRate" class="mt-2 pt-2 border-t border-cream-200/60 dark:border-warm-500/20 flex justify-center gap-4">
        <span class="text-[10px] text-warm-300 dark:text-warm-200">近{{ weightGainRate.daysDiff }}天增重 <strong class="text-mint-500">{{ weightGainRate.weightGain > 0 ? '+' : '' }}{{ weightGainRate.weightGain.toFixed(2) }}kg</strong></span>
        <span class="text-[10px] text-warm-300 dark:text-warm-200">增高 <strong class="text-peach-500">{{ weightGainRate.heightGain > 0 ? '+' : '' }}{{ weightGainRate.heightGain.toFixed(1) }}cm</strong></span>
      </div>
    </div>

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
      </button>
    </div>

    <section v-if="activeTab === 'growth'">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">身高体重记录</h2>
        <button
          v-if="canAddRecord"
          @click="showAddGrowth = !showAddGrowth"
          class="flex items-center gap-1 text-xs font-bold text-peach-400 hover:text-peach-500"
        >
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-if="showAddGrowth" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">身高 (cm)</label>
            <input v-model.number="newGrowth.height" type="number" min="30" max="150" step="0.1"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">体重 (kg)</label>
            <input v-model.number="newGrowth.weight" type="number" min="1" max="30" step="0.1"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">头围 (cm)</label>
            <input v-model.number="newGrowth.headCircumference" type="number" min="25" max="60" step="0.1"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">日期</label>
            <input v-model="newGrowthDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div v-if="familyMembers.length > 0" class="mb-3 relative">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">照护人</label>
          <button
            type="button"
            @click="showCaregiverPicker = !showCaregiverPicker"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-peach-300"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                <User :size="12" class="text-peach-400" />
              </div>
              <span class="text-sm text-warm-500 dark:text-cream-100">{{ caregiverName }}</span>
            </div>
            <ChevronDown :size="14" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
          </button>
          <div
            v-if="showCaregiverPicker"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-40 overflow-y-auto"
          >
            <button
              v-for="member in familyMembers"
              :key="member.id"
              type="button"
              @click="selectCaregiver(member.id)"
              class="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="caregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                <User :size="12" class="text-warm-400" />
              </div>
              <span>{{ member.name }}</span>
              <Check v-if="caregiverId === member.id" :size="12" class="ml-auto text-peach-400" />
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="newGrowth.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showAddGrowth = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddGrowth" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div v-if="growths.length === 0" class="text-center py-10">
        <Ruler :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无记录</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="record in [...growths].reverse()"
          :key="record.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ formatDate(record.timestamp) }}</span>
            <span class="text-[10px] text-warm-300 dark:text-warm-200">照护: {{ getMemberName(record.caregiverId) }}</span>
          </div>
          <div class="flex gap-4">
            <span class="text-xs text-peach-500 font-semibold">身高 {{ record.height }}cm</span>
            <span class="text-xs text-mint-500 font-semibold">体重 {{ record.weight }}kg</span>
            <span v-if="record.headCircumference" class="text-xs text-warm-400 font-semibold">头围 {{ record.headCircumference }}cm</span>
          </div>
          <p v-if="record.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">{{ record.note }}</p>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'vaccine'">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">疫苗计划</h2>
        <button
          v-if="canAddRecord"
          @click="showAddVaccine = !showAddVaccine"
          class="flex items-center gap-1 text-xs font-bold text-peach-400 hover:text-peach-500"
        >
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-if="showAddVaccine" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">疫苗名称</label>
          <input v-model="newVaccine.name" type="text" placeholder="如：乙肝疫苗（第1剂）"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">计划日期</label>
            <input v-model="newVaccine.plannedDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">接种地点</label>
            <input v-model="newVaccine.location" type="text" placeholder="社区卫生中心"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div v-if="familyMembers.length > 0" class="mb-3 relative">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">照护人</label>
          <button
            type="button"
            @click="showCaregiverPicker = !showCaregiverPicker"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-peach-300"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                <User :size="12" class="text-peach-400" />
              </div>
              <span class="text-sm text-warm-500 dark:text-cream-100">{{ caregiverName }}</span>
            </div>
            <ChevronDown :size="14" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
          </button>
          <div
            v-if="showCaregiverPicker"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-40 overflow-y-auto"
          >
            <button
              v-for="member in familyMembers"
              :key="member.id"
              type="button"
              @click="selectCaregiver(member.id)"
              class="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="caregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                <User :size="12" class="text-warm-400" />
              </div>
              <span>{{ member.name }}</span>
              <Check v-if="caregiverId === member.id" :size="12" class="ml-auto text-peach-400" />
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="newVaccine.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showAddVaccine = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddVaccine" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div class="flex gap-2 mb-3">
        <button
          v-for="f in (['all', 'planned', 'done'] as const)"
          :key="f"
          @click="vaccineFilter = f"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          :class="vaccineFilter === f
            ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
            : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
        >
          {{ f === 'all' ? '全部' : f === 'planned' ? '待接种' : '已接种' }}
          <span class="ml-0.5">{{ f === 'all' ? vaccines.length : f === 'planned' ? upcomingVaccines.length : doneVaccines.length }}</span>
        </button>
      </div>

      <div v-if="filteredVaccines.length === 0" class="text-center py-10">
        <Syringe :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无记录</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="vaccine in filteredVaccines"
          :key="vaccine.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
          :class="vaccine.status === 'done' ? 'opacity-70' : ''"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              :class="vaccine.status === 'done'
                ? 'bg-mint-100 dark:bg-mint-500/20'
                : vaccine.status === 'planned'
                  ? 'bg-peach-100 dark:bg-peach-500/20'
                  : 'bg-cream-200 dark:bg-cream-300/20'"
            >
              <Check v-if="vaccine.status === 'done'" :size="16" class="text-mint-500" />
              <Clock v-else-if="vaccine.status === 'planned'" :size="16" class="text-peach-400" />
              <X v-else :size="16" class="text-warm-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ vaccine.name }}</p>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
                  <Calendar :size="10" /> {{ formatDate(vaccine.plannedDate) }}
                </span>
                <span v-if="vaccine.location" class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
                  <MapPin :size="10" /> {{ vaccine.location }}
                </span>
                <span class="text-[10px] text-warm-300 dark:text-warm-200">照护: {{ getMemberName(vaccine.caregiverId) }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  :class="vaccine.status === 'done'
                    ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500'
                    : vaccine.status === 'planned'
                      ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
                      : 'bg-cream-200 dark:bg-cream-300/20 text-warm-400'"
                >
                  {{ vaccine.status === 'done' ? '已接种' : vaccine.status === 'planned' ? getDaysUntil(vaccine.plannedDate) : '已错过' }}
                </span>
                <span v-if="vaccine.actualDate" class="text-[10px] text-warm-300 dark:text-warm-200">实际: {{ formatDateShort(vaccine.actualDate) }}</span>
              </div>
              <button
                v-if="vaccine.status === 'planned' && canAddRecord"
                @click="handleMarkDone(vaccine)"
                class="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold bg-mint-100 dark:bg-mint-500/20 text-mint-500 hover:bg-mint-200 dark:hover:bg-mint-500/30 transition-colors"
              >
                标记已接种
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'checkup'">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">体检记录</h2>
        <button
          v-if="canAddRecord"
          @click="showAddCheckup = !showAddCheckup"
          class="flex items-center gap-1 text-xs font-bold text-peach-400 hover:text-peach-500"
        >
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-if="showAddCheckup" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">医院</label>
            <input v-model="newCheckup.hospital" type="text" placeholder="医院名称"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">医生</label>
            <input v-model="newCheckup.doctor" type="text" placeholder="医生姓名"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">检查项目（用逗号分隔）</label>
          <input v-model="newCheckup.items" type="text" placeholder="如：体格检查，血常规，微量元素"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">检查结果</label>
          <textarea v-model="newCheckup.result" rows="2" placeholder="检查结果摘要"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">日期</label>
            <input v-model="newCheckupDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div v-if="familyMembers.length > 0" class="relative">
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">照护人</label>
            <button
              type="button"
              @click="showCaregiverPicker = !showCaregiverPicker"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-peach-300"
            >
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                  <User :size="10" class="text-peach-400" />
                </div>
                <span class="text-xs text-warm-500 dark:text-cream-100 truncate">{{ caregiverName }}</span>
              </div>
              <ChevronDown :size="12" class="text-warm-300 dark:text-warm-200 transition-transform shrink-0" :class="{ 'rotate-180': showCaregiverPicker }" />
            </button>
            <div
              v-if="showCaregiverPicker"
              class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-40 overflow-y-auto"
            >
              <button
                v-for="member in familyMembers"
                :key="member.id"
                type="button"
                @click="selectCaregiver(member.id)"
                class="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
                :class="caregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
              >
                <div class="w-5 h-5 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                  <User :size="10" class="text-warm-400" />
                </div>
                <span class="truncate">{{ member.name }}</span>
                <Check v-if="caregiverId === member.id" :size="12" class="ml-auto text-peach-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="newCheckup.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showAddCheckup = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddCheckup" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div v-if="checkups.length === 0" class="text-center py-10">
        <Stethoscope :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无记录</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="record in checkups"
          :key="record.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ formatDate(record.timestamp) }}</span>
            <span class="text-[10px] text-warm-300 dark:text-warm-200">照护: {{ getMemberName(record.caregiverId) }}</span>
          </div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
              <MapPin :size="10" /> {{ record.hospital }}
            </span>
            <span v-if="record.doctor" class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
              <User :size="10" /> {{ record.doctor }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1 mb-1">
            <span
              v-for="item in record.items"
              :key="item"
              class="text-[10px] px-1.5 py-0.5 rounded-md bg-mint-50 dark:bg-mint-500/10 text-mint-500"
            >{{ item }}</span>
          </div>
          <p class="text-xs text-warm-400 dark:text-warm-100">{{ record.result }}</p>
          <p v-if="record.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">{{ record.note }}</p>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'trend'">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">成长趋势曲线</h2>

      <div v-if="growthTrend.labels.length < 2" class="text-center py-10">
        <TrendingUp :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">至少需要2条记录才能绘制趋势</p>
      </div>

      <template v-else>
        <div class="flex gap-2 mb-4">
          <button
            v-for="opt in ([
              { key: 'weight', label: '体重' },
              { key: 'height', label: '身高' },
              { key: 'head', label: '头围' },
            ] as const)"
            :key="opt.key"
            @click="selectedTrend = opt.key"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            :class="selectedTrend === opt.key
              ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
              : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-warm-400 dark:text-warm-100">
              {{ selectedTrend === 'weight' ? '体重' : selectedTrend === 'height' ? '身高' : '头围' }}
              ({{ trendData.unit }})
            </span>
            <span class="text-xs text-warm-300 dark:text-warm-200">
              共 {{ trendData.values.length }} 条记录
            </span>
          </div>
          <svg :width="svgW" :height="svgH" class="w-full" :viewBox="`0 0 ${svgW} ${svgH}`">
            <line
              v-for="label in yLabels(trendData.values)"
              :key="label.label"
              :x1="padL" :y1="label.y" :x2="svgW - padR" :y2="label.y"
              stroke="currentColor" stroke-opacity="0.08"
            />
            <text
              v-for="label in yLabels(trendData.values)"
              :key="'t' + label.label"
              :x="padL - 4" :y="label.y + 3"
              text-anchor="end"
              class="fill-warm-300 dark:fill-warm-200"
              font-size="8"
            >{{ label.label }}</text>
            <text
              v-for="(lbl, i) in growthTrend.labels"
              :key="'xl' + i"
              :x="padL + (i / (growthTrend.labels.length - 1 || 1)) * plotW"
              :y="svgH - 4"
              text-anchor="middle"
              class="fill-warm-300 dark:fill-warm-200"
              font-size="8"
            >{{ lbl }}</text>
            <polyline
              :points="buildPolyline(trendData.values)"
              fill="none"
              :stroke="trendData.color"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle
              v-for="(v, i) in trendData.values"
              :key="'pt' + i"
              :cx="padL + (i / (trendData.values.length - 1 || 1)) * plotW"
              :cy="(() => {
                const min = Math.min(...trendData.values)
                const max = Math.max(...trendData.values)
                const range = max - min || 1
                return padT + plotH - ((v - min) / range) * plotH
              })()"
              r="3.5"
              :fill="trendData.color"
              class="stroke-white dark:stroke-[#2a1f1a]"
              stroke-width="2"
            />
          </svg>
        </div>

        <div class="bg-cream-50 dark:bg-warm-500/10 rounded-2xl p-4">
          <h3 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">数据详情</h3>
          <div class="space-y-1.5">
            <div
              v-for="(label, i) in growthTrend.labels"
              :key="'detail' + i"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-warm-300 dark:text-warm-200">{{ label }}</span>
              <div class="flex gap-3">
                <span v-if="selectedTrend === 'height' || selectedTrend === 'weight'" class="font-semibold" :class="selectedTrend === 'height' ? 'text-peach-500' : 'text-mint-500'">
                  {{ selectedTrend === 'height' ? growthTrend.heights[i] : growthTrend.weights[i] }} {{ trendData.unit }}
                </span>
                <span v-if="selectedTrend === 'head'" class="font-semibold text-warm-400">
                  {{ growthTrend.headCircumferences[i] }} {{ trendData.unit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
