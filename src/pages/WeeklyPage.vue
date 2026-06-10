<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BarChart3, TrendingUp, Lightbulb, Milk, Moon, Droplets,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, AlertCircle,
  ShieldAlert, Info, CheckCircle2, User, ChevronDown, Check, Filter,
  Target, Award, Clock, AlertOctagon, Sparkles, Sun,
} from 'lucide-vue-next'
import { useGrowthAnalysis } from '@/composables/useGrowthAnalysis'
import { useFamily } from '@/composables/useFamily'
import { useBabyCare } from '@/composables/useBabyCare'

const { analysis, weekData, maxFeedCount, maxSleepMinutes, maxDiaperCount, anomalyCount, dangerCount, warningCount, setCaregiverFilter, filterCaregiverId, weeklySleepStats, weeklySleepPatternReport } = useGrowthAnalysis()
const { family } = useFamily()
const { getMemberName, currentSleepGoal, getDaySleepTimes } = useBabyCare()

const weeklyNapStats = computed(() => {
  let totalNapCount = 0
  let totalNapMinutes = 0
  let validDays = 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const detail = getDaySleepTimes(d, filterCaregiverId.value || undefined)
    if (detail.napCount > 0 || detail.mainSleepMinutes > 0) {
      validDays++
      totalNapCount += detail.napCount
      totalNapMinutes += detail.napMinutes
    }
  }
  return {
    avgNapCount: validDays > 0 ? parseFloat((totalNapCount / validDays).toFixed(1)) : 0,
    avgNapMinutes: validDays > 0 ? Math.round(totalNapMinutes / validDays) : 0,
    totalNapCount,
    totalNapMinutes,
    validDays,
  }
})

const showCaregiverPicker = ref(false)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const filterMemberName = computed(() => {
  if (!filterCaregiverId.value) return '全部照护人'
  return getMemberName(filterCaregiverId.value)
})

