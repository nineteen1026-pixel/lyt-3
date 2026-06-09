<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Milk, Check, Eye } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'

const router = useRouter()
const { addFeeding, canAddRecord, needsJoin } = useBabyCare()

const feedingType = ref<'breast' | 'formula'>('breast')
const duration = ref(15)
const amount = ref(90)
const note = ref('')
const saved = ref(false)

function nowISO() {
  return new Date().toISOString().slice(0, 16)
}

const timestamp = ref(nowISO())

function handleSubmit() {
  addFeeding({
    timestamp: new Date(timestamp.value).toISOString(),
    feedingType: feedingType.value,
    duration: feedingType.value === 'breast' ? duration.value : 0,
    amount: feedingType.value === 'formula' ? amount.value : 0,
    note: note.value,
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Milk :size="20" class="text-peach-400" />
        喂奶记录
      </h1>
    </header>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">你尚未成为家庭成员</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-peach-400 text-white text-sm font-bold">前往加入</button>
    </div>

    <div v-else-if="!canAddRecord" class="flex flex-col items-center justify-center py-20">
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">喂奶类型</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="feedingType = 'breast'"
            class="rounded-2xl py-4 text-center font-bold text-sm transition-all border-2"
            :class="feedingType === 'breast'
              ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400 shadow-sm'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
          >
            🤱 母乳
          </button>
          <button
            type="button"
            @click="feedingType = 'formula'"
            class="rounded-2xl py-4 text-center font-bold text-sm transition-all border-2"
            :class="feedingType === 'formula'
              ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400 shadow-sm'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
          >
            🍼 配方奶
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

      <div v-if="feedingType === 'breast'">
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">持续时长: {{ duration }} 分钟</label>
        <input v-model.number="duration" type="range" min="1" max="60" class="w-full" />
        <div class="flex justify-between text-[10px] text-warm-300 dark:text-warm-200 mt-1">
          <span>1min</span><span>60min</span>
        </div>
      </div>

      <div v-if="feedingType === 'formula'">
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">奶量 (ml)</label>
        <input
          v-model.number="amount"
          type="number"
          min="0"
          max="500"
          step="5"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          placeholder="输入奶量"
        />
        <div class="flex gap-2 mt-2">
          <button v-for="v in [60, 90, 120, 150]" :key="v" type="button" @click="amount = v"
            class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
            :class="amount === v
              ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
              : 'bg-cream-100 dark:bg-warm-500/20 text-warm-300 dark:text-warm-200'"
          >{{ v }}ml</button>
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
        type="submit"
        class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-peach-200 dark:shadow-peach-500/20"
      >
        保存记录
      </button>
    </form>
  </div>
</template>
