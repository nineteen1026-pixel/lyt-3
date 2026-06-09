<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Bell, Milk, Moon, Droplets, Clock, AlertTriangle, Check, X, RefreshCw, Plus, ChevronRight } from 'lucide-vue-next'
import { useReminder } from '@/composables/useReminder'
import { useBabyCare } from '@/composables/useBabyCare'
import type { MissedRecord } from '@/types'

const router = useRouter()
const {
  pattern, pendingReminders, overdueReminders, pendingMissed,
  timeSinceLastFeeding, timeSinceLastDiaper, timeSinceLastSleepEnd,
  notifPermissionGranted,
  generateReminders, detectMissedRecords,
  dismissReminder, completeReminder, dismissMissed,
  fillMissedFeeding, fillMissedSleep, fillMissedDiaper,
  requestNotificationPermission, refreshAll,
} = useReminder()
const { canAddRecord } = useBabyCare()

let timer: ReturnType<typeof setInterval> | null = null
const now = ref(Date.now())

onMounted(() => {
  refreshAll()
  timer = setInterval(() => {
    now.value = Date.now()
    pushReminders()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function pushReminders() {
  const { pushed } = refreshAll()
  return pushed
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(iso)}`
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function timeAgoDisplay(ms: number | null) {
  if (ms === null) return '暂无记录'
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时${min % 60}分钟前`
  const d = Math.floor(h / 24)
  return `${d}天前`
}

function minsUntil(iso: string) {
  const diff = new Date(iso).getTime() - now.value
  return Math.round(diff / 60000)
}

function countdownDisplay(iso: string) {
  const diff = new Date(iso).getTime() - now.value
  if (diff <= 0) return '已超时'
  const min = Math.round(diff / 60000)
  if (min < 60) return `${min}分钟后`
  const h = Math.floor(min / 60)
  return `${h}小时${min % 60}分钟后`
}

function getTypeIcon(type: 'feeding' | 'sleep' | 'diaper') {
  if (type === 'feeding') return Milk
  if (type === 'sleep') return Moon
  return Droplets
}

function getTypeColor(type: 'feeding' | 'sleep' | 'diaper') {
  if (type === 'feeding') return 'bg-peach-100 text-peach-500 dark:bg-peach-500/20 dark:text-peach-400'
  if (type === 'sleep') return 'bg-mint-100 text-mint-500 dark:bg-mint-500/20 dark:text-mint-400'
  return 'bg-cream-200 text-warm-400 dark:bg-cream-300/20 dark:text-cream-300'
}

function getTypeAccent(type: 'feeding' | 'sleep' | 'diaper') {
  if (type === 'feeding') return 'text-peach-500 dark:text-peach-400'
  if (type === 'sleep') return 'text-mint-500 dark:text-mint-400'
  return 'text-warm-400 dark:text-cream-300'
}

const activeFillMissed = ref<MissedRecord | null>(null)
const fillFeedingType = ref<'breast' | 'formula'>('formula')
const fillDuration = ref(15)
const fillAmount = ref(90)
const fillSleepQuality = ref<'deep' | 'light' | 'fussy'>('light')
const fillDiaperType = ref<'wet' | 'dirty' | 'mixed'>('wet')
const fillSuccess = ref(false)

function startFillMissed(missed: MissedRecord) {
  activeFillMissed.value = missed
  fillSuccess.value = false
  fillFeedingType.value = 'formula'
  fillDuration.value = 15
  fillAmount.value = 90
  fillSleepQuality.value = 'light'
  fillDiaperType.value = 'wet'
}

function cancelFill() {
  activeFillMissed.value = null
}

function submitFill() {
  if (!activeFillMissed.value) return
  const m = activeFillMissed.value
  let ok = false
  if (m.type === 'feeding') {
    ok = fillMissedFeeding(m.id, fillFeedingType.value, fillDuration.value, fillAmount.value)
  } else if (m.type === 'sleep') {
    ok = fillMissedSleep(m.id, fillSleepQuality.value)
  } else if (m.type === 'diaper') {
    ok = fillMissedDiaper(m.id, fillDiaperType.value)
  }
  if (ok) {
    fillSuccess.value = true
    setTimeout(() => {
      activeFillMissed.value = null
      fillSuccess.value = false
    }, 800)
  }
}

async function handleRequestPermission() {
  await requestNotificationPermission()
}

const sleepQualities = ['deep', 'light', 'fussy'] as const
const diaperTypes = ['wet', 'dirty', 'mixed'] as const

function sleepLabel(q: string) {
  return q === 'deep' ? '安睡' : q === 'light' ? '浅睡' : '烦躁'
}

function diaperLabel(t: string) {
  return t === 'wet' ? '湿' : t === 'dirty' ? '便' : '混合'
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-8">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Bell :size="20" class="text-peach-400" />
        提醒中心
      </h1>
    </header>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Clock :size="14" /> 当前状态
      </h2>
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
            <Milk :size="16" class="text-peach-400" />
          </div>
          <p class="text-xs font-bold text-peach-500 dark:text-peach-400">{{ timeAgoDisplay(timeSinceLastFeeding) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">上次喂奶</p>
        </div>
        <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
            <Moon :size="16" class="text-mint-500" />
          </div>
          <p class="text-xs font-bold text-mint-500 dark:text-mint-400">{{ timeAgoDisplay(timeSinceLastSleepEnd) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">上次醒来</p>
        </div>
        <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3 text-center">
          <div class="w-8 h-8 mx-auto mb-1.5 rounded-full bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center">
            <Droplets :size="16" class="text-warm-400" />
          </div>
          <p class="text-xs font-bold text-warm-400 dark:text-cream-300">{{ timeAgoDisplay(timeSinceLastDiaper) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-0.5">上次换尿布</p>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <RefreshCw :size="14" /> 规律分析（近3天）
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-warm-400 dark:text-warm-200 flex items-center gap-2">
            <Milk :size="14" class="text-peach-400" /> 喂奶间隔
          </span>
          <span class="text-sm font-bold" :class="getTypeAccent('feeding')">约{{ formatDuration(pattern.avgFeedingIntervalMin) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-warm-400 dark:text-warm-200 flex items-center gap-2">
            <Milk :size="14" class="text-peach-400" /> 日均喂奶
          </span>
          <span class="text-sm font-bold" :class="getTypeAccent('feeding')">{{ pattern.avgDailyFeedings }}次</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-warm-400 dark:text-warm-200 flex items-center gap-2">
            <Moon :size="14" class="text-mint-500" /> 睡眠时长
          </span>
          <span class="text-sm font-bold" :class="getTypeAccent('sleep')">约{{ formatDuration(pattern.avgSleepDurationMin) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-warm-400 dark:text-warm-200 flex items-center gap-2">
            <Droplets :size="14" class="text-warm-400" /> 尿布间隔
          </span>
          <span class="text-sm font-bold" :class="getTypeAccent('diaper')">约{{ formatDuration(pattern.avgDiaperIntervalMin) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-warm-400 dark:text-warm-200 flex items-center gap-2">
            <Droplets :size="14" class="text-warm-400" /> 日均换尿布
          </span>
          <span class="text-sm font-bold" :class="getTypeAccent('diaper')">{{ pattern.avgDailyDiapers }}次</span>
        </div>

        <div class="border-t border-cream-100 dark:border-warm-500/10 pt-3 space-y-2">
          <p class="text-[10px] font-bold text-warm-300 dark:text-warm-200 mb-1">预计下次</p>
          <div v-if="pattern.nextFeedingTime" class="flex items-center justify-between">
            <span class="text-xs text-warm-400 dark:text-warm-200 flex items-center gap-1.5">
              <Milk :size="12" class="text-peach-400" /> 喂奶
            </span>
            <span class="text-xs font-bold" :class="getTypeAccent('feeding')">{{ countdownDisplay(pattern.nextFeedingTime) }}</span>
          </div>
          <div v-if="pattern.nextSleepTime" class="flex items-center justify-between">
            <span class="text-xs text-warm-400 dark:text-warm-200 flex items-center gap-1.5">
              <Moon :size="12" class="text-mint-500" /> 睡眠
            </span>
            <span class="text-xs font-bold" :class="getTypeAccent('sleep')">{{ countdownDisplay(pattern.nextSleepTime) }}</span>
          </div>
          <div v-if="pattern.nextDiaperTime" class="flex items-center justify-between">
            <span class="text-xs text-warm-400 dark:text-warm-200 flex items-center gap-1.5">
              <Droplets :size="12" class="text-warm-400" /> 尿布
            </span>
            <span class="text-xs font-bold" :class="getTypeAccent('diaper')">{{ countdownDisplay(pattern.nextDiaperTime) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!notifPermissionGranted" class="mb-6">
      <button
        @click="handleRequestPermission"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-mint-50 to-peach-50 dark:from-mint-500/10 dark:to-peach-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-9 h-9 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
          <Bell :size="18" class="text-mint-500" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">开启推送通知</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">及时接收喂奶/睡眠/尿布提醒</p>
        </div>
        <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
      </button>
    </section>

    <section v-if="overdueReminders.length > 0" class="mb-6">
      <h2 class="text-sm font-bold text-red-500 dark:text-red-400 mb-3 flex items-center gap-1.5">
        <AlertTriangle :size="14" /> 已超时提醒
      </h2>
      <div class="space-y-2">
        <div
          v-for="r in overdueReminders"
          :key="r.id"
          class="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-3 shadow-sm border border-red-200 dark:border-red-500/20"
        >
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getTypeColor(r.type)">
            <component :is="getTypeIcon(r.type)" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-red-600 dark:text-red-400 truncate">{{ r.title }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">{{ r.description }}</p>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button @click="completeReminder(r.id)"
              class="w-8 h-8 rounded-lg bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
              <Check :size="14" class="text-mint-500" />
            </button>
            <button @click="dismissReminder(r.id)"
              class="w-8 h-8 rounded-lg bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
              <X :size="14" class="text-warm-300 dark:text-warm-200" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="pendingReminders.length > 0" class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Bell :size="14" /> 待办提醒
      </h2>
      <div class="space-y-2">
        <div
          v-for="r in pendingReminders"
          :key="r.id"
          class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm"
        >
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getTypeColor(r.type)">
            <component :is="getTypeIcon(r.type)" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">{{ r.title }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">{{ r.description }}</p>
            <p class="text-[10px] font-bold mt-0.5" :class="getTypeAccent(r.type)">{{ countdownDisplay(r.scheduledTime) }}</p>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button @click="completeReminder(r.id)"
              class="w-8 h-8 rounded-lg bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
              <Check :size="14" class="text-mint-500" />
            </button>
            <button @click="dismissReminder(r.id)"
              class="w-8 h-8 rounded-lg bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
              <X :size="14" class="text-warm-300 dark:text-warm-200" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="pendingMissed.length > 0 && canAddRecord" class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <AlertTriangle :size="14" /> 漏记补录
      </h2>
      <div class="space-y-2">
        <div
          v-for="m in pendingMissed"
          :key="m.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl shadow-sm overflow-hidden"
        >
          <div class="flex items-center gap-3 px-3 py-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getTypeColor(m.type)">
              <component :is="getTypeIcon(m.type)" :size="18" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100 truncate">
                {{ m.type === 'feeding' ? '喂奶' : m.type === 'sleep' ? '睡眠' : '尿布' }}可能漏记
              </p>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">{{ m.description }}</p>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">建议时间: {{ formatDate(m.suggestedTime) }}</p>
            </div>
            <div class="flex gap-1.5 shrink-0">
              <button @click="startFillMissed(m)"
                class="w-8 h-8 rounded-lg bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                <Plus :size="14" class="text-peach-500" />
              </button>
              <button @click="dismissMissed(m.id)"
                class="w-8 h-8 rounded-lg bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
                <X :size="14" class="text-warm-300 dark:text-warm-200" />
              </button>
            </div>
          </div>

          <div v-if="activeFillMissed?.id === m.id && !fillSuccess"
            class="px-3 pb-3 pt-1 border-t border-cream-100 dark:border-warm-500/10">
            <template v-if="m.type === 'feeding'">
              <div class="mb-3">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">喂奶类型</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" @click="fillFeedingType = 'breast'"
                    class="rounded-xl py-2 text-center font-bold text-xs transition-all border-2"
                    :class="fillFeedingType === 'breast'
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                      : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
                  >🤱 母乳</button>
                  <button type="button" @click="fillFeedingType = 'formula'"
                    class="rounded-xl py-2 text-center font-bold text-xs transition-all border-2"
                    :class="fillFeedingType === 'formula'
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                      : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
                  >🍼 配方奶</button>
                </div>
              </div>
              <div v-if="fillFeedingType === 'breast'" class="mb-3">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">时长: {{ fillDuration }}min</label>
                <input v-model.number="fillDuration" type="range" min="1" max="60" class="w-full" />
              </div>
              <div v-if="fillFeedingType === 'formula'" class="mb-3">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">奶量(ml)</label>
                <input v-model.number="fillAmount" type="number" min="0" max="500" step="5"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
              </div>
            </template>
            <template v-if="m.type === 'sleep'">
              <div class="mb-3">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">睡眠质量</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="q in sleepQualities" :key="q" type="button" @click="fillSleepQuality = q"
                    class="rounded-xl py-2 text-center font-bold text-xs transition-all border-2"
                    :class="fillSleepQuality === q
                      ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-500 dark:text-mint-400'
                      : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
                  >{{ sleepLabel(q) }}</button>
                </div>
              </div>
            </template>
            <template v-if="m.type === 'diaper'">
              <div class="mb-3">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">尿布类型</label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="t in diaperTypes" :key="t" type="button" @click="fillDiaperType = t"
                    class="rounded-xl py-2 text-center font-bold text-xs transition-all border-2"
                    :class="fillDiaperType === t
                      ? 'bg-cream-100 dark:bg-cream-300/10 border-warm-300 text-warm-400 dark:text-cream-300'
                      : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
                  >{{ diaperLabel(t) }}</button>
                </div>
              </div>
            </template>
            <div class="flex gap-2">
              <button @click="submitFill"
                class="flex-1 bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2 font-bold text-xs transition-all active:scale-[0.98]">
                补录
              </button>
              <button @click="cancelFill"
                class="flex-1 bg-cream-100 dark:bg-warm-500/20 text-warm-400 dark:text-warm-200 rounded-xl py-2 font-bold text-xs transition-all">
                取消
              </button>
            </div>
          </div>

          <div v-if="activeFillMissed?.id === m.id && fillSuccess"
            class="px-3 pb-3 pt-2 flex items-center justify-center gap-1.5">
            <Check :size="14" class="text-mint-500" />
            <span class="text-xs font-bold text-mint-500">补录成功</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="overdueReminders.length === 0 && pendingReminders.length === 0 && pendingMissed.length === 0" class="mb-6">
      <div class="flex flex-col items-center justify-center py-12">
        <div class="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-4">
          <Check :size="32" class="text-mint-500" />
        </div>
        <p class="text-lg font-bold text-warm-500 dark:text-cream-100">一切正常</p>
        <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">暂无待办提醒或漏记</p>
      </div>
    </section>
  </div>
</template>
