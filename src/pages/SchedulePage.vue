<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, CalendarDays, Target, Sparkles, Clock,
  Play, Check, X, Plus, Trash2, Edit3, Copy,
  ChevronRight, ChevronDown, Sun, Moon, Droplets,
  Smile, TreePine, Star, AlertTriangle, TrendingUp,
  TrendingDown, Award, Lightbulb, Eye, User, Settings2,
  Save, BarChart3, ShieldCheck, Flame, HeartHandshake,
} from 'lucide-vue-next'
import { useSchedule } from '@/composables/useSchedule'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import { currentUserId } from '@/composables/useSharedStore'
import type {
  ScheduleActivityType,
  ScheduleExecutionStatus,
  ScheduleActivity,
  ScheduleTemplate,
} from '@/types'
import {
  SCHEDULE_ACTIVITY_LABELS,
  SCHEDULE_ACTIVITY_COLORS,
  SCHEDULE_EXECUTION_LABELS,
  SCHEDULE_EXECUTION_COLORS,
  SCHEDULE_TEMPLATE_AGE_RANGES,
} from '@/types'

const router = useRouter()
const {
  activePlan,
  currentBabyPlans,
  getRecommendedTemplates,
  getAllTemplates,
  getAgeRangeLabel,
  applyTemplate,
  createPlan,
  updatePlan,
  setActivePlan,
  deletePlan,
  addActivityToPlan,
  updateActivityInPlan,
  removeActivityFromPlan,
  getExecutionsForDate,
  ensureDailyExecutions,
  getActivityForExecution,
  markActivityStart,
  markActivityComplete,
  markActivitySkipped,
  markActivityDelayed,
  getDeviationAnalysis,
} = useSchedule()
const { baby, needsJoin, canAddRecord, getMemberName, settings } = useBabyCare()
const { family } = useFamily()

type TabKey = 'plan' | 'templates' | 'execution' | 'analysis'
const activeTab = ref<TabKey>('plan')

const tabs: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'plan', label: '自定义日程', icon: Target },
  { key: 'templates', label: '推荐模板', icon: Sparkles },
  { key: 'execution', label: '执行记录', icon: Clock },
  { key: 'analysis', label: '偏差分析', icon: BarChart3 },
]

const showPlanEditor = ref(false)
const editingPlanId = ref<string | null>(null)
const planName = ref('')
const planDescription = ref('')

const showActivityEditor = ref(false)
const editingActivityId = ref<string | null>(null)
const activityType = ref<ScheduleActivityType>('feeding')
const activityTitle = ref('')
const activityStart = ref('08:00')
const activityEnd = ref('08:30')
const activityReminder = ref(true)
const activityNote = ref('')

const selectedDate = ref(new Date())
const dateInputValue = ref(formatDateForInput(new Date()))

const analysisDays = ref(7)

const recommendedTemplates = computed<ScheduleTemplate[]>(() => {
  return getRecommendedTemplates(baby.value?.birthDate)
})

const allTemplates = computed(() => getAllTemplates())

const activityTypeOptions: { value: ScheduleActivityType; label: string; icon: typeof Sun }[] = [
  { value: 'wake', label: '起床', icon: Sun },
  { value: 'feeding', label: '喂奶', icon: HeartHandshake },
  { value: 'nap', label: '小睡', icon: Moon },
  { value: 'sleep', label: '夜间睡眠', icon: Moon },
  { value: 'bath', label: '洗澡', icon: Droplets },
  { value: 'play', label: '游戏互动', icon: Smile },
  { value: 'outdoor', label: '户外活动', icon: TreePine },
  { value: 'medicine', label: '吃药', icon: ShieldCheck },
  { value: 'other', label: '其他', icon: Star },
]

const todayExecutions = computed(() => {
  if (!activePlan.value) return []
  return ensureDailyExecutions(activePlan.value, selectedDate.value)
})

