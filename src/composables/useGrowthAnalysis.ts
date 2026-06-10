import { computed } from 'vue'
import type { DailyComparison, ConsecutiveTrend, AnomalyDay, GrowthAdvice, GrowthAnalysis, DaySummary } from '@/types'
import { useBabyCare } from './useBabyCare'
import { babies, currentBabyId } from './useSharedStore'

function getBabyAgeMonths(): number {
  const baby = babies.value.find(b => b.id === currentBabyId.value)
  if (!baby) return 6
  const birth = new Date(baby.birthDate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
}

function buildComparisons(weekData: { date: string; summary: DaySummary }[]): DailyComparison[] {
  if (weekData.length === 0) return []

  const today = weekData[weekData.length - 1].summary
  const prevDays = weekData.slice(0, -1)
  const avgFeed = prevDays.length > 0 ? prevDays.reduce((a, d) => a + d.summary.feedCount, 0) / prevDays.length : today.feedCount
  const avgSleep = prevDays.length > 0 ? prevDays.reduce((a, d) => a + d.summary.sleepMinutes, 0) / prevDays.length : today.sleepMinutes
  const avgDiaper = prevDays.length > 0 ? prevDays.reduce((a, d) => a + d.summary.diaperCount, 0) / prevDays.length : today.diaperCount

  return [
    {
      category: 'feeding',
      todayValue: today.feedCount,
      avgValue: parseFloat(avgFeed.toFixed(1)),
      diff: parseFloat((today.feedCount - avgFeed).toFixed(1)),
      diffPercent: avgFeed > 0 ? parseFloat(((today.feedCount - avgFeed) / avgFeed * 100).toFixed(0)) : 0,
      label: '喂奶',
      unit: '次',
    },
    {
      category: 'sleep',
      todayValue: today.sleepMinutes,
      avgValue: parseFloat(avgSleep.toFixed(1)),
      diff: parseFloat((today.sleepMinutes - avgSleep).toFixed(1)),
      diffPercent: avgSleep > 0 ? parseFloat(((today.sleepMinutes - avgSleep) / avgSleep * 100).toFixed(0)) : 0,
      label: '睡眠',
      unit: 'min',
    },
    {
      category: 'diaper',
      todayValue: today.diaperCount,
      avgValue: parseFloat(avgDiaper.toFixed(1)),
      diff: parseFloat((today.diaperCount - avgDiaper).toFixed(1)),
      diffPercent: avgDiaper > 0 ? parseFloat(((today.diaperCount - avgDiaper) / avgDiaper * 100).toFixed(0)) : 0,
      label: '尿布',
      unit: '次',
    },
  ]
}

function buildConsecutiveTrends(weekData: { date: string; summary: DaySummary }[]): ConsecutiveTrend[] {
  if (weekData.length < 2) {
    return [
      { category: 'feeding', direction: 'stable', days: 0, label: '喂奶', description: '数据不足' },
      { category: 'sleep', direction: 'stable', days: 0, label: '睡眠', description: '数据不足' },
      { category: 'diaper', direction: 'stable', days: 0, label: '尿布', description: '数据不足' },
    ]
  }

  function analyzeTrend(getter: (s: DaySummary) => number, label: string, category: 'feeding' | 'sleep' | 'diaper'): ConsecutiveTrend {
    const values = weekData.map(d => getter(d.summary))
    let direction: 'up' | 'down' | 'stable' = 'stable'
    let consecutiveDays = 0

    for (let i = values.length - 1; i >= 1; i--) {
      const diff = values[i] - values[i - 1]
      if (i === values.length - 1) {
        if (diff > 0) direction = 'up'
        else if (diff < 0) direction = 'down'
        else direction = 'stable'
      }

      const currentDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
      if (currentDirection === direction && direction !== 'stable') {
        consecutiveDays++
      } else if (i === values.length - 1 && direction !== 'stable') {
        consecutiveDays = 1
        break
      } else {
        if (direction !== 'stable') consecutiveDays = Math.max(consecutiveDays, 1)
        break
      }
    }

    if (direction === 'stable') {
      return { category, direction: 'stable', days: 0, label, description: '近期走势平稳' }
    }

    const dirText = direction === 'up' ? '上升' : '下降'
    let description = ''
    if (consecutiveDays >= 3) {
      description = `连续${consecutiveDays}天${dirText}，趋势明显`
    } else if (consecutiveDays >= 2) {
      description = `连续${consecutiveDays}天${dirText}`
    } else {
      description = `今日较昨日${dirText}`
    }

    return { category, direction, days: consecutiveDays, label, description }
  }

  return [
    analyzeTrend(s => s.feedCount, '喂奶', 'feeding'),
    analyzeTrend(s => s.sleepMinutes, '睡眠', 'sleep'),
    analyzeTrend(s => s.diaperCount, '尿布', 'diaper'),
  ]
}

function buildAnomalyDays(weekData: { date: string; summary: DaySummary }[]): AnomalyDay[] {
  const anomalies: AnomalyDay[] = []
  if (weekData.length < 3) return anomalies

  const feedValues = weekData.map(d => d.summary.feedCount)
  const sleepValues = weekData.map(d => d.summary.sleepMinutes)
  const diaperValues = weekData.map(d => d.summary.diaperCount)

  function calcStats(values: number[]) {
    const valid = values.filter(v => v > 0)
    if (valid.length < 2) return null
    const avg = valid.reduce((a, v) => a + v, 0) / valid.length
    const std = Math.sqrt(valid.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / valid.length)
    return { avg, std }
  }

  function checkAnomaly(
    values: number[],
    avg: number,
    std: number,
    category: 'feeding' | 'sleep' | 'diaper',
    unit: string
  ) {
    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      if (v === 0) {
        anomalies.push({
          date: weekData[i].date,
          category,
          level: 'danger',
          value: 0,
          avgValue: parseFloat(avg.toFixed(1)),
          deviation: -100,
          description: `无${category === 'feeding' ? '喂奶' : category === 'sleep' ? '睡眠' : '尿布'}记录`,
        })
        continue
      }

      if (std > 0) {
        const deviation = ((v - avg) / std)
        if (Math.abs(deviation) > 1.5) {
          const isHigh = deviation > 0
          anomalies.push({
            date: weekData[i].date,
            category,
            level: isHigh ? 'info' : 'warning',
            value: v,
            avgValue: parseFloat(avg.toFixed(1)),
            deviation: parseFloat((deviation * 100).toFixed(0)),
            description: `${v}${unit}${isHigh ? '，显著高于日均' : '，显著低于日均'}${avg.toFixed(1)}${unit}`,
          })
        }
      }
    }
  }

  const feedStats = calcStats(feedValues)
  const sleepStats = calcStats(sleepValues)
  const diaperStats = calcStats(diaperValues)

  if (feedStats) checkAnomaly(feedValues, feedStats.avg, feedStats.std, 'feeding', '次')
  if (sleepStats) checkAnomaly(sleepValues, sleepStats.avg, sleepStats.std, 'sleep', 'min')
  if (diaperStats) checkAnomaly(diaperValues, diaperStats.avg, diaperStats.std, 'diaper', '次')

  return anomalies
}

