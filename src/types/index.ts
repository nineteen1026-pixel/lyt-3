export interface Baby {
  id: string
  name: string
  birthDate: string
  gender: 'male' | 'female'
  avatar?: string
}

export interface FeedingRecord {
  id: string
  type: 'feeding'
  babyId: string
  timestamp: string
  feedingType: 'breast' | 'formula'
  duration: number
  amount: number
  note: string
  createdBy: string
}

export interface SleepRecord {
  id: string
  type: 'sleep'
  babyId: string
  startTime: string
  endTime: string
  quality: 'deep' | 'light' | 'fussy'
  note: string
  createdBy: string
}

export interface DiaperRecord {
  id: string
  type: 'diaper'
  babyId: string
  timestamp: string
  diaperType: 'wet' | 'dirty' | 'mixed'
  note: string
  createdBy: string
}

export interface GrowthRecord {
  id: string
  type: 'growth'
  babyId: string
  timestamp: string
  height: number
  weight: number
  headCircumference?: number
  note: string
  createdBy: string
}

export interface VaccineRecord {
  id: string
  type: 'vaccine'
  babyId: string
  name: string
  plannedDate: string
  actualDate?: string
  status: 'planned' | 'done' | 'missed'
  location?: string
  note: string
  createdBy: string
}

export interface CheckupRecord {
  id: string
  type: 'checkup'
  babyId: string
  timestamp: string
  hospital: string
  doctor?: string
  items: string[]
  result: string
  attachments?: string[]
  note: string
  createdBy: string
}

export type HealthRecord = GrowthRecord | VaccineRecord | CheckupRecord

export type ActivityRecord = FeedingRecord | SleepRecord | DiaperRecord

export interface ReminderItem {
  id: string
  type: 'feeding' | 'sleep' | 'diaper'
  title: string
  description: string
  scheduledTime: string
  status: 'pending' | 'done' | 'overdue' | 'dismissed'
  priority: 'high' | 'medium' | 'low'
  babyId: string
  createdAt: string
}

export interface MissedRecord {
  id: string
  type: 'feeding' | 'sleep' | 'diaper'
  suggestedTime: string
  endTime?: string
  description: string
  babyId: string
  status: 'pending' | 'filled' | 'dismissed'
}

export interface PatternSummary {
  avgFeedingIntervalMin: number
  avgSleepDurationMin: number
  avgDiaperIntervalMin: number
  avgDailyFeedings: number
  avgDailyDiapers: number
  nextFeedingTime: string | null
  nextDiaperTime: string | null
  nextSleepTime: string | null
}

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

export interface MonthlyDayData {
  date: string
  day: number
  feedCount: number
  totalAmount: number
  sleepMinutes: number
  diaperCount: number
  diaperWet: number
  diaperDirty: number
  diaperMixed: number
  breastCount: number
  formulaCount: number
  formulaAmount: number
  deepSleepCount: number
  lightSleepCount: number
  fussySleepCount: number
}

export type AnomalyLevel = 'warning' | 'danger' | 'info'

export interface AnomalyItem {
  id: string
  category: 'feeding' | 'sleep' | 'diaper'
  level: AnomalyLevel
  title: string
  description: string
  advice: string
}

export interface MonthlyTrend {
  label: string
  weekIndex: number
  avgFeedCount: number
  avgSleepMinutes: number
  avgDiaperCount: number
  avgFormulaAmount: number
}

export interface MonthlyReport {
  year: number
  month: number
  days: MonthlyDayData[]
  trends: MonthlyTrend[]
  anomalies: AnomalyItem[]
  advices: string[]
  summary: {
    totalFeedCount: number
    avgDailyFeedCount: number
    totalFormulaAmount: number
    avgDailyFormulaAmount: number
    totalSleepMinutes: number
    avgDailySleepMinutes: number
    totalDiaperCount: number
    avgDailyDiaperCount: number
    deepSleepRate: number
    breastVsFormula: { breast: number; formula: number }
  }
}

export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface FamilyMember {
  id: string
  name: string
  avatar?: string
  role: FamilyRole
  joinedAt: string
}

export interface Invitation {
  id: string
  code: string
  role: FamilyRole
  invitedBy: string
  createdAt: string
  expiresAt: string
  usedBy?: string
  usedAt?: string
  status: 'pending' | 'used' | 'expired'
}

export interface Family {
  id: string
  name: string
  createdAt: string
  ownerId: string
  members: FamilyMember[]
  babies: string[]
  invitations: Invitation[]
}

export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: '创建者',
  admin: '管理员',
  member: '成员',
  viewer: '观察者',
}

export const ROLE_PERMISSIONS: Record<FamilyRole, string[]> = {
  owner: ['manage_family', 'manage_members', 'manage_babies', 'add_record', 'edit_record', 'delete_record', 'view_record', 'invite_member', 'export_data'],
  admin: ['manage_members', 'manage_babies', 'add_record', 'edit_record', 'delete_record', 'view_record', 'invite_member', 'export_data'],
  member: ['add_record', 'edit_own', 'view_record', 'export_data'],
  viewer: ['view_record'],
}