const todayStats = computed(() => {
  const execs = todayExecutions.value
  const total = execs.length
  const completed = execs.filter(e => e.status === 'completed').length
  const ongoing = execs.filter(e => e.status === 'ongoing').length
  const skipped = execs.filter(e => e.status === 'skipped').length
  const delayed = execs.filter(e => e.status === 'delayed').length
  const withDev = execs.filter(e => typeof e.deviationMinutes === 'number')
  const onTime = withDev.filter(e => Math.abs(e.deviationMinutes!) <= 15).length
  return {
    total,
    completed,
    ongoing,
    skipped,
    delayed,
    pending: total - completed - ongoing - skipped - delayed,
    onTimeRate: withDev.length > 0 ? Math.round((onTime / withDev.length) * 100) : 0,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
})

const analysis = computed(() => {
  return getDeviationAnalysis(analysisDays.value, activePlan.value?.id)
})

const caregiverName = computed(() => getMemberName(settings.value.defaultCaregiverId || currentUserId.value))

const ageRangeForBaby = computed(() => {
  if (!baby.value?.birthDate) return ''
  const birth = new Date(baby.value.birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12
  months += now.getMonth() - birth.getMonth()
  months = Math.max(0, months)
  const range = SCHEDULE_TEMPLATE_AGE_RANGES.find(r => {
    const [min, maxStr] = r.value.split('-')
    const minM = parseInt(min)
    const maxM = parseInt(maxStr.replace('m', ''))
    return months >= minM && months < maxM
  })
  return range ? range.label : ''
})

function formatDateForInput(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDisplayDate(d: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

function formatDisplayDateShort(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

function getActivityIcon(type: ScheduleActivityType) {
  const map: Record<ScheduleActivityType, typeof Sun> = {
    wake: Sun,
    feeding: HeartHandshake,
    nap: Moon,
    sleep: Moon,
    bath: Droplets,
    play: Smile,
    outdoor: TreePine,
    medicine: ShieldCheck,
    other: Star,
  }
  return map[type] || Star
}

function getActivityColors(type: ScheduleActivityType) {
  return SCHEDULE_ACTIVITY_COLORS[type] || SCHEDULE_ACTIVITY_COLORS.other
}

function openNewPlan() {
  editingPlanId.value = null
  planName.value = ''
  planDescription.value = ''
  showPlanEditor.value = true
}

function openEditPlan() {
  if (!activePlan.value) return
  editingPlanId.value = activePlan.value.id
  planName.value = activePlan.value.name
  planDescription.value = activePlan.value.description || ''
  showPlanEditor.value = true
}

function handleSavePlan() {
  if (!planName.value.trim()) return
  if (editingPlanId.value) {
    updatePlan(editingPlanId.value, {
      name: planName.value.trim(),
      description: planDescription.value.trim(),
    })
  } else {
    createPlan({
      name: planName.value.trim(),
      description: planDescription.value.trim(),
      activities: [],
      setAsActive: true,
    })
  }
  showPlanEditor.value = false
}

function openNewActivity() {
  editingActivityId.value = null
  activityType.value = 'feeding'
  activityTitle.value = ''
  activityStart.value = '08:00'
  activityEnd.value = '08:30'
  activityReminder.value = true
  activityNote.value = ''
  showActivityEditor.value = true
}

function openEditActivity(activity: ScheduleActivity) {
  editingActivityId.value = activity.id
  activityType.value = activity.type
  activityTitle.value = activity.title
  activityStart.value = activity.startTime
  activityEnd.value = activity.endTime
  activityReminder.value = !!activity.reminder
  activityNote.value = activity.note || ''
  showActivityEditor.value = true
}

function handleSaveActivity() {
  if (!activePlan.value) return
  if (!activityTitle.value.trim()) {
    activityTitle.value = SCHEDULE_ACTIVITY_LABELS[activityType.value]
  }
  const data = {
    type: activityType.value,
    title: activityTitle.value.trim(),
    startTime: activityStart.value,
    endTime: activityEnd.value,
    reminder: activityReminder.value,
    note: activityNote.value.trim() || undefined,
  }
  if (editingActivityId.value) {
    updateActivityInPlan(activePlan.value.id, editingActivityId.value, data)
  } else {
    addActivityToPlan(activePlan.value.id, data)
  }
  showActivityEditor.value = false
}

function handleDeleteActivity(activityId: string) {
  if (!activePlan.value) return
  if (!confirm('确定要删除这个活动项吗？')) return
  removeActivityFromPlan(activePlan.value.id, activityId)
}

function handleApplyTemplate(tplId: string) {
  if (!confirm('应用此模板将创建一个新的作息计划并设为当前使用，是否继续？')) return
  const plan = applyTemplate(tplId)
  if (plan) {
    activeTab.value = 'plan'
  }
}

function handleSetActive(planId: string) {
  setActivePlan(planId)
}

function handleDeletePlan(planId: string) {
  if (!confirm('确定删除此计划？相关的执行记录也会被删除。')) return
  deletePlan(planId)
}

function handleMarkStart(execId: string) {
  markActivityStart(execId)
}
function handleMarkComplete(execId: string) {
  markActivityComplete(execId)
}
function handleMarkSkip(execId: string) {
  markActivitySkipped(execId)
}
function handleMarkDelay(execId: string) {
  markActivityDelayed(execId)
}

function formatDeviation(min?: number): string {
  if (min === undefined) return '-'
  const sign = min > 0 ? '+' : ''
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${sign}${h}h${m}m`
  return `${sign}${m}m`
}

function getDeviationColor(min?: number): string {
  if (min === undefined) return 'text-warm-300 dark:text-warm-200'
  if (Math.abs(min) <= 15) return 'text-mint-500 dark:text-mint-400'
  if (Math.abs(min) <= 30) return 'text-amber-500 dark:text-amber-400'
  return 'text-rose-500 dark:text-rose-400'
}

function getProgressColor(rate: number): string {
  if (rate >= 80) return 'from-mint-400 to-emerald-400'
  if (rate >= 50) return 'from-peach-400 to-amber-400'
  return 'from-rose-400 to-red-400'
}

function getTrendIcon(trend: 'improving' | 'worsening' | 'stable') {
  if (trend === 'improving') return TrendingUp
  if (trend === 'worsening') return TrendingDown
  return Minus as unknown as typeof TrendingUp
}

function getTrendText(trend: 'improving' | 'worsening' | 'stable') {
  if (trend === 'improving') return { text: '持续改善', cls: 'text-mint-600 dark:text-mint-400' }
  if (trend === 'worsening') return { text: '有所下降', cls: 'text-rose-600 dark:text-rose-400' }
  return { text: '保持稳定', cls: 'text-warm-500 dark:text-warm-200' }
}

function goPrevDay() {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 1)
  selectedDate.value = d
  dateInputValue.value = formatDateForInput(d)
}
function goNextDay() {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + 1)
  selectedDate.value = d
  dateInputValue.value = formatDateForInput(d)
}
function goToday() {
  const d = new Date()
  selectedDate.value = d
  dateInputValue.value = formatDateForInput(d)
}

function onDateInputChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    selectedDate.value = new Date(val)
  }
}

watch(activeTab, (t) => {
  if (t === 'execution') {
    if (activePlan.value) ensureDailyExecutions(activePlan.value, selectedDate.value)
  }
})

onMounted(() => {
  if (activePlan.value) {
    ensureDailyExecutions(activePlan.value, new Date())
  }
})

const statusDotColors: Record<ScheduleExecutionStatus, string> = {
  pending: 'bg-warm-300 dark:bg-warm-400',
  ongoing: 'bg-mint-500 dark:bg-mint-400 animate-pulse',
  completed: 'bg-emerald-500 dark:bg-emerald-400',
  skipped: 'bg-cream-300 dark:bg-cream-400',
  delayed: 'bg-amber-500 dark:bg-amber-400',
}

import { Minus } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24">
    <header class="flex items-center gap-3 mb-5">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <CalendarDays :size="20" class="text-peach-400" />
        宝宝作息计划
      </h1>
    </header>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">你尚未成为家庭成员</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-mint-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <template v-else>
      <div class="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
          :class="activeTab === tab.key
            ? 'bg-gradient-to-r from-peach-400 to-mint-400 text-white border-transparent shadow-md'
            : 'bg-white dark:bg-[#2a1f1a] text-warm-400 dark:text-warm-200 border-cream-200 dark:border-warm-500/20'"
        >
          <component :is="tab.icon" :size="15" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ========== 自定义日程 ========== -->
      <section v-show="activeTab === 'plan'">
        <div v-if="activePlan" class="mb-5">
          <div class="bg-gradient-to-br from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl p-4 border border-cream-200/50 dark:border-warm-500/10">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-warm-500 dark:text-cream-100 font-display">{{ activePlan.name }}</h2>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-mint-100 dark:bg-mint-500/20 text-mint-600 dark:text-mint-400 font-bold">使用中</span>
                </div>
                <p v-if="activePlan.description" class="text-xs text-warm-300 dark:text-warm-200 mt-1">{{ activePlan.description }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button @click="openEditPlan" class="w-8 h-8 rounded-lg bg-white/80 dark:bg-[#2a1f1a]/60 flex items-center justify-center">
                  <Edit3 :size="14" class="text-warm-400" />
                </button>
              </div>
            </div>
            <div class="flex items-center gap-4 text-[11px] text-warm-300 dark:text-warm-200 mt-2">
              <span class="flex items-center gap-1"><Target :size="11" class="text-peach-400" /> 共 {{ activePlan.activities.length }} 项活动</span>
              <span class="flex items-center gap-1"><User :size="11" class="text-mint-400" /> 照护人: {{ caregiverName }}</span>
            </div>
          </div>
        </div>

        <div v-if="!activePlan" class="mb-5 bg-cream-100 dark:bg-warm-500/10 rounded-2xl p-6 text-center">
          <Target :size="36" class="text-warm-300 mx-auto mb-3" />
          <p class="text-base font-bold text-warm-400 dark:text-cream-100">还没有作息计划</p>
          <p class="text-xs text-warm-300 dark:text-warm-200 mt-1 mb-4">可以从"推荐模板"一键应用，或自定义创建</p>
          <div class="flex justify-center gap-2">
            <button @click="openNewPlan" class="px-4 py-2 rounded-xl bg-white dark:bg-[#2a1f1a] text-warm-500 dark:text-cream-100 text-sm font-bold border border-cream-200 dark:border-warm-500/20">
              创建空白计划
            </button>
            <button @click="activeTab = 'templates'" class="px-4 py-2 rounded-xl bg-gradient-to-r from-peach-400 to-mint-400 text-white text-sm font-bold">
              使用推荐模板
            </button>
          </div>
        </div>

        <div v-if="activePlan" class="space-y-2.5 mb-5">
          <div
            v-for="(act, idx) in activePlan.activities"
            :key="act.id"
            class="rounded-2xl p-3.5 border transition-all"
            :class="[getActivityColors(act.type).bg, getActivityColors(act.type).border]"
          >
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#2a1f1a]/50 flex items-center justify-center flex-shrink-0">
                <component :is="getActivityIcon(act.type)" :size="18" :class="getActivityColors(act.type).text" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-extrabold" :class="getActivityColors(act.type).text">{{ idx + 1 }}.</span>
                      <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 truncate">{{ act.title }}</h3>
                    </div>
                    <p class="text-xs text-warm-300 dark:text-warm-200 mt-0.5 flex items-center gap-1">
                      <Clock :size="10" />
                      {{ act.startTime }} - {{ act.endTime }}
                      <span v-if="act.reminder" class="ml-1 px-1.5 py-0.5 rounded bg-white/60 dark:bg-[#2a1f1a]/40 text-[9px] font-bold text-amber-500">🔔 提醒</span>
                    </p>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button @click="openEditActivity(act)" class="w-7 h-7 rounded-lg bg-white/60 dark:bg-[#2a1f1a]/40 flex items-center justify-center">
                      <Edit3 :size="12" class="text-warm-400" />
                    </button>
                    <button @click="handleDeleteActivity(act.id)" class="w-7 h-7 rounded-lg bg-white/60 dark:bg-[#2a1f1a]/40 flex items-center justify-center">
                      <Trash2 :size="12" class="text-rose-400" />
                    </button>
                  </div>
                </div>
                <p v-if="act.note" class="text-[11px] text-warm-300 dark:text-warm-300 mt-1.5 bg-white/50 dark:bg-[#2a1f1a]/30 rounded-lg px-2 py-1">
                  💡 {{ act.note }}
                </p>
              </div>
            </div>
          </div>

          <button
            v-if="canAddRecord"
            @click="openNewActivity"
            class="w-full rounded-2xl py-3.5 border-2 border-dashed border-cream-200 dark:border-warm-500/20 text-warm-300 dark:text-warm-300 text-sm font-bold flex items-center justify-center gap-1.5 hover:border-peach-300 hover:text-peach-400 transition-colors"
          >
            <Plus :size="16" />
            添加活动项
          </button>
        </div>

        <div v-if="currentBabyPlans.length > 1" class="mb-5">
          <h3 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2.5 flex items-center gap-1.5">
            <Copy :size="14" class="text-warm-300" />
            我的计划 ({{ currentBabyPlans.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="plan in currentBabyPlans"
              :key="plan.id"
              class="bg-white dark:bg-[#2a1f1a] rounded-xl p-3 border border-cream-200 dark:border-warm-500/20"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    v-if="plan.isActive"
                    class="w-2 h-2 rounded-full bg-mint-500 flex-shrink-0"
                  ></span>
                  <span v-else class="w-2 h-2 rounded-full bg-cream-200 dark:bg-warm-500/30 flex-shrink-0"></span>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-warm-500 dark:text-cream-100 truncate">{{ plan.name }}</p>
                    <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ plan.activities.length }}项活动</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    v-if="!plan.isActive"
                    @click="handleSetActive(plan.id)"
                    class="px-2.5 py-1 rounded-lg bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-400 text-[11px] font-bold"
                  >
                    启用
                  </button>
                  <button
                    @click="handleDeletePlan(plan.id)"
                    class="w-7 h-7 rounded-lg bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center"
                  >
                    <Trash2 :size="12" class="text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== 推荐模板 ========== -->
      <section v-show="activeTab === 'templates'">
        <div class="mb-5 bg-gradient-to-r from-amber-50 to-peach-50 dark:from-amber-500/10 dark:to-peach-500/10 rounded-2xl p-4 border border-amber-100/50 dark:border-amber-500/20">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#2a1f1a]/50 flex items-center justify-center flex-shrink-0">
              <Sparkles :size="20" class="text-amber-500" />
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-warm-500 dark:text-cream-100">为宝宝推荐</h3>
              <p class="text-xs text-warm-300 dark:text-warm-200 mt-0.5">
                <span v-if="baby?.birthDate">
                  根据宝宝月龄（{{ ageRangeForBaby }}）自动匹配的科学作息模板
                </span>
                <span v-else>官方精选科学作息模板</span>
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <h4 class="text-xs font-bold text-peach-500 dark:text-peach-400 flex items-center gap-1.5">
            <Flame :size="13" /> 为你推荐
          </h4>
          <div
            v-for="tpl in recommendedTemplates"
            :key="tpl.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-2xl border border-cream-200 dark:border-warm-500/20 overflow-hidden"
          >
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="text-sm font-extrabold text-warm-500 dark:text-cream-100">{{ tpl.name }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-peach-50 dark:bg-peach-500/10 text-peach-600 dark:text-peach-400 font-bold">
                      {{ getAgeRangeLabel(tpl.ageRange) }}
                    </span>
                    <span class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
                      <Award :size="10" />
                      {{ tpl.popularity }}%好评
                    </span>
                  </div>
                </div>
                <button
                  @click="handleApplyTemplate(tpl.id)"
                  class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-peach-400 to-mint-400 text-white text-xs font-bold shadow-sm"
                >
                  应用
                </button>
              </div>
              <p class="text-xs text-warm-300 dark:text-warm-200 mb-3">{{ tpl.description }}</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="a in tpl.activities.slice(0, 5)"
                  :key="a.type + a.startTime"
                  class="text-[10px] px-2 py-0.5 rounded-lg"
                  :class="[getActivityColors(a.type).bg, getActivityColors(a.type).text]"
                >
                  {{ a.startTime }} {{ SCHEDULE_ACTIVITY_LABELS[a.type] }}
                </span>
                <span v-if="tpl.activities.length > 5" class="text-[10px] px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200">
                  +{{ tpl.activities.length - 5 }} 项
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-xs font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <Target :size="13" /> 全部年龄段模板
          </h4>
          <div
            v-for="tpl in allTemplates"
            :key="tpl.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl p-3 border border-cream-200 dark:border-warm-500/20"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 truncate">{{ tpl.name }}</h3>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-400 font-bold">
                    {{ getAgeRangeLabel(tpl.ageRange) }}
                  </span>
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ tpl.activities.length }}项活动</span>
                </div>
              </div>
              <button
                @click="handleApplyTemplate(tpl.id)"
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-400 text-[11px] font-bold"
              >
                使用
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== 执行记录 ========== -->
      <section v-show="activeTab === 'execution'">
        <div v-if="!activePlan" class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl p-6 text-center">
          <Clock :size="36" class="text-warm-300 mx-auto mb-3" />
          <p class="text-base font-bold text-warm-400 dark:text-cream-100">请先创建或启用一个作息计划</p>
          <button @click="activeTab = 'templates'" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">去选择模板</button>
        </div>

        <template v-else>
          <div class="mb-4 bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 border border-cream-200 dark:border-warm-500/20">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-1.5">
                <button @click="goPrevDay" class="w-8 h-8 rounded-lg bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                  <ChevronDown :size="16" class="rotate-90 text-warm-400" />
                </button>
                <input
                  :value="dateInputValue"
                  type="date"
                  @change="onDateInputChange"
                  class="bg-cream-50 dark:bg-warm-500/10 border-none rounded-lg px-3 py-1.5 text-sm font-bold text-warm-500 dark:text-cream-100 focus:ring-2 focus:ring-peach-300"
                />
                <button @click="goNextDay" class="w-8 h-8 rounded-lg bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                  <ChevronRight :size="16" class="text-warm-400" />
                </button>
              </div>
              <button @click="goToday" class="px-3 py-1.5 rounded-lg bg-peach-50 dark:bg-peach-500/10 text-peach-500 dark:text-peach-400 text-[11px] font-bold">
                今天
              </button>
            </div>
            <p class="text-center text-base font-extrabold text-warm-500 dark:text-cream-100 font-display">{{ formatDisplayDate(selectedDate) }}</p>

            <div class="grid grid-cols-4 gap-2 mt-4">
              <div class="text-center bg-cream-50 dark:bg-warm-500/5 rounded-xl p-2">
                <p class="text-[10px] text-warm-300 dark:text-warm-200">总项数</p>
                <p class="text-lg font-extrabold text-warm-500 dark:text-cream-100">{{ todayStats.total }}</p>
              </div>
              <div class="text-center bg-mint-50 dark:bg-mint-500/10 rounded-xl p-2">
                <p class="text-[10px] text-warm-300 dark:text-warm-200">已完成</p>
                <p class="text-lg font-extrabold text-mint-600 dark:text-mint-400">{{ todayStats.completed }}</p>
              </div>
              <div class="text-center bg-amber-50 dark:bg-amber-500/10 rounded-xl p-2">
                <p class="text-[10px] text-warm-300 dark:text-warm-200">完成率</p>
                <p class="text-lg font-extrabold text-amber-600 dark:text-amber-400">{{ todayStats.completionRate }}%</p>
              </div>
              <div class="text-center bg-peach-50 dark:bg-peach-500/10 rounded-xl p-2">
                <p class="text-[10px] text-warm-300 dark:text-warm-200">准时率</p>
                <p class="text-lg font-extrabold text-peach-600 dark:text-peach-400">{{ todayStats.onTimeRate }}%</p>
              </div>
            </div>

            <div class="mt-3">
              <div class="h-2 bg-cream-100 dark:bg-warm-500/10 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                  :class="getProgressColor(todayStats.completionRate)"
                  :style="{ width: `${todayStats.completionRate}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="exec in todayExecutions"
              :key="exec.id"
              class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3.5 border border-cream-200 dark:border-warm-500/20"
            >
              <div class="flex items-start gap-3">
                <div class="flex flex-col items-center gap-1 pt-0.5 w-14 flex-shrink-0">
                  <div
                    class="w-8 h-8 rounded-xl flex items-center justify-center"
                    :class="getActivityColors(getActivityForExecution(exec)?.type || 'other').bg"
                  >
                    <component
                      :is="getActivityIcon(getActivityForExecution(exec)?.type || 'other')"
                      :size="16"
                      :class="getActivityColors(getActivityForExecution(exec)?.type || 'other').text"
                    />
                  </div>
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    :class="statusDotColors[exec.status]"
                  ></span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <h3 class="text-sm font-bold text-warm-500 dark:text-cream-100 truncate">
                          {{ getActivityForExecution(exec)?.title || SCHEDULE_ACTIVITY_LABELS[getActivityForExecution(exec)?.type || 'other'] }}
                        </h3>
                        <span
                          class="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          :class="SCHEDULE_EXECUTION_COLORS[exec.status]"
                        >
                          {{ SCHEDULE_EXECUTION_LABELS[exec.status] }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-[11px] text-warm-300 dark:text-warm-200 flex-wrap">
                        <span class="flex items-center gap-0.5">
                          <Clock :size="10" />
                          计划 {{ exec.scheduledStartTime }}-{{ exec.scheduledEndTime }}
                        </span>
                        <span v-if="exec.actualStartTime" class="flex items-center gap-0.5" :class="getDeviationColor(exec.deviationMinutes)">
                          实际 {{ exec.actualStartTime }}<span v-if="exec.actualEndTime">-{{ exec.actualEndTime }}</span>
                          <span class="ml-0.5 font-bold">({{ formatDeviation(exec.deviationMinutes) }})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div v-if="canAddRecord && exec.status === 'pending'" class="flex items-center gap-1.5 mt-2.5">
                    <button
                      @click="handleMarkStart(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-400 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Play :size="11" /> 开始
                    </button>
                    <button
                      @click="handleMarkDelay(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Clock :size="11" /> 延迟
                    </button>
                    <button
                      @click="handleMarkSkip(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <X :size="11" /> 跳过
                    </button>
                  </div>
                  <div v-else-if="canAddRecord && exec.status === 'ongoing'" class="flex items-center gap-1.5 mt-2.5">
                    <button
                      @click="handleMarkComplete(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Check :size="11" /> 完成
                    </button>
                  </div>
                  <div v-else-if="canAddRecord && (exec.status === 'delayed' || exec.status === 'skipped')" class="flex items-center gap-1.5 mt-2.5">
                    <button
                      @click="handleMarkStart(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-400 text-[11px] font-bold"
                    >
                      重新开始
                    </button>
                    <button
                      @click="handleMarkComplete(exec.id)"
                      class="flex-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold"
                    >
                      补标完成
                    </button>
                  </div>

                  <p v-if="exec.note" class="text-[11px] text-warm-300 dark:text-warm-300 mt-2 bg-cream-50 dark:bg-warm-500/5 rounded-lg px-2 py-1">
                    📝 {{ exec.note }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- ========== 偏差分析 ========== -->
      <section v-show="activeTab === 'analysis'">
        <div v-if="!activePlan" class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl p-6 text-center">
          <BarChart3 :size="36" class="text-warm-300 mx-auto mb-3" />
          <p class="text-base font-bold text-warm-400 dark:text-cream-100">还没有可分析的作息计划</p>
          <button @click="activeTab = 'templates'" class="mt-4 px-5 py-2 rounded-xl bg-mint-400 text-white text-sm font-bold">创建计划</button>
        </div>

        <template v-else>
          <div class="mb-4 flex items-center gap-2">
            <span class="text-xs font-bold text-warm-400 dark:text-warm-100">分析周期</span>
            <div class="flex gap-1">
              <button
                v-for="d in [7, 14, 30]"
                :key="d"
                @click="analysisDays = d"
                class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all"
                :class="analysisDays === d
                  ? 'bg-gradient-to-r from-peach-400 to-mint-400 text-white'
                  : 'bg-white dark:bg-[#2a1f1a] text-warm-400 dark:text-warm-200 border border-cream-200 dark:border-warm-500/20'"
              >
                近{{ d }}天
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-4">
            <div class="bg-gradient-to-br from-mint-50 to-emerald-50 dark:from-mint-500/10 dark:to-emerald-500/10 rounded-2xl p-3 text-center border border-mint-100 dark:border-mint-500/20">
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">平均完成率</p>
              <p class="text-2xl font-extrabold text-mint-600 dark:text-mint-400 font-display">{{ analysis.overallCompletionRate }}%</p>
              <div class="mt-1.5 h-1 bg-mint-100 dark:bg-mint-500/20 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-mint-400 to-emerald-400 rounded-full" :style="{ width: `${analysis.overallCompletionRate}%` }"></div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-peach-50 to-amber-50 dark:from-peach-500/10 dark:to-amber-500/10 rounded-2xl p-3 text-center border border-peach-100 dark:border-peach-500/20">
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">平均准时率</p>
              <p class="text-2xl font-extrabold text-peach-600 dark:text-peach-400 font-display">{{ analysis.overallOnTimeRate }}%</p>
              <div class="mt-1.5 h-1 bg-peach-100 dark:bg-peach-500/20 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-peach-400 to-amber-400 rounded-full" :style="{ width: `${analysis.overallOnTimeRate}%` }"></div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-2xl p-3 text-center border border-indigo-100 dark:border-indigo-500/20">
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">平均偏差</p>
              <p class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display">{{ analysis.avgDeviationMinutes }}<span class="text-sm font-bold ml-0.5">分</span></p>
              <p class="text-[10px] mt-1.5 flex items-center justify-center gap-0.5" :class="getTrendText(analysis.trend).cls">
                <component :is="getTrendIcon(analysis.trend)" :size="10" />
                {{ getTrendText(analysis.trend).text }}
              </p>
            </div>
          </div>

          <div v-if="analysis.bestPerformingDay || analysis.worstPerformingDay" class="grid grid-cols-2 gap-2.5 mb-4">
            <div v-if="analysis.bestPerformingDay" class="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 border border-emerald-100 dark:border-emerald-500/20">
              <div class="flex items-center gap-1.5 mb-1">
                <Award :size="13" class="text-emerald-500" />
                <p class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">表现最佳</p>
              </div>
              <p class="text-sm font-extrabold text-warm-500 dark:text-cream-100">{{ formatDisplayDateShort(analysis.bestPerformingDay) }}</p>
            </div>
            <div v-if="analysis.worstPerformingDay" class="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-3 border border-amber-100 dark:border-amber-500/20">
              <div class="flex items-center gap-1.5 mb-1">
                <AlertTriangle :size="13" class="text-amber-500" />
                <p class="text-[10px] font-bold text-amber-600 dark:text-amber-400">待改进日</p>
              </div>
              <p class="text-sm font-extrabold text-warm-500 dark:text-cream-100">{{ formatDisplayDateShort(analysis.worstPerformingDay) }}</p>
            </div>
          </div>

          <div v-if="analysis.dailyDeviations.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 border border-cream-200 dark:border-warm-500/20 mb-4">
            <h3 class="text-sm font-extrabold text-warm-500 dark:text-cream-100 mb-3 flex items-center gap-1.5">
              <BarChart3 :size="14" class="text-peach-400" />
              每日完成趋势
            </h3>
            <div class="space-y-2">
              <div
                v-for="day in analysis.dailyDeviations"
                :key="day.date"
                class="flex items-center gap-2"
              >
                <span class="text-[11px] text-warm-300 dark:text-warm-200 w-10 flex-shrink-0">{{ formatDisplayDateShort(day.date) }}</span>
                <div class="flex-1 h-4 bg-cream-100 dark:bg-warm-500/10 rounded-full overflow-hidden flex items-center">
                  <div
                    class="h-full rounded-full bg-gradient-to-r transition-all"
                    :class="getProgressColor(Math.round(day.completionRate * 100))"
                    :style="{ width: `${Math.round(day.completionRate * 100)}%` }"
                  ></div>
                </div>
                <div class="w-16 flex-shrink-0 text-right">
                  <span class="text-[10px] font-bold text-warm-500 dark:text-cream-100">
                    {{ Math.round(day.completionRate * 100) }}%
                  </span>
                  <span class="text-[9px] text-warm-300 dark:text-warm-300 ml-1">
                    ({{ day.completedCount }}/{{ day.totalActivities }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="analysis.mostDelayedActivities.length > 0 || analysis.mostSkippedActivities.length > 0" class="grid grid-cols-2 gap-2.5 mb-4">
            <div v-if="analysis.mostDelayedActivities.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 border border-cream-200 dark:border-warm-500/20">
              <h4 class="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                <AlertTriangle :size="12" /> 延迟TOP项
              </h4>
              <div class="space-y-1.5">
                <div
                  v-for="item in analysis.mostDelayedActivities"
                  :key="item.activityType"
                  class="flex items-center justify-between text-[11px]"
                >
                  <span class="flex items-center gap-1">
                    <component :is="getActivityIcon(item.activityType)" :size="11" :class="getActivityColors(item.activityType).text" />
                    <span class="text-warm-400 dark:text-warm-200">{{ SCHEDULE_ACTIVITY_LABELS[item.activityType] }}</span>
                  </span>
                  <span class="text-warm-500 dark:text-cream-100 font-bold">{{ item.count }}次 / 均{{ item.avgDelay }}分</span>
                </div>
              </div>
            </div>
            <div v-if="analysis.mostSkippedActivities.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-3 border border-cream-200 dark:border-warm-500/20">
              <h4 class="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
                <X :size="12" /> 跳过TOP项
              </h4>
              <div class="space-y-1.5">
                <div
                  v-for="item in analysis.mostSkippedActivities"
                  :key="item.activityType"
                  class="flex items-center justify-between text-[11px]"
                >
                  <span class="flex items-center gap-1">
                    <component :is="getActivityIcon(item.activityType)" :size="11" :class="getActivityColors(item.activityType).text" />
                    <span class="text-warm-400 dark:text-warm-200">{{ SCHEDULE_ACTIVITY_LABELS[item.activityType] }}</span>
                  </span>
                  <span class="text-warm-500 dark:text-cream-100 font-bold">{{ item.count }}次</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-cream-50 to-peach-50 dark:from-cream-300/10 dark:to-peach-500/10 rounded-2xl p-4 border border-cream-200 dark:border-warm-500/20">
            <h3 class="text-sm font-extrabold text-warm-500 dark:text-cream-100 mb-3 flex items-center gap-1.5">
              <Lightbulb :size="15" class="text-amber-500" />
              智能建议
            </h3>
            <ul class="space-y-2">
              <li
                v-for="(s, i) in analysis.suggestions"
                :key="i"
                class="flex items-start gap-2 text-xs text-warm-400 dark:text-warm-200"
              >
                <span class="text-peach-400 font-bold flex-shrink-0 mt-0.5">💡</span>
                <span>{{ s }}</span>
              </li>
            </ul>
          </div>
        </template>
      </section>

      <!-- ========== 弹窗：编辑计划 ========== -->
      <div
        v-if="showPlanEditor"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
        @click.self="showPlanEditor = false"
      >
        <div class="bg-white dark:bg-[#2a1f1a] w-full max-w-lg rounded-t-3xl p-5 pb-8 animate-[slideUp_0.25s_ease-out]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-extrabold text-warm-500 dark:text-cream-100 flex items-center gap-1.5">
              <Settings2 :size="16" class="text-peach-400" />
              {{ editingPlanId ? '编辑计划' : '新建计划' }}
            </h3>
            <button @click="showPlanEditor = false" class="w-8 h-8 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
              <X :size="16" class="text-warm-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">计划名称 *</label>
              <input
                v-model="planName"
                type="text"
                placeholder="例如：宝贝专属作息表"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">计划说明</label>
              <textarea
                v-model="planDescription"
                rows="2"
                placeholder="可选：简要描述这个计划的目标或特点"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"
              ></textarea>
            </div>
            <button
              @click="handleSavePlan"
              :disabled="!planName.trim()"
              class="w-full bg-gradient-to-r from-peach-400 to-mint-400 disabled:opacity-40 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-1.5 shadow-md"
            >
              <Save :size="15" />
              保存计划
            </button>
          </div>
        </div>
      </div>

      <!-- ========== 弹窗：编辑活动 ========== -->
      <div
        v-if="showActivityEditor"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
        @click.self="showActivityEditor = false"
      >
        <div class="bg-white dark:bg-[#2a1f1a] w-full max-w-lg rounded-t-3xl p-5 pb-8 animate-[slideUp_0.25s_ease-out] max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-extrabold text-warm-500 dark:text-cream-100 flex items-center gap-1.5">
              <Plus :size="16" class="text-mint-400" />
              {{ editingActivityId ? '编辑活动' : '添加活动' }}
            </h3>
            <button @click="showActivityEditor = false" class="w-8 h-8 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
              <X :size="16" class="text-warm-400" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2 block">活动类型</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in activityTypeOptions"
                  :key="opt.value"
                  type="button"
                  @click="activityType = opt.value"
                  class="rounded-xl py-2.5 text-center font-bold text-xs transition-all border flex flex-col items-center gap-1"
                  :class="activityType === opt.value
                    ? [getActivityColors(opt.value).bg, getActivityColors(opt.value).border, getActivityColors(opt.value).text]
                    : 'bg-cream-50 dark:bg-warm-500/5 border-transparent text-warm-300 dark:text-warm-200'"
                >
                  <component :is="opt.icon" :size="16" />
                  {{ opt.label }}
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">活动标题</label>
              <input
                v-model="activityTitle"
                type="text"
                :placeholder="SCHEDULE_ACTIVITY_LABELS[activityType]"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">开始时间</label>
                <input
                  v-model="activityStart"
                  type="time"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
                />
              </div>
              <div>
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">结束时间</label>
                <input
                  v-model="activityEnd"
                  type="time"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
                />
              </div>
            </div>
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">提醒设置</label>
              <button
                type="button"
                @click="activityReminder = !activityReminder"
                class="w-full rounded-xl px-4 py-2.5 flex items-center justify-between"
                :class="activityReminder ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 'bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20'"
              >
                <span class="text-sm" :class="activityReminder ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-warm-400 dark:text-warm-200'">{{ activityReminder ? '🔔 已开启活动提醒' : '关闭活动提醒' }}</span>
                <span
                  class="w-10 h-6 rounded-full transition-all flex items-center"
                  :class="activityReminder ? 'bg-amber-400 justify-end pr-1' : 'bg-cream-200 dark:bg-warm-500/30 justify-start pl-1'"
                >
                  <span class="w-4 h-4 rounded-full bg-white shadow-sm"></span>
                </span>
              </button>
            </div>
            <div>
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">备注说明</label>
              <textarea
                v-model="activityNote"
                rows="2"
                placeholder="可选：执行此项活动时的注意事项等"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300 resize-none"
              ></textarea>
            </div>
            <button
              @click="handleSaveActivity"
              class="w-full bg-gradient-to-r from-mint-400 to-emerald-400 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-1.5 shadow-md"
            >
              <Save :size="15" />
              保存活动
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