function buildAdvices(
  comparisons: DailyComparison[],
  trends: ConsecutiveTrend[],
  anomalyDays: AnomalyDay[],
): GrowthAdvice[] {
  const advices: GrowthAdvice[] = []
  const babyAge = getBabyAgeMonths()

  const feedComparison = comparisons.find(c => c.category === 'feeding')
  const sleepComparison = comparisons.find(c => c.category === 'sleep')
  const diaperComparison = comparisons.find(c => c.category === 'diaper')

  const feedTrend = trends.find(t => t.category === 'feeding')
  const sleepTrend = trends.find(t => t.category === 'sleep')

  const feedAnomalies = anomalyDays.filter(a => a.category === 'feeding')
  const sleepAnomalies = anomalyDays.filter(a => a.category === 'sleep')
  const diaperAnomalies = anomalyDays.filter(a => a.category === 'diaper')

  if (feedComparison && feedComparison.diffPercent > 30) {
    advices.push({
      id: 'feed-high',
      category: 'feeding',
      level: 'info',
      title: '喂奶偏多',
      description: babyAge <= 6
        ? '今日喂奶次数比日均多30%以上，可能处于猛长期，按需喂养即可'
        : '喂奶次数偏多，留意是否因哭闹误判为饥饿，尝试其他安抚方式',
    })
  } else if (feedComparison && feedComparison.diffPercent < -30) {
    advices.push({
      id: 'feed-low',
      category: 'feeding',
      level: 'warning',
      title: '喂奶偏少',
      description: babyAge <= 3
        ? '小月龄宝宝进食减少需特别关注，建议检查口腔和吸吮力度'
        : '今日喂奶偏少，观察宝宝精神状态和尿量变化',
    })
  }

  if (sleepComparison && sleepComparison.diffPercent < -25) {
    advices.push({
      id: 'sleep-low',
      category: 'sleep',
      level: 'warning',
      title: '睡眠偏少',
      description: babyAge <= 3
        ? '小月龄宝宝睡眠不足可能影响发育，建议营造安静暗淡的睡眠环境'
        : '睡眠偏少，白天适当增加活动量，保持规律作息',
    })
  } else if (sleepComparison && sleepComparison.diffPercent > 40) {
    advices.push({
      id: 'sleep-high',
      category: 'sleep',
      level: 'info',
      title: '睡眠偏多',
      description: '睡眠时间比日均多40%以上，可能处于生长加速期，也需确保进食充足',
    })
  }

  if (diaperComparison && diaperComparison.todayValue < 3) {
    advices.push({
      id: 'diaper-low',
      category: 'diaper',
      level: 'warning',
      title: '尿布次数偏少',
      description: '尿布更换不足3次，可能提示摄入不足，建议观察尿量和颜色',
    })
  }

  if (feedTrend && feedTrend.direction === 'up' && feedTrend.days >= 3) {
    advices.push({
      id: 'feed-trend-up',
      category: 'feeding',
      level: 'info',
      title: '喂奶持续上升',
      description: `连续${feedTrend.days}天喂奶次数上升，宝宝可能正在经历猛长期`,
    })
  }

  if (sleepTrend && sleepTrend.direction === 'down' && sleepTrend.days >= 3) {
    advices.push({
      id: 'sleep-trend-down',
      category: 'sleep',
      level: 'warning',
      title: '睡眠持续下降',
      description: `连续${sleepTrend.days}天睡眠时长下降，建议排查环境干扰或身体不适`,
    })
  }

  if (feedAnomalies.filter(a => a.level === 'danger').length > 0) {
    advices.push({
      id: 'feed-anomaly-danger',
      category: 'feeding',
      level: 'warning',
      title: '存在无喂奶记录天数',
      description: '请确认是否漏记。若确实未喂奶，需关注宝宝脱水风险',
    })
  }

  if (sleepAnomalies.filter(a => a.level === 'danger').length > 0) {
    advices.push({
      id: 'sleep-anomaly-danger',
      category: 'sleep',
      level: 'warning',
      title: '存在无睡眠记录天数',
      description: '请确认是否漏记。建议设置睡眠记录提醒',
    })
  }

  if (diaperAnomalies.filter(a => a.level === 'danger').length > 0) {
    advices.push({
      id: 'diaper-anomaly-danger',
      category: 'diaper',
      level: 'warning',
      title: '存在无尿布记录天数',
      description: '请确认是否漏记。长时间不更换可能导致红屁股',
    })
  }

  if (anomalyDays.length === 0) {
    advices.push({
      id: 'all-good',
      category: 'general',
      level: 'good',
      title: '一切正常',
      description: '近7天各项指标均在正常范围内，继续保持良好的护理节奏！',
    })
  }

  if (advices.length === 0) {
    advices.push({
      id: 'keep-going',
      category: 'general',
      level: 'info',
      title: '持续记录',
      description: '坚持记录宝宝的日常活动，数据越完整分析越准确',
    })
  }

  return advices
}

