export interface Baby {
  name: string
  birthDate: string
  gender: 'male' | 'female'
}

export interface FeedingRecord {
  id: string
  type: 'feeding'
  timestamp: string
  feedingType: 'breast' | 'formula'
  duration: number
  amount: number
  note: string
}

export interface SleepRecord {
  id: string
  type: 'sleep'
  startTime: string
  endTime: string
  quality: 'deep' | 'light' | 'fussy'
  note: string
}

export interface DiaperRecord {
  id: string
  type: 'diaper'
  timestamp: string
  diaperType: 'wet' | 'dirty' | 'mixed'
  note: string
}

export type ActivityRecord = FeedingRecord | SleepRecord | DiaperRecord

export interface AppSettings {
  darkMode: boolean
  notifications: boolean
}

export interface DaySummary {
  feedCount: number
  totalAmount: number
  sleepMinutes: number
  diaperCount: number
}
