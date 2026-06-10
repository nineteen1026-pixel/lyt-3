<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Milk, Check, Eye, User, ChevronDown, BarChart2, AlertCircle, Clock, Droplet, Scale } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import { useFeedingAnalysis } from '@/composables/useFeedingAnalysis'
import { BREAST_SIDE_LABELS, FEEDING_TYPE_LABELS } from '@/types'

const router = useRouter()
const { addFeeding, canAddRecord, needsJoin, getMemberName, settings, updateSettings } = useBabyCare()
const { family, currentUserId } = useFamily()
const { analytics, todayStats, sideBalance, avgIntervalMin, recommendations, nextSuggestedFeeding } = useFeedingAnalysis()

const activeTab = ref<'record' | 'stats'>('record')

const feedingType = ref<'breast' | 'formula' | 'mixed'>('breast')
const breastSide = ref<'left' | 'right' | 'both' | 'alternate'>('alternate')
const leftDuration = ref(10)
const rightDuration = ref(10)
const totalDuration = ref(15)
const amount = ref(90)
const formulaPowder = ref(15)
const formulaWater = ref(90)
const note = ref('')
const saved = ref(false)
const caregiverId = ref(settings.value.defaultCaregiverId || currentUserId.value)
const showCaregiverPicker = ref(false)

const reminderEnabled = ref(settings.value.feedingReminder?.enabled ?? true)
const reminderInterval = ref(settings.value.feedingReminder?.intervalMinutes ?? 180)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const caregiverName = computed(() => getMemberName(caregiverId.value))

function nowISO() {
  return new Date().toISOString().slice(0, 16)
}

const timestamp = ref(nowISO())

watch([feedingType, breastSide, leftDuration, rightDuration], () => {
  if (feedingType.value === 'breast' || feedingType.value === 'mixed') {
    if (breastSide.value === 'left') totalDuration.value = leftDuration.value
    else if (breastSide.value === 'right') totalDuration.value = rightDuration.value
    else totalDuration.value = leftDuration.value + rightDuration.value
  }
})

watch([formulaPowder, formulaWater], () => {
  amount.value = formulaWater.value
})

function formatNextFeeding(iso: string | null) {
  if (!iso) return '暂无数据'
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000)
  if (diffMin < 0) return `已超时 ${Math.abs(diffMin)} 分钟`
  if (diffMin < 60) return `${diffMin} 分钟后`
  const h = Math.floor(diffMin / 60)
  const m = diffMin % 60
  return `${h}小时${m}分钟后 (${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')})`
}

