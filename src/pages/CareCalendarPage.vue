<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  CalendarDays, ChevronLeft, ChevronRight, Milk, Moon, Droplets,
  Plus, Eye, ArrowLeft, X, Clock, Calendar as CalendarIcon, LayoutGrid,
  TrendingUp, AlertCircle, Edit3,
} from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import type { ActivityRecord, FeedingRecord, SleepRecord, DiaperRecord, DaySummary } from '@/types'
import { FEEDING_TYPE_LABELS, BREAST_SIDE_LABELS } from '@/types'

const router = useRouter()
const {
  baby, currentFeedings, currentSleeps, currentDiapers,
  canAddRecord, needsJoin, addFeeding, addSleep, addDiaper,
  getDaySummary, getMemberName,
} = useBabyCare()

type ViewMode = 'month' | 'week'
const viewMode = ref<ViewMode>('month')

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const viewWeekStart = ref<Date>(getWeekStart(now))
const selectedDate = ref<string | null>(formatDate(now))

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const calendarTitle = computed(() => {
  if (viewMode.value === 'month') {
    return `${viewYear.value}年${viewMonth.value + 1}月`
  } else {
    const end = new Date(viewWeekStart.value)
    end.setDate(end.getDate() + 6)
    const startMonth = viewWeekStart.value.getMonth() + 1
    const endMonth = end.getMonth() + 1
    if (startMonth === endMonth) {
      return `${viewYear.value}年${startMonth}月 第${getWeekNumber(viewWeekStart.value)}周`
    } else {
      return `${viewYear.value}年${startMonth}月-${endMonth}月 第${getWeekNumber(viewWeekStart.value)}周`
    }
  }
})

function getWeekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
}

const calendarDays = computed(() => {
  if (viewMode.value === 'month') {
    return getMonthDays()
  } else {
    return getWeekDays()
  }
})

function getMonthDays() {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const lastDay = new Date(viewYear.value, viewMonth.value + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const prevMonthLastDay = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const days: {
    date: number
    isCurrentMonth: boolean
    fullDate: string
    summary: DaySummary | null
    isToday: boolean
    isSelected: boolean
  }[] = []

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const pm = viewMonth.value === 0 ? 11 : viewMonth.value - 1
    const py = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value
    days.push({
      date: d,
      isCurrentMonth: false,
      fullDate: `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      summary: null,
      isToday: false,
      isSelected: false,
    })
  }

  for (let d = 1; d <= totalDays; d++) {
    const fullDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(viewYear.value, viewMonth.value, d)
    const summary = getDaySummary(dateObj)
    const today = new Date()
    days.push({
      date: d,
      isCurrentMonth: true,
      fullDate,
      summary,
      isToday: dateObj.toDateString() === today.toDateString(),
      isSelected: selectedDate.value === fullDate,
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const nm = viewMonth.value === 11 ? 0 : viewMonth.value + 1
    const ny = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value
    days.push({
      date: d,
      isCurrentMonth: false,
      fullDate: `${ny}-${String(nm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      summary: null,
      isToday: false,
      isSelected: false,
    })
  }

  return days
}

function getWeekDays() {
  const days: {
    date: number
    isCurrentMonth: boolean
    fullDate: string
    summary: DaySummary | null
    isToday: boolean
    isSelected: boolean
  }[] = []

  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(viewWeekStart.value)
    d.setDate(d.getDate() + i)
    const fullDate = formatDate(d)
    days.push({
      date: d.getDate(),
      isCurrentMonth: d.getMonth() === viewMonth.value,
      fullDate,
      summary: getDaySummary(d),
      isToday: d.toDateString() === today.toDateString(),
      isSelected: selectedDate.value === fullDate,
    })
  }
  return days
}

function prev() {
  if (viewMode.value === 'month') {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value--
    } else {
      viewMonth.value--
    }
  } else {
    const newStart = new Date(viewWeekStart.value)
    newStart.setDate(newStart.getDate() - 7)
    viewWeekStart.value = newStart
    viewMonth.value = newStart.getMonth()
    viewYear.value = newStart.getFullYear()
  }
}

function next() {
  if (viewMode.value === 'month') {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value++
    } else {
      viewMonth.value++
    }
  } else {
    const newStart = new Date(viewWeekStart.value)
    newStart.setDate(newStart.getDate() + 7)
    viewWeekStart.value = newStart
    viewMonth.value = newStart.getMonth()
    viewYear.value = newStart.getFullYear()
  }
}

