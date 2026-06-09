<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Baby, Milk, Moon, Droplets, ChevronRight } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'

const router = useRouter()
const { baby, todaySummary, recentActivities } = useBabyCare()

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function getAge() {
  const birth = new Date(baby.value.birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  return `${months}个月`
}

function getActivityIcon(record: ActivityRecord) {
  if (record.type === 'feeding') return Milk
  if (record.type === 'sleep') return Moon
  return Droplets
}

function getActivityColor(record: ActivityRecord) {
  if (record.type === 'feeding') return 'bg-peach-100 text-peach-500 dark:bg-peach-500/20 dark:text-peach-400'
  if (record.type === 'sleep') return 'bg-mint-100 text-mint-500 dark:bg-mint-500/20 dark:text-mint-400'
  return 'bg-cream-200 text-warm-400 dark:bg-cream-300/20 dark:text-cream-300'
}

function getActivitySummary(record: ActivityRecord) {
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

function getActivityTime(record: ActivityRecord) {
  if (record.type === 'sleep') return formatTime((record as SleepRecord).startTime)
  if (record.type === 'feeding') return formatTime((record as FeedingRecord).timestamp)
  return formatTime((record as DiaperRecord).timestamp)
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
          <Baby :size="20" class="text-peach-400 dark:text-peach-400" />
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display">{{ baby.name }}</h1>
          <p class="text-xs text-warm-300 dark:text-warm-200">{{ getAge() }}</p>
        </div>
      </div>
    </header>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">今日概览</h2>
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
            <Milk :size="16" class="text-peach-400" />
          </div>
          <p class="text-2xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ todaySummary.feedCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">喂奶 · {{ todaySummary.totalAmount }}ml</p>
        </div>
        <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
            <Moon :size="16" class="text-mint-500" />
          </div>
          <p class="text-2xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ formatDuration(todaySummary.sleepMinutes) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">睡眠时长</p>
        </div>
        <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center">
            <Droplets :size="16" class="text-warm-400" />
          </div>
          <p class="text-2xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ todaySummary.diaperCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">尿布更换</p>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">快速记录</h2>
      <div class="flex gap-3">
        <button
          @click="router.push('/feeding')"
          class="flex-1 flex items-center justify-center gap-2 bg-peach-400 hover:bg-peach-500 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-md shadow-peach-200 dark:shadow-peach-500/20"
        >
          <Milk :size="18" />
          喂奶
        </button>
        <button
          @click="router.push('/sleep')"
          class="flex-1 flex items-center justify-center gap-2 bg-mint-400 hover:bg-mint-500 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-md shadow-mint-200 dark:shadow-mint-500/20"
        >
          <Moon :size="18" />
          睡眠
        </button>
        <button
          @click="router.push('/diaper')"
          class="flex-1 flex items-center justify-center gap-2 bg-warm-300 hover:bg-warm-400 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-md shadow-warm-100 dark:shadow-warm-500/20"
        >
          <Droplets :size="18" />
          尿布
        </button>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">最近活动</h2>
        <button @click="router.push('/history')" class="text-xs text-peach-400 flex items-center gap-0.5 hover:text-peach-500">
          查看全部 <ChevronRight :size="14" />
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-2.5 shadow-sm"
        >
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getActivityColor(activity)">
            <component :is="getActivityIcon(activity)" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">{{ getActivitySummary(activity) }}</p>
          </div>
          <span class="text-xs text-warm-300 dark:text-warm-200 shrink-0">{{ getActivityTime(activity) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
