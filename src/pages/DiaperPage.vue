<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Droplets, Check, Eye } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'

const router = useRouter()
const { addDiaper, canAddRecord } = useBabyCare()

const diaperType = ref<'wet' | 'dirty' | 'mixed'>('wet')
const note = ref('')
const saved = ref(false)

function nowISO() {
  return new Date().toISOString().slice(0, 16)
}

const timestamp = ref(nowISO())

function handleSubmit() {
  addDiaper({
    timestamp: new Date(timestamp.value).toISOString(),
    diaperType: diaperType.value,
    note: note.value,
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}

const typeOptions = [
  { value: 'wet' as const, emoji: '💧', label: '湿' },
  { value: 'dirty' as const, emoji: '💩', label: '便' },
  { value: 'mixed' as const, emoji: '🔄', label: '混合' },
]
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Droplets :size="20" class="text-warm-400" />
        尿布记录
      </h1>
    </header>

    <div v-if="!canAddRecord" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-warm-300 dark:text-warm-200" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">无操作权限</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">当前角色仅可查看记录</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-warm-300 text-white text-sm font-bold">前往家庭管理</button>
    </div>

    <div v-else-if="saved" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-4 animate-bounce">
        <Check :size="32" class="text-mint-500" />
      </div>
      <p class="text-lg font-bold text-warm-500 dark:text-cream-100">记录成功！</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">尿布类型</label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            @click="diaperType = opt.value"
            class="rounded-2xl py-4 text-center font-bold text-sm transition-all border-2"
            :class="diaperType === opt.value
              ? 'bg-cream-100 dark:bg-cream-300/10 border-warm-300 text-warm-500 dark:text-cream-300 shadow-sm'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
          >
            <span class="text-2xl block mb-1">{{ opt.emoji }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">时间</label>
        <input
          v-model="timestamp"
          type="datetime-local"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-warm-200"
        />
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">备注</label>
        <textarea
          v-model="note"
          rows="2"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-warm-200 resize-none"
          placeholder="可选备注..."
        ></textarea>
      </div>

      <button
        type="submit"
        class="w-full bg-warm-300 hover:bg-warm-400 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-warm-100 dark:shadow-warm-500/20"
      >
        保存记录
      </button>
    </form>
  </div>
</template>
