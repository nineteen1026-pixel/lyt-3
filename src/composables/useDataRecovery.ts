import { ref, computed } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, GrowthRecord, VaccineRecord, CheckupRecord, AppSettings, Family, ReminderItem, MissedRecord, Medicine, MedicineUsage, StockChangeRecord } from '@/types'
import {
  family, babies, feedings, sleeps, diapers, growths, vaccines, checkups,
  settings, reminders, missedRecords, medicines, medicineUsages, stockChanges,
  currentBabyId, persistData, genId,
} from './useSharedStore'

export interface BackupData {
  version: string
  exportedAt: string
  family: Family | null
  babies: Baby[]
  feedings: FeedingRecord[]
  sleeps: SleepRecord[]
  diapers: DiaperRecord[]
  growths: GrowthRecord[]
  vaccines: VaccineRecord[]
  checkups: CheckupRecord[]
  settings: AppSettings
  reminders: ReminderItem[]
  missedRecords: MissedRecord[]
  medicines: Medicine[]
  medicineUsages: MedicineUsage[]
  stockChanges: StockChangeRecord[]
  currentBabyId: string
}

export interface ConflictItem {
  key: string
  label: string
  localCount: number
  importCount: number
  conflictType: 'local_has_more' | 'import_has_more' | 'both_have_data' | 'local_only' | 'import_only'
}

export interface ImportPreview {
  data: BackupData | null
  fileName: string
  fileSize: string
  exportedAt: string
  version: string
  conflicts: ConflictItem[]
  summary: { key: string; label: string; count: number }[]
  isValid: boolean
  error: string | null
}

const BACKUP_VERSION = '2.0'

const DATA_KEYS: { key: keyof BackupData; label: string }[] = [
  { key: 'family', label: '家庭信息' },
  { key: 'babies', label: '宝宝信息' },
  { key: 'feedings', label: '喂养记录' },
  { key: 'sleeps', label: '睡眠记录' },
  { key: 'diapers', label: '换尿布记录' },
  { key: 'growths', label: '成长记录' },
  { key: 'vaccines', label: '疫苗记录' },
  { key: 'checkups', label: '体检记录' },
  { key: 'reminders', label: '提醒事项' },
  { key: 'missedRecords', label: '遗漏记录' },
  { key: 'medicines', label: '药品信息' },
  { key: 'medicineUsages', label: '用药记录' },
  { key: 'stockChanges', label: '库存变更' },
]

function getCount(value: unknown): number {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return 1
  if (value === null || value === undefined) return 0
  return 0
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getLocalData(): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    family: family.value,
    babies: babies.value,
    feedings: feedings.value,
    sleeps: sleeps.value,
    diapers: diapers.value,
    growths: growths.value,
    vaccines: vaccines.value,
    checkups: checkups.value,
    settings: settings.value,
    reminders: reminders.value,
    missedRecords: missedRecords.value,
    medicines: medicines.value,
    medicineUsages: medicineUsages.value,
    stockChanges: stockChanges.value,
    currentBabyId: currentBabyId.value,
  }
}

function detectConflicts(importData: BackupData): ConflictItem[] {
  const local = getLocalData()
  const conflicts: ConflictItem[] = []

  for (const { key, label } of DATA_KEYS) {
    const localVal = local[key]
    const importVal = importData[key]
    const localCount = getCount(localVal)
    const importCount = getCount(importVal)

    if (localCount === 0 && importCount === 0) continue

    let conflictType: ConflictItem['conflictType']
    if (localCount > 0 && importCount === 0) {
      conflictType = 'local_only'
    } else if (localCount === 0 && importCount > 0) {
      conflictType = 'import_only'
    } else if (localCount > importCount) {
      conflictType = 'local_has_more'
    } else if (importCount > localCount) {
      conflictType = 'import_has_more'
    } else {
      conflictType = 'both_have_data'
    }

    if (conflictType === 'local_only') continue

    conflicts.push({ key, label, localCount, importCount, conflictType })
  }

  return conflicts
}

