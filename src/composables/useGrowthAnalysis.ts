import { computed, ref } from 'vue'
import type { DailyComparison, ConsecutiveTrend, AnomalyDay, GrowthAdvice, GrowthAnalysis, DaySummary, SleepPatternDeviation, WeeklySleepPatternReport, SleepGoalDailyAchievement } from '@/types'
import { useBabyCare } from './useBabyCare'
import { babies, currentBabyId } from './useSharedStore'

function getBabyAgeMonths(): number {
  const baby = babies.value.find(b => b.id === currentBabyId.value)
  if (!baby) return 6
  const birth = new Date(baby.birthDate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
}

const filterCaregiverId = ref<string | undefined>(undefined)

function setCaregiverFilter(id: string | undefined) {
  filterCaregiverId.value = id
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

  const weekData = computed(() => getWeekData(7, filterCaregiverId.value))

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

  const weeklySleepStats = computed(() => {
    const { getSleepGoalWeeklyStats } = useBabyCare()
    return getSleepGoalWeeklyStats(7, filterCaregiverId.value)
  })

  function getConsistencyLevel(stdDev: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (stdDev <= 15) return 'excellent'
    if (stdDev <= 30) return 'good'
    if (stdDev <= 60) return 'fair'
    return 'poor'
  }

  function getDeviationSeverity(score: number): 'normal' | 'mild' | 'moderate' | 'severe' {
    if (score <= 20) return 'normal'
    if (score <= 40) return 'mild'
    if (score <= 60) return 'moderate'
    return 'severe'
  }

  function buildDeviationDescription(d: SleepGoalDailyAchievement): string {
    const parts: string[] = []
    if (Math.abs(d.bedtimeDeviationMin) > 30) {
      const dir = d.bedtimeDeviationMin > 0 ? '晚睡' : '早睡'
      parts.push(`${dir}${Math.abs(d.bedtimeDeviationMin)}分钟`)
    }
    if (Math.abs(d.wakeTimeDeviationMin) > 30) {
      const dir = d.wakeTimeDeviationMin > 0 ? '晚起' : '早起'
      parts.push(`${dir}${Math.abs(d.wakeTimeDeviationMin)}分钟`)
    }
    if (Math.abs(d.sleepHoursDeviationMin) > 60) {
      const dir = d.sleepHoursDeviationMin > 0 ? '超出' : '不足'
      parts.push(`睡眠时长${dir}${Math.round(Math.abs(d.sleepHoursDeviationMin) / 60)}小时`)
    }
    if (parts.length === 0) return '作息基本符合目标'
    return parts.join('，')
  }

  const weeklySleepPatternReport = computed<WeeklySleepPatternReport | null>(() => {
    const stats = weeklySleepStats.value
    if (!stats) return null
    const { currentSleepGoal } = useBabyCare()
    const goal = currentSleepGoal.value
    const deviations: SleepPatternDeviation[] = stats.dailyAchievements.map(d => {
      const bedtimeScore = Math.min(100, Math.abs(d.bedtimeDeviationMin) / 60 * 40)
      const wakeTimeScore = Math.min(100, Math.abs(d.wakeTimeDeviationMin) / 60 * 40)
      const sleepHoursScore = Math.min(100, Math.abs(d.sleepHoursDeviationMin) / 120 * 40)
      const overallScore = (bedtimeScore + wakeTimeScore + sleepHoursScore) / 3
      return {
        date: d.date,
        bedtimeDeviationMin: d.bedtimeDeviationMin,
        wakeTimeDeviationMin: d.wakeTimeDeviationMin,
        sleepHoursDeviationMin: d.sleepHoursDeviationMin,
        overallDeviationScore: parseFloat(overallScore.toFixed(0)),
        severity: getDeviationSeverity(overallScore),
        description: buildDeviationDescription(d),
      }
    })
    const validAchievements = stats.dailyAchievements.filter(a => a.bedtime !== null || a.wakeTime !== null)
    const bedtimeMinutes = validAchievements
      .map(a => {
        if (!a.bedtime) return null
        const [h, m] = a.bedtime.split(':').map(Number)
        return h * 60 + m
      })
      .filter((v): v is number => v !== null)
    const wakeTimeMinutes = validAchievements
      .map(a => {
        if (!a.wakeTime) return null
        const [h, m] = a.wakeTime.split(':').map(Number)
        return h * 60 + m
      })
      .filter((v): v is number => v !== null)
    function avg(arr: number[]) {
      return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    }
    function minToStr(min: number) {
      if (!isFinite(min)) return null
      const h = Math.floor(((min % 1440) + 1440) % 1440 / 60)
      const m = Math.round(((min % 1440) + 1440) % 1440 % 60)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }
    const avgBedtime = bedtimeMinutes.length > 0 ? minToStr(avg(bedtimeMinutes)) : null
    const avgWakeTime = wakeTimeMinutes.length > 0 ? minToStr(avg(wakeTimeMinutes)) : null
    const avgSleep = validAchievements.length > 0
      ? parseFloat((validAchievements.reduce((a, d) => a + d.sleepHours, 0) / validAchievements.length).toFixed(1))
      : 0
    const sortedByScore = [...deviations].sort((a, b) => a.overallDeviationScore - b.overallDeviationScore)
    const bestDay = sortedByScore[0]?.date || null
    const worstDay = sortedByScore[sortedByScore.length - 1]?.date || null
    const suggestions: string[] = []
    const babyAge = getBabyAgeMonths()
    const bedtimeConsist = getConsistencyLevel(stats.bedtimeStandardDeviationMin)
    const wakeTimeConsist = getConsistencyLevel(stats.wakeTimeStandardDeviationMin)
    const sleepHoursConsist = getConsistencyLevel(stats.sleepHoursStandardDeviationMin)
    if (bedtimeConsist === 'poor' || bedtimeConsist === 'fair') {
      suggestions.push(bedtimeConsist === 'poor'
        ? '入睡时间波动较大（超过1小时），建议建立固定的睡前仪式，如洗澡、讲故事、调暗灯光，帮助宝宝形成条件反射'
        : '入睡时间有一定波动，建议每天在固定时间开始准备入睡，提前30分钟营造安静氛围')
    }
    if (wakeTimeConsist === 'poor' || wakeTimeConsist === 'fair') {
      suggestions.push(wakeTimeConsist === 'poor'
        ? '起床时间很不规律，建议早晨用自然光或轻柔音乐唤醒，帮助建立生物钟'
        : '起床时间有些波动，尽量在固定时间唤醒宝宝，即使前一晚睡得较晚')
    }
    if (sleepHoursConsist === 'poor' || stats.avgSleepHoursDeviationMin < -60) {
      suggestions.push(babyAge <= 3
        ? '小月龄宝宝睡眠时长波动大或不足，注意观察是否有环境噪音、温度不适或身体不适'
        : '睡眠时长波动大或经常不足，白天可适当增加活动量，避免傍晚过度疲劳')
    }
    if (stats.avgBedtimeDeviationMin > 30) {
      suggestions.push('实际入睡时间普遍晚于目标，尝试提前15-30分钟开始睡前流程')
    } else if (stats.avgBedtimeDeviationMin < -30) {
      suggestions.push('入睡时间普遍早于目标，如果宝宝精神好可适当推迟，确保夜间睡眠质量')
    }
    if (suggestions.length === 0) {
      suggestions.push('睡眠作息保持得很好！继续保持规律的作息习惯，有助于宝宝健康成长')
    }
    return {
      avgBedtime,
      avgWakeTime,
      avgSleepHours: avgSleep,
      bedtimeConsistency: bedtimeConsist,
      wakeTimeConsistency: wakeTimeConsist,
      sleepHoursConsistency: sleepHoursConsist,
      deviations,
      bestDay,
      worstDay,
      suggestions,
    }
  })

  return {
    analysis,
    weekData,
    maxFeedCount,
    maxSleepMinutes,
    maxDiaperCount,
    anomalyCount,
    dangerCount,
    warningCount,
    setCaregiverFilter,
    filterCaregiverId,
    weeklySleepStats,
    weeklySleepPatternReport,
  }
}
