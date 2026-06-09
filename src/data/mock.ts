import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, AppSettings } from '@/types'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

function d(offset: number, hour: number = 8, min: number = 0): string {
  const dt = new Date(today.getTime() + offset * 86400000 + hour * 3600000 + min * 60000)
  return dt.toISOString()
}

export const defaultBaby: Baby = {
  name: '小星星',
  birthDate: '2025-12-15',
  gender: 'female',
}

export const defaultSettings: AppSettings = {
  darkMode: false,
  notifications: true,
}

export const mockFeedings: FeedingRecord[] = [
  { id: 'f1', type: 'feeding', timestamp: d(0, 6, 30), feedingType: 'breast', duration: 20, amount: 0, note: '' },
  { id: 'f2', type: 'feeding', timestamp: d(0, 9, 0), feedingType: 'formula', duration: 15, amount: 90, note: '喝得很顺利' },
  { id: 'f3', type: 'feeding', timestamp: d(0, 12, 30), feedingType: 'breast', duration: 25, amount: 0, note: '' },
  { id: 'f4', type: 'feeding', timestamp: d(0, 16, 0), feedingType: 'formula', duration: 10, amount: 120, note: '比上次多喝了30ml' },
  { id: 'f5', type: 'feeding', timestamp: d(0, 20, 0), feedingType: 'breast', duration: 18, amount: 0, note: '睡前喂奶' },
  { id: 'f6', type: 'feeding', timestamp: d(-1, 7, 0), feedingType: 'formula', duration: 15, amount: 100, note: '' },
  { id: 'f7', type: 'feeding', timestamp: d(-1, 11, 0), feedingType: 'breast', duration: 22, amount: 0, note: '' },
  { id: 'f8', type: 'feeding', timestamp: d(-1, 15, 30), feedingType: 'formula', duration: 12, amount: 110, note: '' },
  { id: 'f9', type: 'feeding', timestamp: d(-1, 19, 0), feedingType: 'breast', duration: 20, amount: 0, note: '' },
  { id: 'f10', type: 'feeding', timestamp: d(-2, 6, 0), feedingType: 'formula', duration: 18, amount: 80, note: '早上不太饿' },
  { id: 'f11', type: 'feeding', timestamp: d(-2, 10, 0), feedingType: 'breast', duration: 25, amount: 0, note: '' },
  { id: 'f12', type: 'feeding', timestamp: d(-2, 14, 0), feedingType: 'formula', duration: 15, amount: 100, note: '' },
  { id: 'f13', type: 'feeding', timestamp: d(-2, 18, 30), feedingType: 'breast', duration: 20, amount: 0, note: '' },
  { id: 'f14', type: 'feeding', timestamp: d(-3, 7, 30), feedingType: 'formula', duration: 12, amount: 90, note: '' },
  { id: 'f15', type: 'feeding', timestamp: d(-3, 12, 0), feedingType: 'breast', duration: 18, amount: 0, note: '' },
  { id: 'f16', type: 'feeding', timestamp: d(-3, 17, 0), feedingType: 'formula', duration: 20, amount: 110, note: '' },
  { id: 'f17', type: 'feeding', timestamp: d(-4, 6, 30), feedingType: 'breast', duration: 22, amount: 0, note: '' },
  { id: 'f18', type: 'feeding', timestamp: d(-4, 11, 30), feedingType: 'formula', duration: 15, amount: 95, note: '' },
  { id: 'f19', type: 'feeding', timestamp: d(-4, 16, 0), feedingType: 'breast', duration: 20, amount: 0, note: '' },
  { id: 'f20', type: 'feeding', timestamp: d(-4, 20, 30), feedingType: 'formula', duration: 10, amount: 100, note: '睡前奶' },
  { id: 'f21', type: 'feeding', timestamp: d(-5, 7, 0), feedingType: 'breast', duration: 18, amount: 0, note: '' },
  { id: 'f22', type: 'feeding', timestamp: d(-5, 12, 30), feedingType: 'formula', duration: 15, amount: 105, note: '' },
  { id: 'f23', type: 'feeding', timestamp: d(-5, 17, 30), feedingType: 'breast', duration: 25, amount: 0, note: '' },
  { id: 'f24', type: 'feeding', timestamp: d(-6, 6, 0), feedingType: 'formula', duration: 12, amount: 85, note: '' },
  { id: 'f25', type: 'feeding', timestamp: d(-6, 10, 30), feedingType: 'breast', duration: 20, amount: 0, note: '' },
  { id: 'f26', type: 'feeding', timestamp: d(-6, 15, 0), feedingType: 'formula', duration: 18, amount: 110, note: '' },
]