function handleSubmit() {
  const isBreast = feedingType.value === 'breast' || feedingType.value === 'mixed'
  const isFormula = feedingType.value === 'formula' || feedingType.value === 'mixed'

  addFeeding({
    timestamp: new Date(timestamp.value).toISOString(),
    feedingType: feedingType.value,
    duration: isBreast ? totalDuration.value : 0,
    amount: isFormula ? amount.value : 0,
    breastSide: isBreast ? breastSide.value : undefined,
    leftDuration: isBreast ? (breastSide.value === 'right' ? 0 : leftDuration.value) : undefined,
    rightDuration: isBreast ? (breastSide.value === 'left' ? 0 : rightDuration.value) : undefined,
    formulaPowder: isFormula ? formulaPowder.value : undefined,
    formulaWater: isFormula ? formulaWater.value : undefined,
    note: note.value,
    caregiverId: caregiverId.value,
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}

function saveReminderSettings() {
  updateSettings({
    feedingReminder: {
      enabled: reminderEnabled.value,
      intervalMinutes: reminderInterval.value,
    },
  })
}

watch([reminderEnabled, reminderInterval], saveReminderSettings)

function selectCaregiver(id: string) {
  caregiverId.value = id
  showCaregiverPicker.value = false
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const maxTrendCount = computed(() => Math.max(1, ...analytics.value.last7DaysTrend.map(d => d.count)))
const maxTrendAmount = computed(() => Math.max(1, ...analytics.value.last7DaysTrend.map(d => d.amount)))
const maxHourCount = computed(() => Math.max(1, ...analytics.value.dailyDistribution.map(d => d.count)))
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-6">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Milk :size="20" class="text-peach-400" />
        喂养管理
      </h1>
    </header>

    <div class="flex gap-2 mb-5 bg-cream-100 dark:bg-warm-500/20 rounded-xl p-1">
      <button
        @click="activeTab = 'record'"
        class="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
        :class="activeTab === 'record' ? 'bg-white dark:bg-[#2a1f1a] text-peach-500 shadow-sm' : 'text-warm-300 dark:text-warm-200'"
      >
        记录
      </button>
      <button
        @click="activeTab = 'stats'"
        class="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1"
        :class="activeTab === 'stats' ? 'bg-white dark:bg-[#2a1f1a] text-peach-500 shadow-sm' : 'text-warm-300 dark:text-warm-200'"
      >
        <BarChart2 :size="14" />
        统计
      </button>
    </div>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">你尚未成为家庭成员</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <div v-else-if="!canAddRecord && activeTab === 'record'" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-warm-300 dark:text-warm-200" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">无操作权限</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">当前角色仅可查看记录</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">前往家庭管理</button>
    </div>

    <div v-else-if="saved" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-4 animate-bounce">
        <Check :size="32" class="text-mint-500" />
      </div>
      <p class="text-lg font-bold text-warm-500 dark:text-cream-100">记录成功！</p>
    </div>

    <template v-else>
      <div v-if="activeTab === 'record'" class="space-y-5">
        <div class="bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <Clock :size="14" class="text-peach-400" />
            <p class="text-xs font-bold text-warm-400 dark:text-warm-100">下次喂养提醒</p>
          </div>
          <p class="text-sm font-bold text-peach-500 dark:text-peach-400">{{ formatNextFeeding(nextSuggestedFeeding) }}</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">平均间隔 {{ avgIntervalMin }} 分钟</p>
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">喂养类型</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="v in ['breast', 'formula', 'mixed'] as const"
              :key="v"
              type="button"
              @click="feedingType = v"
              class="rounded-xl py-3 text-center font-bold text-sm transition-all border-2"
              :class="feedingType === v
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400 shadow-sm'
                : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
            >
              {{ v === 'breast' ? '🤱' : v === 'formula' ? '🍼' : '🤱🍼' }}
              {{ FEEDING_TYPE_LABELS[v] }}
            </button>
          </div>
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">时间</label>
          <input
            v-model="timestamp"
            type="datetime-local"
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          />
        </div>

        <div v-if="feedingType === 'breast' || feedingType === 'mixed'">
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">哺乳侧</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="v in ['left', 'right', 'both', 'alternate'] as const"
              :key="v"
              type="button"
              @click="breastSide = v"
              class="rounded-xl py-2.5 text-center font-bold text-xs transition-all border-2"
              :class="breastSide === v
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
            >
              {{ v === 'left' ? '⬅️' : v === 'right' ? '➡️' : v === 'both' ? '⬅️➡️' : '🔄' }}
              {{ BREAST_SIDE_LABELS[v] }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-3">
            <div v-if="breastSide !== 'right'">
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">左侧: {{ leftDuration }}min</label>
              <input v-model.number="leftDuration" type="range" min="1" max="40" class="w-full" />
            </div>
            <div v-if="breastSide !== 'left'">
              <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">右侧: {{ rightDuration }}min</label>
              <input v-model.number="rightDuration" type="range" min="1" max="40" class="w-full" />
            </div>
          </div>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1 text-center">总计: {{ totalDuration }} 分钟</p>
        </div>

        <div v-if="feedingType === 'formula' || feedingType === 'mixed'">
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">冲泡详情</label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="flex items-center gap-1 mb-1">
                <Scale :size="12" class="text-peach-400" />
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100">奶粉 (g)</label>
              </div>
              <input
                v-model.number="formulaPowder"
                type="number"
                min="0"
                step="1"
                class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
              />
            </div>
            <div>
              <div class="flex items-center gap-1 mb-1">
                <Droplet :size="12" class="text-peach-400" />
                <label class="text-xs font-bold text-warm-400 dark:text-warm-100">水量 (ml)</label>
              </div>
              <input
                v-model.number="formulaWater"
                type="number"
                min="0"
                step="5"
                class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
              />
            </div>
          </div>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1 text-center">奶量: {{ amount }}ml (约 {{ (formulaPowder / Math.max(1, formulaWater / 30)).toFixed(1) }} 勺)</p>
          <div class="flex gap-2 mt-2">
            <button v-for="v in [60, 90, 120, 150, 180]" :key="v" type="button" @click="formulaWater = v; formulaPowder = Math.round(v / 30 * 5)"
              class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
              :class="amount === v
                ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
                : 'bg-cream-100 dark:bg-warm-500/20 text-warm-300 dark:text-warm-200'"
            >{{ v }}ml</button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-warm-400 dark:text-warm-100">间隔提醒</label>
            <button
              type="button"
              @click="reminderEnabled = !reminderEnabled"
              class="w-11 h-6 rounded-full transition-colors relative"
              :class="reminderEnabled ? 'bg-peach-400' : 'bg-warm-200 dark:bg-warm-500/30'"
            >
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                :class="reminderEnabled ? 'translate-x-5' : 'translate-x-0.5'" />
            </button>
          </div>
          <div v-if="reminderEnabled" class="bg-cream-50 dark:bg-warm-500/10 rounded-xl p-3">
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2 block">提醒间隔: {{ reminderInterval }} 分钟</label>
            <input v-model.number="reminderInterval" type="range" min="60" max="360" step="15" class="w-full" />
            <div class="flex justify-between text-[10px] text-warm-300 dark:text-warm-200 mt-1">
              <span>1h</span><span>3h</span><span>6h</span>
            </div>
          </div>
        </div>

        <div v-if="familyMembers.length > 0" class="relative">
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">照护人</label>
          <button
            type="button"
            @click="showCaregiverPicker = !showCaregiverPicker"
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-peach-300"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                <User :size="14" class="text-peach-400" />
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
              :class="caregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                <User :size="14" class="text-warm-400" />
              </div>
              <span>{{ member.name }}</span>
              <Check v-if="caregiverId === member.id" :size="14" class="ml-auto text-peach-400" />
            </button>
          </div>
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">备注</label>
          <textarea
            v-model="note"
            rows="2"
            class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"
            placeholder="可选备注..."
          ></textarea>
        </div>

        <button
          type="button"
          @click="handleSubmit"
          class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-peach-200 dark:shadow-peach-500/20"
        >
          保存记录
        </button>
      </div>

      <div v-else class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3">
            <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">今日次数</p>
            <p class="text-2xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ todayStats.totalFeedings }}<span class="text-xs font-normal">次</span></p>
          </div>
          <div class="bg-mint-50 dark:bg-mint-500/10 rounded-2xl p-3">
            <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">今日奶量</p>
            <p class="text-2xl font-extrabold text-mint-500 dark:text-mint-400 font-display">{{ todayStats.totalAmount }}<span class="text-xs font-normal">ml</span></p>
          </div>
          <div class="bg-cream-100 dark:bg-cream-300/10 rounded-2xl p-3">
            <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">母乳时长</p>
            <p class="text-2xl font-extrabold text-warm-400 dark:text-cream-300 font-display">{{ todayStats.totalDuration }}<span class="text-xs font-normal">min</span></p>
          </div>
          <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3">
            <p class="text-[10px] text-warm-300 dark:text-warm-200 mb-1">平均间隔</p>
            <p class="text-2xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ todayStats.avgIntervalMin || avgIntervalMin }}<span class="text-xs font-normal">min</span></p>
          </div>
        </div>

        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-bold text-warm-400 dark:text-warm-100">左右侧平衡</p>
            <AlertCircle v-if="sideBalance.imbalanceWarning" :size="14" class="text-amber-400" />
          </div>
          <div class="flex h-6 rounded-full overflow-hidden bg-cream-100 dark:bg-warm-500/20">
            <div class="bg-peach-300 dark:bg-peach-400 transition-all" :style="{ width: sideBalance.leftPercent + '%' }" />
            <div class="bg-mint-300 dark:bg-mint-400 transition-all" :style="{ width: sideBalance.rightPercent + '%' }" />
          </div>
          <div class="flex justify-between mt-2">
            <p class="text-[10px] text-warm-300 dark:text-warm-200">左侧 {{ sideBalance.leftPercent }}% · {{ sideBalance.leftDuration }}min</p>
            <p class="text-[10px] text-warm-300 dark:text-warm-200">右侧 {{ sideBalance.rightPercent }}% · {{ sideBalance.rightDuration }}min</p>
          </div>
          <p class="text-[11px] mt-2" :class="sideBalance.imbalanceWarning ? 'text-amber-500' : 'text-mint-500'">{{ sideBalance.suggestion }}</p>
        </div>

        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <p class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">近7天趋势</p>
          <div class="space-y-2">
            <div v-for="d in analytics.last7DaysTrend" :key="d.date" class="flex items-center gap-2">
              <span class="text-[10px] text-warm-300 dark:text-warm-200 w-10">{{ d.date }}</span>
              <div class="flex-1 h-4 bg-cream-100 dark:bg-warm-500/20 rounded-full overflow-hidden relative">
                <div class="h-full bg-peach-300 dark:bg-peach-400 rounded-full transition-all"
                  :style="{ width: (d.count / maxTrendCount * 100) + '%' }" />
                <span class="absolute inset-0 flex items-center px-2 text-[9px] font-bold text-warm-500 dark:text-cream-100">
                  {{ d.count }}次 · {{ d.amount }}ml
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <p class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">喂养时段分布 (近7天)</p>
          <div class="flex items-end gap-0.5 h-16">
            <div v-for="h in analytics.dailyDistribution" :key="h.hour"
              class="flex-1 rounded-t transition-all"
              :class="h.count > 0 ? 'bg-peach-300 dark:bg-peach-400' : 'bg-cream-100 dark:bg-warm-500/10'"
              :style="{ height: Math.max(4, (h.count / maxHourCount * 100)) + '%' }"
              :title="`${h.hour}时: ${h.count}次`"
            />
          </div>
          <div class="flex justify-between mt-1 text-[8px] text-warm-300 dark:text-warm-200">
            <span>0时</span><span>6时</span><span>12时</span><span>18时</span><span>24时</span>
          </div>
        </div>

        <div class="bg-gradient-to-r from-mint-50 to-peach-50 dark:from-mint-500/10 dark:to-peach-500/10 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <AlertCircle :size="14" class="text-mint-500" />
            <p class="text-sm font-bold text-warm-400 dark:text-warm-100">喂养建议</p>
          </div>
          <ul class="space-y-1.5">
            <li v-for="(rec, i) in recommendations" :key="i" class="text-xs text-warm-500 dark:text-cream-100 flex items-start gap-1.5">
              <span class="text-peach-400 mt-0.5">•</span>
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <p class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">累计统计</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">母乳累计</p>
              <p class="text-lg font-bold text-peach-500 dark:text-peach-400">{{ analytics.breastfeedingTotalMin }}min</p>
            </div>
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">配方奶累计</p>
              <p class="text-lg font-bold text-mint-500 dark:text-mint-400">{{ analytics.formulaUsageTotal }}ml</p>
            </div>
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">平均时长</p>
              <p class="text-lg font-bold text-warm-500 dark:text-cream-100">{{ analytics.avgDurationMin }}min/次</p>
            </div>
            <div>
              <p class="text-[10px] text-warm-300 dark:text-warm-200">平均奶量</p>
              <p class="text-lg font-bold text-warm-500 dark:text-cream-100">{{ analytics.avgAmountPerFeeding }}ml/次</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
