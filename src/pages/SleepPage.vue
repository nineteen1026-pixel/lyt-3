<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Moon, Check, Eye } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'

const router = useRouter()
const { addSleep, canAddRecord } = useBabyCare()

const quality = ref<'deep' | 'light' | 'fussy'>('deep')
const note = ref('')
const saved = ref(false)

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
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}

const qualityOptions = [
  { value: 'deep' as const, emoji: '😴', label: '安睡' },
  { value: 'light' as const, emoji: '😊', label: '浅睡' },
  { value: 'fussy' as const, emoji: '😟', label: '烦躁' },
]
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

    <div v-if="!canAddRecord" class="flex flex-col items-center justify-center py-20">
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
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
        type="submit"
        :disabled="sleepDuration <= 0"
        class="w-full bg-mint-400 hover:bg-mint-500 disabled:opacity-40 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-mint-200 dark:shadow-mint-500/20"
      >
        保存记录
      </button>
    </form>
  </div>
</template>