export const mockSleeps: SleepRecord[] = [
  { id: 's1', type: 'sleep', startTime: d(0, 0, 0), endTime: d(0, 5, 45), quality: 'deep', note: '夜间长觉' },
  { id: 's2', type: 'sleep', startTime: d(0, 7, 30), endTime: d(0, 9, 0), quality: 'light', note: '' },
  { id: 's3', type: 'sleep', startTime: d(0, 13, 0), endTime: d(0, 15, 0), quality: 'deep', note: '午觉睡得好' },
  { id: 's4', type: 'sleep', startTime: d(-1, 0, 0), endTime: d(-1, 6, 0), quality: 'deep', note: '' },
  { id: 's5', type: 'sleep', startTime: d(-1, 8, 0), endTime: d(-1, 9, 30), quality: 'light', note: '' },
  { id: 's6', type: 'sleep', startTime: d(-1, 13, 30), endTime: d(-1, 15, 30), quality: 'deep', note: '' },
  { id: 's7', type: 'sleep', startTime: d(-2, 0, 30), endTime: d(-2, 5, 30), quality: 'fussy', note: '半夜醒来一次' },
  { id: 's8', type: 'sleep', startTime: d(-2, 8, 30), endTime: d(-2, 10, 0), quality: 'light', note: '' },
  { id: 's9', type: 'sleep', startTime: d(-2, 14, 0), endTime: d(-2, 16, 0), quality: 'deep', note: '' },
  { id: 's10', type: 'sleep', startTime: d(-3, 0, 0), endTime: d(-3, 6, 30), quality: 'deep', note: '' },
  { id: 's11', type: 'sleep', startTime: d(-3, 9, 0), endTime: d(-3, 10, 30), quality: 'light', note: '' },
  { id: 's12', type: 'sleep', startTime: d(-3, 14, 0), endTime: d(-3, 15, 30), quality: 'deep', note: '' },
  { id: 's13', type: 'sleep', startTime: d(-4, 0, 0), endTime: d(-4, 5, 0), quality: 'fussy', note: '肠绞痛' },
  { id: 's14', type: 'sleep', startTime: d(-4, 7, 0), endTime: d(-4, 8, 30), quality: 'light', note: '' },
  { id: 's15', type: 'sleep', startTime: d(-4, 13, 0), endTime: d(-4, 15, 0), quality: 'deep', note: '' },
  { id: 's16', type: 'sleep', startTime: d(-5, 0, 0), endTime: d(-5, 6, 0), quality: 'deep', note: '' },
  { id: 's17', type: 'sleep', startTime: d(-5, 8, 0), endTime: d(-5, 9, 0), quality: 'light', note: '' },
  { id: 's18', type: 'sleep', startTime: d(-5, 14, 0), endTime: d(-5, 16, 0), quality: 'deep', note: '' },
  { id: 's19', type: 'sleep', startTime: d(-6, 0, 30), endTime: d(-6, 6, 0), quality: 'deep', note: '' },
  { id: 's20', type: 'sleep', startTime: d(-6, 8, 30), endTime: d(-6, 10, 0), quality: 'light', note: '' },
  { id: 's21', type: 'sleep', startTime: d(-6, 13, 0), endTime: d(-6, 14, 30), quality: 'deep', note: '' },
]

export const mockDiapers: DiaperRecord[] = [
  { id: 'd1', type: 'diaper', timestamp: d(0, 6, 45), diaperType: 'wet', note: '' },
  { id: 'd2', type: 'diaper', timestamp: d(0, 9, 15), diaperType: 'dirty', note: '正常颜色' },
  { id: 'd3', type: 'diaper', timestamp: d(0, 12, 45), diaperType: 'wet', note: '' },
  { id: 'd4', type: 'diaper', timestamp: d(0, 16, 15), diaperType: 'mixed', note: '' },
  { id: 'd5', type: 'diaper', timestamp: d(0, 20, 15), diaperType: 'wet', note: '' },
  { id: 'd6', type: 'diaper', timestamp: d(-1, 7, 15), diaperType: 'wet', note: '' },
  { id: 'd7', type: 'diaper', timestamp: d(-1, 11, 15), diaperType: 'dirty', note: '' },
  { id: 'd8', type: 'diaper', timestamp: d(-1, 15, 45), diaperType: 'wet', note: '' },
  { id: 'd9', type: 'diaper', timestamp: d(-1, 19, 15), diaperType: 'mixed', note: '量有点多' },
  { id: 'd10', type: 'diaper', timestamp: d(-2, 6, 15), diaperType: 'wet', note: '' },
  { id: 'd11', type: 'diaper', timestamp: d(-2, 10, 15), diaperType: 'wet', note: '' },
  { id: 'd12', type: 'diaper', timestamp: d(-2, 14, 15), diaperType: 'dirty', note: '' },
  { id: 'd13', type: 'diaper', timestamp: d(-2, 18, 45), diaperType: 'wet', note: '' },
  { id: 'd14', type: 'diaper', timestamp: d(-3, 7, 45), diaperType: 'mixed', note: '' },
  { id: 'd15', type: 'diaper', timestamp: d(-3, 12, 15), diaperType: 'wet', note: '' },
  { id: 'd16', type: 'diaper', timestamp: d(-3, 17, 15), diaperType: 'dirty', note: '' },
  { id: 'd17', type: 'diaper', timestamp: d(-4, 6, 45), diaperType: 'wet', note: '' },
  { id: 'd18', type: 'diaper', timestamp: d(-4, 11, 45), diaperType: 'mixed', note: '' },
  { id: 'd19', type: 'diaper', timestamp: d(-4, 16, 15), diaperType: 'wet', note: '' },
  { id: 'd20', type: 'diaper', timestamp: d(-5, 7, 15), diaperType: 'dirty', note: '' },
  { id: 'd21', type: 'diaper', timestamp: d(-5, 12, 45), diaperType: 'wet', note: '' },
  { id: 'd22', type: 'diaper', timestamp: d(-5, 18, 0), diaperType: 'mixed', note: '' },
  { id: 'd23', type: 'diaper', timestamp: d(-6, 6, 15), diaperType: 'wet', note: '' },
  { id: 'd24', type: 'diaper', timestamp: d(-6, 10, 45), diaperType: 'wet', note: '' },
  { id: 'd25', type: 'diaper', timestamp: d(-6, 15, 15), diaperType: 'dirty', note: '' },
]
