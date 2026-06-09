<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, TrendingUp, Lightbulb, Milk, Moon, Droplets } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'

const { getWeekData } = useBabyCare()
const weekData = computed(() => getWeekData(7))

const maxFeedCount = computed(() => Math.max(...weekData.value.map(d => d.summary.feedCount), 1))
const maxSleepMinutes = computed(() => Math.max(...weekData.value.map(d => d.summary.sleepMinutes), 1))
const maxDiaperCount = computed(() => Math.max(...weekData.value.map(d => d.summary.diaperCount), 1))

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

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

const insights = computed(() => {
  const items: string[] = []
  const today = weekData.value[weekData.value.length - 1].summary
  const avgFeeds = parseFloat(avgFeedCount.value)
  const avgSleep = parseFloat(avgSleepHours.value) * 60

  if (today.feedCount > avgFeeds + 1) {
    items.push('今日喂奶次数比日均偏多，宝宝可能处于猛长期')
  } else if (today.feedCount < avgFeeds - 1) {
    items.push('今日喂奶次数偏少，留意宝宝食欲变化')
  }

  if (today.sleepMinutes > avgSleep + 60) {
    items.push('今日睡眠时间比日均多1小时以上，可能需要更多进食')
  } else if (today.sleepMinutes < avgSleep - 60) {
    items.push('今日睡眠偏少，注意观察宝宝精神状态')
  }

  if (today.diaperCount >= 5) {
    items.push('今日尿布更换充足，水分摄入正常')
  }

  if (items.length === 0) {
    items.push('宝宝各项指标均在正常范围内，继续保持！')
  }

  return items
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-5">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <BarChart3 :size="20" class="text-peach-400" />
        周报统计
      </h1>
      <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">近7天数据概览</p>
    </header>

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
        <Lightbulb :size="14" /> 规律洞察
      </h2>
      <div class="space-y-2">
        <div
          v-for="(insight, i) in insights"
          :key="i"
          class="bg-cream-100 dark:bg-cream-300/10 rounded-xl px-4 py-3 text-sm text-warm-400 dark:text-cream-200 flex items-start gap-2"
        >
          <span class="text-base shrink-0">💡</span>
          <span>{{ insight }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
