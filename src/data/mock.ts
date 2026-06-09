import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, AppSettings } from '@/types'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const DEFAULT_BABY_ID = 'baby-default-001'
const DEFAULT_USER_ID = 'user-default-001'

function d(offset: number, hour: number = 8, min: number = 0): string {
  const dt = new Date(today.getTime() + offset * 86400000 + hour * 3600000 + min * 60000)
  return dt.toISOString()
}

export const defaultBaby: Baby = {
  id: DEFAULT_BABY_ID,
  name: '小星星',
  birthDate: '2025-12-15',
  gender: 'female',
}

export const defaultSettings: AppSettings = {
  darkMode: false,
  notifications: true,
}

export const mockFeedings: FeedingRecord[] = [
  { id: 'f1', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(0, 6, 30), feedingType: 'breast', duration: 20, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f2', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(0, 9, 0), feedingType: 'formula', duration: 15, amount: 90, note: '喝得很顺利', createdBy: DEFAULT_USER_ID },
  { id: 'f3', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(0, 12, 30), feedingType: 'breast', duration: 25, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f4', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(0, 16, 0), feedingType: 'formula', duration: 10, amount: 120, note: '比上次多喝了30ml', createdBy: DEFAULT_USER_ID },
  { id: 'f5', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(0, 20, 0), feedingType: 'breast', duration: 18, amount: 0, note: '睡前喂奶', createdBy: DEFAULT_USER_ID },
  { id: 'f6', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 7, 0), feedingType: 'formula', duration: 15, amount: 100, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f7', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 11, 0), feedingType: 'breast', duration: 22, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f8', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 15, 30), feedingType: 'formula', duration: 12, amount: 110, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f9', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 19, 0), feedingType: 'breast', duration: 20, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f10', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 6, 0), feedingType: 'formula', duration: 18, amount: 80, note: '早上不太饿', createdBy: DEFAULT_USER_ID },
  { id: 'f11', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 10, 0), feedingType: 'breast', duration: 25, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f12', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 14, 0), feedingType: 'formula', duration: 15, amount: 100, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f13', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 18, 30), feedingType: 'breast', duration: 20, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f14', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 7, 30), feedingType: 'formula', duration: 12, amount: 90, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f15', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 12, 0), feedingType: 'breast', duration: 18, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f16', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 17, 0), feedingType: 'formula', duration: 20, amount: 110, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f17', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 6, 30), feedingType: 'breast', duration: 22, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f18', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 11, 30), feedingType: 'formula', duration: 15, amount: 95, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f19', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 16, 0), feedingType: 'breast', duration: 20, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f20', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 20, 30), feedingType: 'formula', duration: 10, amount: 100, note: '睡前奶', createdBy: DEFAULT_USER_ID },
  { id: 'f21', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 7, 0), feedingType: 'breast', duration: 18, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f22', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 12, 30), feedingType: 'formula', duration: 15, amount: 105, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f23', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 17, 30), feedingType: 'breast', duration: 25, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f24', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 6, 0), feedingType: 'formula', duration: 12, amount: 85, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f25', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 10, 30), feedingType: 'breast', duration: 20, amount: 0, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'f26', type: 'feeding', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 15, 0), feedingType: 'formula', duration: 18, amount: 110, note: '', createdBy: DEFAULT_USER_ID },
]

export const mockSleeps: SleepRecord[] = [
  { id: 's1', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(0, 0, 0), endTime: d(0, 5, 45), quality: 'deep', note: '夜间长觉', createdBy: DEFAULT_USER_ID },
  { id: 's2', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(0, 7, 30), endTime: d(0, 9, 0), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's3', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(0, 13, 0), endTime: d(0, 15, 0), quality: 'deep', note: '午觉睡得好', createdBy: DEFAULT_USER_ID },
  { id: 's4', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-1, 0, 0), endTime: d(-1, 6, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's5', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-1, 8, 0), endTime: d(-1, 9, 30), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's6', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-1, 13, 30), endTime: d(-1, 15, 30), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's7', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-2, 0, 30), endTime: d(-2, 5, 30), quality: 'fussy', note: '半夜醒来一次', createdBy: DEFAULT_USER_ID },
  { id: 's8', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-2, 8, 30), endTime: d(-2, 10, 0), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's9', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-2, 14, 0), endTime: d(-2, 16, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's10', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-3, 0, 0), endTime: d(-3, 6, 30), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's11', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-3, 9, 0), endTime: d(-3, 10, 30), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's12', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-3, 14, 0), endTime: d(-3, 15, 30), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's13', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-4, 0, 0), endTime: d(-4, 5, 0), quality: 'fussy', note: '肠绞痛', createdBy: DEFAULT_USER_ID },
  { id: 's14', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-4, 7, 0), endTime: d(-4, 8, 30), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's15', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-4, 13, 0), endTime: d(-4, 15, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's16', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-5, 0, 0), endTime: d(-5, 6, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's17', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-5, 8, 0), endTime: d(-5, 9, 0), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's18', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-5, 14, 0), endTime: d(-5, 16, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's19', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-6, 0, 30), endTime: d(-6, 6, 0), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's20', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-6, 8, 30), endTime: d(-6, 10, 0), quality: 'light', note: '', createdBy: DEFAULT_USER_ID },
  { id: 's21', type: 'sleep', babyId: DEFAULT_BABY_ID, startTime: d(-6, 13, 0), endTime: d(-6, 14, 30), quality: 'deep', note: '', createdBy: DEFAULT_USER_ID },
]

export const mockDiapers: DiaperRecord[] = [
  { id: 'd1', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(0, 6, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd2', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(0, 9, 15), diaperType: 'dirty', note: '正常颜色', createdBy: DEFAULT_USER_ID },
  { id: 'd3', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(0, 12, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd4', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(0, 16, 15), diaperType: 'mixed', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd5', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(0, 20, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd6', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 7, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd7', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 11, 15), diaperType: 'dirty', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd8', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 15, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd9', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-1, 19, 15), diaperType: 'mixed', note: '量有点多', createdBy: DEFAULT_USER_ID },
  { id: 'd10', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 6, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd11', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 10, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd12', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 14, 15), diaperType: 'dirty', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd13', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-2, 18, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd14', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 7, 45), diaperType: 'mixed', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd15', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 12, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd16', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-3, 17, 15), diaperType: 'dirty', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd17', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 6, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd18', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 11, 45), diaperType: 'mixed', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd19', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-4, 16, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd20', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 7, 15), diaperType: 'dirty', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd21', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 12, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd22', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-5, 18, 0), diaperType: 'mixed', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd23', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 6, 15), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd24', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 10, 45), diaperType: 'wet', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'd25', type: 'diaper', babyId: DEFAULT_BABY_ID, timestamp: d(-6, 15, 15), diaperType: 'dirty', note: '', createdBy: DEFAULT_USER_ID },
]
