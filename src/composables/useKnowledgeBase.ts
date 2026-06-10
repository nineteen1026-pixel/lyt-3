import { computed, ref } from 'vue'
import type { KnowledgeEntry, KnowledgeCategory, CareGuide, AgeRange, GuideInsight, GuideWithRelevance } from '@/types'
import { knowledgeEntries } from '@/data/knowledgeBase'
import { babies, currentBabyId, feedings, sleeps, diapers, growths } from './useSharedStore'

const RECENT_DAYS = 7
const MS_PER_DAY = 86400000

function getRecentRecords<T extends { babyId: string }>(records: T[], babyId: string, days: number): T[] {
  const cutoff = Date.now() - days * MS_PER_DAY
  return records.filter(r => {
    if (r.babyId !== babyId) return false
    const rec = r as unknown as Record<string, unknown>
    const ts = 'startTime' in rec ? rec.startTime : rec.timestamp
    return new Date(ts as string).getTime() >= cutoff
  })
}

interface AgeNorms {
  minFeedingsPerDay: number
  maxFeedingsPerDay: number
  minSleepHoursPerDay: number
  maxSleepHoursPerDay: number
  minDiapersPerDay: number
  minWeightGainKgPerMonth: number
  expectedFeedingType: 'breast' | 'formula' | 'mixed' | 'solids'
}

function getAgeNorms(months: number): AgeNorms {
  if (months <= 1) return { minFeedingsPerDay: 8, maxFeedingsPerDay: 12, minSleepHoursPerDay: 16, maxSleepHoursPerDay: 18, minDiapersPerDay: 4, minWeightGainKgPerMonth: 0.6, expectedFeedingType: 'breast' }
  if (months <= 3) return { minFeedingsPerDay: 6, maxFeedingsPerDay: 8, minSleepHoursPerDay: 15, maxSleepHoursPerDay: 16, minDiapersPerDay: 4, minWeightGainKgPerMonth: 0.7, expectedFeedingType: 'mixed' }
  if (months <= 6) return { minFeedingsPerDay: 5, maxFeedingsPerDay: 6, minSleepHoursPerDay: 14, maxSleepHoursPerDay: 15, minDiapersPerDay: 3, minWeightGainKgPerMonth: 0.5, expectedFeedingType: 'mixed' }
  if (months <= 9) return { minFeedingsPerDay: 4, maxFeedingsPerDay: 5, minSleepHoursPerDay: 13, maxSleepHoursPerDay: 14, minDiapersPerDay: 3, minWeightGainKgPerMonth: 0.3, expectedFeedingType: 'solids' }
  if (months <= 12) return { minFeedingsPerDay: 3, maxFeedingsPerDay: 5, minSleepHoursPerDay: 12, maxSleepHoursPerDay: 14, minDiapersPerDay: 2, minWeightGainKgPerMonth: 0.25, expectedFeedingType: 'solids' }
  if (months <= 18) return { minFeedingsPerDay: 3, maxFeedingsPerDay: 4, minSleepHoursPerDay: 11, maxSleepHoursPerDay: 12, minDiapersPerDay: 2, minWeightGainKgPerMonth: 0.2, expectedFeedingType: 'solids' }
  return { minFeedingsPerDay: 3, maxFeedingsPerDay: 4, minSleepHoursPerDay: 10, maxSleepHoursPerDay: 12, minDiapersPerDay: 1, minWeightGainKgPerMonth: 0.15, expectedFeedingType: 'solids' }
}

