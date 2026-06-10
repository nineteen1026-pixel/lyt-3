import type { FeedingRecord, SleepRecord, DiaperRecord, GrowthRecord, VaccineRecord, CheckupRecord, Medicine, MedicineUsage, StockChangeRecord, ReminderItem } from '@/types'

export interface AgePreset {
  label: string
  minMonth: number
  maxMonth: number
  description: string
  feeding: {
    avgIntervalMin: number
    defaultType: 'breast' | 'formula'
    typicalAmount: number
    dailyCount: number
  }
  sleep: {
    nightDurationMin: number
    napCount: number
    napDurationMin: number
    avgWakeMin: number
  }
  diaper: {
    dailyCount: number
    wetRatio: number
    dirtyRatio: number
  }
  reminderDefaults: {
    feedingIntervalMin: number
    diaperIntervalMin: number
    sleepWakeMin: number
  }
  dailyCare: {
    bathTime?: string
    sunStartTime?: string
    sunEndTime?: string
    tummyTimeMin: number
  }
  medicines: string[]
  milestones: string[]
}

export const AGE_PRESETS: AgePreset[] = [
  {
    label: '新生儿',
    minMonth: 0,
    maxMonth: 1,
    description: '按需喂养，频繁哺乳，睡眠不规律',
    feeding: { avgIntervalMin: 120, defaultType: 'breast', typicalAmount: 0, dailyCount: 8 },
    sleep: { nightDurationMin: 330, napCount: 4, napDurationMin: 60, avgWakeMin: 60 },
    diaper: { dailyCount: 8, wetRatio: 0.5, dirtyRatio: 0.3 },
    reminderDefaults: { feedingIntervalMin: 120, diaperIntervalMin: 150, sleepWakeMin: 75 },
    dailyCare: { bathTime: '20:00', tummyTimeMin: 5, sunStartTime: '09:00', sunEndTime: '10:00' },
    medicines: ['伊可新维生素AD滴剂'],
    milestones: ['追视红球', '对声音有反应', '握持反射'],
  },
  {
    label: '1-3个月',
    minMonth: 1,
    maxMonth: 3,
    description: '喂养间隔逐渐延长，开始有昼夜区分',
    feeding: { avgIntervalMin: 150, defaultType: 'breast', typicalAmount: 60, dailyCount: 7 },
    sleep: { nightDurationMin: 360, napCount: 3, napDurationMin: 75, avgWakeMin: 90 },
    diaper: { dailyCount: 7, wetRatio: 0.5, dirtyRatio: 0.25 },
    reminderDefaults: { feedingIntervalMin: 150, diaperIntervalMin: 180, sleepWakeMin: 100 },
    dailyCare: { bathTime: '20:00', tummyTimeMin: 10, sunStartTime: '08:30', sunEndTime: '09:30' },
    medicines: ['伊可新维生素AD滴剂'],
    milestones: ['会抬头', '发出咿呀声', '会微笑', '能追视移动物体'],
  },
  {
    label: '3-6个月',
    minMonth: 3,
    maxMonth: 6,
    description: '夜奶减少，可开始添加辅食',
    feeding: { avgIntervalMin: 180, defaultType: 'breast', typicalAmount: 120, dailyCount: 6 },
    sleep: { nightDurationMin: 420, napCount: 3, napDurationMin: 80, avgWakeMin: 110 },
    diaper: { dailyCount: 6, wetRatio: 0.5, dirtyRatio: 0.2 },
    reminderDefaults: { feedingIntervalMin: 180, diaperIntervalMin: 200, sleepWakeMin: 120 },
    dailyCare: { bathTime: '20:30', tummyTimeMin: 15, sunStartTime: '08:00', sunEndTime: '09:00' },
    medicines: ['伊可新维生素AD滴剂'],
    milestones: ['翻身', '抓握玩具', '认出妈妈', '会大笑'],
  },
  {
    label: '6-12个月',
    minMonth: 6,
    maxMonth: 12,
    description: '辅食渐增，睡眠趋于规律',
    feeding: { avgIntervalMin: 210, defaultType: 'formula', typicalAmount: 150, dailyCount: 5 },
    sleep: { nightDurationMin: 540, napCount: 2, napDurationMin: 90, avgWakeMin: 150 },
    diaper: { dailyCount: 5, wetRatio: 0.45, dirtyRatio: 0.25 },
    reminderDefaults: { feedingIntervalMin: 210, diaperIntervalMin: 240, sleepWakeMin: 170 },
    dailyCare: { bathTime: '20:30', tummyTimeMin: 20, sunStartTime: '07:30', sunEndTime: '08:30' },
    medicines: ['伊可新维生素AD滴剂', '妈咪爱益生菌'],
    milestones: ['独坐', '爬行', '长牙', '叫爸爸妈妈', '手指捏物'],
  },
  {
    label: '12-24个月',
    minMonth: 12,
    maxMonth: 24,
    description: '三餐为主，奶量减少，活动量增大',
    feeding: { avgIntervalMin: 270, defaultType: 'formula', typicalAmount: 180, dailyCount: 3 },
    sleep: { nightDurationMin: 600, napCount: 1, napDurationMin: 120, avgWakeMin: 240 },
    diaper: { dailyCount: 4, wetRatio: 0.45, dirtyRatio: 0.25 },
    reminderDefaults: { feedingIntervalMin: 270, diaperIntervalMin: 300, sleepWakeMin: 270 },
    dailyCare: { bathTime: '21:00', tummyTimeMin: 30, sunStartTime: '07:00', sunEndTime: '08:00' },
    medicines: ['伊可新维生素AD滴剂', '美林布洛芬混悬液', '婴儿润肤乳'],
    milestones: ['独走', '说单词', '用勺子', '指出身体部位', '搭积木'],
  },
  {
    label: '2岁以上',
    minMonth: 24,
    maxMonth: 999,
    description: '自主进食，白天一次午觉',
    feeding: { avgIntervalMin: 360, defaultType: 'formula', typicalAmount: 200, dailyCount: 2 },
    sleep: { nightDurationMin: 660, napCount: 1, napDurationMin: 90, avgWakeMin: 360 },
    diaper: { dailyCount: 3, wetRatio: 0.5, dirtyRatio: 0.2 },
    reminderDefaults: { feedingIntervalMin: 360, diaperIntervalMin: 360, sleepWakeMin: 390 },
    dailyCare: { bathTime: '21:00', tummyTimeMin: 60, sunStartTime: '06:30', sunEndTime: '07:30' },
    medicines: ['伊可新维生素AD滴剂', '美林布洛芬混悬液'],
    milestones: ['跑跳', '说短句', '自己吃饭', '穿简单衣物', '数数字'],
  },
]

