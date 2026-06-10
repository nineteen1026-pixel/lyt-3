<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Lightbulb, Milk, Moon, Droplets, AlertCircle, Info, ShieldAlert, User, ChevronDown, Check, Filter } from 'lucide-vue-next'
import { useMonthlyReport } from '@/composables/useMonthlyReport'
import { useFamily } from '@/composables/useFamily'
import { useBabyCare } from '@/composables/useBabyCare'

const { selectedYear, selectedMonth, monthlyReport, prevMonth, nextMonth, canGoNext, filterCaregiverId, setCaregiverFilter } = useMonthlyReport()
const { family } = useFamily()
const { getMemberName } = useBabyCare()

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

const monthLabel = computed(() => `${selectedYear.value}年${selectedMonth.value}月`)

const maxFeedCount = computed(() => Math.max(...monthlyReport.value.days.map(d => d.feedCount), 1))
const maxSleepMinutes = computed(() => Math.max(...monthlyReport.value.days.map(d => d.sleepMinutes), 1))
const maxDiaperCount = computed(() => Math.max(...monthlyReport.value.days.map(d => d.diaperCount), 1))

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
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

function getAnomalyTitleColor(level: string) {
  if (level === 'danger') return 'text-red-600 dark:text-red-400'
  if (level === 'warning') return 'text-amber-600 dark:text-amber-400'
  return 'text-blue-600 dark:text-blue-400'
}

const trendMaxFeed = computed(() => Math.max(...monthlyReport.value.trends.map(t => t.avgFeedCount), 1))
const trendMaxSleep = computed(() => Math.max(...monthlyReport.value.trends.map(t => t.avgSleepMinutes), 1))
const trendMaxDiaper = computed(() => Math.max(...monthlyReport.value.trends.map(t => t.avgDiaperCount), 1))

const hasData = computed(() => {
  const d = monthlyReport.value.days
  return d.some(day => day.feedCount > 0 || day.sleepMinutes > 0 || day.diaperCount > 0)
})

const deepSleepPercent = computed(() => Math.round(monthlyReport.value.summary.deepSleepRate * 100))

