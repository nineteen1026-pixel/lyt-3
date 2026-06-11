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
  feedingType: 'breast' | 'formula' | 'mixed'
  duration: number
  amount: number
  breastSide?: 'left' | 'right' | 'both' | 'alternate'
  leftDuration?: number
  rightDuration?: number
  formulaPowder?: number
  formulaWater?: number
  note: string
  createdBy: string
  caregiverId: string
}

export interface FeedingDailyStats {
  date: string
  totalFeedings: number
  breastCount: number
  formulaCount: number
  mixedCount: number
  totalAmount: number
  totalDuration: number
  leftDuration: number
  rightDuration: number
  avgIntervalMin: number
  avgDurationMin: number
  avgAmount: number
  feedingsByHour: number[]
}

export interface FeedingTrendPoint {
  date: string
  value: number
  label: string
}

export interface SideBalance {
  leftCount: number
  rightCount: number
  bothCount: number
  leftDuration: number
  rightDuration: number
  leftPercent: number
  rightPercent: number
  imbalanceWarning: boolean
  suggestion: string
}

export interface FeedingReminderSettings {
  enabled: boolean
  intervalMinutes: number
  customMessage?: string
  soundEnabled?: boolean
  vibrateEnabled?: boolean
}

export interface FeedingAnalytics {
  todayStats: FeedingDailyStats
  weekStats: FeedingDailyStats[]
  last7DaysTrend: { date: string; count: number; amount: number }[]
  sideBalance: SideBalance
  avgIntervalMin: number
  avgDurationMin: number
  avgAmountPerFeeding: number
  dailyDistribution: { hour: number; count: number }[]
  formulaUsageTotal: number
  breastfeedingTotalMin: number
  nextSuggestedFeeding: string | null
  recommendations: string[]
}

export const FEEDING_TYPE_LABELS: Record<'breast' | 'formula' | 'mixed', string> = {
  breast: '母乳',
  formula: '配方奶',
  mixed: '混合喂养',
}

export const BREAST_SIDE_LABELS: Record<'left' | 'right' | 'both' | 'alternate', string> = {
  left: '左侧',
  right: '右侧',
  both: '双侧',
  alternate: '交替',
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
  caregiverId: string
}

export interface DiaperRecord {
  id: string
  type: 'diaper'
  babyId: string
  timestamp: string
  diaperType: 'wet' | 'dirty' | 'mixed'
  note: string
  createdBy: string
  caregiverId: string
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
  caregiverId: string
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
  caregiverId: string
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
  caregiverId: string
}

export interface MedicalVisitRecord {
  id: string
  type: 'medical_visit'
  babyId: string
  timestamp: string
  hospital: string
  doctor?: string
  department?: string
  symptoms: string
  diagnosis: string
  prescription: string
  followUpDate?: string
  attachments?: string[]
  temperature?: number
  note: string
  createdBy: string
  caregiverId: string
}

export type HealthRecord = GrowthRecord | VaccineRecord | CheckupRecord | MedicalVisitRecord

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
  defaultCaregiverId?: string
  feedingReminder?: FeedingReminderSettings
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

export interface SleepGoal {
  id: string
  babyId: string
  targetBedtime: string
  targetWakeTime: string
  targetSleepHours: number
  bedtimeToleranceMin: number
  wakeTimeToleranceMin: number
  createdAt: string
  updatedAt: string
}

export interface SleepGoalDailyAchievement {
  date: string
  bedtime: string | null
  wakeTime: string | null
  sleepHours: number
  bedtimeAchieved: boolean
  wakeTimeAchieved: boolean
  sleepHoursAchieved: boolean
  bedtimeDeviationMin: number
  wakeTimeDeviationMin: number
  sleepHoursDeviationMin: number
}

export interface SleepGoalWeeklyStats {
  bedtimeAchievementRate: number
  wakeTimeAchievementRate: number
  sleepHoursAchievementRate: number
  overallAchievementRate: number
  avgBedtimeDeviationMin: number
  avgWakeTimeDeviationMin: number
  avgSleepHoursDeviationMin: number
  bedtimeStandardDeviationMin: number
  wakeTimeStandardDeviationMin: number
  sleepHoursStandardDeviationMin: number
  dailyAchievements: SleepGoalDailyAchievement[]
}

export interface SleepPatternDeviation {
  date: string
  bedtimeDeviationMin: number
  wakeTimeDeviationMin: number
  sleepHoursDeviationMin: number
  overallDeviationScore: number
  severity: 'normal' | 'mild' | 'moderate' | 'severe'
  description: string
}

export type MilestoneCategory = 'first' | 'physical' | 'social' | 'language' | 'cognitive'

export interface Milestone {
  id: string
  babyId: string
  category: MilestoneCategory
  title: string
  description: string
  achievedDate: string
  photoUrl?: string
  note: string
  createdBy: string
  createdAt: string
}

export const MILESTONE_CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  first: '第一次',
  physical: '大运动',
  social: '社交情感',
  language: '语言沟通',
  cognitive: '认知发展',
}

export const MILESTONE_CATEGORY_ICONS: Record<MilestoneCategory, string> = {
  first: 'Sparkles',
  physical: 'Footprints',
  social: 'Smile',
  language: 'MessageCircle',
  cognitive: 'Brain',
}

export interface FamilyComment {
  id: string
  targetId: string
  targetType: 'photo' | 'milestone'
  authorId: string
  content: string
  createdAt: string
}

export interface PhotoDiaryEntry {
  id: string
  type: 'photo'
  babyId: string
  timestamp: string
  photoUrl: string
  caption: string
  note: string
  milestoneId?: string
  comments: FamilyComment[]
  createdBy: string
  caregiverId: string
}

