import { ref, computed, watch } from 'vue'
import type { Baby, FeedingRecord, SleepRecord, DiaperRecord, AppSettings, Family, FamilyMember, FamilyRole } from '@/types'
import { ROLE_PERMISSIONS } from '@/types'
import { defaultBaby, defaultSettings, mockFeedings, mockSleeps, mockDiapers } from '@/data/mock'

const KEYS = {
  family: 'baby-care:family',
  babies: 'baby-care:babies',
  feedings: 'baby-care:feedings',
  sleeps: 'baby-care:sleeps',
  diapers: 'baby-care:diapers',
  settings: 'baby-care:settings',
  currentBabyId: 'baby-care:current-baby-id',
  currentUserId: 'baby-care:current-user-id',
  currentUserName: 'baby-care:current-user-name',
  initialized: 'baby-care:initialized',
}

const SYNC_CHANNEL = 'baby-care:shared-sync'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const _uid = load<string>(KEYS.currentUserId, '')
export const currentUserId = ref(_uid || genId())
if (!_uid) save(KEYS.currentUserId, currentUserId.value)

export const currentUserName = ref(load<string>(KEYS.currentUserName, ''))

const initialized = localStorage.getItem(KEYS.initialized)
const defaultBabyWithId: Baby = { ...defaultBaby, id: defaultBaby.id || genId() }

export const family = ref<Family | null>(load<Family | null>(KEYS.family, null))
export const babies = ref<Baby[]>(load<Baby[]>(KEYS.babies, [defaultBabyWithId]))
export const feedings = ref<FeedingRecord[]>(initialized ? load<FeedingRecord[]>(KEYS.feedings, []) : [...mockFeedings])
export const sleeps = ref<SleepRecord[]>(initialized ? load<SleepRecord[]>(KEYS.sleeps, []) : [...mockSleeps])
export const diapers = ref<DiaperRecord[]>(initialized ? load<DiaperRecord[]>(KEYS.diapers, []) : [...mockDiapers])
export const settings = ref<AppSettings>(load<AppSettings>(KEYS.settings, defaultSettings))
export const currentBabyId = ref<string>(load<string>(KEYS.currentBabyId, babies.value[0]?.id || ''))

if (!initialized) {
  save(KEYS.babies, babies.value)
  save(KEYS.feedings, feedings.value)
  save(KEYS.sleeps, sleeps.value)
  save(KEYS.diapers, diapers.value)
  save(KEYS.settings, settings.value)
  save(KEYS.currentBabyId, currentBabyId.value)
  localStorage.setItem(KEYS.initialized, 'true')
}

let syncChannel: BroadcastChannel | null = null
try {
  syncChannel = new BroadcastChannel(SYNC_CHANNEL)
  syncChannel.onmessage = () => {
    family.value = load<Family | null>(KEYS.family, null)
    babies.value = load<Baby[]>(KEYS.babies, [])
    feedings.value = load<FeedingRecord[]>(KEYS.feedings, [])
    sleeps.value = load<SleepRecord[]>(KEYS.sleeps, [])
    diapers.value = load<DiaperRecord[]>(KEYS.diapers, [])
    settings.value = load<AppSettings>(KEYS.settings, defaultSettings)
    currentBabyId.value = load<string>(KEYS.currentBabyId, '')
    currentUserId.value = load<string>(KEYS.currentUserId, '')
    currentUserName.value = load<string>(KEYS.currentUserName, '')
  }
} catch {
  syncChannel = null
}

export function persist() {
  save(KEYS.family, family.value)
  save(KEYS.babies, babies.value)
  save(KEYS.feedings, feedings.value)
  save(KEYS.sleeps, sleeps.value)
  save(KEYS.diapers, diapers.value)
  save(KEYS.settings, settings.value)
  save(KEYS.currentBabyId, currentBabyId.value)
  save(KEYS.currentUserId, currentUserId.value)
  save(KEYS.currentUserName, currentUserName.value)
  syncChannel?.postMessage({ type: 'sync', ts: Date.now() })
}

export const currentMember = computed<FamilyMember | null>(() => {
  if (!family.value) return null
  return family.value.members.find(m => m.id === currentUserId.value) || null
})

export const currentRole = computed<FamilyRole | null>(() => currentMember.value?.role ?? null)

export function hasPermission(permission: string): boolean {
  const role = currentRole.value
  if (!role) return true
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const isOwner = computed(() => currentRole.value === 'owner')
export const isAdmin = computed(() => currentRole.value === 'owner' || currentRole.value === 'admin')
export const canAddRecord = computed(() => hasPermission('add_record'))
export const canDeleteRecord = computed(() => hasPermission('delete_record'))
export const canEditRecord = computed(() => hasPermission('edit_record') || hasPermission('edit_own'))

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
  persist()
}

export function resetAsNewUser(name: string) {
  currentUserId.value = genId()
  currentUserName.value = name
  persist()
}

export function addBabyToFamily(babyId: string) {
  if (!family.value) return
  if (!hasPermission('manage_babies') && !hasPermission('add_record')) return
  if (!family.value.babies.includes(babyId)) {
    family.value.babies.push(babyId)
    persist()
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
