<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Baby, Heart, ChevronRight, ChevronLeft, Milk, Moon, Droplets, Bell, Check, Sparkles, BookOpen, Home, Users, Syringe, Stethoscope, Sun, Bath, Activity, Pill, AlertTriangle, Shield, RefreshCw } from 'lucide-vue-next'
import { useOnboarding } from '@/composables/useOnboarding'

const router = useRouter()
const {
  step, totalSteps,
  babyName, babyGender, babyBirthDate,
  familyName, userName,
  enableNotifications, enableDarkMode, loadSampleData,
  reminderEnabled,
  hasExistingData, keepExistingData,
  ageMonths, currentPreset, reminderSummary,
  completeOnboarding, prefillFromExistingData,
} = useOnboarding()

const animating = ref(false)

function nextStep() {
  if (step.value === 1 && !babyBirthDate.value) return
  if (step.value === 1 && !babyName.value.trim()) return
  if (step.value === 2 && !userName.value.trim()) return
  animating.value = true
  setTimeout(() => {
    step.value++
    animating.value = false
  }, 150)
}

function prevStep() {
  if (step.value <= 0) return
  animating.value = true
  setTimeout(() => {
    step.value--
    animating.value = false
  }, 150)
}

function handleFinish() {
  completeOnboarding()
  router.replace('/')
}

function handleSkipAndKeep() {
  keepExistingData.value = true
  completeOnboarding()
  router.replace('/')
}

const canNext = computed(() => {
  if (step.value === 1) return babyName.value.trim() && babyBirthDate.value
  if (step.value === 2) return userName.value.trim()
  return true
})

const ageLabel = computed(() => {
  if (!babyBirthDate.value) return ''
  const m = ageMonths.value
  if (m <= 0) return '新生儿'
  return `${m}个月`
})

const today = new Date().toISOString().slice(0, 10)

const roleOptions = ['妈妈', '爸爸', '奶奶', '外婆', '爷爷', '外公', '其他']
const isCustomRole = ref(false)

const reminderItems = computed(() => [
  { key: 'feeding', label: '喂奶提醒', desc: `每${currentPreset.value.reminderDefaults.feedingIntervalMin}分钟`, icon: Milk, color: 'peach' },
  { key: 'diaper', label: '换尿布提醒', desc: `每${currentPreset.value.reminderDefaults.diaperIntervalMin}分钟`, icon: Droplets, color: 'mint' },
  { key: 'sleep', label: '哄睡提醒', desc: `清醒${currentPreset.value.reminderDefaults.sleepWakeMin}分钟后`, icon: Moon, color: 'warm' },
  { key: 'medicine_vitamin', label: '维生素AD', desc: '每日一粒', icon: Pill, color: 'peach' },
  { key: 'tummy_time', label: '趴练提醒', desc: `${currentPreset.value.dailyCare.tummyTimeMin}分钟/天`, icon: Activity, color: 'mint' },
  { key: 'bath', label: '洗澡提醒', desc: currentPreset.value.dailyCare.bathTime || '每天', icon: Bath, color: 'warm' },
  { key: 'sunlight', label: '晒太阳', desc: currentPreset.value.dailyCare.sunStartTime || '早晨', icon: Sun, color: 'peach' },
  { key: 'vaccine', label: '疫苗提醒', desc: '按国家免疫规划', icon: Syringe, color: 'mint' },
  { key: 'checkup', label: '体检提醒', desc: '定期儿保检查', icon: Stethoscope, color: 'warm' },
])

watch(babyBirthDate, (val) => {
  if (val && !hasExistingData.value) {
    loadSampleData.value = true
  }
})