function goToday() {
  const today = new Date()
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
  viewWeekStart.value = getWeekStart(today)
  selectDate(today)
}

function selectDate(dateOrDay: Date | typeof calendarDays.value[0]) {
  if (dateOrDay instanceof Date) {
    selectedDate.value = formatDate(dateOrDay)
  } else {
    selectedDate.value = dateOrDay.fullDate
  }
}

const selectedDayActivities = computed<ActivityRecord[]>(() => {
  if (!selectedDate.value) return []
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dayStart = new Date(y, m - 1, d).getTime()
  const dayEnd = dayStart + 86400000

  const feedList = currentFeedings.value.filter(r => {
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })
  const sleepList = currentSleeps.value.filter(r => {
    const t = new Date(r.startTime).getTime()
    return t >= dayStart && t < dayEnd
  })
  const diaperList = currentDiapers.value.filter(r => {
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })

  const all: ActivityRecord[] = [...feedList, ...sleepList, ...diaperList]
  all.sort((a, b) => {
    const ta = a.type === 'sleep' ? (a as SleepRecord).startTime : (a as FeedingRecord | DiaperRecord).timestamp
    const tb = b.type === 'sleep' ? (b as SleepRecord).startTime : (b as FeedingRecord | DiaperRecord).timestamp
    return new Date(ta).getTime() - new Date(tb).getTime()
  })
  return all
})

const selectedDaySummary = computed(() => {
  if (!selectedDate.value) return null
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  return getDaySummary(new Date(y, m - 1, d))
})

const selectedDayDetail = computed(() => {
  if (!selectedDate.value) return null
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dayStart = new Date(y, m - 1, d).getTime()
  const dayEnd = dayStart + 86400000

  const feedList = currentFeedings.value.filter(r => {
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })
  const sleepList = currentSleeps.value.filter(r => {
    const t = new Date(r.startTime).getTime()
    return t >= dayStart && t < dayEnd
  })
  const diaperList = currentDiapers.value.filter(r => {
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })

  const breastCount = feedList.filter(f => f.feedingType === 'breast').length
  const formulaCount = feedList.filter(f => f.feedingType === 'formula').length
  const mixedCount = feedList.filter(f => f.feedingType === 'mixed').length
  const totalBreastDuration = feedList.reduce((acc, f) => acc + (f.feedingType !== 'formula' ? f.duration : 0), 0)
  const totalFormulaAmount = feedList.reduce((acc, f) => acc + (f.feedingType !== 'breast' ? f.amount : 0), 0)

  const deepSleepCount = sleepList.filter(s => s.quality === 'deep').length
  const lightSleepCount = sleepList.filter(s => s.quality === 'light').length
  const fussySleepCount = sleepList.filter(s => s.quality === 'fussy').length
  const totalSleepMinutes = sleepList.reduce((acc, s) => {
    return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000
  }, 0)

  const wetCount = diaperList.filter(d => d.diaperType === 'wet').length
  const dirtyCount = diaperList.filter(d => d.diaperType === 'dirty').length
  const mixedDiaperCount = diaperList.filter(d => d.diaperType === 'mixed').length

  return {
    feeding: {
      total: feedList.length,
      breastCount,
      formulaCount,
      mixedCount,
      totalBreastDuration,
      totalFormulaAmount,
      avgAmountPerFeeding: feedList.length > 0 ? Math.round(totalFormulaAmount / feedList.length) : 0,
    },
    sleep: {
      total: sleepList.length,
      deepSleepCount,
      lightSleepCount,
      fussySleepCount,
      totalMinutes: Math.round(totalSleepMinutes),
      avgDuration: sleepList.length > 0 ? Math.round(totalSleepMinutes / sleepList.length) : 0,
    },
    diaper: {
      total: diaperList.length,
      wetCount,
      dirtyCount,
      mixedCount: mixedDiaperCount,
    },
  }
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(y, m - 1, d).getDay()]
  return `${m}月${d}日 ${dayOfWeek}`
})

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
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
  if (record.type === 'sleep') return formatTime((record as SleepRecord).startTime)
  if (record.type === 'feeding') return formatTime((record as FeedingRecord).timestamp)
  return formatTime((record as DiaperRecord).timestamp)
}

