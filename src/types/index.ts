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

export interface DailyComparison {
  category: 'feeding' | 'sleep' | 'diaper'
  todayValue: number
  avgValue: number
  diff: number
  diffPercent: number
  label: string
  unit: string
}

export type TrendDirection = 'up' | 'down' | 'stable'

export interface ConsecutiveTrend {
  category: 'feeding' | 'sleep' | 'diaper'
  direction: TrendDirection
  days: number
  label: string
  description: string
}

export type AnomalyLevel = 'warning' | 'danger' | 'info'

export interface AnomalyDay {
  date: string
  category: 'feeding' | 'sleep' | 'diaper'
  level: AnomalyLevel
  value: number
  avgValue: number
  deviation: number
  description: string
}

export interface GrowthAdvice {
  id: string
  category: 'feeding' | 'sleep' | 'diaper' | 'general'
  level: 'good' | 'info' | 'warning'
  title: string
  description: string
}

export interface GrowthAnalysis {
  comparisons: DailyComparison[]
  trends: ConsecutiveTrend[]
  anomalyDays: AnomalyDay[]
  advices: GrowthAdvice[]
  weekData: { date: string; summary: DaySummary }[]
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

export type InsightLevel = 'warning' | 'danger' | 'info'

export type KnowledgeCategory = 'feeding' | 'sleep' | 'care' | 'milestone'

export interface GuideInsight {
  id: string
  category: KnowledgeCategory
  level: InsightLevel
  title: string
  description: string
  relatedGuideId: string
}

export interface GuideWithRelevance {
  guide: CareGuide
  priority: number
  insights: GuideInsight[]
  highlightedTipIndices: number[]
}

export interface AgeRange {
  minMonth: number
  maxMonth: number
  label: string
}

export interface CareGuide {
  id: string
  category: KnowledgeCategory
  title: string
  summary: string
  content: string
  tips: string[]
  warnings?: string[]
}

export interface KnowledgeEntry {
  ageRange: AgeRange
  guides: CareGuide[]
}

export type MedicineCategory = 'medication' | 'nursing_supply'

export interface Medicine {
  id: string
  babyId: string
  name: string
  category: MedicineCategory
  unit: string
  totalQuantity: number
  remainingQuantity: number
  expiryDate?: string
  lowStockThreshold: number
  purchaseDate: string
  note: string
  createdBy: string
}

export interface MedicineUsage {
  id: string
  medicineId: string
  babyId: string
  quantity: number
  timestamp: string
  note: string
  createdBy: string
}

export type StockChangeType = 'restock' | 'usage' | 'adjustment' | 'expiry_clear'

export interface StockChangeRecord {
  id: string
  medicineId: string
  babyId: string
  changeType: StockChangeType
  quantity: number
  previousQuantity: number
  newQuantity: number
  previousExpiryDate?: string
  newExpiryDate?: string
  note: string
  createdBy: string
  timestamp: string
}

export const MEDICINE_CATEGORY_LABELS: Record<MedicineCategory, string> = {
  medication: '药品',
  nursing_supply: '护理用品',
}

export interface MedicineAnalytics {
  avgDailyUsage: number
  estimatedDaysLeft: number | null
  estimatedDepletionDate: string | null
  usageLast7Days: number
  usageLast30Days: number
  restockSuggestedQuantity: number | null
}

export type MedicineSortKey = 'name' | 'stock' | 'expiry' | 'usage'
export type MedicineSortOrder = 'asc' | 'desc'

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  feeding: '喂养指南',
  sleep: '睡眠指南',
  care: '护理要点',
  milestone: '发育里程碑',
}

export const KNOWLEDGE_CATEGORY_ICONS: Record<KnowledgeCategory, string> = {
  feeding: 'Milk',
  sleep: 'Moon',
  care: 'Heart',
  milestone: 'Star',
}