function selectCaregiver(id: string | undefined) {
  setCaregiverFilter(id)
  showCaregiverPicker.value = false
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function getDiffColor(diff: number) {
  if (diff > 0) return 'text-peach-500 dark:text-peach-400'
  if (diff < 0) return 'text-mint-500 dark:text-mint-400'
  return 'text-warm-300 dark:text-warm-200'
}

function getDiffIcon(diff: number) {
  if (diff > 0) return ArrowUpRight
  if (diff < 0) return ArrowDownRight
  return Minus
}

function getTrendIcon(direction: string) {
  if (direction === 'up') return ArrowUpRight
  if (direction === 'down') return ArrowDownRight
  return Minus
}

function getTrendColor(direction: string) {
  if (direction === 'up') return 'text-peach-500 dark:text-peach-400'
  if (direction === 'down') return 'text-mint-500 dark:text-mint-400'
  return 'text-warm-300 dark:text-warm-200'
}

function getTrendBg(direction: string) {
  if (direction === 'up') return 'bg-peach-50 dark:bg-peach-500/10 border-peach-200 dark:border-peach-500/20'
  if (direction === 'down') return 'bg-mint-50 dark:bg-mint-500/10 border-mint-200 dark:border-mint-500/20'
  return 'bg-cream-100 dark:bg-cream-300/10 border-cream-200 dark:border-cream-300/20'
}

function getCategoryIcon(category: string) {
  if (category === 'feeding') return Milk
  if (category === 'sleep') return Moon
  return Droplets
}

function getCategoryColor(category: string) {
  if (category === 'feeding') return 'text-peach-400'
  if (category === 'sleep') return 'text-mint-400'
  return 'text-warm-300'
}

function getCategoryBg(category: string) {
  if (category === 'feeding') return 'bg-peach-50 dark:bg-peach-500/10'
  if (category === 'sleep') return 'bg-mint-50 dark:bg-mint-500/10'
  return 'bg-cream-100 dark:bg-cream-300/10'
}

function getAnomalyIcon(level: string) {
  if (level === 'danger') return ShieldAlert
  if (level === 'warning') return AlertTriangle
  return Info
}

function getAnomalyColor(level: string) {
  if (level === 'danger') return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
  if (level === 'warning') return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
  return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
}

function getAnomalyIconColor(level: string) {
  if (level === 'danger') return 'text-red-500'
  if (level === 'warning') return 'text-amber-500'
  return 'text-blue-500'
}

function getAdviceIcon(level: string) {
  if (level === 'good') return CheckCircle2
  if (level === 'warning') return AlertCircle
  return Lightbulb
}

function getAdviceColor(level: string) {
  if (level === 'good') return 'bg-mint-50 dark:bg-mint-500/10 border-mint-200 dark:border-mint-500/20'
  if (level === 'warning') return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
  return 'bg-peach-50 dark:bg-peach-500/10 border-peach-200 dark:border-peach-500/20'
}

function getAdviceIconColor(level: string) {
  if (level === 'good') return 'text-mint-500'
  if (level === 'warning') return 'text-amber-500'
  return 'text-peach-400'
}

function getAdviceTitleColor(level: string) {
  if (level === 'good') return 'text-mint-600 dark:text-mint-400'
  if (level === 'warning') return 'text-amber-600 dark:text-amber-400'
  return 'text-peach-600 dark:text-peach-400'
}

const hasData = computed(() => {
  return weekData.value.some(d => d.summary.feedCount > 0 || d.summary.sleepMinutes > 0 || d.summary.diaperCount > 0)
})

const avgFeedCount = computed(() => {
  const sum = weekData.value.reduce((a, d) => a + d.summary.feedCount, 0)
  return (sum / weekData.value.length).toFixed(1)
})
const avgSleepHours = computed(() => {
  const sum = weekData.value.reduce((a, d) => a + d.summary.sleepMinutes, 0)
  return (sum / weekData.value.length / 60).toFixed(1)
})
const avgDiaperCount = computed(() => {
  const sum = weekData.value.reduce((a, d) => a + d.summary.diaperCount, 0)
  return (sum / weekData.value.length).toFixed(1)
})

function formatDeviation(min: number): string {
  if (Math.abs(min) >= 900) return '-'
  const sign = min > 0 ? '+' : ''
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  if (h > 0) return `${sign}${h}h${m}m`
  return `${sign}${m}m`
}

function getConsistencyLabel(level: string) {
  const map: Record<string, string> = {
    excellent: '非常规律',
    good: '较为规律',
    fair: '一般',
    poor: '波动较大',
  }
  return map[level] || level
}

function getConsistencyColor(level: string) {
  const map: Record<string, string> = {
    excellent: 'text-mint-500 bg-mint-100 dark:bg-mint-500/20 dark:text-mint-400',
    good: 'text-mint-600 bg-mint-50 dark:bg-mint-500/10 dark:text-mint-300',
    fair: 'text-peach-500 bg-peach-100 dark:bg-peach-500/20 dark:text-peach-400',
    poor: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400',
  }
  return map[level] || ''
}

function getSeverityColor(severity: string) {
  const map: Record<string, string> = {
    normal: 'bg-mint-100 dark:bg-mint-500/20 border-mint-200 dark:border-mint-500/20',
    mild: 'bg-peach-50 dark:bg-peach-500/10 border-peach-200 dark:border-peach-500/20',
    moderate: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    severe: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  }
  return map[severity] || ''
}

function getSeverityTextColor(severity: string) {
  const map: Record<string, string> = {
    normal: 'text-mint-600 dark:text-mint-400',
    mild: 'text-peach-600 dark:text-peach-400',
    moderate: 'text-amber-600 dark:text-amber-400',
    severe: 'text-red-600 dark:text-red-400',
  }
  return map[severity] || ''
}

function getSeverityLabel(severity: string) {
  const map: Record<string, string> = {
    normal: '正常',
    mild: '轻度偏差',
    moderate: '中度偏差',
    severe: '严重偏差',
  }
  return map[severity] || severity
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
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-8">
    <header class="mb-5">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <BarChart3 :size="20" class="text-peach-400" />
        成长分析
      </h1>
      <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">近7天数据洞察 · 日均对比 · 趋势与建议</p>
    </header>

    <div v-if="familyMembers.length > 0" class="mb-5 relative">
      <button
        @click="showCaregiverPicker = !showCaregiverPicker"
        class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-2xl px-4 py-3 text-left flex items-center justify-between shadow-sm"
      >
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
            <User :size="16" class="text-peach-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ filterMemberName }}</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">按照护人筛选数据</p>
          </div>
        </div>
        <ChevronDown :size="18" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
      </button>
      <div
        v-if="showCaregiverPicker"
        class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-2xl shadow-lg z-10 py-1 max-h-56 overflow-y-auto"
      >
        <button
          @click="selectCaregiver(undefined)"
          class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
          :class="!filterCaregiverId ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
        >
          <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <Filter :size="14" class="text-warm-400" />
          </div>
          <span>全部照护人</span>
          <Check v-if="!filterCaregiverId" :size="16" class="ml-auto text-peach-400" />
        </button>
        <button
          v-for="member in familyMembers"
          :key="member.id"
          @click="selectCaregiver(member.id)"
          class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
          :class="filterCaregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
        >
          <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <User :size="14" class="text-warm-400" />
          </div>
          <span>{{ member.name }}</span>
          <Check v-if="filterCaregiverId === member.id" :size="16" class="ml-auto text-peach-400" />
        </button>
      </div>
    </div>

    <div v-if="!hasData" class="text-center py-16">
      <BarChart3 :size="48" class="text-warm-200 dark:text-warm-500/30 mx-auto mb-4" />
      <p class="text-sm text-warm-300 dark:text-warm-200">近7天暂无记录数据</p>
      <p class="text-xs text-warm-200 dark:text-warm-400 mt-1">开始记录宝宝的日常活动后，分析将自动生成</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 text-center">
          <Milk :size="16" class="text-peach-400 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ avgFeedCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均喂奶</p>
        </div>
        <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3 text-center">
          <Moon :size="16" class="text-mint-400 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ avgSleepHours }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均睡眠(h)</p>
        </div>
        <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3 text-center">
          <Droplets :size="16" class="text-warm-300 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ avgDiaperCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均尿布</p>
        </div>
      </div>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <BarChart3 :size="14" /> 今日 vs 日均
        </h2>
        <div class="space-y-2">
          <div
            v-for="comp in analysis.comparisons"
            :key="comp.category"
            class="bg-white dark:bg-[#2a1f1a] rounded-2xl px-4 py-3 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center" :class="getCategoryBg(comp.category)">
                <component :is="getCategoryIcon(comp.category)" :size="18" :class="getCategoryColor(comp.category)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ comp.label }}</p>
                  <div class="flex items-center gap-1" :class="getDiffColor(comp.diff)">
                    <component :is="getDiffIcon(comp.diff)" :size="14" />
                    <span class="text-xs font-bold">{{ comp.diffPercent > 0 ? '+' : '' }}{{ comp.diffPercent }}%</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-warm-400 dark:text-cream-200">今日 <strong>{{ comp.todayValue }}</strong>{{ comp.unit }}</span>
                  <span class="text-[10px] text-warm-200 dark:text-warm-400">vs</span>
                  <span class="text-xs text-warm-300 dark:text-warm-200">日均 <strong>{{ comp.avgValue }}</strong>{{ comp.unit }}</span>
                </div>
                <div class="mt-2 h-1.5 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="comp.category === 'feeding' ? 'bg-peach-400' : comp.category === 'sleep' ? 'bg-mint-400' : 'bg-warm-300'"
                    :style="{ width: Math.min(100, comp.avgValue > 0 ? (comp.todayValue / comp.avgValue) * 50 : 50) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 连续趋势
        </h2>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="trend in analysis.trends"
            :key="trend.category"
            class="rounded-2xl px-3 py-3 border text-center"
            :class="getTrendBg(trend.direction)"
          >
            <component :is="getCategoryIcon(trend.category)" :size="16" :class="getCategoryColor(trend.category)" class="mx-auto mb-1" />
            <div class="flex items-center justify-center gap-1 mb-1">
              <component :is="getTrendIcon(trend.direction)" :size="14" :class="getTrendColor(trend.direction)" />
              <span class="text-sm font-extrabold font-display" :class="getTrendColor(trend.direction)">
                {{ trend.direction === 'up' ? '上升' : trend.direction === 'down' ? '下降' : '平稳' }}
              </span>
            </div>
            <p v-if="trend.days > 0" class="text-[10px] font-bold" :class="getTrendColor(trend.direction)">
              连续{{ trend.days }}天
            </p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">{{ trend.label }}</p>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 喂奶趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-2 h-32">
            <div v-for="(day, i) in weekData" :key="i" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-peach-400">{{ day.summary.feedCount }}</span>
              <div
                class="w-full rounded-t-lg bg-peach-400 transition-all duration-500"
                :style="{ height: Math.max(4, (day.summary.feedCount / maxFeedCount) * 80) + 'px' }"
              ></div>
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ day.date }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 睡眠趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-2 h-32">
            <div v-for="(day, i) in weekData" :key="i" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-mint-400">{{ formatDuration(day.summary.sleepMinutes) }}</span>
              <div
                class="w-full rounded-t-lg bg-mint-400 transition-all duration-500"
                :style="{ height: Math.max(4, (day.summary.sleepMinutes / maxSleepMinutes) * 80) + 'px' }"
              ></div>
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ day.date }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 尿布趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-2 h-32">
            <div v-for="(day, i) in weekData" :key="i" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold text-warm-400">{{ day.summary.diaperCount }}</span>
              <div
                class="w-full rounded-t-lg bg-warm-300 transition-all duration-500"
                :style="{ height: Math.max(4, (day.summary.diaperCount / maxDiaperCount) * 80) + 'px' }"
              ></div>
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ day.date }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentSleepGoal" class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <Target :size="14" class="text-peach-400" /> 睡眠作息目标分析
          <span class="ml-auto text-[10px] font-normal text-warm-300 dark:text-warm-400 bg-cream-100 dark:bg-warm-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Moon :size="9" /> 基于夜间主睡眠段
          </span>
        </h2>

        <div v-if="weeklySleepStats" class="space-y-3">
          <div class="bg-gradient-to-br from-peach-50 via-mint-50 to-cream-100 dark:from-peach-500/10 dark:via-mint-500/10 dark:to-cream-300/10 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Award :size="18" class="text-peach-400" />
                <span class="text-sm font-bold text-warm-500 dark:text-cream-100">近7天主睡眠达成</span>
              </div>
              <span class="text-2xl font-extrabold font-display" :class="getRateColor(weeklySleepStats.overallAchievementRate)">
                {{ weeklySleepStats.overallAchievementRate }}%
              </span>
            </div>
            <div class="h-2.5 rounded-full bg-white/60 dark:bg-[#2a1f1a]/50 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-peach-400 to-mint-400"
                :style="{ width: weeklySleepStats.overallAchievementRate + '%' }"
              ></div>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3 text-center">
              <div class="rounded-xl py-2" :class="getRateBg(weeklySleepStats.bedtimeAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200">入睡达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.bedtimeAchievementRate)">
                  {{ weeklySleepStats.bedtimeAchievementRate }}%
                </p>
              </div>
              <div class="rounded-xl py-2" :class="getRateBg(weeklySleepStats.wakeTimeAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200">起床达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.wakeTimeAchievementRate)">
                  {{ weeklySleepStats.wakeTimeAchievementRate }}%
                </p>
              </div>
              <div class="rounded-xl py-2" :class="getRateBg(weeklySleepStats.sleepHoursAchievementRate)">
                <p class="text-[10px] text-warm-400 dark:text-warm-200">时长达标</p>
                <p class="text-base font-extrabold font-display" :class="getRateColor(weeklySleepStats.sleepHoursAchievementRate)">
                  {{ weeklySleepStats.sleepHoursAchievementRate }}%
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
            <h3 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
              <Clock :size="12" /> 主睡眠平均偏差
            </h3>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">入睡偏差</p>
                <p class="text-sm font-bold" :class="Math.abs(weeklySleepStats.avgBedtimeDeviationMin) <= 30 ? 'text-mint-500' : 'text-peach-500'">
                  {{ formatDeviation(weeklySleepStats.avgBedtimeDeviationMin) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">起床偏差</p>
                <p class="text-sm font-bold" :class="Math.abs(weeklySleepStats.avgWakeTimeDeviationMin) <= 30 ? 'text-mint-500' : 'text-peach-500'">
                  {{ formatDeviation(weeklySleepStats.avgWakeTimeDeviationMin) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">时长偏差</p>
                <p class="text-sm font-bold" :class="Math.abs(weeklySleepStats.avgSleepHoursDeviationMin) <= 60 ? 'text-mint-500' : 'text-peach-500'">
                  {{ formatDeviation(weeklySleepStats.avgSleepHoursDeviationMin) }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="weeklyNapStats.validDays > 0" class="bg-amber-50/60 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-100/60 dark:border-amber-500/20">
            <h3 class="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
              <Sun :size="12" /> 白天小睡统计（7天均值）
            </h3>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-[10px] text-amber-600/70 dark:text-amber-400/70 mb-1">平均次数</p>
                <p class="text-sm font-extrabold text-amber-700 dark:text-amber-400 font-display">
                  {{ weeklyNapStats.avgNapCount }}次
                </p>
              </div>
              <div>
                <p class="text-[10px] text-amber-600/70 dark:text-amber-400/70 mb-1">小睡时长</p>
                <p class="text-sm font-extrabold text-amber-700 dark:text-amber-400 font-display">
                  {{ (weeklyNapStats.avgNapMinutes / 60).toFixed(1) }}h
                </p>
              </div>
              <div>
                <p class="text-[10px] text-amber-600/70 dark:text-amber-400/70 mb-1">周累计</p>
                <p class="text-sm font-extrabold text-amber-700 dark:text-amber-400 font-display">
                  {{ weeklyNapStats.totalNapCount }}次 / {{ (weeklyNapStats.totalNapMinutes / 60).toFixed(1) }}h
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="weeklySleepPatternReport" class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <AlertOctagon :size="14" class="text-amber-500" /> 睡眠规律偏差分析
          <span class="ml-auto text-[10px] font-normal text-warm-300 dark:text-warm-400 bg-cream-100 dark:bg-warm-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Moon :size="9" /> 仅统计主睡眠段
          </span>
        </h2>

        <div class="space-y-3">
          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
            <div class="grid grid-cols-3 gap-3 text-center mb-3">
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">主睡平均入睡</p>
                <p class="text-sm font-extrabold text-peach-500 dark:text-peach-400 font-display">
                  {{ weeklySleepPatternReport.avgBedtime || '-' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">主睡平均起床</p>
                <p class="text-sm font-extrabold text-mint-500 dark:text-mint-400 font-display">
                  {{ weeklySleepPatternReport.avgWakeTime || '-' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">主睡平均时长</p>
                <p class="text-sm font-extrabold text-warm-500 dark:text-cream-300 font-display">
                  {{ weeklySleepPatternReport.avgSleepHours }}h
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 justify-center">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="getConsistencyColor(weeklySleepPatternReport.bedtimeConsistency)">
                入睡 {{ getConsistencyLabel(weeklySleepPatternReport.bedtimeConsistency) }}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="getConsistencyColor(weeklySleepPatternReport.wakeTimeConsistency)">
                起床 {{ getConsistencyLabel(weeklySleepPatternReport.wakeTimeConsistency) }}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="getConsistencyColor(weeklySleepPatternReport.sleepHoursConsistency)">
                时长 {{ getConsistencyLabel(weeklySleepPatternReport.sleepHoursConsistency) }}
              </span>
            </div>
            <div v-if="weeklySleepPatternReport.bestDay || weeklySleepPatternReport.worstDay" class="mt-3 pt-3 border-t border-cream-100 dark:border-warm-500/10 flex justify-around text-xs">
              <div v-if="weeklySleepPatternReport.bestDay" class="text-center">
                <Sparkles :size="12" class="text-mint-500 mx-auto mb-0.5" />
                <span class="text-warm-300 dark:text-warm-200">最佳</span>
                <span class="font-bold text-mint-500 ml-1">{{ weeklySleepPatternReport.bestDay }}</span>
              </div>
              <div v-if="weeklySleepPatternReport.worstDay" class="text-center">
                <AlertTriangle :size="12" class="text-peach-400 mx-auto mb-0.5" />
                <span class="text-warm-300 dark:text-warm-200">待改善</span>
                <span class="font-bold text-peach-500 ml-1">{{ weeklySleepPatternReport.worstDay }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
            <h3 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-3">每日主睡偏差详情</h3>
            <div class="space-y-2">
              <div
                v-for="dev in weeklySleepPatternReport.deviations"
                :key="dev.date"
                class="rounded-xl px-3 py-2.5 border"
                :class="getSeverityColor(dev.severity)"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold" :class="getSeverityTextColor(dev.severity)">{{ dev.date }}</span>
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded" :class="getSeverityColor(dev.severity) + ' ' + getSeverityTextColor(dev.severity)">
                    {{ getSeverityLabel(dev.severity) }}
                  </span>
                </div>
                <p class="text-[11px] text-warm-400 dark:text-warm-200">{{ dev.description }}</p>
                <div class="flex gap-3 mt-1 text-[10px] text-warm-300 dark:text-warm-400">
                  <span>入睡 {{ formatDeviation(dev.bedtimeDeviationMin) }}</span>
                  <span>起床 {{ formatDeviation(dev.wakeTimeDeviationMin) }}</span>
                  <span>时长 {{ formatDeviation(dev.sleepHoursDeviationMin) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-cream-100 to-peach-50 dark:from-cream-300/10 dark:to-peach-500/10 rounded-2xl p-4 border border-cream-200 dark:border-peach-500/20">
            <h3 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2 flex items-center gap-1.5">
              <Lightbulb :size="12" class="text-peach-400" /> 睡眠规律改善建议
            </h3>
            <ul class="space-y-1.5">
              <li
                v-for="(sugg, i) in weeklySleepPatternReport.suggestions"
                :key="i"
                class="text-[11px] text-warm-400 dark:text-warm-200 flex items-start gap-1.5"
              >
                <span class="text-peach-400 mt-0.5">•</span>
                <span>{{ sugg }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <AlertCircle :size="14" class="text-amber-500" /> 异常天数
          <span v-if="anomalyCount > 0" class="ml-auto text-[10px] font-normal bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
            {{ anomalyCount }}项
            <template v-if="dangerCount > 0"> · {{ dangerCount }}严重</template>
          </span>
        </h2>
        <template v-if="anomalyCount > 0">
          <div class="space-y-2">
            <div
              v-for="(anomaly, i) in analysis.anomalyDays"
              :key="i"
              class="rounded-2xl px-4 py-3 border"
              :class="getAnomalyColor(anomaly.level)"
            >
              <div class="flex items-start gap-2">
                <component :is="getAnomalyIcon(anomaly.level)" :size="16" class="shrink-0 mt-0.5" :class="getAnomalyIconColor(anomaly.level)" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :class="getCategoryBg(anomaly.category)">
                      {{ anomaly.date }}
                    </span>
                    <span class="text-[10px]" :class="getCategoryColor(anomaly.category)">
                      {{ anomaly.category === 'feeding' ? '喂奶' : anomaly.category === 'sleep' ? '睡眠' : '尿布' }}
                    </span>
                  </div>
                  <p class="text-xs text-warm-400 dark:text-warm-200 mt-1">{{ anomaly.description }}</p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-[10px] text-warm-300 dark:text-warm-200">实际值 <strong>{{ anomaly.value }}</strong></span>
                    <span class="text-[10px] text-warm-200 dark:text-warm-400">日均 <strong>{{ anomaly.avgValue }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl px-4 py-3 border border-mint-200 dark:border-mint-500/20">
            <div class="flex items-center gap-2">
              <span class="text-base shrink-0">✅</span>
              <p class="text-sm text-mint-600 dark:text-mint-400 font-semibold">近7天未检测到异常</p>
            </div>
            <p class="text-xs text-warm-400 dark:text-warm-200 mt-1 ml-6">各项指标波动在正常范围内</p>
          </div>
        </template>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <Lightbulb :size="14" class="text-peach-400" /> 建议摘要
        </h2>
        <div class="space-y-2">
          <div
            v-for="advice in analysis.advices"
            :key="advice.id"
            class="rounded-2xl px-4 py-3 border"
            :class="getAdviceColor(advice.level)"
          >
            <div class="flex items-start gap-2">
              <component :is="getAdviceIcon(advice.level)" :size="16" class="shrink-0 mt-0.5" :class="getAdviceIconColor(advice.level)" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold" :class="getAdviceTitleColor(advice.level)">{{ advice.title }}</p>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold" :class="getCategoryBg(advice.category)">
                    {{ advice.category === 'feeding' ? '喂奶' : advice.category === 'sleep' ? '睡眠' : advice.category === 'diaper' ? '尿布' : '综合' }}
                  </span>
                </div>
                <p class="text-xs text-warm-400 dark:text-warm-200 mt-1">{{ advice.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
