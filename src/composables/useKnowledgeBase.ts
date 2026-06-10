import { computed, ref } from 'vue'
import type { KnowledgeEntry, KnowledgeCategory, CareGuide, AgeRange } from '@/types'
import { knowledgeEntries } from '@/data/knowledgeBase'
import { babies, currentBabyId } from './useSharedStore'

export function useKnowledgeBase() {
  const currentBaby = computed(() =>
    babies.value.find(b => b.id === currentBabyId.value)
  )

  const babyAgeMonths = computed(() => {
    if (!currentBaby.value) return 0
    const birth = new Date(currentBaby.value.birthDate)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
    return Math.max(0, months)
  })

  const allAgeRanges: AgeRange[] = knowledgeEntries.map(e => e.ageRange)

  const selectedMonth = ref<number | null>(null)

  const activeMonth = computed(() =>
    selectedMonth.value ?? babyAgeMonths.value
  )

  const currentEntry = computed<KnowledgeEntry | undefined>(() =>
    knowledgeEntries.find(
      e => activeMonth.value >= e.ageRange.minMonth && activeMonth.value <= e.ageRange.maxMonth
    )
  )

  const currentAgeLabel = computed(() =>
    currentEntry.value?.ageRange.label ?? `${activeMonth.value}个月`
  )

  const activeCategory = ref<KnowledgeCategory | 'all'>('all')

  const currentGuides = computed(() => {
    const entry = currentEntry.value
    if (!entry) return [] as CareGuide[]
    const cat = activeCategory.value
    if (cat === 'all') return entry.guides
    return entry.guides.filter(g => g.category === cat)
  })

  function selectMonth(month: number) {
    selectedMonth.value = month
  }

  function resetToBabyAge() {
    selectedMonth.value = null
  }

  function getEntryForMonth(month: number): KnowledgeEntry | undefined {
    return knowledgeEntries.find(
      e => month >= e.ageRange.minMonth && month <= e.ageRange.maxMonth
    )
  }

  const categoryGuideCounts = computed((): Record<KnowledgeCategory | 'all', number> => {
    const entry = currentEntry.value
    if (!entry) {
      return { all: 0, feeding: 0, sleep: 0, care: 0, milestone: 0 }
    }
    const guides = entry.guides
    return {
      all: guides.length,
      feeding: guides.filter(g => g.category === 'feeding').length,
      sleep: guides.filter(g => g.category === 'sleep').length,
      care: guides.filter(g => g.category === 'care').length,
      milestone: guides.filter(g => g.category === 'milestone').length,
    }
  })

  return {
    babyAgeMonths,
    activeMonth,
    allAgeRanges,
    currentEntry,
    currentAgeLabel,
    activeCategory,
    currentGuides,
    categoryGuideCounts,
    selectedMonth,
    selectMonth,
    resetToBabyAge,
    getEntryForMonth,
  }
}