let insightIdCounter = 0
function makeInsight(category: KnowledgeCategory, level: GuideInsight['level'], title: string, description: string, relatedGuideId: string): GuideInsight {
  insightIdCounter++
  return { id: `insight-${insightIdCounter}`, category, level, title, description, relatedGuideId }
}

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

  const recentFeedings = computed(() =>
    getRecentRecords(feedings.value, currentBabyId.value, RECENT_DAYS)
  )
  const recentSleeps = computed(() =>
    getRecentRecords(sleeps.value, currentBabyId.value, RECENT_DAYS)
  )
  const recentDiapers = computed(() =>
    getRecentRecords(diapers.value, currentBabyId.value, RECENT_DAYS)
  )
  const currentGrowths = computed(() =>
    growths.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  )

  const insights = computed<GuideInsight[]>(() => {
    if (!currentBaby.value) return []
    const norms = getAgeNorms(activeMonth.value)
    const result: GuideInsight[] = []
    const entry = currentEntry.value
    if (!entry) return result

    const daysWithData = Math.max(1, RECENT_DAYS)
    const avgFeedingsPerDay = recentFeedings.value.length / daysWithData
    const avgSleepMinPerDay = recentSleeps.value.reduce((acc, s) => {
      return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000
    }, 0) / daysWithData
    const avgSleepHoursPerDay = avgSleepMinPerDay / 60
    const avgDiapersPerDay = recentDiapers.value.length / daysWithData
    const fussySleepRatio = recentSleeps.value.length > 0
      ? recentSleeps.value.filter(s => s.quality === 'fussy').length / recentSleeps.value.length
      : 0
    const breastRatio = recentFeedings.value.length > 0
      ? recentFeedings.value.filter(f => f.feedingType === 'breast').length / recentFeedings.value.length
      : 0
    const formulaAvgAmount = recentFeedings.value.filter(f => f.feedingType === 'formula' && f.amount > 0).length > 0
      ? recentFeedings.value.filter(f => f.feedingType === 'formula' && f.amount > 0).reduce((a, f) => a + f.amount, 0) / recentFeedings.value.filter(f => f.feedingType === 'formula' && f.amount > 0).length
      : 0

    const feedingGuide = entry.guides.find(g => g.category === 'feeding')
    const sleepGuide = entry.guides.find(g => g.category === 'sleep')
    const careGuide = entry.guides.find(g => g.category === 'care')

    if (avgFeedingsPerDay < norms.minFeedingsPerDay * 0.7) {
      result.push(makeInsight('feeding', 'danger', '喂养次数明显不足',
        `近${RECENT_DAYS}天日均${avgFeedingsPerDay.toFixed(1)}次，低于月龄推荐${norms.minFeedingsPerDay}次`,
        feedingGuide?.id ?? ''))
    } else if (avgFeedingsPerDay < norms.minFeedingsPerDay * 0.9) {
      result.push(makeInsight('feeding', 'warning', '喂养次数偏少',
        `近${RECENT_DAYS}天日均${avgFeedingsPerDay.toFixed(1)}次，略低于推荐${norms.minFeedingsPerDay}次`,
        feedingGuide?.id ?? ''))
    }

    if (avgFeedingsPerDay > norms.maxFeedingsPerDay * 1.3) {
      result.push(makeInsight('feeding', 'warning', '喂养过于频繁',
        `近${RECENT_DAYS}天日均${avgFeedingsPerDay.toFixed(1)}次，高于月龄推荐上限${norms.maxFeedingsPerDay}次`,
        feedingGuide?.id ?? ''))
    }

    if (activeMonth.value >= 6 && breastRatio > 0.8 && avgFeedingsPerDay > 0) {
      result.push(makeInsight('feeding', 'info', '可考虑引入辅食',
        '宝宝已满6个月，母乳比例较高，建议逐步引入辅食补充铁等营养素',
        feedingGuide?.id ?? ''))
    }

    if (formulaAvgAmount > 0 && activeMonth.value >= 6 && formulaAvgAmount > 210) {
      result.push(makeInsight('feeding', 'warning', '单次配方奶量偏大',
        `近${RECENT_DAYS}天配方奶均量${Math.round(formulaAvgAmount)}ml，可能需要增加辅食`,
        feedingGuide?.id ?? ''))
    }

    if (avgSleepHoursPerDay < norms.minSleepHoursPerDay * 0.8) {
      result.push(makeInsight('sleep', 'danger', '睡眠严重不足',
        `近${RECENT_DAYS}天日均睡眠${avgSleepHoursPerDay.toFixed(1)}h，低于推荐${norms.minSleepHoursPerDay}h`,
        sleepGuide?.id ?? ''))
    } else if (avgSleepHoursPerDay < norms.minSleepHoursPerDay * 0.95) {
      result.push(makeInsight('sleep', 'warning', '睡眠时间偏少',
        `近${RECENT_DAYS}天日均睡眠${avgSleepHoursPerDay.toFixed(1)}h，略低于推荐${norms.minSleepHoursPerDay}h`,
        sleepGuide?.id ?? ''))
    }

    if (fussySleepRatio > 0.4 && recentSleeps.value.length >= 3) {
      result.push(makeInsight('sleep', 'warning', '睡眠质量较差',
        `烦躁睡眠占比${Math.round(fussySleepRatio * 100)}%，可能存在不适或睡眠环境问题`,
        sleepGuide?.id ?? ''))
    }

    if (avgDiapersPerDay < norms.minDiapersPerDay * 0.6) {
      result.push(makeInsight('care', 'danger', '尿布更换次数过少',
        `近${RECENT_DAYS}天日均${avgDiapersPerDay.toFixed(1)}次，可能提示摄入不足或脱水`,
        careGuide?.id ?? ''))
    } else if (avgDiapersPerDay < norms.minDiapersPerDay * 0.8) {
      result.push(makeInsight('care', 'warning', '尿布更换次数偏少',
        `近${RECENT_DAYS}天日均${avgDiapersPerDay.toFixed(1)}次，需关注宝宝摄入情况`,
        careGuide?.id ?? ''))
    }

    const growthData = currentGrowths.value
    if (growthData.length >= 2) {
      const latest = growthData[growthData.length - 1]
      const prev = growthData[growthData.length - 2]
      const daysDiff = (new Date(latest.timestamp).getTime() - new Date(prev.timestamp).getTime()) / MS_PER_DAY
      if (daysDiff > 0) {
        const monthlyGain = (latest.weight - prev.weight) / daysDiff * 30
        if (monthlyGain < norms.minWeightGainKgPerMonth * 0.5) {
          result.push(makeInsight('milestone', 'danger', '体重增长缓慢',
            `近${Math.round(daysDiff)}天增重${(latest.weight - prev.weight).toFixed(2)}kg，月化增长率偏低`,
            entry.guides.find(g => g.category === 'milestone')?.id ?? ''))
        } else if (monthlyGain < norms.minWeightGainKgPerMonth * 0.8) {
          result.push(makeInsight('milestone', 'warning', '体重增长偏慢',
            `近${Math.round(daysDiff)}天增重${(latest.weight - prev.weight).toFixed(2)}kg，略低于预期`,
            entry.guides.find(g => g.category === 'milestone')?.id ?? ''))
        }
      }
    }

    return result
  })

  const guidesWithRelevance = computed<GuideWithRelevance[]>(() => {
    const entry = currentEntry.value
    if (!entry) return []

    const insightMap = new Map<string, GuideInsight[]>()
    for (const ins of insights.value) {
      const existing = insightMap.get(ins.relatedGuideId) ?? []
      existing.push(ins)
      insightMap.set(ins.relatedGuideId, existing)
    }

    const result: GuideWithRelevance[] = entry.guides.map(guide => {
      const relatedInsights = insightMap.get(guide.id) ?? []
      const maxLevel = relatedInsights.reduce((max, ins) => {
        const order = { info: 0, warning: 1, danger: 2 }
        return order[ins.level] > order[max] ? ins.level : max
      }, 'info' as GuideInsight['level'])

      const priorityMap = { info: 1, warning: 2, danger: 3 }
      let priority = relatedInsights.length > 0
        ? priorityMap[maxLevel] * 10 + relatedInsights.length
        : 0

      if (relatedInsights.length === 0) {
        if (guide.category === 'feeding') priority = -1
        else if (guide.category === 'sleep') priority = -2
        else if (guide.category === 'care') priority = -3
        else priority = -4
      }

      const highlightedTipIndices: number[] = []
      if (relatedInsights.length > 0) {
        guide.tips.forEach((tip, i) => {
          const tipLower = tip.toLowerCase()
          for (const ins of relatedInsights) {
            const keywords = ins.title.split(/[，、\s]/).filter(w => w.length >= 2)
            for (const kw of keywords) {
              if (tipLower.includes(kw.toLowerCase())) {
                if (!highlightedTipIndices.includes(i)) highlightedTipIndices.push(i)
                break
              }
            }
          }
        })
      }

      return { guide, priority, insights: relatedInsights, highlightedTipIndices }
    })

    result.sort((a, b) => b.priority - a.priority)
    return result
  })

  const currentGuides = computed(() => {
    const cat = activeCategory.value
    if (cat === 'all') return guidesWithRelevance.value
    return guidesWithRelevance.value.filter(g => g.guide.category === cat)
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

  const categoryInsightCounts = computed((): Record<KnowledgeCategory | 'all', number> => {
    const ins = insights.value
    return {
      all: ins.length,
      feeding: ins.filter(i => i.category === 'feeding').length,
      sleep: ins.filter(i => i.category === 'sleep').length,
      care: ins.filter(i => i.category === 'care').length,
      milestone: ins.filter(i => i.category === 'milestone').length,
    }
  })

  const dangerCount = computed(() => insights.value.filter(i => i.level === 'danger').length)
  const warningCount = computed(() => insights.value.filter(i => i.level === 'warning').length)

  return {
    babyAgeMonths,
    activeMonth,
    allAgeRanges,
    currentEntry,
    currentAgeLabel,
    activeCategory,
    currentGuides,
    guidesWithRelevance,
    insights,
    categoryGuideCounts,
    categoryInsightCounts,
    dangerCount,
    warningCount,
    selectedMonth,
    selectMonth,
    resetToBabyAge,
    getEntryForMonth,
  }
}
