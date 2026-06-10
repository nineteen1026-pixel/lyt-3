<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Baby, Milk, Moon, Droplets, ChevronRight, ChevronDown, Plus, Users, Heart, Bell, CalendarDays, BookOpen, Pill, Target, CheckCircle, XCircle, Sun } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useReminder } from '@/composables/useReminder'
import { useMedicine } from '@/composables/useMedicine'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord } from '@/types'

const router = useRouter()
const { baby, babies, currentBabyId, switchBaby, todaySummary, recentActivities, canAddRecord, getMemberName, needsJoin, currentSleepGoal, getSleepGoalWeeklyStats, getSleepGoalDailyAchievement, getDaySleepTimes } = useBabyCare()
const { overdueReminders, pendingReminders, pendingMissed, refreshAll } = useReminder()
const { alertCount: medicineAlertCount, medicines: currentMedicines, inventorySummary, lowStockMedicines } = useMedicine()

const showBabyPicker = ref(false)

const weeklySleepStats = computed(() => getSleepGoalWeeklyStats(7))
const todaySleepAchievement = computed(() => getSleepGoalDailyAchievement(new Date()))
const todaySleepDetail = computed(() => getDaySleepTimes(new Date()))

function formatDeviation(min: number): string {
  if (Math.abs(min) >= 900) return '-'
  const sign = min > 0 ? '+' : ''
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  if (h > 0) return `${sign}${h}h${m}m`
  return `${sign}${m}m`
}

function getRateColor(rate: number) {
  if (rate >= 80) return 'text-mint-500 dark:text-mint-400'
  if (rate >= 50) return 'text-peach-500 dark:text-peach-400'
  return 'text-amber-500'
}