export function getPresetByAge(months: number): AgePreset {
  return AGE_PRESETS.find(p => months >= p.minMonth && months < p.maxMonth) || AGE_PRESETS[AGE_PRESETS.length - 1]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function d(offset: number, hour: number, min: number, base: Date): string {
  const dt = new Date(base.getTime() + offset * 86400000 + hour * 3600000 + min * 60000)
  return dt.toISOString()
}

export interface ReminderTemplate {
  type: string
  getTitle: (preset: AgePreset) => string
  getDescription: (preset: AgePreset) => string
  priority: 'high' | 'medium' | 'low'
  enabled: boolean
}

export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    type: 'feeding',
    getTitle: () => '该喂奶了',
    getDescription: (p) => `建议每${p.reminderDefaults.feedingIntervalMin}分钟喂养一次`,
    priority: 'medium',
    enabled: true,
  },
  {
    type: 'diaper',
    getTitle: () => '该换尿布了',
    getDescription: (p) => `建议每${p.reminderDefaults.diaperIntervalMin}分钟检查更换`,
    priority: 'low',
    enabled: true,
  },
  {
    type: 'sleep',
    getTitle: () => '该哄睡了',
    getDescription: (p) => `清醒约${p.reminderDefaults.sleepWakeMin}分钟后建议入睡`,
    priority: 'medium',
    enabled: true,
  },
  {
    type: 'medicine_vitamin',
    getTitle: () => '补充维生素AD',
    getDescription: () => '每日一粒，促进钙吸收',
    priority: 'medium',
    enabled: true,
  },
  {
    type: 'tummy_time',
    getTitle: (p) => `趴练${p.dailyCare.tummyTimeMin}分钟`,
    getDescription: () => '锻炼颈部和背部肌肉',
    priority: 'low',
    enabled: true,
  },
  {
    type: 'bath',
    getTitle: () => '洗澡时间',
    getDescription: () => '睡前洗澡有助睡眠',
    priority: 'low',
    enabled: true,
  },
  {
    type: 'sunlight',
    getTitle: () => '晒太阳',
    getDescription: () => '户外活动1小时，促进维生素D合成',
    priority: 'low',
    enabled: true,
  },
]

