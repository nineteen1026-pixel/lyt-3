import { ref, computed } from 'vue'
import type { MonthlyReport, MonthlyDayData, MonthlyTrend, AnomalyItem } from '@/types'
import {
  feedings, sleeps, diapers, currentBabyId, babies,
} from './useSharedStore'

const filterCaregiverId = ref<string | undefined>(undefined)

function setCaregiverFilter(id: string | undefined) {
  filterCaregiverId.value = id
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function buildDayData(
  year: number, month: number, day: number,
  babyId: string, caregiverId?: string
): MonthlyDayData {
  const dayStart = new Date(year, month - 1, day).getTime()
  const dayEnd = dayStart + 86400000
  const dateStr = `${month}/${day}`

  let dayFeedings = feedings.value.filter(r => {
    if (r.babyId !== babyId) return false
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })
  let daySleeps = sleeps.value.filter(r => {
    if (r.babyId !== babyId) return false
    const t = new Date(r.startTime).getTime()
    return t >= dayStart && t < dayEnd
  })
  let dayDiapers = diapers.value.filter(r => {
    if (r.babyId !== babyId) return false
    const t = new Date(r.timestamp).getTime()
    return t >= dayStart && t < dayEnd
  })

  if (caregiverId) {
    dayFeedings = dayFeedings.filter(r => r.caregiverId === caregiverId)
    daySleeps = daySleeps.filter(r => r.caregiverId === caregiverId)
    dayDiapers = dayDiapers.filter(r => r.caregiverId === caregiverId)
  }

  const sleepMinutes = daySleeps.reduce((acc, s) => {
    const diff = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
    return acc + diff / 60000
  }, 0)

  return {
    date: dateStr,
    day,
    feedCount: dayFeedings.length,
    totalAmount: dayFeedings.reduce((a, r) => a + r.amount, 0),
    sleepMinutes: Math.round(sleepMinutes),
    diaperCount: dayDiapers.length,
    diaperWet: dayDiapers.filter(d => d.diaperType === 'wet').length,
    diaperDirty: dayDiapers.filter(d => d.diaperType === 'dirty').length,
    diaperMixed: dayDiapers.filter(d => d.diaperType === 'mixed').length,
    breastCount: dayFeedings.filter(f => f.feedingType === 'breast').length,
    formulaCount: dayFeedings.filter(f => f.feedingType === 'formula').length,
    formulaAmount: dayFeedings.filter(f => f.feedingType === 'formula').reduce((a, r) => a + r.amount, 0),
    deepSleepCount: daySleeps.filter(s => s.quality === 'deep').length,
    lightSleepCount: daySleeps.filter(s => s.quality === 'light').length,
    fussySleepCount: daySleeps.filter(s => s.quality === 'fussy').length,
  }
}

function buildTrends(days: MonthlyDayData[]): MonthlyTrend[] {
  const totalDays = days.length
  if (totalDays === 0) return []

  const weekCount = Math.ceil(totalDays / 7)
  const trends: MonthlyTrend[] = []

  for (let w = 0; w < weekCount; w++) {
    const start = w * 7
    const end = Math.min(start + 7, totalDays)
    const weekDays = days.slice(start, end)
    if (weekDays.length === 0) continue

    trends.push({
      label: `第${w + 1}周`,
      weekIndex: w,
      avgFeedCount: parseFloat((weekDays.reduce((a, d) => a + d.feedCount, 0) / weekDays.length).toFixed(1)),
      avgSleepMinutes: Math.round(weekDays.reduce((a, d) => a + d.sleepMinutes, 0) / weekDays.length),
      avgDiaperCount: parseFloat((weekDays.reduce((a, d) => a + d.diaperCount, 0) / weekDays.length).toFixed(1)),
      avgFormulaAmount: Math.round(weekDays.reduce((a, d) => a + d.formulaAmount, 0) / weekDays.length),
    })
  }

  return trends
}

function detectAnomalies(days: MonthlyDayData[], babyAgeMonths: number): AnomalyItem[] {
  const anomalies: AnomalyItem[] = []
  const validDays = days.filter(d => d.feedCount > 0 || d.sleepMinutes > 0 || d.diaperCount > 0)
  if (validDays.length < 3) return anomalies

  const avgFeed = validDays.reduce((a, d) => a + d.feedCount, 0) / validDays.length
  const avgSleep = validDays.reduce((a, d) => a + d.sleepMinutes, 0) / validDays.length
  const avgDiaper = validDays.reduce((a, d) => a + d.diaperCount, 0) / validDays.length
  const avgFussy = validDays.reduce((a, d) => a + d.fussySleepCount, 0) / validDays.length

  const feedStd = Math.sqrt(validDays.reduce((a, d) => a + Math.pow(d.feedCount - avgFeed, 2), 0) / validDays.length)
  const sleepStd = Math.sqrt(validDays.reduce((a, d) => a + Math.pow(d.sleepMinutes - avgSleep, 2), 0) / validDays.length)
  const diaperStd = Math.sqrt(validDays.reduce((a, d) => a + Math.pow(d.diaperCount - avgDiaper, 2), 0) / validDays.length)

  const lowFeedDays = validDays.filter(d => d.feedCount < avgFeed - 2 * feedStd && d.feedCount > 0)
  if (lowFeedDays.length >= 2) {
    anomalies.push({
      id: 'low-feed',
      category: 'feeding',
      level: 'warning',
      title: '喂奶次数异常偏低',
      description: `有${lowFeedDays.length}天喂奶次数显著低于月均${avgFeed.toFixed(1)}次`,
      advice: babyAgeMonths <= 6
        ? '小月龄宝宝进食减少需特别关注，建议检查宝宝口腔是否有鹅口疮，观察吸吮力度是否正常，必要时就医排查'
        : '宝宝进食减少可能与长牙、天气变化或轻微不适有关，可尝试调整喂奶环境和姿势，若持续2天以上建议就医',
    })
  }

  const zeroFeedDays = validDays.filter(d => d.feedCount === 0)
  if (zeroFeedDays.length >= 1) {
    anomalies.push({
      id: 'zero-feed',
      category: 'feeding',
      level: 'danger',
      title: '存在无喂奶记录天数',
      description: `有${zeroFeedDays.length}天完全没有喂奶记录`,
      advice: '请确认是否漏记。若确实未喂奶，小月龄宝宝需立即就医；大月龄宝宝也需关注脱水风险，确保至少有水分摄入',
    })
  }

  const highFeedDays = validDays.filter(d => d.feedCount > avgFeed + 2 * feedStd)
  if (highFeedDays.length >= 2) {
    anomalies.push({
      id: 'high-feed',
      category: 'feeding',
      level: 'info',
      title: '喂奶次数异常偏高',
      description: `有${highFeedDays.length}天喂奶次数显著高于月均${avgFeed.toFixed(1)}次`,
      advice: '频繁进食可能是猛长期的表现（通常持续2-3天），属正常现象。若持续一周以上且伴有哭闹，建议排查胃食管反流',
    })
  }

  const lowSleepDays = validDays.filter(d => d.sleepMinutes < avgSleep - 2 * sleepStd && d.sleepMinutes > 0)
  if (lowSleepDays.length >= 3) {
    anomalies.push({
      id: 'low-sleep',
      category: 'sleep',
      level: 'warning',
      title: '睡眠时长异常偏少',
      description: `有${lowSleepDays.length}天睡眠显著低于月均${(avgSleep / 60).toFixed(1)}小时`,
      advice: babyAgeMonths <= 3
        ? '小月龄宝宝睡眠不足可能影响发育，建议营造安静暗淡的睡眠环境，建立固定的睡前仪式，襁褓包裹可能有帮助'
        : '可尝试建立规律作息时间表，白天适当增加活动量，避免睡前过度刺激，保持卧室温度适宜(22-24°C)',
    })
  }

  const zeroSleepDays = validDays.filter(d => d.sleepMinutes === 0)
  if (zeroSleepDays.length >= 1) {
    anomalies.push({
      id: 'zero-sleep',
      category: 'sleep',
      level: 'danger',
      title: '存在无睡眠记录天数',
      description: `有${zeroSleepDays.length}天完全没有睡眠记录`,
      advice: '请确认是否漏记。睡眠对宝宝发育至关重要，建议设置睡眠记录提醒',
    })
  }

  const highFussyDays = validDays.filter(d => d.fussySleepCount > avgFussy + 1)
  if (highFussyDays.length >= 3) {
    anomalies.push({
      id: 'high-fussy',
      category: 'sleep',
      level: 'warning',
      title: '烦躁睡眠频繁',
      description: `有${highFussyDays.length}天出现较多烦躁睡眠`,
      advice: babyAgeMonths <= 4
        ? '烦躁睡眠在3-4月龄前较常见（"四月睡眠回退"），建议坚持安抚策略，避免立即抱起，先尝试轻拍和嘘声安抚'
        : '频繁烦躁睡眠可能与环境变化、分离焦虑或身体不适有关，建议排查过敏、胀气等因素，保持睡前程序一致',
    })
  }

  const lowDiaperDays = validDays.filter(d => d.diaperCount < avgDiaper - 2 * diaperStd)
  if (lowDiaperDays.length >= 2) {
    anomalies.push({
      id: 'low-diaper',
      category: 'diaper',
      level: 'warning',
      title: '尿布更换次数偏少',
      description: `有${lowDiaperDays.length}天尿布更换次数显著低于月均${avgDiaper.toFixed(1)}次`,
      advice: '尿布次数减少可能意味着摄入不足，建议关注宝宝的尿量和颜色。淡黄色尿液表示水分充足，深黄色需增加喂养',
    })
  }

  const dirtyDays = validDays.filter(d => d.diaperDirty + d.diaperMixed === 0)
  if (dirtyDays.length >= 3 && babyAgeMonths <= 6) {
    anomalies.push({
      id: 'no-dirty',
      category: 'diaper',
      level: 'info',
      title: '多天无排便记录',
      description: `有${dirtyDays.length}天没有排便记录`,
      advice: '纯母乳宝宝可能出现"攒肚"（数天不排便属正常），但若伴有腹胀、哭闹、呕吐需就医排查。配方奶宝宝超过3天未排便建议咨询医生',
    })
  }

  const zeroDiaperDays = validDays.filter(d => d.diaperCount === 0)
  if (zeroDiaperDays.length >= 1) {
    anomalies.push({
      id: 'zero-diaper',
      category: 'diaper',
      level: 'danger',
      title: '存在无尿布记录天数',
      description: `有${zeroDiaperDays.length}天完全没有尿布更换记录`,
      advice: '请确认是否漏记。长时间不更换尿布可能导致红屁股和尿路感染，建议至少每2-3小时检查一次',
    })
  }

  return anomalies
}

function generateAdvices(report: MonthlyReport, babyAgeMonths: number): string[] {
  const advices: string[] = []
  const s = report.summary

  if (s.avgDailyFeedCount < 5 && babyAgeMonths <= 3) {
    advices.push('日均喂奶次数偏少，0-3月龄宝宝通常每天需要8-12次喂养，建议增加喂奶频率')
  } else if (s.avgDailyFeedCount >= 8 && babyAgeMonths <= 3) {
    advices.push('喂奶频率正常，宝宝正处于快速生长阶段，按需喂养即可')
  }

  if (s.avgDailySleepMinutes < 540 && babyAgeMonths <= 3) {
    advices.push('日均睡眠不足9小时，0-3月龄宝宝通常需要14-17小时睡眠，建议优化睡眠环境')
  } else if (s.avgDailySleepMinutes < 720 && babyAgeMonths <= 6) {
    advices.push('日均睡眠时间偏低，建议注意观察宝宝的睡眠信号（揉眼、打哈欠），及时安排小睡')
  }

  if (s.deepSleepRate < 0.3) {
    advices.push('深度睡眠占比偏低，建议确保睡眠环境安静、温度适宜，睡前避免过度刺激')
  }

  if (s.breastVsFormula.formula > 0 && s.breastVsFormula.breast > 0) {
    advices.push('混合喂养模式下，建议先喂母乳再补配方奶，确保母乳分泌充足')
  }

  if (s.avgDailyDiaperCount < 4) {
    advices.push('日均尿布更换次数偏少，新生儿每天应有6片以上湿尿布，偏少可能提示摄入不足')
  }

  if (babyAgeMonths >= 4 && babyAgeMonths <= 6) {
    advices.push('4-6月龄是添加辅食的窗口期，可以关注宝宝是否出现对食物的兴趣和坐稳的能力')
  }

  if (babyAgeMonths >= 6) {
    advices.push('6月龄以上宝宝注意补充含铁食物，如强化铁米粉、蛋黄等')
  }

  if (report.anomalies.length === 0) {
    advices.push('本月各项指标均在正常范围内，继续保持良好的护理节奏！')
  }

  if (advices.length === 0) {
    advices.push('坚持记录宝宝的日常活动，数据越完整，分析越准确。')
  }

  return advices
}

function getBabyAgeMonths(): number {
  const babyId = currentBabyId.value
  const baby = babies.value.find(b => b.id === babyId)
  if (!baby) return 6
  const birth = new Date(baby.birthDate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
}

export function useMonthlyReport() {
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth() + 1)

  const monthlyReport = computed<MonthlyReport>(() => {
    const babyId = currentBabyId.value
    const year = selectedYear.value
    const month = selectedMonth.value
    const daysInMonth = getDaysInMonth(year, month)

    const days: MonthlyDayData[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(buildDayData(year, month, d, babyId, filterCaregiverId.value))
    }

    const validDays = days.filter(d => d.feedCount > 0 || d.sleepMinutes > 0 || d.diaperCount > 0)
    const validCount = Math.max(validDays.length, 1)

    const totalFeedCount = days.reduce((a, d) => a + d.feedCount, 0)
    const totalFormulaAmount = days.reduce((a, d) => a + d.formulaAmount, 0)
    const totalSleepMinutes = days.reduce((a, d) => a + d.sleepMinutes, 0)
    const totalDiaperCount = days.reduce((a, d) => a + d.diaperCount, 0)

    const totalSleepSessions = validDays.reduce((a, d) => a + d.deepSleepCount + d.lightSleepCount + d.fussySleepCount, 0)
    const totalDeepSleep = validDays.reduce((a, d) => a + d.deepSleepCount, 0)

    const totalBreast = days.reduce((a, d) => a + d.breastCount, 0)
    const totalFormula = days.reduce((a, d) => a + d.formulaCount, 0)

    const report: MonthlyReport = {
      year,
      month,
      days,
      trends: [],
      anomalies: [],
      advices: [],
      summary: {
        totalFeedCount,
        avgDailyFeedCount: parseFloat((totalFeedCount / validCount).toFixed(1)),
        totalFormulaAmount,
        avgDailyFormulaAmount: Math.round(totalFormulaAmount / validCount),
        totalSleepMinutes,
        avgDailySleepMinutes: Math.round(totalSleepMinutes / validCount),
        totalDiaperCount,
        avgDailyDiaperCount: parseFloat((totalDiaperCount / validCount).toFixed(1)),
        deepSleepRate: totalSleepSessions > 0 ? parseFloat((totalDeepSleep / totalSleepSessions).toFixed(2)) : 0,
        breastVsFormula: { breast: totalBreast, formula: totalFormula },
      },
    }

    report.trends = buildTrends(days)
    report.anomalies = detectAnomalies(days, getBabyAgeMonths())
    report.advices = generateAdvices(report, getBabyAgeMonths())

    return report
  })

  function prevMonth() {
    if (selectedMonth.value === 1) {
      selectedMonth.value = 12
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  }

  function nextMonth() {
    const now = new Date()
    const nextM = selectedMonth.value === 12 ? 1 : selectedMonth.value + 1
    const nextY = selectedMonth.value === 12 ? selectedYear.value + 1 : selectedYear.value
    if (nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth() + 1)) return
    selectedMonth.value = nextM
    selectedYear.value = nextY
  }

  const canGoNext = computed(() => {
    const now = new Date()
    if (selectedYear.value < now.getFullYear()) return true
    return selectedMonth.value < now.getMonth() + 1
  })

  return {
    selectedYear,
    selectedMonth,
    monthlyReport,
    prevMonth,
    nextMonth,
    canGoNext,
    filterCaregiverId,
    setCaregiverFilter,
  }
}
