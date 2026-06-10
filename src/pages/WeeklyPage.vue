<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BarChart3, TrendingUp, Lightbulb, Milk, Moon, Droplets,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, AlertCircle,
  ShieldAlert, Info, CheckCircle2, User, ChevronDown, Check, Filter,
} from 'lucide-vue-next'
import { useGrowthAnalysis } from '@/composables/useGrowthAnalysis'
import { useFamily } from '@/composables/useFamily'
import { useBabyCare } from '@/composables/useBabyCare'

const { analysis, weekData, maxFeedCount, maxSleepMinutes, maxDiaperCount, anomalyCount, dangerCount, warningCount, setCaregiverFilter, filterCaregiverId } = useGrowthAnalysis()
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