export function useGrowthAnalysis() {
  const { getWeekData } = useBabyCare()

  const weekData = computed(() => getWeekData(7))

  const analysis = computed<GrowthAnalysis>(() => {
    const data = weekData.value
    const comparisons = buildComparisons(data)
    const trendResults = buildConsecutiveTrends(data)
    const anomalyDays = buildAnomalyDays(data)
    const advices = buildAdvices(comparisons, trendResults, anomalyDays)

    return {
      comparisons,
      trends: trendResults,
      anomalyDays,
      advices,
      weekData: data,
    }
  })

  const maxFeedCount = computed(() => Math.max(...weekData.value.map(d => d.summary.feedCount), 1))
  const maxSleepMinutes = computed(() => Math.max(...weekData.value.map(d => d.summary.sleepMinutes), 1))
  const maxDiaperCount = computed(() => Math.max(...weekData.value.map(d => d.summary.diaperCount), 1))

  const anomalyCount = computed(() => analysis.value.anomalyDays.length)
  const dangerCount = computed(() => analysis.value.anomalyDays.filter(a => a.level === 'danger').length)
  const warningCount = computed(() => analysis.value.anomalyDays.filter(a => a.level === 'warning').length)

  return {
    analysis,
    weekData,
    maxFeedCount,
    maxSleepMinutes,
    maxDiaperCount,
    anomalyCount,
    dangerCount,
    warningCount,
  }
}
