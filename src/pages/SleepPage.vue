<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Moon, Check, Eye, User, ChevronDown, Target, Settings2, Save, Clock, Sun, Plus, Trash2, Star } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { SleepTemplateData } from '@/types'

const router = useRouter()
const { addSleep, canAddRecord, needsJoin, getMemberName, settings, currentSleepGoal, setSleepGoal, getSleepGoalDailyAchievement, getDaySleepTimes, getTemplatesByCategory, createSleepTemplate, deleteTemplate, setDefaultTemplate } = useBabyCare()
const { family, currentUserId } = useFamily()

const quality = ref<'deep' | 'light' | 'fussy'>('deep')
const note = ref('')
const saved = ref(false)
const caregiverId = ref(settings.value.defaultCaregiverId || currentUserId.value)
const showCaregiverPicker = ref(false)
const showGoalSettings = ref(false)
const goalSaved = ref(false)

const showTemplatePanel = ref(false)
const showSaveTemplateDialog = ref(false)
const newTemplateName = ref('')
const newTemplateIcon = ref('🌙')

const sleepTemplates = computed(() => getTemplatesByCategory('sleep'))

const sleepIconOptions = ['🌙', '😴', '💤', '⭐', '☀️', '🛁', '📖', '🎵']

function applyTemplate(templateId: string) {
  const template = sleepTemplates.value.find(t => t.id === templateId)
  if (!template) return
  const data = template.data as SleepTemplateData
  quality.value = data.quality
  note.value = data.note
  if (data.durationMinutes && data.durationMinutes > 0) {
    const now = new Date()
    const start = new Date(now.getTime() - data.durationMinutes * 60000)
    startTime.value = start.toISOString().slice(0, 16)
    endTime.value = now.toISOString().slice(0, 16)
  }
  showTemplatePanel.value = false
}

function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) return
  const data: SleepTemplateData = {
    quality: quality.value,
    durationMinutes: sleepDuration.value,
    note: note.value,
  }
  createSleepTemplate(newTemplateName.value.trim(), newTemplateIcon.value, data)
  newTemplateName.value = ''
  showSaveTemplateDialog.value = false
}

function handleDeleteTemplate(id: string) {
  if (confirm('确定要删除这个模板吗？')) {
    deleteTemplate(id)
  }
}

function handleSetDefault(id: string) {
  setDefaultTemplate(id)
}

const goalTargetBedtime = ref('21:00')
const goalTargetWakeTime = ref('07:00')
const goalTargetSleepHours = ref(12)
const goalBedtimeTolerance = ref(30)
const goalWakeTimeTolerance = ref(30)

watch(currentSleepGoal, (g) => {
  if (g) {
    goalTargetBedtime.value = g.targetBedtime
    goalTargetWakeTime.value = g.targetWakeTime
    goalTargetSleepHours.value = g.targetSleepHours
    goalBedtimeTolerance.value = g.bedtimeToleranceMin
    goalWakeTimeTolerance.value = g.wakeTimeToleranceMin
  }
}, { immediate: true })

const todayAchievement = computed(() => getSleepGoalDailyAchievement(new Date()))
const todaySleepDetail = computed(() => getDaySleepTimes(new Date()))

function formatDeviation(min: number): string {
  if (Math.abs(min) >= 900) return '-'
  const sign = min > 0 ? '+' : ''
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  if (h > 0) return `${sign}${h}h${m}m`
  return `${sign}${m}m`
}

function handleSaveGoal() {
  setSleepGoal({
    targetBedtime: goalTargetBedtime.value,
    targetWakeTime: goalTargetWakeTime.value,
    targetSleepHours: goalTargetSleepHours.value,
    bedtimeToleranceMin: goalBedtimeTolerance.value,
    wakeTimeToleranceMin: goalWakeTimeTolerance.value,
  })
  goalSaved.value = true
  setTimeout(() => {
    goalSaved.value = false
    showGoalSettings.value = false
  }, 1000)
}

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const caregiverName = computed(() => getMemberName(caregiverId.value))

