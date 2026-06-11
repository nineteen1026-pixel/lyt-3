<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Milk, Moon, Droplets, Trash2, Filter, Eye, User, ChevronDown, Check,
  Calendar, AlertTriangle, AlertCircle, Pencil, X, Square, CheckSquare,
  StickyNote, Edit3
} from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'
import { useRouter } from 'vue-router'

const router = useRouter()
const {
  allActivities, deleteRecord, canDelete, canEdit, getMemberName,
  canViewRecord, needsJoin, batchDeleteRecords, updateRecordNote,
  batchUpdateNotes, getRecordTimestamp, getRecordAnomalyLevel,
} = useBabyCare()
const { family } = useFamily()

const filterType = ref<'all' | 'feeding' | 'sleep' | 'diaper'>('all')
const filterMemberId = ref<string>('all')
const filterAnomaly = ref<'all' | 'normal' | 'warning' | 'danger'>('all')
const filterDateStart = ref<string>('')
const filterDateEnd = ref<string>('')
const showMemberPicker = ref(false)
const showDatePicker = ref(false)

const batchMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const showBatchNoteModal = ref(false)
const batchNoteText = ref('')

const editingNoteId = ref<string | null>(null)
const editingNoteText = ref('')
const showNoteSuggestions = ref(false)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const noteSuggestions = computed(() => {
  const allNotes = new Set<string>()
  allActivities.value.forEach(r => {
    const note = (r as any).note
    if (note && note.trim()) {
      allNotes.add(note.trim())
    }
  })
  const defaults = [
    '状态良好', '精神不错', '食欲一般', '有点哭闹', '睡眠质量好',
    '吃奶顺利', '便便正常', '尿量充足', '有点发热', '需关注',
  ]
  return [...new Set([...defaults, ...Array.from(allNotes)])].slice(0, 12)
})