const showSupplement = ref(false)
const supplementType = ref<'feeding' | 'sleep' | 'diaper'>('feeding')
const supplementDate = computed(() => selectedDate.value || new Date().toISOString().slice(0, 10))

const feedForm = ref({
  feedingType: 'formula' as 'breast' | 'formula' | 'mixed',
  breastSide: 'both' as 'left' | 'right' | 'both' | 'alternate',
  amount: 90,
  duration: 15,
  leftDuration: 7,
  rightDuration: 8,
  time: '12:00',
  note: '',
})
const sleepForm = ref({
  startTime: '',
  endTime: '',
  quality: 'deep' as 'deep' | 'light' | 'fussy',
  note: '',
})
const diaperForm = ref({
  diaperType: 'wet' as 'wet' | 'dirty' | 'mixed',
  time: '12:00',
  note: '',
})

const supplementSaved = ref(false)

watch(supplementDate, (d) => {
  if (d) {
    sleepForm.value.startTime = `${d}T08:00`
    sleepForm.value.endTime = `${d}T09:00`
  }
}, { immediate: true })

function openSupplement(type: 'feeding' | 'sleep' | 'diaper') {
  supplementType.value = type
  supplementSaved.value = false
  showSupplement.value = true
}

function submitSupplement() {
  if (supplementType.value === 'feeding') {
    const timestamp = new Date(`${supplementDate.value}T${feedForm.value.time}`).toISOString()
    const hasSide = feedForm.value.feedingType !== 'formula'
    addFeeding({
      timestamp,
      feedingType: feedForm.value.feedingType,
      duration: feedForm.value.feedingType !== 'formula' ? feedForm.value.duration : 0,
      amount: feedForm.value.feedingType !== 'breast' ? feedForm.value.amount : 0,
      breastSide: hasSide ? feedForm.value.breastSide : undefined,
      leftDuration: hasSide && feedForm.value.breastSide !== 'both' ? feedForm.value.leftDuration : undefined,
      rightDuration: hasSide && feedForm.value.breastSide !== 'both' ? feedForm.value.rightDuration : undefined,
      note: feedForm.value.note,
    })
  } else if (supplementType.value === 'sleep') {
    addSleep({
      startTime: new Date(sleepForm.value.startTime).toISOString(),
      endTime: new Date(sleepForm.value.endTime).toISOString(),
      quality: sleepForm.value.quality,
      note: sleepForm.value.note,
    })
  } else {
    const timestamp = new Date(`${supplementDate.value}T${diaperForm.value.time}`).toISOString()
    addDiaper({
      timestamp,
      diaperType: diaperForm.value.diaperType,
      note: diaperForm.value.note,
    })
  }
  supplementSaved.value = true
  setTimeout(() => {
    showSupplement.value = false
  }, 800)
}