export function useDataRecovery() {
  const importPreview = ref<ImportPreview | null>(null)
  const isExporting = ref(false)
  const isImporting = ref(false)
  const lastExportTime = ref<string | null>(null)

  const hasConflicts = computed(() =>
    importPreview.value ? importPreview.value.conflicts.length > 0 : false
  )

  const hasCriticalConflicts = computed(() =>
    importPreview.value
      ? importPreview.value.conflicts.some(c =>
          c.conflictType === 'both_have_data' || c.conflictType === 'local_has_more'
        )
      : false
  )

  function exportBackup() {
    isExporting.value = true
    try {
      const data = getLocalData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `baby-care-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      lastExportTime.value = new Date().toISOString()
      return true
    } finally {
      isExporting.value = false
    }
  }

  function parseImportFile(file: File): Promise<ImportPreview> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string
          const data = JSON.parse(raw) as BackupData

          if (!data.version || !data.exportedAt) {
            resolve({
              data: null,
              fileName: file.name,
              fileSize: formatFileSize(file.size),
              exportedAt: '',
              version: '',
              conflicts: [],
              summary: [],
              isValid: false,
              error: '无效的备份文件格式，缺少版本或导出时间信息',
            })
            return
          }

          if (!data.babies || !Array.isArray(data.babies)) {
            resolve({
              data: null,
              fileName: file.name,
              fileSize: formatFileSize(file.size),
              exportedAt: '',
              version: '',
              conflicts: [],
              summary: [],
              isValid: false,
              error: '无效的备份文件：缺少宝宝数据',
            })
            return
          }

          const conflicts = detectConflicts(data)
          const summary = DATA_KEYS
            .map(({ key, label }) => ({
              key,
              label,
              count: getCount(data[key]),
            }))
            .filter(s => s.count > 0)

          resolve({
            data,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            exportedAt: data.exportedAt,
            version: data.version,
            conflicts,
            summary,
            isValid: true,
            error: null,
          })
        } catch {
          resolve({
            data: null,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            exportedAt: '',
            version: '',
            conflicts: [],
            summary: [],
            isValid: false,
            error: '无法解析文件内容，请确认是有效的 JSON 备份文件',
          })
        }
      }
      reader.onerror = () => {
        resolve({
          data: null,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          exportedAt: '',
          version: '',
          conflicts: [],
          summary: [],
          isValid: false,
          error: '读取文件失败',
        })
      }
      reader.readAsText(file)
    })
  }

  async function previewImport(file: File) {
    importPreview.value = await parseImportFile(file)
  }

  function clearPreview() {
    importPreview.value = null
  }

  function applyImport(mode: 'overwrite' | 'merge') {
    if (!importPreview.value?.data) return false
    isImporting.value = true
    try {
      const data = importPreview.value.data

      if (mode === 'overwrite') {
        family.value = data.family
        babies.value = data.babies
        feedings.value = data.feedings || []
        sleeps.value = data.sleeps || []
        diapers.value = data.diapers || []
        growths.value = data.growths || []
        vaccines.value = data.vaccines || []
        checkups.value = data.checkups || []
        settings.value = data.settings
        reminders.value = data.reminders || []
        missedRecords.value = data.missedRecords || []
        medicines.value = data.medicines || []
        medicineUsages.value = data.medicineUsages || []
        stockChanges.value = data.stockChanges || []
        currentBabyId.value = data.currentBabyId || ''
      } else {
        const existingIds = new Set([
          ...feedings.value.map(r => r.id),
          ...sleeps.value.map(r => r.id),
          ...diapers.value.map(r => r.id),
          ...growths.value.map(r => r.id),
          ...vaccines.value.map(r => r.id),
          ...checkups.value.map(r => r.id),
          ...reminders.value.map(r => r.id),
          ...missedRecords.value.map(r => r.id),
          ...medicines.value.map(r => r.id),
          ...medicineUsages.value.map(r => r.id),
          ...stockChanges.value.map(r => r.id),
        ])

        if (data.feedings) {
          const merged = data.feedings.filter(r => !existingIds.has(r.id))
          feedings.value = [...merged, ...feedings.value]
        }
        if (data.sleeps) {
          const merged = data.sleeps.filter(r => !existingIds.has(r.id))
          sleeps.value = [...merged, ...sleeps.value]
        }
        if (data.diapers) {
          const merged = data.diapers.filter(r => !existingIds.has(r.id))
          diapers.value = [...merged, ...diapers.value]
        }
        if (data.growths) {
          const merged = data.growths.filter(r => !existingIds.has(r.id))
          growths.value = [...merged, ...growths.value]
        }
        if (data.vaccines) {
          const merged = data.vaccines.filter(r => !existingIds.has(r.id))
          vaccines.value = [...merged, ...vaccines.value]
        }
        if (data.checkups) {
          const merged = data.checkups.filter(r => !existingIds.has(r.id))
          checkups.value = [...merged, ...checkups.value]
        }
        if (data.reminders) {
          const merged = data.reminders.filter(r => !existingIds.has(r.id))
          reminders.value = [...merged, ...reminders.value]
        }
        if (data.missedRecords) {
          const merged = data.missedRecords.filter(r => !existingIds.has(r.id))
          missedRecords.value = [...merged, ...missedRecords.value]
        }
        if (data.medicines) {
          const merged = data.medicines.filter(r => !existingIds.has(r.id))
          medicines.value = [...merged, ...medicines.value]
        }
        if (data.medicineUsages) {
          const merged = data.medicineUsages.filter(r => !existingIds.has(r.id))
          medicineUsages.value = [...merged, ...medicineUsages.value]
        }
        if (data.stockChanges) {
          const merged = data.stockChanges.filter(r => !existingIds.has(r.id))
          stockChanges.value = [...merged, ...stockChanges.value]
        }

        if (!family.value && data.family) {
          family.value = data.family
        }
        if (data.babies) {
          const existingBabyIds = new Set(babies.value.map(b => b.id))
          const newBabies = data.babies.filter(b => !existingBabyIds.has(b.id))
          babies.value = [...babies.value, ...newBabies]
        }
        if (data.settings) {
          settings.value = { ...settings.value, ...data.settings }
        }
        if (!currentBabyId.value && data.currentBabyId) {
          currentBabyId.value = data.currentBabyId
        }
      }

      persistData()
      importPreview.value = null
      return true
    } finally {
      isImporting.value = false
    }
  }

  const localDataSummary = computed(() => {
    return DATA_KEYS.map(({ key, label }) => {
      const local = getLocalData()
      return { key, label, count: getCount(local[key]) }
    }).filter(s => s.count > 0)
  })

  const totalLocalRecords = computed(() =>
    localDataSummary.value.reduce((acc, s) => acc + s.count, 0)
  )

  return {
    importPreview,
    isExporting,
    isImporting,
    lastExportTime,
    hasConflicts,
    hasCriticalConflicts,
    localDataSummary,
    totalLocalRecords,
    exportBackup,
    previewImport,
    clearPreview,
    applyImport,
  }
}
