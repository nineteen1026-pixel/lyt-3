import { computed } from 'vue'
import type {
  SchedulePlan,
  ScheduleActivity,
  ScheduleExecution,
  ScheduleExecutionStatus,
  ScheduleTemplate,
  ScheduleTemplateAgeRange,
  ScheduleDailyDeviation,
  ScheduleDeviationAnalysis,
  ScheduleActivityType,
} from '@/types'
import { SCHEDULE_ACTIVITY_LABELS, SCHEDULE_TEMPLATE_AGE_RANGES } from '@/types'
import {
  schedulePlans,
  scheduleExecutions,
  currentBabyId,
  currentUserId,
  persistData,
  genId,
  canAddRecord,
  canManageBabies,
} from './useSharedStore'

function getDefaultTemplates(): ScheduleTemplate[] {
  return [
    {
      id: 'tpl-0-1m',
      name: '新生儿基础作息',
      ageRange: '0-1m',
      description: '按需喂养为主，睡眠频繁，建立昼夜节律',
      source: 'official',
      popularity: 98,
      activities: [
        { type: 'wake', title: '起床·换尿布', startTime: '07:00', endTime: '07:30', reminder: true },
        { type: 'feeding', title: '晨间喂奶', startTime: '07:00', endTime: '07:40', reminder: true },
        { type: 'nap', title: '晨间小睡', startTime: '08:30', endTime: '10:00', reminder: true },
        { type: 'feeding', title: '上午喂奶', startTime: '10:00', endTime: '10:40', reminder: true },
        { type: 'nap', title: '午前小睡', startTime: '11:30', endTime: '13:00', reminder: true },
        { type: 'feeding', title: '午后喂奶', startTime: '13:00', endTime: '13:40', reminder: true },
        { type: 'play', title: '亲子互动', startTime: '14:30', endTime: '15:30', reminder: false },
        { type: 'nap', title: '午后小睡', startTime: '15:30', endTime: '17:00', reminder: true },
        { type: 'feeding', title: '傍晚喂奶', startTime: '17:00', endTime: '17:40', reminder: true },
        { type: 'bath', title: '洗澡抚触', startTime: '18:30', endTime: '19:15', reminder: true },
        { type: 'feeding', title: '睡前喂奶', startTime: '20:30', endTime: '21:10', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '21:30', endTime: '07:00', reminder: true },
      ],
    },
    {
      id: 'tpl-1-3m',
      name: '小婴儿规律作息',
      ageRange: '1-3m',
      description: '建立3-4小时喂养周期，逐渐延长夜间睡眠',
      source: 'official',
      popularity: 95,
      activities: [
        { type: 'wake', title: '起床·晨间护理', startTime: '06:30', endTime: '07:00', reminder: true },
        { type: 'feeding', title: '晨间喂奶', startTime: '07:00', endTime: '07:30', reminder: true },
        { type: 'play', title: '互动游戏', startTime: '07:45', endTime: '08:45', reminder: false },
        { type: 'nap', title: '上午小睡', startTime: '09:00', endTime: '10:30', reminder: true },
        { type: 'feeding', title: '上午喂奶', startTime: '10:30', endTime: '11:00', reminder: true },
        { type: 'outdoor', title: '户外散步', startTime: '11:15', endTime: '12:15', reminder: false },
        { type: 'nap', title: '午后长觉', startTime: '12:30', endTime: '15:00', reminder: true },
        { type: 'feeding', title: '午后喂奶', startTime: '15:00', endTime: '15:30', reminder: true },
        { type: 'play', title: '认知训练', startTime: '15:45', endTime: '17:00', reminder: false },
        { type: 'feeding', title: '傍晚喂奶', startTime: '18:00', endTime: '18:30', reminder: true },
        { type: 'bath', title: '洗澡·抚触', startTime: '19:00', endTime: '19:45', reminder: true },
        { type: 'feeding', title: '睡前喂奶', startTime: '20:00', endTime: '20:30', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '20:45', endTime: '06:30', reminder: true },
      ],
    },
    {
      id: 'tpl-3-6m',
      name: '婴儿巩固作息',
      ageRange: '3-6m',
      description: '巩固3餐3觉规律，引入辅食准备期',
      source: 'official',
      popularity: 92,
      activities: [
        { type: 'wake', title: '起床', startTime: '07:00', endTime: '07:15', reminder: true },
        { type: 'feeding', title: '晨间奶', startTime: '07:15', endTime: '07:45', reminder: true },
        { type: 'outdoor', title: '晨间户外', startTime: '08:00', endTime: '09:00', reminder: false },
        { type: 'nap', title: '上午小睡', startTime: '09:15', endTime: '10:30', reminder: true },
        { type: 'feeding', title: '午餐奶', startTime: '10:45', endTime: '11:15', reminder: true },
        { type: 'play', title: '大运动练习', startTime: '11:30', endTime: '12:30', reminder: false },
        { type: 'nap', title: '午后长觉', startTime: '12:45', endTime: '15:15', reminder: true },
        { type: 'feeding', title: '午后奶', startTime: '15:15', endTime: '15:45', reminder: true },
        { type: 'play', title: '精细动作训练', startTime: '16:00', endTime: '17:00', reminder: false },
        { type: 'feeding', title: '傍晚奶', startTime: '17:30', endTime: '18:00', reminder: true },
        { type: 'bath', title: '睡前沐浴', startTime: '18:30', endTime: '19:15', reminder: true },
        { type: 'feeding', title: '睡前奶', startTime: '19:30', endTime: '20:00', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '20:15', endTime: '07:00', reminder: true },
      ],
    },
    {
      id: 'tpl-6-9m',
      name: '大婴儿作息·辅食期',
      ageRange: '6-9m',
      description: '三餐2点2觉，引入两顿辅食，逐步过渡到2次小睡',
      source: 'official',
      popularity: 90,
      activities: [
        { type: 'wake', title: '起床·洗漱', startTime: '07:00', endTime: '07:20', reminder: true },
        { type: 'feeding', title: '晨奶', startTime: '07:20', endTime: '07:50', reminder: true },
        { type: 'outdoor', title: '晨间户外', startTime: '08:00', endTime: '09:00', reminder: false },
        { type: 'nap', title: '上午觉', startTime: '09:15', endTime: '10:30', reminder: true },
        { type: 'feeding', title: '辅食1餐+奶', startTime: '10:45', endTime: '11:30', reminder: true },
        { type: 'play', title: '爬行练习', startTime: '11:45', endTime: '12:45', reminder: false },
        { type: 'nap', title: '午后长觉', startTime: '13:00', endTime: '15:30', reminder: true },
        { type: 'feeding', title: '辅食2餐+奶', startTime: '15:30', endTime: '16:15', reminder: true },
        { type: 'play', title: '亲子阅读', startTime: '16:30', endTime: '17:30', reminder: false },
        { type: 'feeding', title: '加餐奶', startTime: '17:30', endTime: '17:55', reminder: true },
        { type: 'bath', title: '洗澡抚触', startTime: '18:30', endTime: '19:15', reminder: true },
        { type: 'feeding', title: '睡前奶', startTime: '19:30', endTime: '20:00', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '20:15', endTime: '07:00', reminder: true },
      ],
    },
    {
      id: 'tpl-9-12m',
      name: '学步前期作息',
      ageRange: '9-12m',
      description: '三次正餐，过渡到一次午后长觉，增加活动量',
      source: 'official',
      popularity: 88,
      activities: [
        { type: 'wake', title: '起床', startTime: '07:00', endTime: '07:20', reminder: true },
        { type: 'feeding', title: '早餐（辅食+奶）', startTime: '07:30', endTime: '08:15', reminder: true },
        { type: 'play', title: '晨间活动', startTime: '08:30', endTime: '09:30', reminder: false },
        { type: 'outdoor', title: '户外散步', startTime: '09:30', endTime: '10:30', reminder: false },
        { type: 'feeding', title: '上午加餐', startTime: '10:30', endTime: '10:50', reminder: true },
        { type: 'feeding', title: '午餐（正餐）', startTime: '11:30', endTime: '12:15', reminder: true },
        { type: 'nap', title: '午后长觉', startTime: '12:45', endTime: '15:15', reminder: true },
        { type: 'feeding', title: '下午加餐', startTime: '15:30', endTime: '15:50', reminder: true },
        { type: 'play', title: '站立/学步练习', startTime: '16:00', endTime: '17:30', reminder: false },
        { type: 'feeding', title: '晚餐（正餐）', startTime: '17:45', endTime: '18:30', reminder: true },
        { type: 'bath', title: '睡前洗澡', startTime: '19:00', endTime: '19:45', reminder: true },
        { type: 'feeding', title: '睡前奶', startTime: '20:00', endTime: '20:25', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '20:40', endTime: '07:00', reminder: true },
      ],
    },
    {
      id: 'tpl-12-18m',
      name: '学步儿作息',
      ageRange: '12-18m',
      description: '三餐两点一午睡，活动丰富，注意自主进食训练',
      source: 'official',
      popularity: 85,
      activities: [
        { type: 'wake', title: '起床·洗漱更衣', startTime: '07:00', endTime: '07:30', reminder: true },
        { type: 'feeding', title: '早餐', startTime: '07:30', endTime: '08:15', reminder: true },
        { type: 'outdoor', title: '晨间户外活动', startTime: '08:30', endTime: '10:00', reminder: false },
        { type: 'feeding', title: '上午加餐', startTime: '10:00', endTime: '10:20', reminder: true },
        { type: 'play', title: '室内活动/益智游戏', startTime: '10:30', endTime: '11:30', reminder: false },
        { type: 'feeding', title: '午餐', startTime: '11:45', endTime: '12:30', reminder: true },
        { type: 'nap', title: '午觉', startTime: '13:00', endTime: '15:30', reminder: true },
        { type: 'feeding', title: '下午加餐', startTime: '15:30', endTime: '15:50', reminder: true },
        { type: 'outdoor', title: '午后户外活动', startTime: '16:00', endTime: '17:30', reminder: false },
        { type: 'feeding', title: '晚餐', startTime: '17:45', endTime: '18:30', reminder: true },
        { type: 'bath', title: '洗澡', startTime: '19:00', endTime: '19:40', reminder: true },
        { type: 'play', title: '亲子共读', startTime: '19:40', endTime: '20:15', reminder: false },
        { type: 'feeding', title: '睡前奶', startTime: '20:15', endTime: '20:40', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '20:50', endTime: '07:00', reminder: true },
      ],
    },
    {
      id: 'tpl-18-24m',
      name: '幼儿作息·入园准备',
      ageRange: '18-24m',
      description: '向幼儿园作息过渡，自主进食、规律如厕训练',
      source: 'official',
      popularity: 82,
      activities: [
        { type: 'wake', title: '起床·如厕·洗漱', startTime: '07:00', endTime: '07:30', reminder: true },
        { type: 'feeding', title: '早餐', startTime: '07:30', endTime: '08:10', reminder: true },
        { type: 'outdoor', title: '晨间户外', startTime: '08:30', endTime: '10:00', reminder: false },
        { type: 'feeding', title: '上午点心', startTime: '10:00', endTime: '10:20', reminder: true },
        { type: 'play', title: '主题活动/早教', startTime: '10:30', endTime: '11:30', reminder: false },
        { type: 'feeding', title: '午餐', startTime: '11:45', endTime: '12:30', reminder: true },
        { type: 'nap', title: '午觉', startTime: '13:00', endTime: '15:00', reminder: true },
        { type: 'feeding', title: '下午点心', startTime: '15:00', endTime: '15:20', reminder: true },
        { type: 'play', title: '创意/艺术活动', startTime: '15:30', endTime: '16:30', reminder: false },
        { type: 'outdoor', title: '傍晚户外活动', startTime: '16:30', endTime: '17:30', reminder: false },
        { type: 'feeding', title: '晚餐', startTime: '17:45', endTime: '18:30', reminder: true },
        { type: 'bath', title: '洗澡', startTime: '19:00', endTime: '19:40', reminder: true },
        { type: 'play', title: '亲子共读', startTime: '19:45', endTime: '20:20', reminder: false },
        { type: 'feeding', title: '睡前奶', startTime: '20:20', endTime: '20:45', reminder: true },
        { type: 'sleep', title: '夜间睡眠', startTime: '21:00', endTime: '07:00', reminder: true },
      ],
    },
  ]
}

