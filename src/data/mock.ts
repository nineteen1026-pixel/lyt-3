import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, GrowthRecord, VaccineRecord, CheckupRecord, AppSettings, Medicine, MedicineUsage } from '@/types'

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

export const mockGrowths: GrowthRecord[] = [
  { id: 'g1', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-180, 10, 0), height: 50, weight: 3.3, headCircumference: 34, note: '出生', createdBy: DEFAULT_USER_ID },
  { id: 'g2', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-150, 10, 0), height: 53, weight: 4.2, headCircumference: 35.5, note: '满月体检', createdBy: DEFAULT_USER_ID },
  { id: 'g3', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-120, 10, 0), height: 56, weight: 5.1, headCircumference: 37, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'g4', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-90, 10, 0), height: 59, weight: 5.8, headCircumference: 38.5, note: '3个月体检', createdBy: DEFAULT_USER_ID },
  { id: 'g5', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-60, 10, 0), height: 62, weight: 6.5, headCircumference: 40, note: '', createdBy: DEFAULT_USER_ID },
  { id: 'g6', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(-30, 10, 0), height: 65, weight: 7.0, headCircumference: 41.5, note: '半岁体检', createdBy: DEFAULT_USER_ID },
  { id: 'g7', type: 'growth', babyId: DEFAULT_BABY_ID, timestamp: d(0, 10, 0), height: 67, weight: 7.5, headCircumference: 42, note: '', createdBy: DEFAULT_USER_ID },
]

