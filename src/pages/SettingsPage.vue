<script setup lang="ts">
import { ref } from 'vue'
import { Settings, Baby, Moon, Bell, Download, Check } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useTheme } from '@/composables/useTheme'

const { baby, settings, updateBaby, updateSettings, feedings, sleeps, diapers } = useBabyCare()
const { theme, toggleTheme, isDark } = useTheme()

const editName = ref(baby.value.name)
const editBirthDate = ref(baby.value.birthDate)
const editGender = ref(baby.value.gender)
const saved = ref(false)

function handleSaveBaby() {
  updateBaby({
    name: editName.value,
    birthDate: editBirthDate.value,
    gender: editGender.value,
  })
  saved.value = true
  setTimeout(() => { saved.value = false }, 1500)
}

function handleToggleDark() {
  toggleTheme()
  updateSettings({ darkMode: !settings.value.darkMode })
}

function handleToggleNotif() {
  updateSettings({ notifications: !settings.value.notifications })
}

function handleExport() {
  const data = {
    baby: baby.value,
    feedings: feedings.value,
    sleeps: sleeps.value,
    diapers: diapers.value,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `baby-care-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-6">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Settings :size="20" class="text-warm-300" />
        设置中心
      </h1>
    </header>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Baby :size="14" /> 宝宝信息
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">姓名</label>
          <input
            v-model="editName"
            type="text"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">出生日期</label>
          <input
            v-model="editBirthDate"
            type="date"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">性别</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="editGender = 'male'"
              class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
              :class="editGender === 'male'
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
            >
              👦 男孩
            </button>
            <button
              type="button"
              @click="editGender = 'female'"
              class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
              :class="editGender === 'female'
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
            >
              👧 女孩
            </button>
          </div>
        </div>
        <button
          @click="handleSaveBaby"
          class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Check v-if="saved" :size="16" />
          {{ saved ? '已保存' : '保存信息' }}
        </button>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Moon :size="14" /> 偏好设置
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm divide-y divide-cream-100 dark:divide-warm-500/10">
        <div class="flex items-center justify-between px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">深色模式</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">切换深色/浅色主题</p>
          </div>
          <button
            @click="handleToggleDark"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isDark ? 'bg-peach-400' : 'bg-cream-200'"
          >
            <div
              class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              :class="isDark ? 'left-[22px]' : 'left-0.5'"
            ></div>
          </button>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">提醒通知</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">喂奶/换尿布提醒</p>
          </div>
          <button
            @click="handleToggleNotif"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="settings.notifications ? 'bg-mint-400' : 'bg-cream-200'"
          >
            <div
              class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              :class="settings.notifications ? 'left-[22px]' : 'left-0.5'"
            ></div>
          </button>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Download :size="14" /> 数据管理
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
        <button
          @click="handleExport"
          class="w-full flex items-center justify-between px-4 py-3.5 text-left"
        >
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">导出数据</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">导出为 JSON 文件</p>
          </div>
          <Download :size="16" class="text-warm-300 dark:text-warm-200" />
        </button>
      </div>
    </section>

    <section class="text-center py-4">
      <p class="text-[11px] text-warm-200 dark:text-warm-300">宝宝照护记录 v1.0</p>
      <p class="text-[10px] text-warm-200 dark:text-warm-300 mt-0.5">用爱记录每一天 ❤️</p>
    </section>
  </div>
</template>