function getRateBg(rate: number) {
  if (rate >= 80) return 'bg-mint-100 dark:bg-mint-500/20'
  if (rate >= 50) return 'bg-peach-100 dark:bg-peach-500/20'
  return 'bg-amber-100 dark:bg-amber-500/20'
}

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

    <section v-if="currentSleepGoal" class="mb-6">
      <button
        @click="router.push('/weekly')"
        class="w-full text-left"
      >
        <div class="bg-gradient-to-br from-peach-50 via-mint-50 to-cream-100 dark:from-peach-500/10 dark:via-mint-500/10 dark:to-cream-300/10 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                <Target :size="16" class="text-peach-400" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-warm-500 dark:text-cream-100">作息目标达成</h2>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">近7天 · 点击查看周报分析</p>
              </div>
            </div>
            <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
          </div>

          <div v-if="weeklySleepStats" class="space-y-3">
            <div class="bg-white/60 dark:bg-[#2a1f1a]/50 rounded-xl p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-warm-400 dark:text-warm-100">综合达成率</span>
                <span class="text-lg font-extrabold font-display" :class="getRateColor(weeklySleepStats.overallAchievementRate)">
                  {{ weeklySleepStats.overallAchievementRate }}%
                </span>
              </div>
              <div class="h-2 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-peach-400 to-mint-400"
                  :style="{ width: weeklySleepStats.overallAchievementRate + '%' }"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-xl p-2.5 text-center" :class="getRateBg(weeklySleepStats.bedtimeAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200 mb-1">入睡达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.bedtimeAchievementRate)">
                  {{ weeklySleepStats.bedtimeAchievementRate }}%
                </p>
              </div>
              <div class="rounded-xl p-2.5 text-center" :class="getRateBg(weeklySleepStats.wakeTimeAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200 mb-1">起床达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.wakeTimeAchievementRate)">
                  {{ weeklySleepStats.wakeTimeAchievementRate }}%
                </p>
              </div>
              <div class="rounded-xl p-2.5 text-center" :class="getRateBg(weeklySleepStats.sleepHoursAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200 mb-1">时长达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.sleepHoursAchievementRate)">
                  {{ weeklySleepStats.sleepHoursAchievementRate }}%
                </p>
              </div>
            </div>

            <div v-if="todaySleepAchievement && todaySleepAchievement.bedtime" class="border-t border-cream-200/60 dark:border-warm-500/10 pt-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-1">
                  <Moon :size="10" class="text-peach-400" />
                  主睡眠
                </p>
                <span class="text-[10px] text-warm-200 dark:text-warm-400">
                  {{ todaySleepAchievement.sleepHours }}h / {{ currentSleepGoal?.targetSleepHours }}h
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="flex items-center gap-1 justify-center">
                  <component
                    :is="todaySleepAchievement.bedtimeAchieved ? CheckCircle : XCircle"
                    :size="12"
                    :class="todaySleepAchievement.bedtimeAchieved ? 'text-mint-500' : 'text-warm-300'"
                  />
                  <span class="text-[10px]" :class="todaySleepAchievement.bedtimeAchieved ? 'text-mint-600 dark:text-mint-400 font-semibold' : 'text-warm-300'">
                    {{ todaySleepAchievement.bedtime }}
                  </span>
                </div>
                <div class="flex items-center gap-1 justify-center">
                  <component
                    :is="todaySleepAchievement.wakeTimeAchieved ? CheckCircle : XCircle"
                    :size="12"
                    :class="todaySleepAchievement.wakeTimeAchieved ? 'text-mint-500' : 'text-warm-300'"
                  />
                  <span class="text-[10px]" :class="todaySleepAchievement.wakeTimeAchieved ? 'text-mint-600 dark:text-mint-400 font-semibold' : 'text-warm-300'">
                    {{ todaySleepAchievement.wakeTime || '-' }}
                  </span>
                </div>
                <div class="flex items-center gap-1 justify-center">
                  <component
                    :is="todaySleepAchievement.sleepHoursAchieved ? CheckCircle : XCircle"
                    :size="12"
                    :class="todaySleepAchievement.sleepHoursAchieved ? 'text-mint-500' : 'text-warm-300'"
                  />
                  <span class="text-[10px]" :class="todaySleepAchievement.sleepHoursAchieved ? 'text-mint-600 dark:text-mint-400 font-semibold' : 'text-warm-300'">
                    {{ todaySleepAchievement.sleepHours }}h
                  </span>
                </div>
              </div>
              <div v-if="todaySleepDetail.napCount > 0" class="mt-2 flex items-center justify-between bg-amber-50/60 dark:bg-amber-500/10 rounded-lg px-2 py-1 border border-amber-100/60 dark:border-amber-500/20">
                <span class="text-[9px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Sun :size="9" />
                  小睡{{ todaySleepDetail.napCount }}次
                </span>
                <span class="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                  {{ (todaySleepDetail.napMinutes / 60).toFixed(1) }}h · 全天{{ (todaySleepDetail.totalSleepMinutes / 60).toFixed(1) }}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
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
        @click="router.push('/schedule')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-amber-50 to-peach-50 dark:from-amber-500/10 dark:to-peach-500/10 rounded-2xl px-4 py-3 shadow-sm mb-3"
      >
        <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <CalendarDays :size="18" class="text-amber-500" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">宝宝作息计划</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">自定义日程 · 科学模板 · 执行追踪 · 偏差分析</p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
      <button
        @click="refreshAll(); router.push('/reminders')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-mint-50 to-peach-50 dark:from-mint-500/10 dark:to-peach-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center relative">
          <Bell :size="18" class="text-mint-500" />
          <div v-if="overdueReminders.length + pendingMissed.length > 0"
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
            {{ overdueReminders.length + pendingMissed.length }}
          </div>
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">提醒中心</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">
            <template v-if="overdueReminders.length > 0">{{ overdueReminders.length }}项超时提醒 · </template>
            <template v-if="pendingReminders.length > 0">{{ pendingReminders.length }}项待办 · </template>
            <template v-if="pendingMissed.length > 0">{{ pendingMissed.length }}项漏记 · </template>
            历史规律分析 · 智能推送
          </p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
    </section>

    <section class="mb-6">
      <button
        @click="router.push('/knowledge')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-mint-50 to-peach-50 dark:from-mint-500/10 dark:to-peach-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
          <BookOpen :size="18" class="text-mint-500" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">知识库与照护指南</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">按月龄推荐 · 喂养睡眠护理 · 发育里程碑</p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
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

    <section class="mb-6">
      <button
        @click="router.push('/monthly-report')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-cream-100 to-peach-50 dark:from-cream-300/10 dark:to-peach-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center">
          <CalendarDays :size="18" class="text-warm-400" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">月报分析</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">喂养睡眠排便趋势 · 异常识别 · 育儿建议</p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
    </section>

    <section class="mb-6">
      <button
        @click="router.push('/medicine')"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-peach-50 to-cream-100 dark:from-peach-500/10 dark:to-cream-300/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center relative">
          <Pill :size="18" class="text-peach-400" />
          <div v-if="medicineAlertCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
            {{ medicineAlertCount }}
          </div>
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">药品与护理用品</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">
            <template v-if="medicineAlertCount > 0">{{ medicineAlertCount }}项预警 · </template>
            库存{{ inventorySummary.total }}种(药品{{ inventorySummary.medicationCount }}/护理{{ inventorySummary.supplyCount }}) · 有效期 · 补货提醒
          </p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
      <div v-if="lowStockMedicines.length > 0" class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="med in lowStockMedicines.slice(0, 3)"
          :key="med.id"
          class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/20"
        >
          {{ med.name }} 仅剩{{ med.remainingQuantity }}{{ med.unit }}
        </span>
        <span v-if="lowStockMedicines.length > 3" class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200">
          +{{ lowStockMedicines.length - 3 }}
        </span>
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
            <p class="text-[10px] text-warm-300 dark:text-warm-200">照护: {{ getMemberName((activity as any).caregiverId) }}</p>
          </div>
          <span class="text-xs text-warm-300 dark:text-warm-200 shrink-0">{{ getActivityTime(activity) }}</span>
        </div>
      </div>
    </section>
    </template>
  </div>
</template>
