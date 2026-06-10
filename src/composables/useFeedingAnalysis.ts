import { computed } from 'vue'
import type { FeedingRecord, FeedingDailyStats, FeedingAnalytics, SideBalance } from '@/types'
import { feedings, currentBabyId } from './useSharedStore'

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function useFeedingAnalysis() {
  const currentFeedings = computed(() =>
    feedings.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  )

  function getDayFeedings(date: Date): FeedingRecord[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 86400000
    return currentFeedings.value.filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })
  }

  function calcDayStats(date: Date): FeedingDailyStats {
    const dayFeedings = getDayFeedings(date)
    const feedingsByHour = new Array(24).fill(0)
    let totalAmount = 0
    let totalDuration = 0
    let leftDuration = 0
    let rightDuration = 0
    let breastCount = 0
    let formulaCount = 0
    let mixedCount = 0
    const intervals: number[] = []

    for (let i = 0; i < dayFeedings.length; i++) {
      const f = dayFeedings[i]
      const h = new Date(f.timestamp).getHours()
      feedingsByHour[h]++
      totalAmount += f.amount || 0
      totalDuration += f.duration || 0
      leftDuration += f.leftDuration || 0
      rightDuration += f.rightDuration || 0
      if (f.feedingType === 'breast') breastCount++
      else if (f.feedingType === 'formula') formulaCount++
      else if (f.feedingType === 'mixed') mixedCount++
      if (i > 0) {
        const diff = (new Date(f.timestamp).getTime() - new Date(dayFeedings[i - 1].timestamp).getTime()) / 60000
        if (diff > 0 && diff < 8 * 60) intervals.push(diff)
      }
    }

    const total = dayFeedings.length
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      totalFeedings: total,
      breastCount,
      formulaCount,
      mixedCount,
      totalAmount,
      totalDuration,
      leftDuration,
      rightDuration,
      avgIntervalMin: intervals.length > 0 ? Math.round(median(intervals)) : 0,
      avgDurationMin: total > 0 ? Math.round(totalDuration / total) : 0,
      avgAmount: total > 0 ? Math.round(totalAmount / total) : 0,
      feedingsByHour,
    }
  }

  const todayStats = computed(() => calcDayStats(new Date()))

  const weekStats = computed(() => {
    const result: FeedingDailyStats[] = []
    for (let i = 6; i >= 0; i--) {
      result.push(calcDayStats(new Date(Date.now() - i * 86400000)))
    }
    return result
  })

  const last7DaysTrend = computed(() => {
    return weekStats.value.map(s => ({
      date: s.date,
      count: s.totalFeedings,
      amount: s.totalAmount,
    }))
  })

  const sideBalance = computed<SideBalance>(() => {
    let leftCount = 0
    let rightCount = 0
    let bothCount = 0
    let leftDuration = 0
    let rightDuration = 0

    const last7Days = Date.now() - 7 * 86400000
    for (const f of currentFeedings.value) {
      if (new Date(f.timestamp).getTime() < last7Days) continue
      if (f.feedingType === 'breast' || f.feedingType === 'mixed') {
        if (f.breastSide === 'left') { leftCount++; leftDuration += f.leftDuration || f.duration || 0 }
        else if (f.breastSide === 'right') { rightCount++; rightDuration += f.rightDuration || f.duration || 0 }
        else if (f.breastSide === 'both' || f.breastSide === 'alternate') {
          bothCount++
          leftDuration += f.leftDuration || 0
          rightDuration += f.rightDuration || 0
        }
      }
    }

    const totalDur = leftDuration + rightDuration
    const leftPercent = totalDur > 0 ? Math.round((leftDuration / totalDur) * 100) : 50
    const rightPercent = totalDur > 0 ? 100 - leftPercent : 50
    const imbalanceWarning = Math.abs(leftPercent - rightPercent) > 30 && totalDur > 0
    let suggestion = '左右侧喂养平衡良好'
    if (imbalanceWarning) {
      suggestion = leftPercent > rightPercent
        ? '左侧喂养时间偏多，建议下次优先使用右侧'
        : '右侧喂养时间偏多，建议下次优先使用左侧'
    } else if (totalDur === 0) {
      suggestion = '暂无足够的母乳数据'
    }

    return {
      leftCount,
      rightCount,
      bothCount,
      leftDuration,
      rightDuration,
      leftPercent,
      rightPercent,
      imbalanceWarning,
      suggestion,
    }
  })

  const avgIntervalMin = computed(() => {
    const all = currentFeedings.value
    if (all.length < 2) return 180
    const intervals: number[] = []
    for (let i = 1; i < all.length; i++) {
      const diff = (new Date(all[i].timestamp).getTime() - new Date(all[i - 1].timestamp).getTime()) / 60000
      if (diff > 0 && diff < 8 * 60) intervals.push(diff)
    }
    return intervals.length > 0 ? Math.round(median(intervals)) : 180
  })

  const avgDurationMin = computed(() => {
    const breastFeedings = currentFeedings.value.filter(f => f.feedingType === 'breast' && f.duration > 0)
    if (breastFeedings.length === 0) return 15
    return Math.round(breastFeedings.reduce((a, f) => a + f.duration, 0) / breastFeedings.length)
  })

  const avgAmountPerFeeding = computed(() => {
    const formulaFeedings = currentFeedings.value.filter(f => (f.feedingType === 'formula' || f.feedingType === 'mixed') && f.amount > 0)
    if (formulaFeedings.length === 0) return 100
    return Math.round(formulaFeedings.reduce((a, f) => a + f.amount, 0) / formulaFeedings.length)
  })

  const dailyDistribution = computed(() => {
    const byHour = new Array(24).fill(0)
    const last7Days = Date.now() - 7 * 86400000
    for (const f of currentFeedings.value) {
      if (new Date(f.timestamp).getTime() < last7Days) continue
      byHour[new Date(f.timestamp).getHours()]++
    }
    return byHour.map((count, hour) => ({ hour, count }))
  })

  const formulaUsageTotal = computed(() => {
    return currentFeedings.value
      .filter(f => f.feedingType === 'formula' || f.feedingType === 'mixed')
      .reduce((a, f) => a + (f.amount || 0), 0)
  })

  const breastfeedingTotalMin = computed(() => {
    return currentFeedings.value
      .filter(f => f.feedingType === 'breast' || f.feedingType === 'mixed')
      .reduce((a, f) => a + (f.duration || 0), 0)
  })

  const nextSuggestedFeeding = computed<string | null>(() => {
    const sorted = [...currentFeedings.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (sorted.length === 0) return null
    const last = sorted[0]
    return new Date(new Date(last.timestamp).getTime() + avgIntervalMin.value * 60000).toISOString()
  })

  const recommendations = computed<string[]>(() => {
    const recs: string[] = []
    if (sideBalance.value.imbalanceWarning) {
      recs.push(sideBalance.value.suggestion)
    }
    if (todayStats.value.totalFeedings < 6) {
      recs.push('今日喂奶次数偏少，请注意观察宝宝是否饥饿')
    }
    if (todayStats.value.totalFeedings > 12) {
      recs.push('今日喂奶次数偏多，可考虑适当拉长间隔')
    }
    if (avgAmountPerFeeding.value < 60 && formulaUsageTotal.value > 0) {
      recs.push('平均每次奶量偏少，可尝试逐步增加')
    }
    if (avgDurationMin.value < 5 && breastfeedingTotalMin.value > 0) {
      recs.push('母乳单次喂养时间较短，确保宝宝充分吸吮')
    }
    if (recs.length === 0) {
      recs.push('喂养规律良好，继续保持！')
    }
    return recs
  })

  const analytics = computed<FeedingAnalytics>(() => ({
    todayStats: todayStats.value,
    weekStats: weekStats.value,
    last7DaysTrend: last7DaysTrend.value,
    sideBalance: sideBalance.value,
    avgIntervalMin: avgIntervalMin.value,
    avgDurationMin: avgDurationMin.value,
    avgAmountPerFeeding: avgAmountPerFeeding.value,
    dailyDistribution: dailyDistribution.value,
    formulaUsageTotal: formulaUsageTotal.value,
    breastfeedingTotalMin: breastfeedingTotalMin.value,
    nextSuggestedFeeding: nextSuggestedFeeding.value,
    recommendations: recommendations.value,
  }))

  return {
    analytics,
    todayStats,
    weekStats,
    last7DaysTrend,
    sideBalance,
    avgIntervalMin,
    avgDurationMin,
    avgAmountPerFeeding,
    dailyDistribution,
    formulaUsageTotal,
    breastfeedingTotalMin,
    nextSuggestedFeeding,
    recommendations,
    getDayFeedings,
    calcDayStats,
  }
}