const breastPercent = computed(() => {
  const bv = monthlyReport.value.summary.breastVsFormula
  const total = bv.breast + bv.formula
  return total > 0 ? Math.round((bv.breast / total) * 100) : 0
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-5">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <CalendarDays :size="20" class="text-peach-400" />
        月报分析
      </h1>
      <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">喂养·睡眠·排便趋势汇总与异常识别</p>
    </header>

    <div class="flex items-center justify-between mb-5 bg-white dark:bg-[#2a1f1a] rounded-2xl px-4 py-3 shadow-sm">
      <button @click="prevMonth" class="w-8 h-8 rounded-xl bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center hover:bg-cream-200 dark:hover:bg-warm-500/30 transition-colors">
        <ChevronLeft :size="18" class="text-warm-400 dark:text-cream-200" />
      </button>
      <span class="text-sm font-bold text-warm-500 dark:text-cream-100 font-display">{{ monthLabel }}</span>
      <button @click="nextMonth" :disabled="!canGoNext"
        class="w-8 h-8 rounded-xl bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center hover:bg-cream-200 dark:hover:bg-warm-500/30 transition-colors"
        :class="!canGoNext ? 'opacity-30 cursor-not-allowed' : ''">
        <ChevronRight :size="18" class="text-warm-400 dark:text-cream-200" />
      </button>
    </div>

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
      <CalendarDays :size="48" class="text-warm-200 dark:text-warm-500/30 mx-auto mb-4" />
      <p class="text-sm text-warm-300 dark:text-warm-200">本月暂无记录数据</p>
      <p class="text-xs text-warm-200 dark:text-warm-400 mt-1">开始记录宝宝的日常活动后，月报将自动生成</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 text-center">
          <Milk :size="16" class="text-peach-400 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ monthlyReport.summary.avgDailyFeedCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均喂奶</p>
          <p class="text-[10px] text-warm-200 dark:text-warm-400 mt-0.5">共{{ monthlyReport.summary.totalFeedCount }}次</p>
        </div>
        <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3 text-center">
          <Moon :size="16" class="text-mint-400 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ (monthlyReport.summary.avgDailySleepMinutes / 60).toFixed(1) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均睡眠(h)</p>
          <p class="text-[10px] text-warm-200 dark:text-warm-400 mt-0.5">深睡{{ deepSleepPercent }}%</p>
        </div>
        <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3 text-center">
          <Droplets :size="16" class="text-warm-300 mx-auto mb-1" />
          <p class="text-xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ monthlyReport.summary.avgDailyDiaperCount }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">日均尿布</p>
          <p class="text-[10px] text-warm-200 dark:text-warm-400 mt-0.5">共{{ monthlyReport.summary.totalDiaperCount }}次</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 shadow-sm">
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">喂养方式</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
              <div class="h-full rounded-full bg-peach-400 transition-all" :style="{ width: breastPercent + '%' }"></div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-[10px] text-peach-400">母乳 {{ breastPercent }}%</span>
            <span class="text-[10px] text-warm-300">配方奶 {{ 100 - breastPercent }}%</span>
          </div>
        </div>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 shadow-sm">
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">睡眠质量</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
              <div class="h-full rounded-full bg-mint-400 transition-all" :style="{ width: deepSleepPercent + '%' }"></div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-[10px] text-mint-400">深睡 {{ deepSleepPercent }}%</span>
            <span class="text-[10px] text-warm-300">浅/烦躁 {{ 100 - deepSleepPercent }}%</span>
          </div>
        </div>
      </div>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 周趋势
        </h2>
        <div class="space-y-3">
          <div v-for="trend in monthlyReport.trends" :key="trend.weekIndex"
            class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
            <p class="text-xs font-bold text-warm-400 dark:text-cream-200 mb-3">{{ trend.label }}</p>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <p class="text-sm font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ trend.avgFeedCount }}</p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">日均喂奶</p>
                <div class="mt-1 h-1.5 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
                  <div class="h-full rounded-full bg-peach-400 transition-all" :style="{ width: Math.min(100, (trend.avgFeedCount / trendMaxFeed) * 100) + '%' }"></div>
                </div>
              </div>
              <div class="text-center">
                <p class="text-sm font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ (trend.avgSleepMinutes / 60).toFixed(1) }}h</p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">日均睡眠</p>
                <div class="mt-1 h-1.5 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
                  <div class="h-full rounded-full bg-mint-400 transition-all" :style="{ width: Math.min(100, (trend.avgSleepMinutes / trendMaxSleep) * 100) + '%' }"></div>
                </div>
              </div>
              <div class="text-center">
                <p class="text-sm font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ trend.avgDiaperCount }}</p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">日均尿布</p>
                <div class="mt-1 h-1.5 rounded-full bg-cream-100 dark:bg-warm-500/20 overflow-hidden">
                  <div class="h-full rounded-full bg-warm-300 transition-all" :style="{ width: Math.min(100, (trend.avgDiaperCount / trendMaxDiaper) * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 每日喂奶趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-[3px] h-24 overflow-x-auto">
            <div v-for="day in monthlyReport.days" :key="day.day" class="flex flex-col items-center min-w-[10px]" style="flex:1 0 10px">
              <span class="text-[8px] font-bold text-peach-400 leading-none">{{ day.feedCount || '' }}</span>
              <div
                class="w-full rounded-t bg-peach-400 transition-all duration-300"
                :style="{ height: Math.max(2, (day.feedCount / maxFeedCount) * 60) + 'px' }"
              ></div>
              <span class="text-[8px] text-warm-300 dark:text-warm-200 leading-none mt-0.5"
                :class="day.day % 5 === 0 ? 'opacity-100' : 'opacity-0'">{{ day.day }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 每日睡眠趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-[3px] h-24 overflow-x-auto">
            <div v-for="day in monthlyReport.days" :key="day.day" class="flex flex-col items-center min-w-[10px]" style="flex:1 0 10px">
              <span class="text-[8px] font-bold text-mint-400 leading-none">{{ day.sleepMinutes ? formatDuration(day.sleepMinutes) : '' }}</span>
              <div
                class="w-full rounded-t bg-mint-400 transition-all duration-300"
                :style="{ height: Math.max(2, (day.sleepMinutes / maxSleepMinutes) * 60) + 'px' }"
              ></div>
              <span class="text-[8px] text-warm-300 dark:text-warm-200 leading-none mt-0.5"
                :class="day.day % 5 === 0 ? 'opacity-100' : 'opacity-0'">{{ day.day }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <TrendingUp :size="14" /> 每日排便趋势
        </h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-end gap-[3px] h-24 overflow-x-auto">
            <div v-for="day in monthlyReport.days" :key="day.day" class="flex flex-col items-center min-w-[10px]" style="flex:1 0 10px">
              <span class="text-[8px] font-bold text-warm-400 leading-none">{{ day.diaperCount || '' }}</span>
              <div
                class="w-full rounded-t bg-warm-300 transition-all duration-300"
                :style="{ height: Math.max(2, (day.diaperCount / maxDiaperCount) * 60) + 'px' }"
              ></div>
              <span class="text-[8px] text-warm-300 dark:text-warm-200 leading-none mt-0.5"
                :class="day.day % 5 === 0 ? 'opacity-100' : 'opacity-0'">{{ day.day }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="monthlyReport.anomalies.length > 0" class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <AlertCircle :size="14" class="text-amber-500" /> 异常识别
          <span class="ml-auto text-[10px] font-normal bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{{ monthlyReport.anomalies.length }}项</span>
        </h2>
        <div class="space-y-2">
          <div v-for="anomaly in monthlyReport.anomalies" :key="anomaly.id"
            class="rounded-2xl px-4 py-3 border"
            :class="getAnomalyColor(anomaly.level)">
            <div class="flex items-start gap-2">
              <component :is="getAnomalyIcon(anomaly.level)" :size="16" class="shrink-0 mt-0.5" :class="getAnomalyIconColor(anomaly.level)" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold" :class="getAnomalyTitleColor(anomaly.level)">{{ anomaly.title }}</p>
                <p class="text-xs text-warm-400 dark:text-warm-200 mt-0.5">{{ anomaly.description }}</p>
                <div class="mt-2 bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2">
                  <p class="text-xs text-warm-500 dark:text-cream-200">
                    <span class="font-semibold">建议：</span>{{ anomaly.advice }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="mb-6">
        <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl px-4 py-3 border border-mint-200 dark:border-mint-500/20">
          <div class="flex items-center gap-2">
            <span class="text-base shrink-0">✅</span>
            <p class="text-sm text-mint-600 dark:text-mint-400 font-semibold">本月未检测到异常</p>
          </div>
          <p class="text-xs text-warm-400 dark:text-warm-200 mt-1 ml-6">各项指标波动在正常范围内</p>
        </div>
      </section>

      <section class="mb-6">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <Lightbulb :size="14" class="text-peach-400" /> 育儿建议
        </h2>
        <div class="space-y-2">
          <div v-for="(advice, i) in monthlyReport.advices" :key="i"
            class="bg-cream-100 dark:bg-cream-300/10 rounded-xl px-4 py-3 text-sm text-warm-400 dark:text-cream-200 flex items-start gap-2">
            <span class="text-base shrink-0">💡</span>
            <span>{{ advice }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
