<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Baby, Milk, Moon, Droplets, ChevronRight, ChevronDown, Plus, Users, Heart } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'

const router = useRouter()
const { baby, babies, currentBabyId, switchBaby, todaySummary, recentActivities, canAddRecord, getMemberName, needsJoin } = useBabyCare()

const showBabyPicker = ref(false)

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

function handleSwitchBaby(id: string) {
  switchBaby(id)
  showBabyPicker.value = false
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Users :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-500 dark:text-cream-100">你尚未加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">请先通过邀请码加入家庭</p>
      <button @click="router.push('/family')" class="mt-4 px-6 py-2.5 rounded-xl bg-peach-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <template v-else>
    <header class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
          <Baby :size="20" class="text-peach-400 dark:text-peach-400" />
        </div>
        <div class="flex-1">
          <button @click="showBabyPicker = !showBabyPicker" class="flex items-center gap-1">
            <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display">{{ baby.name }}</h1>
            <ChevronDown v-if="babies.length > 1" :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="showBabyPicker ? 'rotate-180' : ''" />
          </button>
          <p class="text-xs text-warm-300 dark:text-warm-200">{{ getAge() }}</p>
        </div>
        <button @click="router.push('/family')"
          class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
          <Baby :size="16" class="text-peach-400" />
        </button>
      </div>

      <div v-if="showBabyPicker && babies.length > 1"
        class="mt-2 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-lg border border-cream-200 dark:border-warm-500/20 overflow-hidden">
        <button v-for="b in babies" :key="b.id" @click="handleSwitchBaby(b.id)"
          class="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream-50 dark:hover:bg-warm-500/10"
          :class="b.id === currentBabyId ? 'bg-peach-50 dark:bg-peach-500/10' : ''">
          <div class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="b.id === currentBabyId ? 'bg-peach-100 dark:bg-peach-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
            <Baby :size="14" :class="b.id === currentBabyId ? 'text-peach-400' : 'text-warm-300 dark:text-warm-200'" />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold" :class="b.id === currentBabyId ? 'text-peach-500 dark:text-peach-400' : 'text-warm-500 dark:text-cream-100'">{{ b.name }}</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ b.gender === 'male' ? '👦' : '👧' }} {{ b.birthDate }}</p>
          </div>
          <div v-if="b.id === currentBabyId" class="w-2 h-2 rounded-full bg-peach-400"></div>
        </button>
        <button @click="router.push('/family'); showBabyPicker = false"
          class="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-cream-100 dark:border-warm-500/10 text-xs font-bold text-peach-400 hover:bg-cream-50 dark:hover:bg-warm-500/10">
          <Plus :size="14" /> 添加宝宝
        </button>
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
      <template v-if="canAddRecord">
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
      </template>
      <div v-else class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl py-3 text-center">
        <p class="text-xs text-warm-300 dark:text-warm-200">当前角色无添加记录权限</p>
      </div>
    </section>

    <section class="mb-6">
      <button
        @click="router.push('/health')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
          <Heart :size="18" class="text-peach-400" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">成长健康档案</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">身高体重 · 疫苗计划 · 体检记录 · 趋势曲线</p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
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
            <p class="text-[10px] text-warm-300 dark:text-warm-200">by {{ getMemberName(activity.createdBy) }}</p>
          </div>
          <span class="text-xs text-warm-300 dark:text-warm-200 shrink-0">{{ getActivityTime(activity) }}</span>
        </div>
      </div>
    </section>
    </template>
  </div>
</template>