export function generateSmartReminders(
  babyId: string,
  birthDate: string,
  enabledTypes: Record<string, boolean>,
): ReminderItem[] {
  const birth = new Date(birthDate)
  const now = new Date()
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  const preset = getPresetByAge(ageMonths)
  const reminders: ReminderItem[] = []
  const nowTime = new Date()

  const addReminder = (
    idSuffix: string,
    type: string,
    title: string,
    description: string,
    offsetMin: number,
    priority: 'high' | 'medium' | 'low',
  ) => {
    const reminderType = type.startsWith('medicine') ? 'feeding' :
      type === 'tummy_time' || type === 'bath' || type === 'sunlight' ? 'diaper' :
      (type as 'feeding' | 'sleep' | 'diaper')
    reminders.push({
      id: `sr-${idSuffix}`,
      type: reminderType,
      title,
      description,
      scheduledTime: new Date(nowTime.getTime() + offsetMin * 60000).toISOString(),
      status: 'pending',
      priority,
      babyId,
      createdAt: nowTime.toISOString(),
    })
  }

  if (enabledTypes.feeding !== false) {
    addReminder('feed-1', 'feeding',
      DEFAULT_REMINDER_TEMPLATES[0].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[0].getDescription(preset),
      preset.reminderDefaults.feedingIntervalMin,
      'medium',
    )
  }

  if (enabledTypes.diaper !== false) {
    addReminder('diaper-1', 'diaper',
      DEFAULT_REMINDER_TEMPLATES[1].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[1].getDescription(preset),
      preset.reminderDefaults.diaperIntervalMin,
      'low',
    )
  }

  if (enabledTypes.sleep !== false) {
    addReminder('sleep-1', 'sleep',
      DEFAULT_REMINDER_TEMPLATES[2].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[2].getDescription(preset),
      preset.reminderDefaults.sleepWakeMin,
      'medium',
    )
  }

  if (enabledTypes.medicine_vitamin !== false) {
    addReminder('vitad-1', 'medicine_vitamin',
      DEFAULT_REMINDER_TEMPLATES[3].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[3].getDescription(preset),
      60,
      'medium',
    )
  }

  if (enabledTypes.tummy_time !== false && preset.dailyCare.tummyTimeMin > 0) {
    addReminder('tummy-1', 'tummy_time',
      DEFAULT_REMINDER_TEMPLATES[4].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[4].getDescription(preset),
      180,
      'low',
    )
  }

  if (enabledTypes.bath !== false && preset.dailyCare.bathTime) {
    const [h, m] = preset.dailyCare.bathTime.split(':').map(Number)
    const bathToday = new Date()
    bathToday.setHours(h, m, 0, 0)
    const offset = bathToday.getTime() < nowTime.getTime()
      ? Math.round((bathToday.getTime() + 86400000 - nowTime.getTime()) / 60000)
      : Math.round((bathToday.getTime() - nowTime.getTime()) / 60000)
    addReminder('bath-1', 'bath',
      DEFAULT_REMINDER_TEMPLATES[5].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[5].getDescription(preset),
      offset,
      'low',
    )
  }

  if (enabledTypes.sunlight !== false && preset.dailyCare.sunStartTime) {
    const [h, m] = preset.dailyCare.sunStartTime.split(':').map(Number)
    const sunToday = new Date()
    sunToday.setHours(h, m, 0, 0)
    const offset = sunToday.getTime() < nowTime.getTime()
      ? Math.round((sunToday.getTime() + 86400000 - nowTime.getTime()) / 60000)
      : Math.round((sunToday.getTime() - nowTime.getTime()) / 60000)
    addReminder('sun-1', 'sunlight',
      DEFAULT_REMINDER_TEMPLATES[6].getTitle(preset),
      DEFAULT_REMINDER_TEMPLATES[6].getDescription(preset),
      offset,
      'low',
    )
  }

  const nextVaccine = getNextVaccine(birthDate)
  if (nextVaccine && enabledTypes.vaccine !== false) {
    const daysUntil = Math.max(0, Math.round((nextVaccine.targetDate.getTime() - nowTime.getTime()) / 86400000))
    addReminder('vaccine-next', 'vaccine',
      `疫苗提醒：${nextVaccine.name}`,
      daysUntil === 0 ? '今天建议接种' : `还有${daysUntil}天到建议月龄`,
      Math.max(60, daysUntil * 24 * 60),
      'high',
    )
  }

  const nextCheckup = getNextCheckup(birthDate)
  if (nextCheckup && enabledTypes.checkup !== false) {
    const daysUntil = Math.max(0, Math.round((nextCheckup.targetDate.getTime() - nowTime.getTime()) / 86400000))
    addReminder('checkup-next', 'checkup',
      `体检提醒：${nextCheckup.label}`,
      daysUntil === 0 ? '今天建议体检' : `还有${daysUntil}天到建议月龄`,
      Math.max(120, daysUntil * 24 * 60),
      'medium',
    )
  }

  return reminders
}