onMounted(() => {
  if (hasExistingData.value) {
    prefillFromExistingData()
    keepExistingData.value = true
  }
})
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-gradient-to-b from-peach-50 via-white to-mint-50 dark:from-[#1a1210] dark:via-[#1a1210] dark:to-[#121a14]">
    <div class="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
      <div class="flex items-center justify-between mb-8">
        <div class="flex gap-1.5">
          <div v-for="i in totalSteps" :key="i"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="i - 1 <= step ? 'w-8 bg-peach-400' : 'w-4 bg-cream-200 dark:bg-warm-500/20'" />
        </div>
        <span class="text-xs text-warm-300 dark:text-warm-200">{{ step + 1 }} / {{ totalSteps }}</span>
      </div>

      <div class="flex-1" :class="animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'" style="transition: all 0.15s ease">

        <template v-if="step === 0">
          <div class="flex flex-col items-center text-center pt-8">
            <div class="w-24 h-24 rounded-3xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-6 shadow-lg shadow-peach-100 dark:shadow-peach-500/10">
              <Baby :size="48" class="text-peach-400" />
            </div>
            <h1 class="text-2xl font-extrabold text-warm-500 dark:text-cream-100 font-display mb-3">欢迎来到宝宝照护</h1>
            <p class="text-warm-300 dark:text-warm-200 text-sm leading-relaxed max-w-xs mb-8">
              用爱记录每一天的喂养、睡眠和成长，<br/>让照护更从容、更安心
            </p>
            <div class="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
              <div class="flex flex-col items-center gap-2 py-4 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                  <Milk :size="20" class="text-peach-400" />
                </div>
                <span class="text-[11px] font-semibold text-warm-400 dark:text-warm-100">喂养记录</span>
              </div>
              <div class="flex flex-col items-center gap-2 py-4 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
                  <Moon :size="20" class="text-mint-500" />
                </div>
                <span class="text-[11px] font-semibold text-warm-400 dark:text-warm-100">睡眠追踪</span>
              </div>
              <div class="flex flex-col items-center gap-2 py-4 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center">
                  <Droplets :size="20" class="text-warm-400" />
                </div>
                <span class="text-[11px] font-semibold text-warm-400 dark:text-warm-100">尿布更换</span>
              </div>
            </div>
            <div class="bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl px-5 py-4 w-full">
              <div class="flex items-start gap-3">
                <Sparkles :size="18" class="text-peach-400 mt-0.5 shrink-0" />
                <div class="text-left">
                  <p class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-1">智能引导</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200 leading-relaxed">只需几分钟，为宝宝定制专属照护方案，自动设置喂养间隔、睡眠节奏、疫苗提醒等</p>
                </div>
              </div>
            </div>

            <div v-if="hasExistingData" class="mt-4 w-full">
              <div class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-4">
                <div class="flex items-start gap-3">
                  <AlertTriangle :size="18" class="text-amber-500 mt-0.5 shrink-0" />
                  <div class="text-left flex-1">
                    <p class="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">检测到已有数据</p>
                    <p class="text-[11px] text-amber-600 dark:text-amber-300/80 leading-relaxed mb-3">
                      我们发现你之前已经记录过宝宝数据。你可以保留现有数据并快速进入应用，或重新配置引导。
                    </p>
                    <button
                      @click="handleSkipAndKeep"
                      class="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <Shield :size="14" />
                      保留数据并快速进入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="step === 1">
          <div class="pt-4">
            <h2 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display mb-2">宝宝信息</h2>
            <p class="text-sm text-warm-300 dark:text-warm-200 mb-6">告诉我们宝宝的基本信息，我们会根据月龄为你定制照护方案</p>

            <div class="space-y-5">
              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1.5 block">宝宝名字</label>
                <input
                  v-model="babyName"
                  type="text"
                  placeholder="给宝宝起个昵称吧"
                  class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 placeholder-warm-200 dark:placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-peach-300 text-sm"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1.5 block">出生日期</label>
                <input
                  v-model="babyBirthDate"
                  type="date"
                  :max="today"
                  class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 text-sm"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1.5 block">性别</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    @click="babyGender = 'male'"
                    class="rounded-xl py-3 text-center font-bold text-sm transition-all border-2"
                    :class="babyGender === 'male'
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                      : 'bg-white dark:bg-[#2a1f1a] border-cream-200 dark:border-warm-500/20 text-warm-300 dark:text-warm-200'"
                  >
                    👦 男孩
                  </button>
                  <button
                    type="button"
                    @click="babyGender = 'female'"
                    class="rounded-xl py-3 text-center font-bold text-sm transition-all border-2"
                    :class="babyGender === 'female'
                      ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                      : 'bg-white dark:bg-[#2a1f1a] border-cream-200 dark:border-warm-500/20 text-warm-300 dark:text-warm-200'"
                  >
                    👧 女孩
                  </button>
                </div>
              </div>
            </div>

            <div v-if="babyBirthDate" class="mt-6 bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
                  <BookOpen :size="18" class="text-peach-400" />
                </div>
                <div>
                  <p class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ currentPreset.label }} · {{ ageLabel }}</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200 mt-0.5">{{ currentPreset.description }}</p>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div class="text-center bg-white/60 dark:bg-warm-500/10 rounded-lg py-2">
                  <p class="text-xs font-bold text-peach-400">{{ currentPreset.feeding.dailyCount }}次</p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">日喂奶</p>
                </div>
                <div class="text-center bg-white/60 dark:bg-warm-500/10 rounded-lg py-2">
                  <p class="text-xs font-bold text-mint-500">{{ currentPreset.sleep.napCount }}次</p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">日小觉</p>
                </div>
                <div class="text-center bg-white/60 dark:bg-warm-500/10 rounded-lg py-2">
                  <p class="text-xs font-bold text-warm-400">{{ currentPreset.diaper.dailyCount }}次</p>
                  <p class="text-[10px] text-warm-300 dark:text-warm-200">日换尿布</p>
                </div>
              </div>
              <div v-if="currentPreset.milestones.length" class="mt-3 pt-3 border-t border-cream-200/50 dark:border-warm-500/10">
                <p class="text-[11px] font-bold text-warm-400 dark:text-warm-100 mb-2">🎯 本月发育里程碑</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="m in currentPreset.milestones" :key="m"
                    class="text-[10px] px-2 py-1 bg-white/60 dark:bg-warm-500/10 rounded-full text-warm-400 dark:text-warm-200">
                    {{ m }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="step === 2">
          <div class="pt-4">
            <h2 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display mb-2">家庭成员</h2>
            <p class="text-sm text-warm-300 dark:text-warm-200 mb-6">创建你的家庭空间，可以邀请家人一起照护宝宝</p>

            <div class="space-y-5">
              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1.5 block">
                  <span class="inline-flex items-center gap-1.5">
                    <Home :size="12" />
                    家庭名称
                  </span>
                </label>
                <input
                  v-model="familyName"
                  type="text"
                  placeholder="给小家起个温馨的名字"
                  class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 placeholder-warm-200 dark:placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-peach-300 text-sm"
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1.5 block">
                  <span class="inline-flex items-center gap-1.5">
                    <Users :size="12" />
                    你的称呼
                  </span>
                </label>
                <div class="grid grid-cols-4 gap-2 mb-2">
                  <button
                    v-for="r in roleOptions"
                    :key="r"
                    type="button"
                    @click="r === '其他' ? (isCustomRole = true, userName = '') : (isCustomRole = false, userName = r)"
                    class="rounded-xl py-2.5 text-center font-semibold text-xs transition-all border-2"
                    :class="(r !== '其他' && userName === r) || (r === '其他' && isCustomRole)
                      ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400 text-mint-600 dark:text-mint-400'
                      : 'bg-white dark:bg-[#2a1f1a] border-cream-200 dark:border-warm-500/20 text-warm-300 dark:text-warm-200'"
                  >
                    {{ r }}
                  </button>
                </div>
                <input
                  v-if="isCustomRole"
                  v-model="userName"
                  type="text"
                  placeholder="请输入你的称呼"
                  class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 placeholder-warm-200 dark:placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-mint-300 text-sm mt-2"
                />
              </div>
            </div>

            <div class="mt-6 bg-gradient-to-r from-mint-50 to-cream-100 dark:from-mint-500/10 dark:to-cream-300/10 rounded-2xl px-5 py-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center shrink-0">
                  <Users :size="18" class="text-mint-500" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-1">一起照护更轻松</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200 leading-relaxed">完成设置后，可在「家庭」页面生成邀请码，邀请爸爸、奶奶等家人加入，共同记录宝宝成长</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="step === 3">
          <div class="pt-4">
            <h2 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display mb-2">偏好与提醒</h2>
            <p class="text-sm text-warm-300 dark:text-warm-200 mb-5">根据宝宝月龄自动推荐，随时可在设置中修改</p>

            <div class="space-y-3 mb-6">
              <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="flex items-center justify-between px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
                      <Bell :size="18" class="text-mint-500" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">提醒通知总开关</p>
                      <p class="text-[11px] text-warm-300 dark:text-warm-200">关闭后所有提醒将不再推送</p>
                    </div>
                  </div>
                  <button
                    @click="enableNotifications = !enableNotifications"
                    class="w-11 h-6 rounded-full transition-colors relative"
                    :class="enableNotifications ? 'bg-mint-400' : 'bg-cream-200'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                      :class="enableNotifications ? 'left-[22px]' : 'left-0.5'"
                    ></div>
                  </button>
                </div>
              </div>

              <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="flex items-center justify-between px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                      <Moon :size="18" class="text-peach-400" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">深色模式</p>
                      <p class="text-[11px] text-warm-300 dark:text-warm-200">夜间使用更舒适</p>
                    </div>
                  </div>
                  <button
                    @click="enableDarkMode = !enableDarkMode"
                    class="w-11 h-6 rounded-full transition-colors relative"
                    :class="enableDarkMode ? 'bg-peach-400' : 'bg-cream-200'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                      :class="enableDarkMode ? 'left-[22px]' : 'left-0.5'"
                    ></div>
                  </button>
                </div>
              </div>

              <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
                <div class="flex items-center justify-between px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center">
                      <Sparkles :size="18" class="text-warm-400" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">加载示例数据</p>
                      <p class="text-[11px] text-warm-300 dark:text-warm-200">预填近3天照护记录，快速体验功能</p>
                    </div>
                  </div>
                  <button
                    @click="loadSampleData = !loadSampleData"
                    class="w-11 h-6 rounded-full transition-colors relative"
                    :class="loadSampleData ? 'bg-peach-400' : 'bg-cream-200'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                      :class="loadSampleData ? 'left-[22px]' : 'left-0.5'"
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
                  <Bell :size="12" />
                  自定义提醒规则
                </p>
                <span class="text-[11px] text-warm-300 dark:text-warm-200">{{ reminderSummary.enabled }}/{{ reminderSummary.total }} 已开启</span>
              </div>
              <div class="space-y-2">
                <div
                  v-for="item in reminderItems"
                  :key="item.key"
                  class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      :class="{
                        'bg-peach-100 dark:bg-peach-500/20': item.color === 'peach',
                        'bg-mint-100 dark:bg-mint-500/20': item.color === 'mint',
                        'bg-cream-200 dark:bg-cream-300/20': item.color === 'warm',
                      }"
                    >
                      <component
                        :is="item.icon"
                        :size="14"
                        :class="{
                          'text-peach-400': item.color === 'peach',
                          'text-mint-500': item.color === 'mint',
                          'text-warm-400': item.color === 'warm',
                        }"
                      />
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-warm-500 dark:text-cream-100">{{ item.label }}</p>
                      <p class="text-[10px] text-warm-300 dark:text-warm-200">{{ item.desc }}</p>
                    </div>
                  </div>
                  <button
                    @click="reminderEnabled[item.key] = !reminderEnabled[item.key]"
                    class="w-10 h-5 rounded-full transition-colors relative shrink-0"
                    :class="reminderEnabled[item.key] ? 'bg-mint-400' : 'bg-cream-200'"
                    :disabled="!enableNotifications"
                  >
                    <div
                      class="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                      :class="reminderEnabled[item.key] ? 'left-[20px]' : 'left-0.5'"
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="step === 4">
          <div class="flex flex-col items-center text-center pt-6">
            <div class="w-24 h-24 rounded-3xl bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-5 shadow-lg shadow-mint-100 dark:shadow-mint-500/10">
              <Check :size="48" class="text-mint-500" />
            </div>
            <h1 class="text-2xl font-extrabold text-warm-500 dark:text-cream-100 font-display mb-3">
              {{ hasExistingData ? '完成设置' : '准备就绪！' }}
            </h1>
            <p class="text-warm-300 dark:text-warm-200 text-sm leading-relaxed max-w-xs mb-5">
              <template v-if="hasExistingData && keepExistingData">
                将保留你的现有数据，<br/>应用新的提醒和偏好设置
              </template>
              <template v-else>
                已为{{ babyName || '宝宝' }}定制{{ currentPreset.label }}照护方案，<br/>开始记录美好时光吧
              </template>
            </p>

            <div v-if="hasExistingData" class="w-full mb-5">
              <p class="text-xs font-bold text-warm-400 dark:text-warm-100 text-left mb-2.5">数据处理方式</p>
              <div class="space-y-2">
                <button
                  type="button"
                  @click="keepExistingData = true"
                  class="w-full text-left rounded-xl px-4 py-3 transition-all border-2 flex items-start gap-3"
                  :class="keepExistingData
                    ? 'bg-mint-50 dark:bg-mint-500/10 border-mint-400'
                    : 'bg-white dark:bg-[#2a1f1a] border-cream-200 dark:border-warm-500/20'"
                >
                  <div class="w-8 h-8 rounded-lg bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield :size="14" class="text-mint-500" />
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-warm-500 dark:text-cream-100 mb-0.5">保留现有数据（推荐）</p>
                    <p class="text-[10px] text-warm-300 dark:text-warm-200 leading-relaxed">
                      保留所有宝宝记录和历史数据，仅更新提醒和偏好设置，不会丢失任何数据
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                    :class="keepExistingData ? 'bg-mint-400 border-mint-400' : 'border-cream-300 dark:border-warm-500/30'"
                  >
                    <Check v-if="keepExistingData" :size="12" class="text-white" />
                  </div>
                </button>

                <button
                  type="button"
                  @click="keepExistingData = false"
                  class="w-full text-left rounded-xl px-4 py-3 transition-all border-2 flex items-start gap-3"
                  :class="!keepExistingData
                    ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400'
                    : 'bg-white dark:bg-[#2a1f1a] border-cream-200 dark:border-warm-500/20'"
                >
                  <div class="w-8 h-8 rounded-lg bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw :size="14" class="text-peach-400" />
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-warm-500 dark:text-cream-100 mb-0.5">重置为新配置</p>
                    <p class="text-[10px] text-warm-300 dark:text-warm-200 leading-relaxed">
                      清空所有现有数据，按当前配置重新开始。<span class="text-peach-500 font-semibold">此操作不可恢复</span>
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                    :class="!keepExistingData ? 'bg-peach-400 border-peach-400' : 'border-cream-300 dark:border-warm-500/30'"
                  >
                    <Check v-if="!keepExistingData" :size="12" class="text-white" />
                  </div>
                </button>
              </div>
            </div>

            <div v-if="!hasExistingData || !keepExistingData" class="w-full space-y-2.5 mb-5">
              <div class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm">
                <div class="w-8 h-8 rounded-lg bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
                  <Baby :size="14" class="text-peach-400" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ babyName || '宝宝' }} · {{ babyGender === 'male' ? '👦' : '👧' }}</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ ageLabel || '未设置' }} · {{ currentPreset.label }}</p>
                </div>
                <Check :size="16" class="text-mint-500" />
              </div>

              <div class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm">
                <div class="w-8 h-8 rounded-lg bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center shrink-0">
                  <Home :size="14" class="text-mint-500" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ familyName || '我们的小家' }}</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ userName || '妈妈' }} · 创建者</p>
                </div>
                <Check :size="16" class="text-mint-500" />
              </div>

              <div class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm">
                <div class="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-500/20 flex items-center justify-center shrink-0">
                  <Bell :size="14" class="text-warm-400" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">提醒规则</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ enableNotifications ? `已开启 ${reminderSummary.enabled} 项` : '已关闭' }} · 深色模式{{ enableDarkMode ? '开' : '关' }}</p>
                </div>
                <Check :size="16" class="text-mint-500" />
              </div>

              <div class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm">
                <div class="w-8 h-8 rounded-lg bg-cream-200 dark:bg-cream-300/20 flex items-center justify-center shrink-0">
                  <Sparkles :size="14" class="text-warm-400" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">示例数据</p>
                  <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ loadSampleData ? '已加载近3天记录 + 疫苗/体检计划' : '空白开始' }}</p>
                </div>
                <Check :size="16" class="text-mint-500" />
              </div>
            </div>

            <div class="bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl px-5 py-3.5 w-full">
              <p class="text-[11px] text-warm-300 dark:text-warm-200">
                💡 所有设置随时可在「设置」中修改<br/>
                家庭成员可在「家庭」页面邀请添加
              </p>
            </div>
          </div>
        </template>

      </div>

      <div class="mt-auto pt-6 space-y-3">
        <button
          v-if="step < totalSteps - 1"
          @click="nextStep"
          :disabled="!canNext"
          class="w-full bg-peach-400 hover:bg-peach-500 disabled:bg-cream-200 disabled:text-warm-300 text-white disabled:dark:bg-warm-500/20 disabled:dark:text-warm-300 rounded-xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {{ step === 0 ? '开始设置' : '下一步' }}
          <ChevronRight :size="16" />
        </button>

        <button
          v-if="step === totalSteps - 1"
          @click="handleFinish"
          class="w-full bg-mint-400 hover:bg-mint-500 text-white rounded-xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-mint-200 dark:shadow-mint-500/20"
        >
          <Heart :size="16" />
          开始照护之旅
        </button>

        <button
          v-if="step > 0"
          @click="prevStep"
          class="w-full text-warm-300 dark:text-warm-200 text-sm font-semibold py-2 flex items-center justify-center gap-1 hover:text-warm-400 dark:hover:text-warm-100 transition-colors"
        >
          <ChevronLeft :size="14" />
          上一步
        </button>
      </div>
    </div>
  </div>
</template>