function hasActivity(day: typeof calendarDays.value[0], type: 'feeding' | 'sleep' | 'diaper') {
  if (!day.summary) return false
  if (type === 'feeding') return day.summary.feedCount > 0
  if (type === 'sleep') return day.summary.sleepMinutes > 0
  return day.summary.diaperCount > 0
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <CalendarDays :size="20" class="text-peach-400" />
        照护日历
      </h1>
    </header>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <template v-else>
      <section class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm mb-4">
        <div class="flex items-center justify-between mb-3">
          <button @click="prev" class="w-9 h-9 rounded-xl bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
            <ChevronLeft :size="18" class="text-warm-400 dark:text-warm-100" />
          </button>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-extrabold text-warm-500 dark:text-cream-100 font-display">{{ calendarTitle }}</h2>
            <button @click="goToday" class="px-2.5 py-1 rounded-lg bg-peach-50 dark:bg-peach-500/10 text-peach-500 dark:text-peach-400 text-[10px] font-bold">
              今天
            </button>
          </div>
          <button @click="next" class="w-9 h-9 rounded-xl bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
            <ChevronRight :size="18" class="text-warm-400 dark:text-warm-100" />
          </button>
        </div>

        <div class="flex items-center justify-center gap-2 mb-3">
          <button
            @click="viewMode = 'month'"
            class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="viewMode === 'month'
              ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500 dark:text-peach-400'
              : 'bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
          >
            <CalendarIcon :size="14" />
            月视图
          </button>
          <button
            @click="viewMode = 'week'"
            class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="viewMode === 'week'
              ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500 dark:text-mint-400'
              : 'bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
          >
            <LayoutGrid :size="14" />
            周视图
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 mb-2">
          <div v-for="wd in weekDays" :key="wd" class="text-center text-[10px] font-bold text-warm-300 dark:text-warm-200 py-1">
            {{ wd }}
          </div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="(day, i) in calendarDays"
            :key="i"
            @click="selectDate(day)"
            class="relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all"
            :class="[
              day.isCurrentMonth ? '' : 'opacity-30',
              day.isSelected
                ? 'bg-peach-400 text-white shadow-sm'
                : day.isToday
                  ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500'
                  : 'text-warm-500 dark:text-cream-100 hover:bg-cream-50 dark:hover:bg-warm-500/10'
            ]"
          >
            <span class="text-sm font-bold leading-tight">{{ day.date }}</span>
            <div v-if="day.summary" class="flex gap-0.5 mt-0.5">
              <span v-if="hasActivity(day, 'feeding')" class="w-1.5 h-1.5 rounded-full" :class="day.isSelected ? 'bg-white' : 'bg-peach-400'"></span>
              <span v-if="hasActivity(day, 'sleep')" class="w-1.5 h-1.5 rounded-full" :class="day.isSelected ? 'bg-white' : 'bg-mint-400'"></span>
              <span v-if="hasActivity(day, 'diaper')" class="w-1.5 h-1.5 rounded-full" :class="day.isSelected ? 'bg-white' : 'bg-warm-300'"></span>
            </div>
          </button>
        </div>

        <div class="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-cream-100 dark:border-warm-500/10">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-peach-400"></span>
            <span class="text-[10px] text-warm-300 dark:text-warm-200">喂奶</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-mint-400"></span>
            <span class="text-[10px] text-warm-300 dark:text-warm-200">睡眠</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-warm-300"></span>
            <span class="text-[10px] text-warm-300 dark:text-warm-200">尿布</span>
          </div>
        </div>
      </section>

      <section v-if="selectedDate && selectedDaySummary" class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <Clock :size="14" class="text-peach-400" />
            {{ selectedDateLabel }} 汇总
          </h2>
          <button
            v-if="canAddRecord"
            @click="showSupplement ? (showSupplement = false) : (showSupplement = true)"
            class="text-xs text-peach-400 flex items-center gap-0.5 font-bold"
          >
            <Edit3 :size="14" />
            补录
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 text-center">
            <Milk :size="14" class="text-peach-400 mx-auto mb-1" />
            <p class="text-xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ selectedDaySummary.feedCount }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">{{ selectedDaySummary.totalAmount }}ml</p>
          </div>
          <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3 text-center">
            <Moon :size="14" class="text-mint-400 mx-auto mb-1" />
            <p class="text-xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ formatDuration(selectedDaySummary.sleepMinutes) }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">睡眠</p>
          </div>
          <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3 text-center">
            <Droplets :size="14" class="text-warm-300 mx-auto mb-1" />
            <p class="text-xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ selectedDaySummary.diaperCount }}</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">尿布</p>
          </div>
        </div>

        <div v-if="selectedDayDetail" class="space-y-3 mb-3">
          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <Milk :size="14" class="text-peach-400" />
              <span class="text-sm font-bold text-warm-500 dark:text-cream-100">喂奶详情</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between bg-peach-50 dark:bg-peach-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">母乳</span>
                <span class="font-bold text-peach-500 dark:text-peach-400">{{ selectedDayDetail.feeding.breastCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-peach-50 dark:bg-peach-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">配方奶</span>
                <span class="font-bold text-peach-500 dark:text-peach-400">{{ selectedDayDetail.feeding.formulaCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-peach-50 dark:bg-peach-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">混合</span>
                <span class="font-bold text-peach-500 dark:text-peach-400">{{ selectedDayDetail.feeding.mixedCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-peach-50 dark:bg-peach-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">平均奶量</span>
                <span class="font-bold text-peach-500 dark:text-peach-400">{{ selectedDayDetail.feeding.avgAmountPerFeeding }}ml</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <Moon :size="14" class="text-mint-400" />
              <span class="text-sm font-bold text-warm-500 dark:text-cream-100">睡眠详情</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between bg-mint-50 dark:bg-mint-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">安睡</span>
                <span class="font-bold text-mint-500 dark:text-mint-400">{{ selectedDayDetail.sleep.deepSleepCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-mint-50 dark:bg-mint-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">浅睡</span>
                <span class="font-bold text-mint-500 dark:text-mint-400">{{ selectedDayDetail.sleep.lightSleepCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-mint-50 dark:bg-mint-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">烦躁</span>
                <span class="font-bold text-mint-500 dark:text-mint-400">{{ selectedDayDetail.sleep.fussySleepCount }}次</span>
              </div>
              <div class="flex items-center justify-between bg-mint-50 dark:bg-mint-500/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">平均时长</span>
                <span class="font-bold text-mint-500 dark:text-mint-400">{{ formatDuration(selectedDayDetail.sleep.avgDuration) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <Droplets :size="14" class="text-warm-300" />
              <span class="text-sm font-bold text-warm-500 dark:text-cream-100">尿布详情</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="flex items-center justify-between bg-cream-100 dark:bg-cream-300/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">湿</span>
                <span class="font-bold text-warm-500 dark:text-cream-300">{{ selectedDayDetail.diaper.wetCount }}</span>
              </div>
              <div class="flex items-center justify-between bg-cream-100 dark:bg-cream-300/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">便</span>
                <span class="font-bold text-warm-500 dark:text-cream-300">{{ selectedDayDetail.diaper.dirtyCount }}</span>
              </div>
              <div class="flex items-center justify-between bg-cream-100 dark:bg-cream-300/10 rounded-lg px-2 py-1.5">
                <span class="text-warm-300 dark:text-warm-200">混合</span>
                <span class="font-bold text-warm-500 dark:text-cream-300">{{ selectedDayDetail.diaper.mixedCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showSupplement && canAddRecord" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm mb-3 border-2 border-dashed border-peach-200 dark:border-peach-500/30">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100">补录记录</h3>
            <button @click="showSupplement = false" class="w-7 h-7 rounded-lg bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center">
              <X :size="14" class="text-warm-300 dark:text-warm-200" />
            </button>
          </div>

          <div v-if="supplementSaved" class="flex flex-col items-center py-6">
            <div class="w-12 h-12 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-2 animate-bounce">
              <Milk :size="24" class="text-mint-500" />
            </div>
            <p class="text-sm font-bold text-warm-500 dark:text-cream-100">补录成功！</p>
          </div>

          <template v-else>
            <div class="flex gap-2 mb-4">
              <button
                v-for="st in (['feeding', 'sleep', 'diaper'] as const)"
                :key="st"
                @click="supplementType = st"
                class="flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2"
                :class="supplementType === st
                  ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                  : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
              >
                {{ st === 'feeding' ? '🤱 喂奶' : st === 'sleep' ? '🌙 睡眠' : '💧 尿布' }}
              </button>
            </div>

            <div v-if="supplementType === 'feeding'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">补录时间</label>
                  <input v-model="feedForm.time" type="time"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">喂养类型</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="ft in (['breast', 'formula', 'mixed'] as const)"
                    :key="ft"
                    @click="feedForm.feedingType = ft"
                    class="py-2 rounded-xl text-xs font-bold transition-all border-2"
                    :class="feedForm.feedingType === ft
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500'
                      : 'border-transparent bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
                  >
                    {{ FEEDING_TYPE_LABELS[ft] }}
                  </button>
                </div>
              </div>
              <div v-if="feedForm.feedingType !== 'formula'">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">喂奶侧</label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="side in (['left', 'right', 'both', 'alternate'] as const)"
                    :key="side"
                    @click="feedForm.breastSide = side"
                    class="py-2 rounded-xl text-xs font-bold transition-all border-2"
                    :class="feedForm.breastSide === side
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500'
                      : 'border-transparent bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
                  >
                    {{ BREAST_SIDE_LABELS[side] }}
                  </button>
                </div>
              </div>
              <div v-if="feedForm.feedingType !== 'formula' && feedForm.breastSide !== 'both' && feedForm.breastSide !== 'alternate'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">左侧时长 (min)</label>
                  <input v-model.number="feedForm.leftDuration" type="number" min="0" step="1"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">右侧时长 (min)</label>
                  <input v-model.number="feedForm.rightDuration" type="number" min="0" step="1"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
              </div>
              <div v-if="feedForm.feedingType !== 'breast'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">奶量 (ml)</label>
                  <input v-model.number="feedForm.amount" type="number" min="0" step="5"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
                <div v-if="feedForm.feedingType !== 'formula'">
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">总时长 (min)</label>
                  <input v-model.number="feedForm.duration" type="number" min="0" step="1"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
              </div>
              <div v-if="feedForm.feedingType === 'breast'">
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">总时长 (min)</label>
                <input v-model.number="feedForm.duration" type="number" min="0" step="1"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
                <input v-model="feedForm.note" type="text" placeholder="可选"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
              </div>
            </div>

            <div v-if="supplementType === 'sleep'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">入睡时间</label>
                  <input v-model="sleepForm.startTime" type="datetime-local"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">醒来时间</label>
                  <input v-model="sleepForm.endTime" type="datetime-local"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">睡眠质量</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="q in (['deep', 'light', 'fussy'] as const)"
                    :key="q"
                    @click="sleepForm.quality = q"
                    class="py-2 rounded-xl text-xs font-bold transition-all border-2"
                    :class="sleepForm.quality === q
                      ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-500'
                      : 'border-transparent bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
                  >
                    {{ q === 'deep' ? '😴 安睡' : q === 'light' ? '😐 浅睡' : '😤 烦躁' }}
                  </button>
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
                <input v-model="sleepForm.note" type="text" placeholder="可选"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
              </div>
            </div>

            <div v-if="supplementType === 'diaper'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">补录时间</label>
                  <input v-model="diaperForm.time" type="time"
                    class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">尿布类型</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="dt in (['wet', 'dirty', 'mixed'] as const)"
                    :key="dt"
                    @click="diaperForm.diaperType = dt"
                    class="py-2 rounded-xl text-xs font-bold transition-all border-2"
                    :class="diaperForm.diaperType === dt
                      ? 'bg-cream-100 dark:bg-cream-300/20 border-warm-300 text-warm-500'
                      : 'border-transparent bg-cream-50 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
                  >
                    {{ dt === 'wet' ? '💦 湿' : dt === 'dirty' ? '💩 便' : '🔄 混合' }}
                  </button>
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
                <input v-model="diaperForm.note" type="text" placeholder="可选"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
              </div>
            </div>

            <button
              @click="submitSupplement"
              class="w-full mt-4 bg-peach-400 hover:bg-peach-500 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-[0.98] shadow-md shadow-peach-200 dark:shadow-peach-500/20"
            >
              保存补录
            </button>
          </template>
        </div>

        <div class="space-y-2">
          <div
            v-for="activity in selectedDayActivities"
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
          </div>

          <div v-if="selectedDayActivities.length === 0" class="text-center py-8">
            <CalendarDays :size="32" class="text-warm-200 dark:text-warm-500/30 mx-auto mb-2" />
            <p class="text-sm text-warm-300 dark:text-warm-200">当天暂无记录</p>
            <button
              v-if="canAddRecord"
              @click="showSupplement = true"
              class="mt-2 px-4 py-1.5 rounded-xl bg-peach-400 text-white text-xs font-bold"
            >
              补录一条
            </button>
          </div>
        </div>
      </section>

      <section v-else class="text-center py-12">
        <CalendarDays :size="48" class="text-warm-200 dark:text-warm-500/30 mx-auto mb-3" />
        <p class="text-sm text-warm-300 dark:text-warm-200">点击日历中的日期查看详情</p>
      </section>

      <section v-if="canAddRecord" class="fixed bottom-20 left-0 right-0 z-40 px-4">
        <div class="max-w-lg mx-auto flex gap-2">
          <button
            @click="openSupplement('feeding')"
            class="flex-1 flex items-center justify-center gap-1.5 bg-peach-400 hover:bg-peach-500 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-peach-200 dark:shadow-peach-500/20"
          >
            <Milk :size="16" />
            补录喂奶
          </button>
          <button
            @click="openSupplement('sleep')"
            class="flex-1 flex items-center justify-center gap-1.5 bg-mint-400 hover:bg-mint-500 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-mint-200 dark:shadow-mint-500/20"
          >
            <Moon :size="16" />
            补录睡眠
          </button>
          <button
            @click="openSupplement('diaper')"
            class="flex-1 flex items-center justify-center gap-1.5 bg-warm-300 hover:bg-warm-400 text-white rounded-2xl py-3 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-warm-100 dark:shadow-warm-500/20"
          >
            <Droplets :size="16" />
            补录尿布
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
