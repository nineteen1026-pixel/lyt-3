<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Home, Clock, Heart, BookOpen, CalendarDays } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'dashboard', path: '/', icon: Home, label: '首页' },
  { name: 'care-calendar', path: '/care-calendar', icon: CalendarDays, label: '日历' },
  { name: 'health', path: '/health', icon: Heart, label: '健康' },
  { name: 'history', path: '/history', icon: Clock, label: '记录' },
  { name: 'knowledge', path: '/knowledge', icon: BookOpen, label: '指南' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#2a1f1a]/90 backdrop-blur-lg border-t border-cream-200 dark:border-warm-500/20">
    <div class="max-w-lg mx-auto flex items-center justify-around h-16">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="router.push(tab.path)"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
        :class="isActive(tab.path)
          ? 'text-peach-400 dark:text-peach-400'
          : 'text-warm-300 dark:text-warm-200 hover:text-warm-400'"
      >
        <component :is="tab.icon" :size="22" :stroke-width="isActive(tab.path) ? 2.5 : 1.8" />
        <span class="text-[10px] font-semibold">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
