<script setup lang="ts">
import { ref, computed } from 'vue'
import { Milk, Moon, Droplets, Trash2, Filter } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'

const { allActivities, deleteRecord } = useBabyCare()

const filterType = ref<'all' | 'feeding' | 'sleep' | 'diaper'>('all')

const filteredActivities = computed(() => {
  if (filterType.value === 'all') return allActivities.value
  return allActivities.value.filter(r => r.type === filterType.value)
})

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
    return f.feedingType === 'breast' ? `母乳 ${f.duration}min` : `配方奶 ${f.amount}ml`
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
      <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">共 {{ filteredActivities.length }} 条记录</p>
    </header>

    <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
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
          <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ getTime(activity) }}</p>
        </div>
        <button
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
  </div>
</template>