export function useSchedule() {
  const scheduleTemplates = getDefaultTemplates()

  const currentBabyPlans = computed<SchedulePlan[]>(() =>
    schedulePlans.value.filter(p => p.babyId === currentBabyId.value)
  )

  const activePlan = computed<SchedulePlan | null>(() => {
    const active = currentBabyPlans.value.find(p => p.isActive)
    if (active) return active
    return currentBabyPlans.value[0] || null
  })

  function getBabyAgeMonths(birthDateStr: string): number {
    const birth = new Date(birthDateStr)
    const now = new Date()
    let months = (now.getFullYear() - birth.getFullYear()) * 12
    months += now.getMonth() - birth.getMonth()
    return Math.max(0, months)
  }

  function getAgeRangeForMonths(months: number): ScheduleTemplateAgeRange {
    if (months < 1) return '0-1m'
    if (months < 3) return '1-3m'
    if (months < 6) return '3-6m'
    if (months < 9) return '6-9m'
    if (months < 12) return '9-12m'
    if (months < 18) return '12-18m'
    return '18-24m'
  }

  function getRecommendedTemplates(birthDate?: string): ScheduleTemplate[] {
    if (!birthDate) {
      return scheduleTemplates.slice(0, 3)
    }
    const months = getBabyAgeMonths(birthDate)
    const targetRange = getAgeRangeForMonths(months)
    const exact = scheduleTemplates.filter(t => t.ageRange === targetRange)
    if (exact.length > 0) return exact
    const idx = SCHEDULE_TEMPLATE_AGE_RANGES.findIndex(r => r.value === targetRange)
    const nearby: ScheduleTemplate[] = []
    if (idx > 0) {
      const prev = scheduleTemplates.filter(t => t.ageRange === SCHEDULE_TEMPLATE_AGE_RANGES[idx - 1].value)
      nearby.push(...prev)
    }
    nearby.push(...scheduleTemplates.slice(0, 2))
    return nearby.slice(0, 3)
  }

  function getAllTemplates(): ScheduleTemplate[] {
    return scheduleTemplates
  }

  function getAgeRangeLabel(range: ScheduleTemplateAgeRange): string {
    return SCHEDULE_TEMPLATE_AGE_RANGES.find(r => r.value === range)?.label || range
  }

  function createPlan(data: {
    name: string
    description?: string
    activities: Omit<ScheduleActivity, 'id'>[]
    setAsActive?: boolean
  }): SchedulePlan | null {
    if (!canAddRecord.value && !canManageBabies.value) return null
    if (!currentBabyId.value) return null

    if (data.setAsActive) {
      schedulePlans.value.forEach(p => {
        if (p.babyId === currentBabyId.value) p.isActive = false
      })
    }

    const now = new Date().toISOString()
    const newPlan: SchedulePlan = {
      id: genId(),
      babyId: currentBabyId.value,
      name: data.name,
      description: data.description,
      activities: data.activities.map(a => ({ ...a, id: genId() })),
      isActive: !!data.setAsActive || currentBabyPlans.value.length === 0,
      createdAt: now,
      updatedAt: now,
    }
    schedulePlans.value.push(newPlan)
    persistData()
    return newPlan
  }

  function applyTemplate(templateId: string, overrideName?: string): SchedulePlan | null {
    const tpl = scheduleTemplates.find(t => t.id === templateId)
    if (!tpl) return null
    return createPlan({
      name: overrideName || tpl.name,
      description: tpl.description,
      activities: tpl.activities.map(a => ({ ...a })),
      setAsActive: true,
    })
  }

  function updatePlan(planId: string, data: Partial<Omit<SchedulePlan, 'id' | 'babyId' | 'createdAt'>>) {
    if (!canAddRecord.value && !canManageBabies.value) return
    const idx = schedulePlans.value.findIndex(p => p.id === planId && p.babyId === currentBabyId.value)
    if (idx < 0) return
    schedulePlans.value[idx] = {
      ...schedulePlans.value[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    if (data.isActive) {
      schedulePlans.value.forEach((p, i) => {
        if (i !== idx && p.babyId === currentBabyId.value) p.isActive = false
      })
    }
    persistData()
  }

  function setActivePlan(planId: string) {
    if (!canAddRecord.value && !canManageBabies.value) return
    schedulePlans.value.forEach(p => {
      if (p.babyId === currentBabyId.value) {
        p.isActive = p.id === planId
        p.updatedAt = new Date().toISOString()
      }
    })
    persistData()
  }

  function deletePlan(planId: string) {
    if (!canManageBabies.value) return
    const plan = schedulePlans.value.find(p => p.id === planId)
    if (!plan) return
    schedulePlans.value = schedulePlans.value.filter(p => p.id !== planId)
    scheduleExecutions.value = scheduleExecutions.value.filter(e => e.planId !== planId)
    if (plan.isActive && currentBabyPlans.value.length > 0) {
      currentBabyPlans.value[0].isActive = true
    }
    persistData()
  }

  function addActivityToPlan(planId: string, activity: Omit<ScheduleActivity, 'id'>) {
    if (!canAddRecord.value && !canManageBabies.value) return
    const plan = schedulePlans.value.find(p => p.id === planId)
    if (!plan) return
    plan.activities.push({ ...activity, id: genId() })
    sortActivitiesByTime(plan.activities)
    plan.updatedAt = new Date().toISOString()
    persistData()
  }

  function updateActivityInPlan(planId: string, activityId: string, data: Partial<ScheduleActivity>) {
    if (!canAddRecord.value && !canManageBabies.value) return
    const plan = schedulePlans.value.find(p => p.id === planId)
    if (!plan) return
    const idx = plan.activities.findIndex(a => a.id === activityId)
    if (idx < 0) return
    plan.activities[idx] = { ...plan.activities[idx], ...data }
    sortActivitiesByTime(plan.activities)
    plan.updatedAt = new Date().toISOString()
    persistData()
  }

  function removeActivityFromPlan(planId: string, activityId: string) {
    if (!canAddRecord.value && !canManageBabies.value) return
    const plan = schedulePlans.value.find(p => p.id === planId)
    if (!plan) return
    plan.activities = plan.activities.filter(a => a.id !== activityId)
    plan.updatedAt = new Date().toISOString()
    persistData()
  }

  function sortActivitiesByTime(activities: ScheduleActivity[]) {
    activities.sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number)
      const [bh, bm] = b.startTime.split(':').map(Number)
      return ah * 60 + am - (bh * 60 + bm)
    })
  }

  function getDateStr(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }

  function getExecutionsForDate(date: Date, planId?: string): ScheduleExecution[] {
    const dateStr = getDateStr(date)
    let list = scheduleExecutions.value.filter(e =>
      e.babyId === currentBabyId.value && e.date === dateStr
    )
    if (planId) list = list.filter(e => e.planId === planId)
    return list.sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime))
  }

  function ensureDailyExecutions(plan: SchedulePlan, date: Date): ScheduleExecution[] {
    const dateStr = getDateStr(date)
    const existing = getExecutionsForDate(date, plan.id)

    if (existing.length > 0) return existing

    const now = new Date().toISOString()
    const newExecs: ScheduleExecution[] = plan.activities.map(a => ({
      id: genId(),
      planId: plan.id,
      activityId: a.id,
      babyId: plan.babyId,
      date: dateStr,
      scheduledStartTime: a.startTime,
      scheduledEndTime: a.endTime,
      status: 'pending',
      createdBy: currentUserId.value,
      createdAt: now,
      updatedAt: now,
    }))
    scheduleExecutions.value.push(...newExecs)
    persistData()
    return newExecs
  }

  function getActivityForExecution(exec: ScheduleExecution): ScheduleActivity | null {
    const plan = schedulePlans.value.find(p => p.id === exec.planId)
    if (!plan) return null
    return plan.activities.find(a => a.id === exec.activityId) || null
  }

  function parseTimeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  function calculateDeviation(scheduledStart: string, actualStart?: string): number | undefined {
    if (!actualStart) return undefined
    return parseTimeToMinutes(actualStart) - parseTimeToMinutes(scheduledStart)
  }

  function updateExecutionStatus(executionId: string, status: ScheduleExecutionStatus, actualTime?: string, note?: string) {
    if (!canAddRecord.value) return
    const idx = scheduleExecutions.value.findIndex(e => e.id === executionId)
    if (idx < 0) return

    const exec = scheduleExecutions.value[idx]
    const nowTime = new Date()
    const nowTimeStr = `${nowTime.getHours().toString().padStart(2, '0')}:${nowTime.getMinutes().toString().padStart(2, '0')}`

    if (status === 'ongoing' || status === 'completed') {
      if (!exec.actualStartTime) {
        exec.actualStartTime = actualTime || nowTimeStr
      }
    }
    if (status === 'completed') {
      if (!exec.actualEndTime) {
        exec.actualEndTime = actualTime || nowTimeStr
      }
      exec.deviationMinutes = calculateDeviation(exec.scheduledStartTime, exec.actualStartTime)
    }
    if (note !== undefined) exec.note = note
    exec.status = status
    exec.updatedAt = new Date().toISOString()

    scheduleExecutions.value[idx] = { ...exec }
    persistData()
  }

  function markActivityStart(executionId: string) {
    updateExecutionStatus(executionId, 'ongoing')
  }

  function markActivityComplete(executionId: string) {
    updateExecutionStatus(executionId, 'completed')
  }

  function markActivitySkipped(executionId: string, note?: string) {
    updateExecutionStatus(executionId, 'skipped', undefined, note)
  }

  function markActivityDelayed(executionId: string, note?: string) {
    updateExecutionStatus(executionId, 'delayed', undefined, note)
  }

  function getDailyDeviation(date: Date, planId?: string): ScheduleDailyDeviation | null {
    const execs = getExecutionsForDate(date, planId)
    if (execs.length === 0) return null

    const total = execs.length
    const completed = execs.filter(e => e.status === 'completed').length
    const skipped = execs.filter(e => e.status === 'skipped').length
    const delayed = execs.filter(e => e.status === 'delayed').length
    const withDeviation = execs.filter(e => typeof e.deviationMinutes === 'number')
    const absDeviations = withDeviation.map(e => Math.abs(e.deviationMinutes!))
    const maxDev = absDeviations.length > 0 ? Math.max(...absDeviations) : 0
    const avgDev = absDeviations.length > 0
      ? absDeviations.reduce((a, b) => a + b, 0) / absDeviations.length
      : 0
    const onTime = withDeviation.filter(e => Math.abs(e.deviationMinutes!) <= 15).length
    const onTimeRate = withDeviation.length > 0 ? onTime / withDeviation.length : 0

    return {
      date: getDateStr(date),
      totalActivities: total,
      completedCount: completed,
      skippedCount: skipped,
      delayedCount: delayed,
      completionRate: total > 0 ? completed / total : 0,
      avgDeviationMinutes: Math.round(avgDev),
      maxDeviationMinutes: maxDev,
      onTimeRate: Math.round(onTimeRate * 100),
    }
  }

  function getDeviationAnalysis(days: number = 7, planId?: string): ScheduleDeviationAnalysis {
    const dailyDeviations: ScheduleDailyDeviation[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dev = getDailyDeviation(d, planId)
      if (dev) dailyDeviations.push(dev)
    }

    const validDays = dailyDeviations.filter(d => d.totalActivities > 0)
    const overallCompletion = validDays.length > 0
      ? validDays.reduce((a, d) => a + d.completionRate, 0) / validDays.length
      : 0
    const overallOnTime = validDays.length > 0
      ? validDays.reduce((a, d) => a + d.onTimeRate, 0) / validDays.length
      : 0
    const allDeviations = validDays.map(d => d.avgDeviationMinutes).filter(v => v >= 0)
    const avgDev = allDeviations.length > 0
      ? allDeviations.reduce((a, b) => a + b, 0) / allDeviations.length
      : 0

    const delayCounts: Record<string, number> = {}
    const delaySums: Record<string, number> = {}
    const skipCounts: Record<string, number> = {}

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const execs = getExecutionsForDate(d, planId)
      for (const exec of execs) {
        const activity = getActivityForExecution(exec)
        const type = activity?.type || 'other'
        if (exec.status === 'delayed' || (exec.status === 'completed' && (exec.deviationMinutes || 0) > 15)) {
          delayCounts[type] = (delayCounts[type] || 0) + 1
          delaySums[type] = (delaySums[type] || 0) + Math.abs(exec.deviationMinutes || 0)
        }
        if (exec.status === 'skipped') {
          skipCounts[type] = (skipCounts[type] || 0) + 1
        }
      }
    }

    const mostDelayed = Object.entries(delayCounts)
      .map(([type, count]) => ({
        activityType: type as ScheduleActivityType,
        count,
        avgDelay: delaySums[type] ? Math.round(delaySums[type] / count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const mostSkipped = Object.entries(skipCounts)
      .map(([type, count]) => ({ activityType: type as ScheduleActivityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    let bestDay: string | null = null
    let worstDay: string | null = null
    let bestScore = -Infinity
    let worstScore = Infinity

    for (const d of validDays) {
      const score = d.completionRate * 0.6 + (d.onTimeRate / 100) * 0.4
      if (score > bestScore) {
        bestScore = score
        bestDay = d.date
      }
      if (score < worstScore) {
        worstScore = score
        worstDay = d.date
      }
    }

    let trend: 'improving' | 'worsening' | 'stable' = 'stable'
    if (validDays.length >= 4) {
      const half = Math.floor(validDays.length / 2)
      const firstHalf = validDays.slice(0, half)
      const secondHalf = validDays.slice(half)
      const firstAvg = firstHalf.reduce((a, d) => a + d.completionRate * 0.6 + (d.onTimeRate / 100) * 0.4, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, d) => a + d.completionRate * 0.6 + (d.onTimeRate / 100) * 0.4, 0) / secondHalf.length
      const diff = secondAvg - firstAvg
      if (diff > 0.05) trend = 'improving'
      else if (diff < -0.05) trend = 'worsening'
    }

    const suggestions: string[] = []
    if (overallCompletion < 0.6) {
      suggestions.push('整体完成率偏低，建议简化日程安排，减少活动数量，优先保证核心作息（喂奶、睡眠）。')
    }
    if (overallOnTime < 50) {
      suggestions.push('准时率偏低，活动间隔可能过于紧凑，建议预留更多缓冲时间。')
    }
    if (mostDelayed.length > 0) {
      const topDelay = mostDelayed[0]
      suggestions.push(`"${SCHEDULE_ACTIVITY_LABELS[topDelay.activityType]}"延迟最频繁（${topDelay.count}次），平均延迟${topDelay.avgDelay}分钟，建议检查前置活动安排。`)
    }
    if (mostSkipped.length > 0) {
      const topSkip = mostSkipped[0]
      suggestions.push(`"${SCHEDULE_ACTIVITY_LABELS[topSkip.activityType]}"最常被跳过（${topSkip.count}次），可考虑取消或调整到更合适的时间。`)
    }
    if (avgDev > 30) {
      suggestions.push(`平均偏差${Math.round(avgDev)}分钟，偏差较大，建议逐步收紧时间容差，培养时间观念。`)
    }
    if (trend === 'improving') {
      suggestions.push('执行情况在持续改善，请继续保持当前节奏！')
    } else if (trend === 'worsening') {
      suggestions.push('近期执行质量有所下降，建议回顾近期变化，适当调整日程或作息策略。')
    }
    if (suggestions.length === 0) {
      suggestions.push('执行情况良好，保持当前节奏即可。可尝试逐步引入新的活动内容。')
    }

    return {
      periodDays: days,
      dailyDeviations,
      overallCompletionRate: Math.round(overallCompletion * 100),
      overallOnTimeRate: Math.round(overallOnTime),
      avgDeviationMinutes: Math.round(avgDev),
      mostDelayedActivities: mostDelayed,
      mostSkippedActivities: mostSkipped,
      bestPerformingDay: bestDay,
      worstPerformingDay: worstDay,
      suggestions,
      trend,
    }
  }

  return {
    schedulePlans,
    scheduleExecutions,
    scheduleTemplates,
    currentBabyPlans,
    activePlan,
    getAllTemplates,
    getRecommendedTemplates,
    getAgeRangeLabel,
    getBabyAgeMonths,
    getAgeRangeForMonths,
    createPlan,
    applyTemplate,
    updatePlan,
    setActivePlan,
    deletePlan,
    addActivityToPlan,
    updateActivityInPlan,
    removeActivityFromPlan,
    getExecutionsForDate,
    ensureDailyExecutions,
    getActivityForExecution,
    updateExecutionStatus,
    markActivityStart,
    markActivityComplete,
    markActivitySkipped,
    markActivityDelayed,
    getDailyDeviation,
    getDeviationAnalysis,
  }
}
