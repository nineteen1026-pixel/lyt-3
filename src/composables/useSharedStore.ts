import { ref, computed, watch } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, GrowthRecord, VaccineRecord, CheckupRecord, AppSettings, Family, FamilyMember, FamilyRole } from '@/types'
import { ROLE_PERMISSIONS } from '@/types'
import { defaultBaby, defaultSettings, mockFeedings, mockSleeps, mockDiapers, mockGrowths, mockVaccines, mockCheckups } from '@/data/mock'

const LS_KEYS = {
  family: 'baby-care:family',
  babies: 'baby-care:babies',
  feedings: 'baby-care:feedings',
  sleeps: 'baby-care:sleeps',
  diapers: 'baby-care:diapers',
  growths: 'baby-care:growths',
  vaccines: 'baby-care:vaccines',
  checkups: 'baby-care:checkups',
  settings: 'baby-care:settings',
  currentBabyId: 'baby-care:current-baby-id',
  initialized: 'baby-care:initialized',
}

const SS_KEYS = {
  userId: 'baby-care:session-user-id',
  userName: 'baby-care:session-user-name',
}

const SYNC_CHANNEL = 'baby-care:shared-sync'

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLS(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadSS<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveSS(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const _uid = loadSS<string>(SS_KEYS.userId, '')
export const currentUserId = ref(_uid || genId())
if (!_uid) saveSS(SS_KEYS.userId, currentUserId.value)

export const currentUserName = ref(loadSS<string>(SS_KEYS.userName, ''))

const initialized = localStorage.getItem(LS_KEYS.initialized)
const defaultBabyWithId: Baby = { ...defaultBaby, id: defaultBaby.id || genId() }

export const family = ref<Family | null>(loadLS<Family | null>(LS_KEYS.family, null))
export const babies = ref<Baby[]>(loadLS<Baby[]>(LS_KEYS.babies, [defaultBabyWithId]))
export const feedings = ref<FeedingRecord[]>(initialized ? loadLS<FeedingRecord[]>(LS_KEYS.feedings, []) : [...mockFeedings])
export const sleeps = ref<SleepRecord[]>(initialized ? loadLS<SleepRecord[]>(LS_KEYS.sleeps, []) : [...mockSleeps])
export const diapers = ref<DiaperRecord[]>(initialized ? loadLS<DiaperRecord[]>(LS_KEYS.diapers, []) : [...mockDiapers])
export const growths = ref<GrowthRecord[]>(initialized ? loadLS<GrowthRecord[]>(LS_KEYS.growths, []) : [...mockGrowths])
export const vaccines = ref<VaccineRecord[]>(initialized ? loadLS<VaccineRecord[]>(LS_KEYS.vaccines, []) : [...mockVaccines])
export const checkups = ref<CheckupRecord[]>(initialized ? loadLS<CheckupRecord[]>(LS_KEYS.checkups, []) : [...mockCheckups])
export const settings = ref<AppSettings>(loadLS<AppSettings>(LS_KEYS.settings, defaultSettings))
export const currentBabyId = ref<string>(loadLS<string>(LS_KEYS.currentBabyId, babies.value[0]?.id || ''))

if (!initialized) {
  saveLS(LS_KEYS.babies, babies.value)
  saveLS(LS_KEYS.feedings, feedings.value)
  saveLS(LS_KEYS.sleeps, sleeps.value)
  saveLS(LS_KEYS.diapers, diapers.value)
  saveLS(LS_KEYS.growths, growths.value)
  saveLS(LS_KEYS.vaccines, vaccines.value)
  saveLS(LS_KEYS.checkups, checkups.value)
  saveLS(LS_KEYS.settings, settings.value)
  saveLS(LS_KEYS.currentBabyId, currentBabyId.value)
  localStorage.setItem(LS_KEYS.initialized, 'true')
}

let syncChannel: BroadcastChannel | null = null
try {
  syncChannel = new BroadcastChannel(SYNC_CHANNEL)
  syncChannel.onmessage = () => {
    family.value = loadLS<Family | null>(LS_KEYS.family, null)
    babies.value = loadLS<Baby[]>(LS_KEYS.babies, [])
    feedings.value = loadLS<FeedingRecord[]>(LS_KEYS.feedings, [])
    sleeps.value = loadLS<SleepRecord[]>(LS_KEYS.sleeps, [])
    diapers.value = loadLS<DiaperRecord[]>(LS_KEYS.diapers, [])
    growths.value = loadLS<GrowthRecord[]>(LS_KEYS.growths, [])
    vaccines.value = loadLS<VaccineRecord[]>(LS_KEYS.vaccines, [])
    checkups.value = loadLS<CheckupRecord[]>(LS_KEYS.checkups, [])
    settings.value = loadLS<AppSettings>(LS_KEYS.settings, defaultSettings)
    currentBabyId.value = loadLS<string>(LS_KEYS.currentBabyId, '')
  }
} catch {
  syncChannel = null
}

export function persistData() {
  saveLS(LS_KEYS.family, family.value)
  saveLS(LS_KEYS.babies, babies.value)
  saveLS(LS_KEYS.feedings, feedings.value)
  saveLS(LS_KEYS.sleeps, sleeps.value)
  saveLS(LS_KEYS.diapers, diapers.value)
  saveLS(LS_KEYS.growths, growths.value)
  saveLS(LS_KEYS.vaccines, vaccines.value)
  saveLS(LS_KEYS.checkups, checkups.value)
  saveLS(LS_KEYS.settings, settings.value)
  saveLS(LS_KEYS.currentBabyId, currentBabyId.value)
  syncChannel?.postMessage({ type: 'sync', ts: Date.now() })
}

export function persistSession() {
  saveSS(SS_KEYS.userId, currentUserId.value)
  saveSS(SS_KEYS.userName, currentUserName.value)
}

export function persist() {
  persistData()
  persistSession()
}

export const currentMember = computed<FamilyMember | null>(() => {
  if (!family.value) return null
  return family.value.members.find(m => m.id === currentUserId.value) || null
})

export const currentRole = computed<FamilyRole | null>(() => currentMember.value?.role ?? null)

export const isFamilyMember = computed(() => {
  if (!family.value) return true
  return family.value.members.some(m => m.id === currentUserId.value)
})

export const needsJoin = computed(() => {
  return family.value !== null && !isFamilyMember.value
})

export function hasPermission(permission: string): boolean {
  if (!family.value) return true
  if (!isFamilyMember.value) return false
  const role = currentRole.value
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const isOwner = computed(() => currentRole.value === 'owner')
export const isAdmin = computed(() => currentRole.value === 'owner' || currentRole.value === 'admin')
export const canAddRecord = computed(() => hasPermission('add_record'))
export const canDeleteRecord = computed(() => hasPermission('delete_record'))
export const canEditRecord = computed(() => hasPermission('edit_record') || hasPermission('edit_own'))
export const canManageBabies = computed(() => hasPermission('manage_babies'))
export const canViewRecord = computed(() => hasPermission('view_record'))
export const canExportData = computed(() => hasPermission('export_data'))

export function getMemberName(memberId: string): string {
  if (!family.value) return currentUserName.value || '我'
  const m = family.value.members.find(m => m.id === memberId)
  return m?.name || '未知成员'
}

export function switchToMember(memberId: string) {
  if (!family.value) return
  const m = family.value.members.find(m => m.id === memberId)
  if (!m) return
  currentUserId.value = m.id
  currentUserName.value = m.name
  persistSession()
}

export function resetAsNewUser(name: string) {
  currentUserId.value = genId()
  currentUserName.value = name
  persistSession()
}

export function addBabyToFamily(babyId: string) {
  if (!family.value) return
  if (!hasPermission('manage_babies') && !hasPermission('add_record')) return
  if (!family.value.babies.includes(babyId)) {
    family.value.babies.push(babyId)
    persistData()
  }
}

watch(family, () => {
  if (!family.value) return
  const now = new Date()
  family.value.invitations = family.value.invitations.map(inv => {
    if (inv.status === 'pending' && new Date(inv.expiresAt) < now) {
      return { ...inv, status: 'expired' as const }
    }
    return inv
  })
}, { deep: true })