export interface TimelineDay {
  date: string
  photos: PhotoDiaryEntry[]
  milestones: Milestone[]
  dayNotes: string[]
}

export interface WeeklySleepPatternReport {
  avgBedtime: string | null
  avgWakeTime: string | null
  avgSleepHours: number
  bedtimeConsistency: 'excellent' | 'good' | 'fair' | 'poor'
  wakeTimeConsistency: 'excellent' | 'good' | 'fair' | 'poor'
  sleepHoursConsistency: 'excellent' | 'good' | 'fair' | 'poor'
  deviations: SleepPatternDeviation[]
  bestDay: string | null
  worstDay: string | null
  suggestions: string[]
}

export type ScheduleActivityType = 'wake' | 'feeding' | 'nap' | 'sleep' | 'bath' | 'play' | 'outdoor' | 'medicine' | 'other'

export const SCHEDULE_ACTIVITY_LABELS: Record<ScheduleActivityType, string> = {
  wake: '起床',
  feeding: '喂奶',
  nap: '小睡',
  sleep: '夜间睡眠',
  bath: '洗澡',
  play: '游戏互动',
  outdoor: '户外活动',
  medicine: '吃药',
  other: '其他',
}

export const SCHEDULE_ACTIVITY_ICONS: Record<ScheduleActivityType, string> = {
  wake: 'Sun',
  feeding: 'Milk',
  nap: 'Moon',
  sleep: 'Moon',
  bath: 'Droplets',
  play: 'Smile',
  outdoor: 'TreePine',
  medicine: 'Pill',
  other: 'Star',
}

export const SCHEDULE_ACTIVITY_COLORS: Record<ScheduleActivityType, { bg: string; text: string; border: string }> = {
  wake: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
  feeding: { bg: 'bg-peach-50 dark:bg-peach-500/10', text: 'text-peach-600 dark:text-peach-400', border: 'border-peach-200 dark:border-peach-500/20' },
  nap: { bg: 'bg-mint-50 dark:bg-mint-500/10', text: 'text-mint-600 dark:text-mint-400', border: 'border-mint-200 dark:border-mint-500/20' },
  sleep: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
  bath: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
  play: { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-500/20' },
  outdoor: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  medicine: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20' },
  other: { bg: 'bg-cream-100 dark:bg-warm-500/10', text: 'text-warm-500 dark:text-warm-300', border: 'border-cream-200 dark:border-warm-500/20' },
}

export interface ScheduleActivity {
  id: string
  type: ScheduleActivityType
  title: string
  startTime: string
  endTime: string
  reminder?: boolean
  note?: string
}

export interface SchedulePlan {
  id: string
  babyId: string
  name: string
  description?: string
  activities: ScheduleActivity[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ScheduleTemplateAgeRange = '0-1m' | '1-3m' | '3-6m' | '6-9m' | '9-12m' | '12-18m' | '18-24m'

export const SCHEDULE_TEMPLATE_AGE_RANGES: { value: ScheduleTemplateAgeRange; label: string }[] = [
  { value: '0-1m', label: '0-1个月 新生儿' },
  { value: '1-3m', label: '1-3个月 小婴儿' },
  { value: '3-6m', label: '3-6个月 婴儿' },
  { value: '6-9m', label: '6-9个月 大婴儿' },
  { value: '9-12m', label: '9-12个月 学步前期' },
  { value: '12-18m', label: '12-18个月 学步期' },
  { value: '18-24m', label: '18-24个月 幼儿期' },
]

export interface ScheduleTemplate {
  id: string
  name: string
  ageRange: ScheduleTemplateAgeRange
  description: string
  activities: Omit<ScheduleActivity, 'id'>[]
  source: 'official' | 'community'
  popularity: number
}

export type ScheduleExecutionStatus = 'pending' | 'ongoing' | 'completed' | 'skipped' | 'delayed'

export const SCHEDULE_EXECUTION_LABELS: Record<ScheduleExecutionStatus, string> = {
  pending: '待执行',
  ongoing: '进行中',
  completed: '已完成',
  skipped: '已跳过',
  delayed: '已延迟',
}

export const SCHEDULE_EXECUTION_COLORS: Record<ScheduleExecutionStatus, string> = {
  pending: 'bg-warm-100 dark:bg-warm-500/10 text-warm-500 dark:text-warm-200',
  ongoing: 'bg-mint-100 dark:bg-mint-500/20 text-mint-600 dark:text-mint-400',
  completed: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  skipped: 'bg-cream-200 dark:bg-cream-300/20 text-warm-400 dark:text-warm-300',
  delayed: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
}

export interface ScheduleExecution {
  id: string
  planId: string
  activityId: string
  babyId: string
  date: string
  scheduledStartTime: string
  scheduledEndTime: string
  actualStartTime?: string
  actualEndTime?: string
  status: ScheduleExecutionStatus
  deviationMinutes?: number
  note?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleDailyDeviation {
  date: string
  totalActivities: number
  completedCount: number
  skippedCount: number
  delayedCount: number
  completionRate: number
  avgDeviationMinutes: number
  maxDeviationMinutes: number
  onTimeRate: number
}

export interface ScheduleDeviationAnalysis {
  periodDays: number
  dailyDeviations: ScheduleDailyDeviation[]
  overallCompletionRate: number
  overallOnTimeRate: number
  avgDeviationMinutes: number
  mostDelayedActivities: { activityType: ScheduleActivityType; count: number; avgDelay: number }[]
  mostSkippedActivities: { activityType: ScheduleActivityType; count: number }[]
  bestPerformingDay: string | null
  worstPerformingDay: string | null
  suggestions: string[]
  trend: 'improving' | 'worsening' | 'stable'
}
