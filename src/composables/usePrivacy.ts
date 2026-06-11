import { ref, computed } from 'vue'
import type { PrivacySettings, PrivacyPassword, ShareAuthorization, ClearRecordLog, SensitiveFieldType } from '@/types'
import { feedings, sleeps, diapers, growths, vaccines, checkups, medicalVisits, medicines, temperatures, photoDiaryEntries, currentUserId, persistData, genId } from './useSharedStore'

const LS_KEY = 'baby-care:privacy-settings'

const defaultPrivacy: PrivacySettings = {
  password: { enabled: false, hash: '', lastSetAt: '' },
  hiddenFields: [],
  shareAuthorizations: [],
  clearLogs: [],
}

function loadPrivacy(): PrivacySettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : defaultPrivacy
  } catch {
    return defaultPrivacy
  }
}

function savePrivacy(data: PrivacySettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export const privacySettings = ref<PrivacySettings>(loadPrivacy())

function persist() {
  savePrivacy(privacySettings.value)
}

async function simpleHash(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input + 'baby-care-salt-2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function usePrivacy() {
  const isPasswordEnabled = computed(() => privacySettings.value.password.enabled)
  const hiddenFields = computed(() => privacySettings.value.hiddenFields)
  const activeAuthorizations = computed(() =>
    privacySettings.value.shareAuthorizations.filter(a => a.status === 'active')
  )
  const clearLogs = computed(() => privacySettings.value.clearLogs)

  const isUnlocked = ref(!privacySettings.value.password.enabled)

  async function setPassword(password: string) {
    const hash = await simpleHash(password)
    privacySettings.value.password = {
      enabled: true,
      hash,
      lastSetAt: new Date().toISOString(),
    }
    isUnlocked.value = true
    persist()
  }

  async function verifyPassword(password: string): Promise<boolean> {
    const hash = await simpleHash(password)
    return hash === privacySettings.value.password.hash
  }

  async function unlock(password: string): Promise<boolean> {
    const valid = await verifyPassword(password)
    if (valid) {
      isUnlocked.value = true
    }
    return valid
  }

  function lock() {
    isUnlocked.value = false
  }

  function disablePassword() {
    privacySettings.value.password = { enabled: false, hash: '', lastSetAt: '' }
    isUnlocked.value = true
    persist()
  }

  function isFieldHidden(field: SensitiveFieldType): boolean {
    return privacySettings.value.hiddenFields.includes(field)
  }

  function toggleFieldHidden(field: SensitiveFieldType) {
    const idx = privacySettings.value.hiddenFields.indexOf(field)
    if (idx >= 0) {
      privacySettings.value.hiddenFields.splice(idx, 1)
    } else {
      privacySettings.value.hiddenFields.push(field)
    }
    persist()
  }

  function setHiddenFields(fields: SensitiveFieldType[]) {
    privacySettings.value.hiddenFields = fields
    persist()
  }

  function maskValue(value: string | number | undefined, field: SensitiveFieldType): string {
    if (!isFieldHidden(field) || isUnlocked.value) {
      return value != null ? String(value) : ''
    }
    const str = String(value ?? '')
    if (str.length <= 2) return '***'
    return str[0] + '***' + str[str.length - 1]
  }

  function grantAuthorization(targetMemberId: string, targetMemberName: string, fields: SensitiveFieldType[], expiresAt: string | null) {
    const existing = privacySettings.value.shareAuthorizations.find(
      a => a.targetMemberId === targetMemberId && a.status === 'active'
    )
    if (existing) {
      existing.fields = [...new Set([...existing.fields, ...fields])]
      existing.expiresAt = expiresAt
      existing.grantedAt = new Date().toISOString()
      persist()
      return existing
    }
    const auth: ShareAuthorization = {
      id: genId(),
      targetMemberId,
      targetMemberName,
      fields,
      grantedAt: new Date().toISOString(),
      expiresAt,
      status: 'active',
    }
    privacySettings.value.shareAuthorizations.push(auth)
    persist()
    return auth
  }

  function revokeAuthorization(authId: string) {
    const auth = privacySettings.value.shareAuthorizations.find(a => a.id === authId)
    if (auth) {
      auth.status = 'revoked'
      persist()
    }
  }

  function canMemberSeeField(memberId: string, field: SensitiveFieldType): boolean {
    if (memberId === currentUserId.value) return true
    const auth = privacySettings.value.shareAuthorizations.find(
      a => a.targetMemberId === memberId && a.status === 'active'
    )
    if (!auth) return false
    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      auth.status = 'expired'
      persist()
      return false
    }
    return auth.fields.includes(field)
  }

  function clearRecords(category: ClearRecordLog['category'], dateRange?: { from: string; to: string }): number {
    let count = 0

    function inRange(dateStr: string): boolean {
      if (!dateRange) return true
      const from = new Date(dateRange.from).getTime()
      const to = new Date(dateRange.to).getTime() + 86400000
      const t = new Date(dateStr).getTime()
      return t >= from && t < to
    }

    function filterByTimestamp<T extends { timestamp: string }>(records: T[]): T[] {
      if (!dateRange) return records
      return records.filter(r => inRange(r.timestamp))
    }

    function filterByStartTime<T extends { startTime: string }>(records: T[]): T[] {
      if (!dateRange) return records
      return records.filter(r => inRange(r.startTime))
    }

    switch (category) {
      case 'feeding':
        count = filterByTimestamp(feedings.value).length
        feedings.value = dateRange ? feedings.value.filter(r => !inRange(r.timestamp)) : []
        break
      case 'sleep':
        count = filterByStartTime(sleeps.value).length
        sleeps.value = dateRange ? sleeps.value.filter(r => !inRange(r.startTime)) : []
        break
      case 'diaper':
        count = filterByTimestamp(diapers.value).length
        diapers.value = dateRange ? diapers.value.filter(r => !inRange(r.timestamp)) : []
        break
      case 'health': {
        const gCount = filterByTimestamp(growths.value).length
        const vCount = vaccines.value.filter(v => inRange(v.plannedDate)).length
        const cCount = filterByTimestamp(checkups.value).length
        const mCount = filterByTimestamp(medicalVisits.value).length
        count = gCount + vCount + cCount + mCount
        if (!dateRange) {
          growths.value = []
          vaccines.value = []
          checkups.value = []
          medicalVisits.value = []
        } else {
          growths.value = growths.value.filter(r => !inRange(r.timestamp))
          vaccines.value = vaccines.value.filter(v => !inRange(v.plannedDate))
          checkups.value = checkups.value.filter(r => !inRange(r.timestamp))
          medicalVisits.value = medicalVisits.value.filter(r => !inRange(r.timestamp))
        }
        break
      }
      case 'medicine':
        count = medicines.value.length
        medicines.value = []
        break
      case 'temperature':
        count = filterByTimestamp(temperatures.value).length
        temperatures.value = dateRange ? temperatures.value.filter(r => !inRange(r.timestamp)) : []
        break
      case 'photo':
        count = filterByTimestamp(photoDiaryEntries.value).length
        photoDiaryEntries.value = dateRange ? photoDiaryEntries.value.filter(r => !inRange(r.timestamp)) : []
        break
      case 'all': {
        count = feedings.value.length + sleeps.value.length + diapers.value.length
          + growths.value.length + vaccines.value.length + checkups.value.length
          + medicalVisits.value.length + medicines.value.length + temperatures.value.length
          + photoDiaryEntries.value.length
        feedings.value = []
        sleeps.value = []
        diapers.value = []
        growths.value = []
        vaccines.value = []
        checkups.value = []
        medicalVisits.value = []
        medicines.value = []
        temperatures.value = []
        photoDiaryEntries.value = []
        break
      }
    }

    const log: ClearRecordLog = {
      id: genId(),
      category,
      clearedAt: new Date().toISOString(),
      clearedBy: currentUserId.value,
      recordCount: count,
      dateRange: dateRange ?? null,
    }
    privacySettings.value.clearLogs.unshift(log)
    persist()
    persistData()
    return count
  }

  function clearPrivacyLogs() {
    privacySettings.value.clearLogs = []
    persist()
  }

  return {
    privacySettings,
    isPasswordEnabled,
    isUnlocked,
    hiddenFields,
    activeAuthorizations,
    clearLogs,
    setPassword,
    verifyPassword,
    unlock,
    lock,
    disablePassword,
    isFieldHidden,
    toggleFieldHidden,
    setHiddenFields,
    maskValue,
    grantAuthorization,
    revokeAuthorization,
    canMemberSeeField,
    clearRecords,
    clearPrivacyLogs,
  }
}