function nowTimeStr() {
  return new Date().toISOString().slice(0, 16)
}

function hoursAgo(h: number) {
  const d = new Date(Date.now() - h * 3600000)
  return d.toISOString().slice(0, 16)
}

const startTime = ref(hoursAgo(2))
const endTime = ref(nowTimeStr())

const sleepDuration = computed(() => {
  const diff = (new Date(endTime.value).getTime() - new Date(startTime.value).getTime()) / 60000
  return Math.max(0, Math.round(diff))
})

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function handleSubmit() {
  if (sleepDuration.value <= 0) return
  addSleep({
    startTime: new Date(startTime.value).toISOString(),
    endTime: new Date(endTime.value).toISOString(),
    quality: quality.value,
    note: note.value,
    caregiverId: caregiverId.value,
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}

function selectCaregiver(id: string) {
  caregiverId.value = id
  showCaregiverPicker.value = false
}

const qualityOptions = [
  { value: 'deep' as const, emoji: '😴', label: '安睡' },
  { value: 'light' as const, emoji: '😊', label: '浅睡' },
  { value: 'fussy' as const, emoji: '😟', label: '烦躁' },
]

const toleranceOptions = [
  { value: 15, label: '±15分钟' },
  { value: 30, label: '±30分钟' },
  { value: 45, label: '±45分钟' },
  { value: 60, label: '±1小时' },
]

const sleepHoursPresets = [10, 11, 12, 13, 14]
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Moon :size="20" class="text-mint-500" />
        睡眠记录
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

    <div v-else-if="!canAddRecord" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-warm-300 dark:text-warm-200" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">无操作权限</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">当前角色仅可查看记录</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-mint-400 text-white text-sm font-bold">前往家庭管理</button>
    </div>

    <div v-else-if="saved" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-4 animate-bounce">
        <Check :size="32" class="text-mint-500" />
      </div>
      <p class="text-lg font-bold text-warm-500 dark:text-cream-100">记录成功！</p>
    </div>

    <template v-else>
      <section class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <Target :size="14" class="text-peach-400" />
            作息目标
          </h2>
          <button
            type="button"
            @click="showGoalSettings = !showGoalSettings"
            class="flex items-center gap-1 text-xs text-peach-400 hover:text-peach-500 font-semibold"
          >
            <Settings2 :size="12" />
            {{ showGoalSettings ? '收起' : '设置' }}
          </button>
        </div>

        <div v-if="currentSleepGoal" class="bg-gradient-to-br from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl p-4 mb-3">
          <div class="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">目标入睡</p>
              <p class="text-sm font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ currentSleepGoal.targetBedtime }}</p>
            </div>
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">目标起床</p>
              <p class="text-sm font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ currentSleepGoal.targetWakeTime }}</p>
            </div>
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-0.5">目标时长</p>
              <p class="text-sm font-extrabold text-warm-500 dark:text-cream-300 font-display">{{ currentSleepGoal.targetSleepHours }}h</p>
            </div>
          </div>
          <div v-if="todayAchievement && todayAchievement.bedtime" class="border-t border-cream-200/60 dark:border-warm-500/10 pt-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-1">
                <Moon :size="10" class="text-peach-400" />
                今日主睡眠达成
              </p>
              <span v-if="todaySleepDetail.mainSleepMinutes > 0" class="text-[10px] text-warm-200 dark:text-warm-400">
                {{ (todaySleepDetail.mainSleepMinutes / 60).toFixed(1) }}h / 目标 {{ currentSleepGoal?.targetSleepHours }}h
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl p-2" :class="todayAchievement.bedtimeAchieved ? 'bg-mint-100 dark:bg-mint-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
                <Check v-if="todayAchievement.bedtimeAchieved" :size="14" class="text-mint-500 mx-auto mb-0.5" />
                <Clock v-else :size="14" class="text-warm-300 mx-auto mb-0.5" />
                <p class="text-[10px]" :class="todayAchievement.bedtimeAchieved ? 'text-mint-600 dark:text-mint-400 font-bold' : 'text-warm-300'">{{ todayAchievement.bedtime }}</p>
                <p class="text-[9px] text-warm-200 dark:text-warm-400">{{ formatDeviation(todayAchievement.bedtimeDeviationMin) }}</p>
              </div>
              <div class="rounded-xl p-2" :class="todayAchievement.wakeTimeAchieved ? 'bg-mint-100 dark:bg-mint-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
                <Check v-if="todayAchievement.wakeTimeAchieved" :size="14" class="text-mint-500 mx-auto mb-0.5" />
                <Clock v-else :size="14" class="text-warm-300 mx-auto mb-0.5" />
                <p class="text-[10px]" :class="todayAchievement.wakeTimeAchieved ? 'text-mint-600 dark:text-mint-400 font-bold' : 'text-warm-300'">{{ todayAchievement.wakeTime || '-' }}</p>
                <p class="text-[9px] text-warm-200 dark:text-warm-400">{{ formatDeviation(todayAchievement.wakeTimeDeviationMin) }}</p>
              </div>
              <div class="rounded-xl p-2" :class="todayAchievement.sleepHoursAchieved ? 'bg-mint-100 dark:bg-mint-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
                <Check v-if="todayAchievement.sleepHoursAchieved" :size="14" class="text-mint-500 mx-auto mb-0.5" />
                <Clock v-else :size="14" class="text-warm-300 mx-auto mb-0.5" />
                <p class="text-[10px]" :class="todayAchievement.sleepHoursAchieved ? 'text-mint-600 dark:text-mint-400 font-bold' : 'text-warm-300'">{{ todayAchievement.sleepHours }}h</p>
                <p class="text-[9px] text-warm-200 dark:text-warm-400">{{ formatDeviation(todayAchievement.sleepHoursDeviationMin) }}</p>
              </div>
            </div>
            <div v-if="todaySleepDetail.napCount > 0" class="mt-3 bg-sun-50 dark:bg-amber-500/10 rounded-xl p-2 border border-sun-100/60 dark:border-amber-500/20">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Sun :size="10" />
                  白天小睡
                </span>
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  {{ todaySleepDetail.napCount }}次 · {{ (todaySleepDetail.napMinutes / 60).toFixed(1) }}h
                </span>
              </div>
            </div>
            <div class="mt-2 text-center">
              <span class="text-[10px] text-warm-200 dark:text-warm-400">
                全天合计 {{ (todaySleepDetail.totalSleepMinutes / 60).toFixed(1) }}h
              </span>
            </div>
          </div>
          <div v-else class="border-t border-cream-200/60 dark:border-warm-500/10 pt-3 text-center">
            <p class="text-xs text-warm-300 dark:text-warm-200">今日暂无完整睡眠记录</p>
          </div>
        </div>
        <div v-else class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl p-4 mb-3 text-center">
          <Target :size="24" class="text-warm-300 mx-auto mb-2" />
          <p class="text-sm text-warm-400 dark:text-warm-200 font-semibold">尚未设置作息目标</p>
          <p class="text-xs text-warm-300 dark:text-warm-400 mt-1">点击右上角"设置"创建目标</p>
        </div>

        <div v-if="showGoalSettings" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm space-y-4 border border-cream-200 dark:border-warm-500/20">
          <div v-if="goalSaved" class="flex items-center justify-center gap-2 py-2 bg-mint-50 dark:bg-mint-500/10 rounded-xl">
            <Check :size="16" class="text-mint-500" />
            <span class="text-sm font-bold text-mint-600 dark:text-mint-400">已保存！</span>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">目标入睡时间</label>
            <input
              v-model="goalTargetBedtime"
              type="time"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">目标起床时间</label>
            <input
              v-model="goalTargetWakeTime"
              type="time"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">每日目标睡眠时长</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="h in sleepHoursPresets"
                :key="h"
                type="button"
                @click="goalTargetSleepHours = h"
                class="rounded-xl py-2 text-center text-sm font-bold transition-all border"
                :class="goalTargetSleepHours === h
                  ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-500'
                  : 'bg-cream-50 dark:bg-warm-500/5 border-transparent text-warm-300'"
              >
                {{ h }}h
              </button>
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">入睡时间容差</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="opt in toleranceOptions"
                :key="opt.value"
                type="button"
                @click="goalBedtimeTolerance = opt.value"
                class="rounded-xl py-2 text-center text-xs font-bold transition-all border"
                :class="goalBedtimeTolerance === opt.value
                  ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500'
                  : 'bg-cream-50 dark:bg-warm-500/5 border-transparent text-warm-300'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1.5 block">起床时间容差</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="opt in toleranceOptions"
                :key="opt.value"
                type="button"
                @click="goalWakeTimeTolerance = opt.value"
                class="rounded-xl py-2 text-center text-xs font-bold transition-all border"
                :class="goalWakeTimeTolerance === opt.value
                  ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-500'
                  : 'bg-cream-50 dark:bg-warm-500/5 border-transparent text-warm-300'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="handleSaveGoal"
            class="w-full bg-gradient-to-r from-peach-400 to-mint-400 hover:from-peach-500 hover:to-mint-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
          >
            <Save :size="14" />
            保存目标
          </button>
        </div>
      </section>

      <section v-if="sleepTemplates.length > 0" class="mb-6">
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-bold text-warm-400 dark:text-warm-100">常用模板</p>
            <button
              type="button"
              @click="showTemplatePanel = !showTemplatePanel"
              class="text-xs text-mint-500 hover:text-mint-600 font-semibold flex items-center gap-1"
            >
              <ChevronDown :size="12" :class="{ 'rotate-180': showTemplatePanel }" />
              {{ showTemplatePanel ? '收起' : '展开' }}
            </button>
          </div>
          <div v-if="showTemplatePanel" class="space-y-2">
            <div
              v-for="template in sleepTemplates"
              :key="template.id"
              class="flex items-center gap-3 p-2 rounded-xl bg-cream-50 dark:bg-warm-500/10 hover:bg-cream-100 dark:hover:bg-warm-500/20 transition-colors group"
            >
              <button
                type="button"
                @click="applyTemplate(template.id)"
                class="flex-1 flex items-center gap-2 text-left"
              >
                <span class="text-xl">{{ template.icon || '📋' }}</span>
                <div class="flex-1">
                  <p class="text-sm font-bold text-warm-500 dark:text-cream-100 flex items-center gap-1">
                    {{ template.name }}
                    <Star v-if="template.isDefault" :size="12" class="text-amber-400 fill-amber-400" />
                  </p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">
                    {{ (template.data as SleepTemplateData).quality === 'deep' ? '安睡' : (template.data as SleepTemplateData).quality === 'light' ? '浅睡' : '烦躁' }}
                    <template v-if="(template.data as SleepTemplateData).durationMinutes">
                      · {{ formatDuration((template.data as SleepTemplateData).durationMinutes!) }}
                    </template>
                  </p>
                </div>
              </button>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  @click.stop="handleSetDefault(template.id)"
                  class="p-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-500/30"
                  :title="template.isDefault ? '取消默认' : '设为默认'"
                >
                  <Star :size="14" :class="template.isDefault ? 'text-amber-400 fill-amber-400' : 'text-warm-300'" />
                </button>
                <button
                  type="button"
                  @click.stop="handleDeleteTemplate(template.id)"
                  class="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20"
                  title="删除模板"
                >
                  <Trash2 :size="14" class="text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">入睡时间</label>
        <input
          v-model="startTime"
          type="datetime-local"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
        />
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">醒来时间</label>
        <input
          v-model="endTime"
          type="datetime-local"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
        />
      </div>

      <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-4 text-center">
        <p class="text-sm text-warm-300 dark:text-warm-200">睡眠时长</p>
        <p class="text-3xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ formatDuration(sleepDuration) }}</p>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">睡眠质量</label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="opt in qualityOptions"
            :key="opt.value"
            type="button"
            @click="quality = opt.value"
            class="rounded-2xl py-4 text-center font-bold text-sm transition-all border-2"
            :class="quality === opt.value
              ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-500 dark:text-mint-400 shadow-sm'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
          >
            <span class="text-2xl block mb-1">{{ opt.emoji }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="familyMembers.length > 0" class="relative">
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">照护人</label>
        <button
          type="button"
          @click="showCaregiverPicker = !showCaregiverPicker"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-mint-300"
        >
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
              <User :size="14" class="text-mint-500" />
            </div>
            <span class="text-sm text-warm-500 dark:text-cream-100">{{ caregiverName }}</span>
          </div>
          <ChevronDown :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
        </button>
        <div
          v-if="showCaregiverPicker"
          class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto"
        >
          <button
            v-for="member in familyMembers"
            :key="member.id"
            type="button"
            @click="selectCaregiver(member.id)"
            class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
            :class="caregiverId === member.id ? 'bg-mint-50 dark:bg-mint-500/10 text-mint-500' : 'text-warm-500 dark:text-cream-100'"
          >
            <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
              <User :size="14" class="text-warm-400" />
            </div>
            <span>{{ member.name }}</span>
            <Check v-if="caregiverId === member.id" :size="14" class="ml-auto text-mint-500" />
          </button>
        </div>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">备注</label>
        <textarea
          v-model="note"
          rows="2"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300 resize-none"
          placeholder="可选备注..."
        ></textarea>
      </div>

      <button
        type="button"
        @click="showSaveTemplateDialog = true"
        class="w-full bg-white dark:bg-[#2a1f1a] border-2 border-dashed border-cream-200 dark:border-warm-500/30 text-warm-400 dark:text-warm-200 rounded-2xl py-2.5 font-bold text-sm transition-all hover:border-mint-300 hover:text-mint-500 dark:hover:border-mint-500/30 flex items-center justify-center gap-2"
      >
        <Save :size="16" />
        保存为常用模板
      </button>

      <button
        type="submit"
        :disabled="sleepDuration <= 0"
        class="w-full bg-mint-400 hover:bg-mint-500 disabled:opacity-40 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-mint-200 dark:shadow-mint-500/20"
      >
        保存记录
      </button>
    </form>
    </template>

    <div v-if="showSaveTemplateDialog" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" @click.self="showSaveTemplateDialog = false">
      <div class="bg-white dark:bg-[#2a1f1a] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-5 space-y-4 animate-slide-up">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-warm-500 dark:text-cream-100">保存为模板</h3>
          <button @click="showSaveTemplateDialog = false" class="text-warm-300 hover:text-warm-400">
            <ChevronDown :size="24" class="rotate-90" />
          </button>
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">模板名称</label>
          <input
            v-model="newTemplateName"
            type="text"
            placeholder="例如：睡前流程"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-mint-300"
          />
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">选择图标</label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="icon in sleepIconOptions"
              :key="icon"
              type="button"
              @click="newTemplateIcon = icon"
              class="aspect-square rounded-xl text-xl flex items-center justify-center transition-all border-2"
              :class="newTemplateIcon === icon
                ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent hover:border-cream-200'"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="bg-cream-50 dark:bg-warm-500/10 rounded-xl p-3">
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1">将保存以下内容：</p>
          <ul class="text-[11px] text-warm-300 dark:text-warm-200 space-y-0.5">
            <li>• 睡眠质量: {{ quality === 'deep' ? '安睡' : quality === 'light' ? '浅睡' : '烦躁' }}</li>
            <li>• 睡眠时长: {{ formatDuration(sleepDuration) }}</li>
            <li v-if="note">• 备注: {{ note.slice(0, 20) }}{{ note.length > 20 ? '...' : '' }}</li>
          </ul>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="showSaveTemplateDialog = false"
            class="flex-1 py-3 rounded-xl font-bold text-sm bg-cream-100 dark:bg-warm-500/20 text-warm-400 dark:text-warm-200"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSaveTemplate"
            :disabled="!newTemplateName.trim()"
            class="flex-1 py-3 rounded-xl font-bold text-sm bg-mint-400 text-white disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
