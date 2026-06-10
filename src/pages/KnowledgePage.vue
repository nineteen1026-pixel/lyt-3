<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, BookOpen, Milk, Moon, Heart, Star, ChevronRight,
  Lightbulb, AlertTriangle, ChevronDown, Baby,
} from 'lucide-vue-next'
import { useKnowledgeBase } from '@/composables/useKnowledgeBase'
import { knowledgeEntries } from '@/data/knowledgeBase'
import type { KnowledgeCategory, CareGuide } from '@/types'
import { KNOWLEDGE_CATEGORY_LABELS } from '@/types'

const router = useRouter()
const {
  babyAgeMonths, activeMonth, allAgeRanges,
  currentEntry, currentAgeLabel, activeCategory,
  currentGuides, categoryGuideCounts,
  selectedMonth, selectMonth, resetToBabyAge,
} = useKnowledgeBase()

const showAgePicker = ref(false)
const expandedGuide = ref<string | null>(null)

const categoryTabs: { key: KnowledgeCategory | 'all'; label: string; icon: typeof Milk }[] = [
  { key: 'all', label: '全部', icon: BookOpen },
  { key: 'feeding', label: '喂养', icon: Milk },
  { key: 'sleep', label: '睡眠', icon: Moon },
  { key: 'care', label: '护理', icon: Heart },
  { key: 'milestone', label: '里程碑', icon: Star },
]

function getCategoryIcon(category: KnowledgeCategory) {
  if (category === 'feeding') return Milk
  if (category === 'sleep') return Moon
  if (category === 'care') return Heart
  return Star
}

function getCategoryColor(category: KnowledgeCategory) {
  if (category === 'feeding') return {
    bg: 'bg-peach-100 dark:bg-peach-500/20',
    text: 'text-peach-500 dark:text-peach-400',
    border: 'border-peach-200 dark:border-peach-500/30',
    badge: 'bg-peach-50 dark:bg-peach-500/10 text-peach-500',
  }
  if (category === 'sleep') return {
    bg: 'bg-mint-100 dark:bg-mint-500/20',
    text: 'text-mint-500 dark:text-mint-400',
    border: 'border-mint-200 dark:border-mint-500/30',
    badge: 'bg-mint-50 dark:bg-mint-500/10 text-mint-500',
  }
  if (category === 'care') return {
    bg: 'bg-rose-100 dark:bg-rose-500/20',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/30',
    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500',
  }
  return {
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
  }
}

function toggleGuide(id: string) {
  expandedGuide.value = expandedGuide.value === id ? null : id
}

function handleSelectMonth(month: number) {
  selectMonth(month)
  showAgePicker.value = false
}

