<script setup lang="ts">
import { ref, computed } from 'vue'
import { Milk, Moon, Droplets, Trash2, Filter, Eye, User, ChevronDown, Check } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'
import { useRouter } from 'vue-router'

const router = useRouter()
const { allActivities, deleteRecord, canDelete, getMemberName, canViewRecord, needsJoin } = useBabyCare()
const { family } = useFamily()

const filterType = ref<'all' | 'feeding' | 'sleep' | 'diaper'>('all')
const filterMemberId = ref<string>('all')
const showMemberPicker = ref(false)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const filteredActivities = computed(() => {
  let result = allActivities.value
  if (filterType.value !== 'all') {
    result = result.filter(r => r.type === filterType.value)
  }
  if (filterMemberId.value !== 'all') {
    result = result.filter(r => (r as any).caregiverId === filterMemberId.value)
  }
  return result
})

const filterMemberName = computed(() => {
  if (filterMemberId.value === 'all') return '全部照护人'
  return getMemberName(filterMemberId.value)
})

function selectMember(id: string) {
  filterMemberId.value = id
  showMemberPicker.value = false
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
  if (record.type === 'sleep') return formatDate((record as SleepRecord).startTime)
  if (record.type === 'feeding') return formatDate((record as FeedingRecord).timestamp)
  return formatDate((record as DiaperRecord).timestamp)
}

const filterTabs = [
  { value: 'all' as const, label: '全部' },
  { value: 'feeding' as const, label: '喂奶' },
  { value: 'sleep' as const, label: '睡眠' },
  { value: 'diaper' as const, label: '尿布' },
]

const confirmDeleteId = ref<string | null>(null)

function handleDelete(id: string) {
  if (!canDelete(id)) return
  if (confirmDeleteId.value === id) {
    deleteRecord(id)
    confirmDeleteId.value = null
  } else {
    confirmDeleteId.value = id
    setTimeout(() => {
      confirmDeleteId.value = null
    }, 2000)
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-5">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Filter :size="20" class="text-warm-300" />
        历史记录
      </h1>
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
    <p class="text-xs text-warm-300 dark:text-warm-200 mb-4">共 {{ filteredActivities.length }} 条记录</p>

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

    <div v-if="familyMembers.length > 0" class="mb-4 relative">
      <button
        @click="showMemberPicker = !showMemberPicker"
        class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-left flex items-center justify-between shadow-sm"
      >
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
            <User :size="12" class="text-peach-400" />
          </div>
          <span class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ filterMemberName }}</span>
        </div>
        <ChevronDown :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showMemberPicker }" />
      </button>
      <div
        v-if="showMemberPicker"
        class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto"
      >
        <button
          @click="selectMember('all')"
          class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
          :class="filterMemberId === 'all' ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
        >
          <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <Filter :size="12" class="text-warm-400" />
          </div>
          <span>全部照护人</span>
          <Check v-if="filterMemberId === 'all'" :size="14" class="ml-auto text-peach-400" />
        </button>
        <button
          v-for="member in familyMembers"
          :key="member.id"
          @click="selectMember(member.id)"
          class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
          :class="filterMemberId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
        >
          <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <User :size="12" class="text-warm-400" />
          </div>
          <span>{{ member.name }}</span>
          <Check v-if="filterMemberId === member.id" :size="14" class="ml-auto text-peach-400" />
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id"
        class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getColor(activity)">
          <component :is="getIcon(activity)" :size="18" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">{{ getSummary(activity) }}</p>
          <p class="text-[11px] text-warm-300 dark:text-warm-200">
            {{ getTime(activity) }}
            <span class="text-warm-200 dark:text-warm-300"> · 照护: {{ getMemberName((activity as any).caregiverId) }}</span>
          </p>
        </div>
        <button
          v-if="canDelete(activity.id)"
          @click="handleDelete(activity.id)"
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          :class="confirmDeleteId === activity.id
            ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
            : 'text-warm-200 dark:text-warm-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <div v-if="filteredActivities.length === 0" class="text-center py-16">
      <p class="text-warm-300 dark:text-warm-200 text-sm">暂无记录</p>
    </div>
    </template>
  </div>
</template>