function parseDateOnly(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const filteredActivities = computed(() => {
  let result = allActivities.value

  if (filterType.value !== 'all') {
    result = result.filter(r => r.type === filterType.value)
  }
  if (filterMemberId.value !== 'all') {
    result = result.filter(r => (r as any).caregiverId === filterMemberId.value)
  }
  if (filterAnomaly.value !== 'all') {
    result = result.filter(r => getRecordAnomalyLevel(r) === filterAnomaly.value)
  }
  if (filterDateStart.value) {
    const start = new Date(filterDateStart.value).getTime()
    result = result.filter(r => new Date(getRecordTimestamp(r)).getTime() >= start)
  }
  if (filterDateEnd.value) {
    const end = new Date(filterDateEnd.value).getTime() + 86400000
    result = result.filter(r => new Date(getRecordTimestamp(r)).getTime() < end)
  }

  return result
})

const selectableCount = computed(() =>
  filteredActivities.value.filter(r => canEdit(r.id) || canDelete(r.id)).length
)

const allSelected = computed(() => {
  if (selectableCount.value === 0) return false
  return filteredActivities.value
    .filter(r => canEdit(r.id) || canDelete(r.id))
    .every(r => selectedIds.value.has(r.id))
})

const filterMemberName = computed(() => {
  if (filterMemberId.value === 'all') return '全部照护人'
  return getMemberName(filterMemberId.value)
})

const dateRangeLabel = computed(() => {
  if (!filterDateStart.value && !filterDateEnd.value) return '全部日期'
  if (filterDateStart.value && filterDateEnd.value) {
    return `${filterDateStart.value} ~ ${filterDateEnd.value}`
  }
  if (filterDateStart.value) return `${filterDateStart.value} 起`
  return `至 ${filterDateEnd.value}`
})

const anomalyLabel = computed(() => {
  switch (filterAnomaly.value) {
    case 'normal': return '正常'
    case 'warning': return '异常警告'
    case 'danger': return '危险异常'
    default: return '全部状态'
  }
})

function selectMember(id: string) {
  filterMemberId.value = id
  showMemberPicker.value = false
}

function selectAnomaly(value: 'all' | 'normal' | 'warning' | 'danger') {
  filterAnomaly.value = value
}

function clearDateFilter() {
  filterDateStart.value = ''
  filterDateEnd.value = ''
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function getIcon(record: ActivityRecord) {
  if (record.type === 'feeding') return Milk
  if (record.type === 'sleep') return Moon
  return Droplets
}

function getColor(record: ActivityRecord) {
  if (record.type === 'feeding') return 'bg-peach-100 text-peach-500 dark:bg-peach-500/20 dark:text-peach-400'
  if (record.type === 'sleep') return 'bg-mint-100 text-mint-500 dark:bg-mint-500/20 dark:text-mint-400'
  return 'bg-cream-200 text-warm-400 dark:bg-cream-300/20 dark:text-cream-300'
}

function getAnomalyBadge(record: ActivityRecord) {
  const level = getRecordAnomalyLevel(record)
  if (level === 'danger') {
    return { icon: AlertCircle, class: 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400', label: '异常' }
  }
  if (level === 'warning') {
    return { icon: AlertTriangle, class: 'bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400', label: '警告' }
  }
  return null
}

function getSummary(record: ActivityRecord) {
  if (record.type === 'feeding') {
    const f = record as FeedingRecord
    const typeLabel = f.feedingType === 'breast' ? '母乳' : f.feedingType === 'formula' ? '配方奶' : '混合'
    const sideLabel = f.breastSide ? ` · ${f.breastSide === 'left' ? '左' : f.breastSide === 'right' ? '右' : f.breastSide === 'both' ? '双' : '交替'}` : ''
    if (f.feedingType === 'breast') {
      return `${typeLabel}${sideLabel} ${f.duration}min`
    } else if (f.feedingType === 'formula') {
      return `${typeLabel} ${f.amount}ml`
    } else {
      return `${typeLabel}${sideLabel} ${f.duration}min · ${f.amount}ml`
    }
  }
  if (record.type === 'sleep') {
    const s = record as SleepRecord
    const diff = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000
    return `睡眠 ${formatDuration(Math.round(diff))} · ${s.quality === 'deep' ? '安睡' : s.quality === 'light' ? '浅睡' : '烦躁'}`
  }
  const d = record as DiaperRecord
  return `尿布 · ${d.diaperType === 'wet' ? '湿' : d.diaperType === 'dirty' ? '便' : '混合'}`
}

function getTime(record: ActivityRecord) {
  return formatDate(getRecordTimestamp(record))
}

function getNote(record: ActivityRecord): string {
  return (record as any).note || ''
}

const filterTabs = [
  { value: 'all' as const, label: '全部' },
  { value: 'feeding' as const, label: '喂奶' },
  { value: 'sleep' as const, label: '睡眠' },
  { value: 'diaper' as const, label: '尿布' },
]

const anomalyFilters = [
  { value: 'all' as const, label: '全部', icon: null },
  { value: 'normal' as const, label: '正常', icon: null },
  { value: 'warning' as const, label: '警告', icon: AlertTriangle },
  { value: 'danger' as const, label: '危险', icon: AlertCircle },
]

const confirmDeleteId = ref<string | null>(null)
const confirmBatchDelete = ref(false)

function handleDelete(id: string) {
  if (!canDelete(id)) return
  if (confirmDeleteId.value === id) {
    deleteRecord(id)
    selectedIds.value.delete(id)
    confirmDeleteId.value = null
  } else {
    confirmDeleteId.value = id
    setTimeout(() => {
      confirmDeleteId.value = null
    }, 2000)
  }
}

function toggleSelect(id: string) {
  if (!canEdit(id) && !canDelete(id)) return
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    filteredActivities.value.forEach(r => {
      if (canEdit(r.id) || canDelete(r.id)) {
        selectedIds.value.delete(r.id)
      }
    })
  } else {
    filteredActivities.value.forEach(r => {
      if (canEdit(r.id) || canDelete(r.id)) {
        selectedIds.value.add(r.id)
      }
    })
  }
}

function exitBatchMode() {
  batchMode.value = false
  selectedIds.value.clear()
}

function handleBatchDelete() {
  if (confirmBatchDelete.value) {
    const deletableIds = Array.from(selectedIds.value).filter(id => canDelete(id))
    batchDeleteRecords(deletableIds)
    selectedIds.value.clear()
    confirmBatchDelete.value = false
    batchMode.value = false
  } else {
    confirmBatchDelete.value = true
    setTimeout(() => {
      confirmBatchDelete.value = false
    }, 2000)
  }
}

function openBatchNoteModal() {
  batchNoteText.value = ''
  showBatchNoteModal.value = true
}

function closeBatchNoteModal() {
  showBatchNoteModal.value = false
  batchNoteText.value = ''
}

function applyBatchNote() {
  if (!batchNoteText.value.trim()) return
  const editableIds = Array.from(selectedIds.value).filter(id => canEdit(id))
  batchUpdateNotes(editableIds, batchNoteText.value.trim())
  closeBatchNoteModal()
  batchMode.value = false
  selectedIds.value.clear()
}

function startEditNote(id: string) {
  if (!canEdit(id)) return
  const record = allActivities.value.find(r => r.id === id)
  if (!record) return
  editingNoteId.value = id
  editingNoteText.value = getNote(record)
  showNoteSuggestions.value = false
}

function cancelEditNote() {
  editingNoteId.value = null
  editingNoteText.value = ''
  showNoteSuggestions.value = false
}

function saveEditNote() {
  if (!editingNoteId.value) return
  updateRecordNote(editingNoteId.value, editingNoteText.value.trim())
  cancelEditNote()
}

function applyNoteSuggestion(suggestion: string) {
  editingNoteText.value = suggestion
  showNoteSuggestions.value = false
}

watch(batchMode, (val) => {
  if (!val) selectedIds.value.clear()
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-24">
    <header class="mb-5 flex items-center justify-between">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Filter :size="20" class="text-warm-300" />
        历史记录
      </h1>
      <div class="flex items-center gap-2">
        <template v-if="!batchMode">
          <button
            v-if="filteredActivities.some(r => canEdit(r.id) || canDelete(r.id))"
            @click="batchMode = true"
            class="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2a1f1a] text-warm-400 dark:text-warm-200 text-xs font-bold shadow-sm flex items-center gap-1 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
          >
            <Edit3 :size="14" />
            批量
          </button>
        </template>
        <template v-else>
          <button
            @click="exitBatchMode"
            class="px-3 py-1.5 rounded-lg bg-warm-100 dark:bg-warm-500/20 text-warm-500 dark:text-cream-100 text-xs font-bold flex items-center gap-1"
          >
            <X :size="14" />
            取消
          </button>
        </template>
      </div>
    </header>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">你尚未成为家庭成员</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <div v-else-if="!canViewRecord" class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 rounded-full bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-warm-300 dark:text-warm-200" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">无查看权限</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">当前角色无查看记录权限</p>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <p class="text-xs text-warm-300 dark:text-warm-200">共 {{ filteredActivities.length }} 条记录</p>
        <span v-if="batchMode" class="text-xs text-peach-500 font-bold">
          · 已选 {{ selectedIds.size }} 条
        </span>
      </div>

      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          @click="filterType = tab.value"
          class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
          :class="filterType === tab.value
            ? 'bg-peach-400 text-white shadow-sm'
            : 'bg-white dark:bg-[#2a1f1a] text-warm-300 dark:text-warm-200 shadow-sm'"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flex gap-2 mb-3 flex-wrap">
        <div class="relative flex-1 min-w-[120px]">
          <button
            @click="showMemberPicker = !showMemberPicker"
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-left flex items-center justify-between shadow-sm"
          >
            <div class="flex items-center gap-1.5 min-w-0">
              <User :size="12" class="text-peach-400 shrink-0" />
              <span class="text-xs font-semibold text-warm-500 dark:text-cream-100 truncate">{{ filterMemberName }}</span>
            </div>
            <ChevronDown :size="14" class="text-warm-300 dark:text-warm-200 shrink-0 transition-transform" :class="{ 'rotate-180': showMemberPicker }" />
          </button>
          <div
            v-if="showMemberPicker"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-20 py-1 max-h-48 overflow-y-auto"
          >
            <button
              @click="selectMember('all')"
              class="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="filterMemberId === 'all' ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <Filter :size="12" class="text-warm-400" />
              <span>全部照护人</span>
              <Check v-if="filterMemberId === 'all'" :size="12" class="ml-auto text-peach-400" />
            </button>
            <button
              v-for="member in familyMembers"
              :key="member.id"
              @click="selectMember(member.id)"
              class="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="filterMemberId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <User :size="12" class="text-warm-400" />
              <span>{{ member.name }}</span>
              <Check v-if="filterMemberId === member.id" :size="12" class="ml-auto text-peach-400" />
            </button>
          </div>
        </div>

        <div class="relative flex-1 min-w-[140px]">
          <button
            @click="showDatePicker = !showDatePicker"
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-left flex items-center justify-between shadow-sm"
          >
            <div class="flex items-center gap-1.5 min-w-0">
              <Calendar :size="12" class="text-mint-500 shrink-0" />
              <span class="text-xs font-semibold text-warm-500 dark:text-cream-100 truncate">{{ dateRangeLabel }}</span>
            </div>
            <ChevronDown :size="14" class="text-warm-300 dark:text-warm-200 shrink-0 transition-transform" :class="{ 'rotate-180': showDatePicker }" />
          </button>
          <div
            v-if="showDatePicker"
            class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-20 p-3 space-y-2"
          >
            <div>
              <label class="text-[11px] text-warm-300 dark:text-warm-200 font-semibold mb-1 block">开始日期</label>
              <input
                type="date"
                v-model="filterDateStart"
                class="w-full px-2 py-1.5 text-xs bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-lg text-warm-500 dark:text-cream-100"
              />
            </div>
            <div>
              <label class="text-[11px] text-warm-300 dark:text-warm-200 font-semibold mb-1 block">结束日期</label>
              <input
                type="date"
                v-model="filterDateEnd"
                class="w-full px-2 py-1.5 text-xs bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-lg text-warm-500 dark:text-cream-100"
              />
            </div>
            <div class="flex gap-2 pt-1">
              <button
                @click="clearDateFilter"
                class="flex-1 px-3 py-1.5 rounded-lg bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 text-xs font-semibold"
              >
                清除
              </button>
              <button
                @click="showDatePicker = false"
                class="flex-1 px-3 py-1.5 rounded-lg bg-peach-400 text-white text-xs font-semibold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button
          v-for="opt in anomalyFilters"
          :key="opt.value"
          @click="selectAnomaly(opt.value)"
          class="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1"
          :class="filterAnomaly === opt.value
            ? (opt.value === 'danger' ? 'bg-red-500 text-white' : opt.value === 'warning' ? 'bg-amber-500 text-white' : opt.value === 'normal' ? 'bg-mint-500 text-white' : 'bg-peach-400 text-white')
            : 'bg-white dark:bg-[#2a1f1a] text-warm-300 dark:text-warm-200 shadow-sm'"
        >
          <component v-if="opt.icon" :is="opt.icon" :size="11" />
          {{ opt.label }}
        </button>
      </div>

      <div v-if="batchMode" class="sticky top-0 z-10 -mx-4 px-4 py-3 mb-3 bg-cream-50/90 dark:bg-[#1a1410]/90 backdrop-blur-sm border-b border-cream-200 dark:border-warm-500/20">
        <div class="flex items-center justify-between">
          <button
            @click="toggleSelectAll"
            class="flex items-center gap-2 text-sm font-semibold text-warm-500 dark:text-cream-100"
          >
            <component :is="allSelected ? CheckSquare : Square" :size="18" class="text-peach-500" />
            {{ allSelected ? '取消全选' : '全选可编辑' }}
          </button>
          <div class="flex gap-2">
            <button
              @click="openBatchNoteModal"
              :disabled="selectedIds.size === 0"
              class="px-3 py-1.5 rounded-lg bg-mint-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <StickyNote :size="12" />
              批量备注
            </button>
            <button
              @click="handleBatchDelete"
              :disabled="Array.from(selectedIds).filter(id => canDelete(id)).length === 0"
              class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :class="confirmBatchDelete
                ? 'bg-red-500 text-white'
                : 'bg-red-100 dark:bg-red-500/20 text-red-500 hover:bg-red-200 dark:hover:bg-red-500/30'"
            >
              <Trash2 :size="12" />
              {{ confirmBatchDelete ? '确认删除' : '删除' }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="activity in filteredActivities"
          :key="activity.id"
          class="flex items-start gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm transition-all"
          :class="{
            'ring-2 ring-peach-400 ring-offset-2 dark:ring-offset-[#1a1410]': selectedIds.has(activity.id),
            'opacity-60': batchMode && !canEdit(activity.id) && !canDelete(activity.id)
          }"
        >
          <div v-if="batchMode" class="pt-1 shrink-0">
            <button
              v-if="canEdit(activity.id) || canDelete(activity.id)"
              @click="toggleSelect(activity.id)"
              class="text-peach-500"
            >
              <component :is="selectedIds.has(activity.id) ? CheckSquare : Square" :size="18" />
            </button>
            <div v-else class="w-[18px] h-[18px]" />
          </div>

          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative" :class="getColor(activity)">
            <component :is="getIcon(activity)" :size="18" />
            <div
              v-if="getAnomalyBadge(activity)"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              :class="getAnomalyBadge(activity)!.class"
              :title="getAnomalyBadge(activity)!.label"
            >
              <component :is="getAnomalyBadge(activity)!.icon" :size="10" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">{{ getSummary(activity) }}</p>
              <span
                v-if="getAnomalyBadge(activity)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                :class="getAnomalyBadge(activity)!.class"
              >
                {{ getAnomalyBadge(activity)!.label }}
              </span>
            </div>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">
              {{ getTime(activity) }}
              <span class="text-warm-200 dark:text-warm-300"> · 照护: {{ getMemberName((activity as any).caregiverId) }}</span>
            </p>

            <div v-if="editingNoteId === activity.id" class="mt-2 relative">
              <div class="flex gap-1.5">
                <input
                  v-model="editingNoteText"
                  type="text"
                  placeholder="添加备注..."
                  class="flex-1 px-2 py-1.5 text-xs bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-lg text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
                  @focus="showNoteSuggestions = true"
                />
                <button
                  @click="saveEditNote"
                  class="px-2.5 py-1.5 rounded-lg bg-peach-400 text-white text-xs font-bold"
                >
                  <Check :size="14" />
                </button>
                <button
                  @click="cancelEditNote"
                  class="px-2.5 py-1.5 rounded-lg bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200"
                >
                  <X :size="14" />
                </button>
              </div>
              <div
                v-if="showNoteSuggestions && noteSuggestions.length > 0"
                class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-lg shadow-lg z-10 p-1.5 flex flex-wrap gap-1"
              >
                <button
                  v-for="suggestion in noteSuggestions"
                  :key="suggestion"
                  @click="applyNoteSuggestion(suggestion)"
                  class="px-2 py-1 rounded-md bg-cream-50 dark:bg-warm-500/10 text-[11px] text-warm-400 dark:text-warm-200 hover:bg-peach-50 hover:text-peach-500 dark:hover:bg-peach-500/10 transition-colors"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <div v-else-if="getNote(activity)" class="mt-1.5 flex items-start gap-1.5">
              <StickyNote :size="11" class="text-warm-300 mt-0.5 shrink-0" />
              <p class="text-[11px] text-warm-400 dark:text-warm-300 leading-snug">{{ getNote(activity) }}</p>
              <button
                v-if="canEdit(activity.id) && !batchMode"
                @click="startEditNote(activity.id)"
                class="text-warm-300 hover:text-peach-500 shrink-0"
              >
                <Pencil :size="10" />
              </button>
            </div>

            <button
              v-else-if="canEdit(activity.id) && !batchMode"
              @click="startEditNote(activity.id)"
              class="mt-1.5 text-[11px] text-peach-400 hover:text-peach-500 font-semibold flex items-center gap-1"
            >
              <Pencil :size="10" />
              添加备注
            </button>
          </div>

          <div class="flex flex-col gap-1 shrink-0">
            <button
              v-if="canEdit(activity.id) && !batchMode && editingNoteId !== activity.id"
              @click="startEditNote(activity.id)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-warm-200 dark:text-warm-300 hover:text-peach-500 hover:bg-peach-50 dark:hover:bg-peach-500/10 transition-colors"
              title="编辑备注"
            >
              <Pencil :size="14" />
            </button>
            <button
              v-if="canDelete(activity.id) && !batchMode"
              @click="handleDelete(activity.id)"
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
              :class="confirmDeleteId === activity.id
                ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
                : 'text-warm-200 dark:text-warm-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'"
              title="删除"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredActivities.length === 0" class="text-center py-16">
        <p class="text-warm-300 dark:text-warm-200 text-sm">暂无记录</p>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="showBatchNoteModal"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeBatchNoteModal"
      >
        <div class="w-full max-w-sm bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 shadow-2xl">
          <h3 class="text-lg font-bold text-warm-500 dark:text-cream-100 mb-1 flex items-center gap-2">
            <StickyNote :size="18" class="text-mint-500" />
            批量添加备注
          </h3>
          <p class="text-xs text-warm-300 dark:text-warm-200 mb-4">
            将为 {{ selectedIds.size }} 条记录设置相同备注
          </p>
          <textarea
            v-model="batchNoteText"
            rows="3"
            placeholder="输入备注内容..."
            class="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"
          />
          <div v-if="noteSuggestions.length > 0" class="mt-2 flex flex-wrap gap-1">
            <button
              v-for="suggestion in noteSuggestions.slice(0, 8)"
              :key="suggestion"
              @click="batchNoteText = suggestion"
              class="px-2 py-1 rounded-md bg-cream-50 dark:bg-warm-500/10 text-[11px] text-warm-400 dark:text-warm-200 hover:bg-peach-50 hover:text-peach-500 dark:hover:bg-peach-500/10 transition-colors"
            >
              {{ suggestion }}
            </button>
          </div>
          <div class="flex gap-2 mt-5">
            <button
              @click="closeBatchNoteModal"
              class="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 text-sm font-bold"
            >
              取消
            </button>
            <button
              @click="applyBatchNote"
              :disabled="!batchNoteText.trim()"
              class="flex-1 px-4 py-2.5 rounded-xl bg-peach-400 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