export const mockVaccines: VaccineRecord[] = [
  { id: 'v1', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '乙肝疫苗（第1剂）', plannedDate: d(-180, 9, 0), actualDate: d(-180, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v2', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '卡介苗', plannedDate: d(-180, 9, 0), actualDate: d(-180, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v3', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '乙肝疫苗（第2剂）', plannedDate: d(-150, 9, 0), actualDate: d(-150, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v4', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '脊灰灭活疫苗（第1剂）', plannedDate: d(-120, 9, 0), actualDate: d(-120, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v5', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '百白破疫苗（第1剂）', plannedDate: d(-120, 9, 0), actualDate: d(-120, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v6', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '脊灰灭活疫苗（第2剂）', plannedDate: d(-90, 9, 0), actualDate: d(-90, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v7', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '百白破疫苗（第2剂）', plannedDate: d(-90, 9, 0), actualDate: d(-90, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v8', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '乙肝疫苗（第3剂）', plannedDate: d(-60, 9, 0), actualDate: d(-60, 9, 30), status: 'done', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v9', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: 'A群流脑疫苗（第1剂）', plannedDate: d(-60, 9, 0), status: 'done', actualDate: d(-60, 9, 30), location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v10', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '百白破疫苗（第3剂）', plannedDate: d(-30, 9, 0), status: 'done', actualDate: d(-30, 9, 30), location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v11', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '脊灰减毒疫苗（第3剂）', plannedDate: d(7, 9, 0), status: 'planned', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v12', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '麻腮风疫苗（第1剂）', plannedDate: d(30, 9, 0), status: 'planned', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v13', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '乙脑减毒疫苗（第1剂）', plannedDate: d(30, 9, 0), status: 'planned', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
  { id: 'v14', type: 'vaccine', babyId: DEFAULT_BABY_ID, name: '甲肝减毒疫苗', plannedDate: d(60, 9, 0), status: 'planned', location: '社区卫生中心', note: '', createdBy: DEFAULT_USER_ID },
]

export const mockCheckups: CheckupRecord[] = [
  { id: 'c1', type: 'checkup', babyId: DEFAULT_BABY_ID, timestamp: d(-180, 9, 0), hospital: '市妇幼保健院', doctor: '王医生', items: ['新生儿筛查', '听力筛查', '体格检查'], result: '各项指标正常', note: '出生体检', createdBy: DEFAULT_USER_ID },
  { id: 'c2', type: 'checkup', babyId: DEFAULT_BABY_ID, timestamp: d(-150, 9, 0), hospital: '社区卫生中心', doctor: '李医生', items: ['体格检查', '黄疸检测'], result: '黄疸已退，发育正常', note: '满月体检', createdBy: DEFAULT_USER_ID },
  { id: 'c3', type: 'checkup', babyId: DEFAULT_BABY_ID, timestamp: d(-90, 9, 0), hospital: '市妇幼保健院', doctor: '王医生', items: ['体格检查', '髋关节B超', '视力筛查'], result: '髋关节正常，发育良好', note: '3个月体检', createdBy: DEFAULT_USER_ID },
  { id: 'c4', type: 'checkup', babyId: DEFAULT_BABY_ID, timestamp: d(-30, 9, 0), hospital: '市妇幼保健院', doctor: '张医生', items: ['体格检查', '血常规', '微量元素'], result: '轻微缺铁，建议补充', note: '6个月体检', createdBy: DEFAULT_USER_ID },
]

export const mockMedicines: Medicine[] = [
  { id: 'med1', babyId: DEFAULT_BABY_ID, name: '伊可新维生素AD滴剂', category: 'medication', unit: '粒', totalQuantity: 30, remainingQuantity: 18, expiryDate: d(180), lowStockThreshold: 5, purchaseDate: d(-15), note: '每天一粒', createdBy: DEFAULT_USER_ID },
  { id: 'med2', babyId: DEFAULT_BABY_ID, name: '美林布洛芬混悬液', category: 'medication', unit: '瓶', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(365), lowStockThreshold: 1, purchaseDate: d(-30), note: '发烧备用', createdBy: DEFAULT_USER_ID },
  { id: 'med3', babyId: DEFAULT_BABY_ID, name: '泰诺林对乙酰氨基酚滴剂', category: 'medication', unit: '瓶', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(300), lowStockThreshold: 1, purchaseDate: d(-20), note: '发烧备用', createdBy: DEFAULT_USER_ID },
  { id: 'med4', babyId: DEFAULT_BABY_ID, name: '妈咪爱益生菌', category: 'medication', unit: '袋', totalQuantity: 20, remainingQuantity: 3, expiryDate: d(90), lowStockThreshold: 5, purchaseDate: d(-25), note: '肠胃调理', createdBy: DEFAULT_USER_ID },
  { id: 'med5', babyId: DEFAULT_BABY_ID, name: '尤卓尔氧化锌软膏', category: 'medication', unit: '支', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(200), lowStockThreshold: 1, purchaseDate: d(-10), note: '红屁股涂抹', createdBy: DEFAULT_USER_ID },
  { id: 'med6', babyId: DEFAULT_BABY_ID, name: '纸尿裤（M号）', category: 'nursing_supply', unit: '片', totalQuantity: 120, remainingQuantity: 35, expiryDate: d(730), lowStockThreshold: 20, purchaseDate: d(-20), note: '', createdBy: DEFAULT_USER_ID },
  { id: 'med7', babyId: DEFAULT_BABY_ID, name: '婴儿湿巾', category: 'nursing_supply', unit: '包', totalQuantity: 6, remainingQuantity: 2, expiryDate: d(365), lowStockThreshold: 2, purchaseDate: d(-30), note: '', createdBy: DEFAULT_USER_ID },
  { id: 'med8', babyId: DEFAULT_BABY_ID, name: '护臀霜', category: 'nursing_supply', unit: '支', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(150), lowStockThreshold: 1, purchaseDate: d(-15), note: '', createdBy: DEFAULT_USER_ID },
  { id: 'med9', babyId: DEFAULT_BABY_ID, name: '婴儿润肤乳', category: 'nursing_supply', unit: '瓶', totalQuantity: 1, remainingQuantity: 1, expiryDate: d(120), lowStockThreshold: 1, purchaseDate: d(-40), note: '', createdBy: DEFAULT_USER_ID },
  { id: 'med10', babyId: DEFAULT_BABY_ID, name: '退热贴', category: 'nursing_supply', unit: '片', totalQuantity: 10, remainingQuantity: 8, expiryDate: d(180), lowStockThreshold: 3, purchaseDate: d(-10), note: '', createdBy: DEFAULT_USER_ID },
  { id: 'med11', babyId: DEFAULT_BABY_ID, name: '生理盐水滴鼻剂', category: 'medication', unit: '支', totalQuantity: 2, remainingQuantity: 2, expiryDate: d(-5), lowStockThreshold: 1, purchaseDate: d(-60), note: '已过期需更换', createdBy: DEFAULT_USER_ID },
  { id: 'med12', babyId: DEFAULT_BABY_ID, name: '婴儿抚触油', category: 'nursing_supply', unit: '瓶', totalQuantity: 1, remainingQuantity: 0, lowStockThreshold: 1, purchaseDate: d(-50), note: '已用完需补货', expiryDate: d(60), createdBy: DEFAULT_USER_ID },
]

export const mockMedicineUsages: MedicineUsage[] = [
  { id: 'mu1', medicineId: 'med1', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(0, 8, 0), note: '日常补充', createdBy: DEFAULT_USER_ID },
  { id: 'mu2', medicineId: 'med1', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-1, 8, 0), note: '日常补充', createdBy: DEFAULT_USER_ID },
  { id: 'mu3', medicineId: 'med1', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-2, 8, 0), note: '日常补充', createdBy: DEFAULT_USER_ID },
  { id: 'mu4', medicineId: 'med4', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(0, 9, 0), note: '腹泻调理', createdBy: DEFAULT_USER_ID },
  { id: 'mu5', medicineId: 'med4', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-1, 9, 0), note: '腹泻调理', createdBy: DEFAULT_USER_ID },
  { id: 'mu6', medicineId: 'med4', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-2, 9, 0), note: '腹泻调理', createdBy: DEFAULT_USER_ID },
  { id: 'mu7', medicineId: 'med6', babyId: DEFAULT_BABY_ID, quantity: 5, timestamp: d(0, 7, 0), note: '日常消耗', createdBy: DEFAULT_USER_ID },
  { id: 'mu8', medicineId: 'med6', babyId: DEFAULT_BABY_ID, quantity: 5, timestamp: d(-1, 7, 0), note: '日常消耗', createdBy: DEFAULT_USER_ID },
  { id: 'mu9', medicineId: 'med6', babyId: DEFAULT_BABY_ID, quantity: 5, timestamp: d(-2, 7, 0), note: '日常消耗', createdBy: DEFAULT_USER_ID },
  { id: 'mu10', medicineId: 'med7', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(0, 10, 0), note: '日常消耗', createdBy: DEFAULT_USER_ID },
  { id: 'mu11', medicineId: 'med7', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-2, 10, 0), note: '日常消耗', createdBy: DEFAULT_USER_ID },
  { id: 'mu12', medicineId: 'med8', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(0, 11, 0), note: '换尿布后涂抹', createdBy: DEFAULT_USER_ID },
  { id: 'mu13', medicineId: 'med9', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-1, 20, 0), note: '洗澡后涂抹', createdBy: DEFAULT_USER_ID },
  { id: 'mu14', medicineId: 'med12', babyId: DEFAULT_BABY_ID, quantity: 1, timestamp: d(-5, 20, 0), note: '最后一点用完', createdBy: DEFAULT_USER_ID },
]