function getNextVaccine(birthDate: string): { name: string; targetDate: Date } | null {
  const schedule: { name: string; month: number }[] = [
    { name: '乙肝疫苗（第1剂）', month: 0 },
    { name: '卡介苗', month: 0 },
    { name: '乙肝疫苗（第2剂）', month: 1 },
    { name: '脊灰灭活疫苗（第1剂）', month: 2 },
    { name: '百白破疫苗（第1剂）', month: 3 },
    { name: '脊灰灭活疫苗（第2剂）', month: 3 },
    { name: '百白破疫苗（第2剂）', month: 4 },
    { name: '百白破疫苗（第3剂）', month: 5 },
    { name: '乙肝疫苗（第3剂）', month: 6 },
    { name: 'A群流脑疫苗（第1剂）', month: 6 },
    { name: '麻腮风疫苗（第1剂）', month: 8 },
    { name: '乙脑减毒疫苗（第1剂）', month: 8 },
    { name: '甲肝减毒疫苗', month: 18 },
  ]
  const now = new Date()
  const birth = new Date(birthDate)
  for (const v of schedule) {
    const target = new Date(birth)
    target.setMonth(target.getMonth() + v.month)
    if (target.getTime() > now.getTime() - 7 * 86400000) {
      return { name: v.name, targetDate: target }
    }
  }
  return null
}

function getNextCheckup(birthDate: string): { label: string; targetDate: Date } | null {
  const checkupMonths = [0, 1, 3, 6, 8, 12, 18, 24, 30, 36]
  const labels = ['出生体检', '满月体检', '3月龄体检', '6月龄体检', '8月龄体检', '1岁体检', '1.5岁体检', '2岁体检', '2.5岁体检', '3岁体检']
  const now = new Date()
  const birth = new Date(birthDate)
  for (let i = 0; i < checkupMonths.length; i++) {
    const target = new Date(birth)
    target.setMonth(target.getMonth() + checkupMonths[i])
    if (target.getTime() > now.getTime() - 7 * 86400000) {
      return { label: labels[i], targetDate: target }
    }
  }
  return null
}