const ageRanges = knowledgeEntries.map(e => e.ageRange)
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <BookOpen :size="20" class="text-peach-400" />
        知识库与照护指南
      </h1>
    </header>

    <section class="mb-4">
      <button
        @click="showAgePicker = !showAgePicker"
        class="w-full flex items-center gap-3 bg-gradient-to-r from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl px-4 py-3 shadow-sm"
      >
        <div class="w-10 h-10 rounded-xl bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
          <Baby :size="20" class="text-peach-400" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">
            {{ currentAgeLabel }}
            <span v-if="selectedMonth !== null" class="text-peach-400">（宝宝实际{{ babyAgeMonths }}个月）</span>
          </p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">点击切换月龄查看对应照护指南</p>
        </div>
        <ChevronDown :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="showAgePicker ? 'rotate-180' : ''" />
      </button>

      <div v-if="showAgePicker"
        class="mt-2 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-lg border border-cream-200 dark:border-warm-500/20 overflow-hidden">
        <div class="p-3 grid grid-cols-2 gap-2">
          <button
            v-for="range in ageRanges"
            :key="range.label"
            @click="handleSelectMonth(range.minMonth)"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
            :class="activeMonth >= range.minMonth && activeMonth <= range.maxMonth
              ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
              : 'bg-cream-50 dark:bg-warm-500/10 text-warm-400 dark:text-warm-100 hover:bg-cream-100 dark:hover:bg-warm-500/20'"
          >
            <Baby :size="14" />
            {{ range.label }}
          </button>
        </div>
        <button
          v-if="selectedMonth !== null"
          @click="resetToBabyAge(); showAgePicker = false"
          class="w-full py-2.5 border-t border-cream-100 dark:border-warm-500/10 text-xs font-bold text-peach-400 hover:bg-cream-50 dark:hover:bg-warm-500/10"
        >
          恢复为宝宝实际月龄（{{ babyAgeMonths }}个月）
        </button>
      </div>
    </section>

    <section class="mb-4">
      <div class="flex gap-1 bg-cream-100 dark:bg-warm-500/10 rounded-xl p-1 overflow-x-auto">
        <button
          v-for="tab in categoryTabs"
          :key="tab.key"
          @click="activeCategory = tab.key"
          class="flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
          :class="activeCategory === tab.key
            ? 'bg-white dark:bg-[#2a1f1a] text-peach-500 shadow-sm'
            : 'text-warm-300 dark:text-warm-200'"
        >
          <component :is="tab.icon" :size="12" />
          {{ tab.label }}
          <span v-if="categoryGuideCounts[tab.key] > 0" class="text-[10px] opacity-60">{{ categoryGuideCounts[tab.key] }}</span>
        </button>
      </div>
    </section>

    <section v-if="!currentEntry" class="text-center py-16">
      <BookOpen :size="48" class="mx-auto text-warm-300 dark:text-warm-200 mb-3" />
      <p class="text-sm text-warm-300 dark:text-warm-200">暂无对应月龄的照护指南</p>
    </section>

    <section v-else class="space-y-3 pb-24">
      <div
        v-for="guide in currentGuides"
        :key="guide.id"
        class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm overflow-hidden border"
        :class="getCategoryColor(guide.category).border"
      >
        <button
          @click="toggleGuide(guide.id)"
          class="w-full flex items-start gap-3 p-4 text-left"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            :class="getCategoryColor(guide.category).bg"
          >
            <component :is="getCategoryIcon(guide.category)" :size="20" :class="getCategoryColor(guide.category).text" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md" :class="getCategoryColor(guide.category).badge">
                {{ KNOWLEDGE_CATEGORY_LABELS[guide.category] }}
              </span>
            </div>
            <p class="text-sm font-bold text-warm-500 dark:text-cream-100 mb-0.5">{{ guide.title }}</p>
            <p class="text-xs text-warm-300 dark:text-warm-200 line-clamp-2">{{ guide.summary }}</p>
          </div>
          <ChevronRight
            :size="16"
            class="text-warm-300 dark:text-warm-200 shrink-0 mt-3 transition-transform"
            :class="expandedGuide === guide.id ? 'rotate-90' : ''"
          />
        </button>

        <div v-if="expandedGuide === guide.id" class="px-4 pb-4">
          <div class="border-t border-cream-100 dark:border-warm-500/10 pt-3">
            <p class="text-sm text-warm-400 dark:text-warm-100 leading-relaxed mb-4">{{ guide.content }}</p>

            <div class="mb-3">
              <div class="flex items-center gap-1.5 mb-2">
                <Lightbulb :size="14" class="text-mint-500" />
                <span class="text-xs font-bold text-mint-500">实用建议</span>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="(tip, i) in guide.tips"
                  :key="i"
                  class="flex items-start gap-2 bg-mint-50 dark:bg-mint-500/10 rounded-xl px-3 py-2"
                >
                  <span class="text-[10px] font-bold text-mint-500 shrink-0 mt-0.5">{{ i + 1 }}</span>
                  <span class="text-xs text-warm-400 dark:text-warm-100">{{ tip }}</span>
                </div>
              </div>
            </div>

            <div v-if="guide.warnings && guide.warnings.length > 0">
              <div class="flex items-center gap-1.5 mb-2">
                <AlertTriangle :size="14" class="text-amber-500" />
                <span class="text-xs font-bold text-amber-500">注意事项</span>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="(warning, i) in guide.warnings"
                  :key="i"
                  class="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2"
                >
                  <span class="text-[10px] shrink-0 mt-0.5">⚠️</span>
                  <span class="text-xs text-warm-400 dark:text-warm-100">{{ warning }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