export function generateSampleData(
  babyId: string,
  userId: string,
  birthDate: string,
  days: number = 3,
  reminderEnabledTypes: Record<string, boolean> = {},
): {
  feedings: FeedingRecord[]
  sleeps: SleepRecord[]
  diapers: DiaperRecord[]
  growths: GrowthRecord[]
  vaccines: VaccineRecord[]
  checkups: CheckupRecord[]
  medicines: Medicine[]
  medicineUsages: MedicineUsage[]
  stockChanges: StockChangeRecord[]
  reminders: ReminderItem[]
} {
  const birth = new Date(birthDate)
  const now = new Date()
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  const preset = getPresetByAge(ageMonths)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const feedings: FeedingRecord[] = []
  const sleeps: SleepRecord[] = []
  const diapers: DiaperRecord[] = []

  for (let dayOffset = -days + 1; dayOffset <= 0; dayOffset++) {
    const feedCount = preset.feeding.dailyCount + randomInt(-1, 1)
    const startHour = dayOffset === 0 ? 6 : 0
    const endHour = dayOffset === 0 ? now.getHours() : 23

    const feedInterval = (endHour - startHour) / Math.max(feedCount, 1)
    for (let i = 0; i < feedCount; i++) {
      const hour = Math.min(startHour + Math.round(feedInterval * i) + randomInt(0, 1), endHour)
      const min = randomInt(0, 59)
      if (hour > endHour) continue
      const isBreast = Math.random() < (preset.feeding.defaultType === 'breast' ? 0.6 : 0.4)
      feedings.push({
        id: `sf-${dayOffset}-${i}`,
        type: 'feeding',
        babyId,
        timestamp: d(dayOffset, hour, min, today),
        feedingType: isBreast ? 'breast' : 'formula',
        duration: isBreast ? randomInt(10, 25) : randomInt(8, 15),
        amount: isBreast ? 0 : preset.feeding.typicalAmount + randomInt(-20, 20),
        note: '',
        createdBy: userId,
        caregiverId: userId,
      })
    }

    const nightStart = dayOffset === 0 ? 0 : 0
    const nightEndHour = dayOffset === 0 ? Math.min(6, endHour) : 6
    if (nightEndHour > nightStart) {
      sleeps.push({
        id: `ss-night-${dayOffset}`,
        type: 'sleep',
        babyId,
        startTime: d(dayOffset, nightStart, randomInt(0, 30), today),
        endTime: d(dayOffset, nightEndHour, randomInt(0, 45), today),
        quality: Math.random() < 0.7 ? 'deep' : 'light',
        note: '夜间睡眠',
        createdBy: userId,
        caregiverId: userId,
      })
    }

    for (let n = 0; n < preset.sleep.napCount; n++) {
      const napStartHour = 8 + n * Math.floor(10 / Math.max(preset.sleep.napCount, 1)) + randomInt(-1, 1)
      if (napStartHour > endHour || (dayOffset === 0 && napStartHour > now.getHours() - 1)) continue
      const napDuration = preset.sleep.napDurationMin + randomInt(-15, 15)
      const napEndHour = napStartHour + Math.floor(napDuration / 60)
      const napEndMin = napDuration % 60
      if (dayOffset === 0 && napEndHour > now.getHours()) continue
      sleeps.push({
        id: `ss-nap-${dayOffset}-${n}`,
        type: 'sleep',
        babyId,
        startTime: d(dayOffset, napStartHour, randomInt(0, 30), today),
        endTime: d(dayOffset, napEndHour, napEndMin, today),
        quality: Math.random() < 0.5 ? 'deep' : Math.random() < 0.7 ? 'light' : 'fussy',
        note: '',
        createdBy: userId,
        caregiverId: userId,
      })
    }

    const diaperCount = preset.diaper.dailyCount + randomInt(-1, 1)
    for (let i = 0; i < diaperCount; i++) {
      const hour = startHour + Math.round((endHour - startHour) / Math.max(diaperCount, 1) * i) + randomInt(0, 1)
      if (hour > endHour) continue
      const rand = Math.random()
      const diaperType = rand < preset.diaper.wetRatio ? 'wet' : rand < preset.diaper.wetRatio + preset.diaper.dirtyRatio ? 'dirty' : 'mixed'
      diapers.push({
        id: `sd-${dayOffset}-${i}`,
        type: 'diaper',
        babyId,
        timestamp: d(dayOffset, hour, randomInt(0, 59), today),
        diaperType,
        note: '',
        createdBy: userId,
        caregiverId: userId,
      })
    }
  }

  const ageDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
  const growths: GrowthRecord[] = []
  const growthCheckpoints = [0, 30, 60, 90, 120, 150, 180]
  for (const cp of growthCheckpoints) {
    if (cp > ageDays) break
    const monthFactor = cp / 30
    growths.push({
      id: `sg-${cp}`,
      type: 'growth',
      babyId,
      timestamp: d(-ageDays + cp, 10, 0, today),
      height: Math.round((50 + monthFactor * 2.5) * 10) / 10,
      weight: Math.round((3.3 + monthFactor * 0.7) * 10) / 10,
      headCircumference: Math.round((34 + monthFactor * 1.2) * 10) / 10,
      note: cp === 0 ? '出生' : '',
      createdBy: userId,
      caregiverId: userId,
    })
  }

  const vaccineSchedule: { name: string; month: number }[] = [
    { name: '乙肝疫苗（第1剂）', month: 0 },
    { name: '卡介苗', month: 0 },
    { name: '乙肝疫苗（第2剂）', month: 1 },
    { name: '脊灰灭活疫苗（第1剂）', month: 2 },
    { name: '百白破疫苗（第1剂）', month: 3 },
    { name: '脊灰灭活疫苗（第2剂）', month: 3 },
    { name: '百白破疫苗（第2剂）', month: 4 },
    { name: '乙肝疫苗（第3剂）', month: 6 },
    { name: 'A群流脑疫苗（第1剂）', month: 6 },
    { name: '百白破疫苗（第3剂）', month: 5 },
    { name: '麻腮风疫苗（第1剂）', month: 8 },
    { name: '乙脑减毒疫苗（第1剂）', month: 8 },
    { name: '甲肝减毒疫苗', month: 18 },
  ]

  const vaccines: VaccineRecord[] = vaccineSchedule.map((v, i) => {
    const plannedDayOffset = -ageDays + v.month * 30
    const isPast = plannedDayOffset < 0
    return {
      id: `sv-${i}`,
      type: 'vaccine',
      babyId,
      name: v.name,
      plannedDate: d(plannedDayOffset, 9, 0, today),
      ...(isPast ? { actualDate: d(plannedDayOffset + randomInt(0, 7), 9, 30, today), status: 'done' as const } : { status: 'planned' as const }),
      location: '社区卫生中心',
      note: '',
      createdBy: userId,
      caregiverId: userId,
    }
  })

  const checkups: CheckupRecord[] = []
  const checkupMonths = [0, 1, 3, 6, 8, 12, 18, 24]
  for (const m of checkupMonths) {
    const offset = -ageDays + m * 30
    if (offset > 0) break
    checkups.push({
      id: `sc-${m}`,
      type: 'checkup',
      babyId,
      timestamp: d(offset, 9, 0, today),
      hospital: m === 0 ? '市妇幼保健院' : '社区卫生中心',
      doctor: m === 0 ? '王医生' : '李医生',
      items: ['体格检查', m === 0 ? '新生儿筛查' : '常规检查'],
      result: '各项指标正常',
      note: m === 0 ? '出生体检' : '',
      createdBy: userId,
      caregiverId: userId,
    })
  }

  const medicineTemplates: Record<string, Omit<Medicine, 'id' | 'babyId' | 'createdBy'>> = {
    '伊可新维生素AD滴剂': { name: '伊可新维生素AD滴剂', category: 'medication', unit: '粒', totalQuantity: 30, remainingQuantity: 22, expiryDate: d(180, 0, 0, today), lowStockThreshold: 5, purchaseDate: d(-10, 0, 0, today), note: '每天一粒' },
    '妈咪爱益生菌': { name: '妈咪爱益生菌', category: 'medication', unit: '袋', totalQuantity: 20, remainingQuantity: 15, expiryDate: d(90, 0, 0, today), lowStockThreshold: 5, purchaseDate: d(-15, 0, 0, today), note: '肠胃调理' },
    '美林布洛芬混悬液': { name: '美林布洛芬混悬液', category: 'medication', unit: '瓶', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(365, 0, 0, today), lowStockThreshold: 1, purchaseDate: d(-20, 0, 0, today), note: '发烧备用' },
    '婴儿润肤乳': { name: '婴儿润肤乳', category: 'nursing_supply', unit: '瓶', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(120, 0, 0, today), lowStockThreshold: 1, purchaseDate: d(-30, 0, 0, today), note: '' },
  }

  const medicines: Medicine[] = preset.medicines
    .filter(name => medicineTemplates[name])
    .map((name, i) => ({
      ...medicineTemplates[name],
      id: `smed-${i}`,
      babyId,
      createdBy: userId,
    }))

  const medicineUsages: MedicineUsage[] = []
  const stockChanges: StockChangeRecord[] = []
  const vitAD = medicines.find(m => m.name === '伊可新维生素AD滴剂')
  if (vitAD) {
    for (let dayOffset = -2; dayOffset <= 0; dayOffset++) {
      medicineUsages.push({
        id: `smu-${dayOffset}`,
        medicineId: vitAD.id,
        babyId,
        quantity: 1,
        timestamp: d(dayOffset, 8, 0, today),
        note: '日常补充',
        createdBy: userId,
      })
      stockChanges.push({
        id: `ssc-usage-${dayOffset}`,
        medicineId: vitAD.id,
        babyId,
        changeType: 'usage',
        quantity: -1,
        previousQuantity: 24 + dayOffset,
        newQuantity: 23 + dayOffset,
        note: '日常补充',
        createdBy: userId,
        timestamp: d(dayOffset, 8, 0, today),
      })
    }
    stockChanges.push({
      id: 'ssc-restock-vitad',
      medicineId: vitAD.id,
      babyId,
      changeType: 'restock',
      quantity: 30,
      previousQuantity: 0,
      newQuantity: 30,
      newExpiryDate: d(180, 0, 0, today),
      note: '首次购入',
      createdBy: userId,
      timestamp: d(-10, 10, 0, today),
    })
  }

  const reminders = generateSmartReminders(babyId, birthDate, reminderEnabledTypes)

  return { feedings, sleeps, diapers, growths, vaccines, checkups, medicines, medicineUsages, stockChanges, reminders }
}
