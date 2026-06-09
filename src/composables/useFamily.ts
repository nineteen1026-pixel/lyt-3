import { ref, computed, watch } from 'vue'
import type { Family, FamilyMember, FamilyRole, Invitation } from '@/types'
import { ROLE_PERMISSIONS } from '@/types'

const STORAGE_KEY = 'baby-care:family'
const CURRENT_USER_KEY = 'baby-care:current-user'
const SYNC_CHANNEL = 'baby-care:sync'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function genInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

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

let syncChannel: BroadcastChannel | null = null

export function useFamily() {
  const family = ref<Family | null>(load<Family | null>(STORAGE_KEY, null))
  const currentUserId = ref<string>(load<string>(CURRENT_USER_KEY, ''))

  if (!currentUserId.value) {
    currentUserId.value = genId()
    save(CURRENT_USER_KEY, currentUserId.value)
  }

  function persist() {
    save(STORAGE_KEY, family.value)
    if (syncChannel) {
      syncChannel.postMessage({ type: 'family-updated', timestamp: Date.now() })
    }
  }

  if (!syncChannel) {
    try {
      syncChannel = new BroadcastChannel(SYNC_CHANNEL)
      syncChannel.onmessage = () => {
        family.value = load<Family | null>(STORAGE_KEY, null)
      }
    } catch {
      syncChannel = null
    }
  }

  const currentMember = computed<FamilyMember | null>(() => {
    if (!family.value) return null
    return family.value.members.find(m => m.id === currentUserId.value) || null
  })

  const currentRole = computed<FamilyRole | null>(() => currentMember.value?.role || null)

  function hasPermission(permission: string): boolean {
    if (!currentRole.value) return false
    return ROLE_PERMISSIONS[currentRole.value].includes(permission)
  }

  const isOwner = computed(() => currentRole.value === 'owner')
  const isAdmin = computed(() => currentRole.value === 'owner' || currentRole.value === 'admin')

  function createFamily(name: string, userName: string) {
    const ownerMember: FamilyMember = {
      id: currentUserId.value,
      name: userName,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    }
    family.value = {
      id: genId(),
      name,
      createdAt: new Date().toISOString(),
      ownerId: currentUserId.value,
      members: [ownerMember],
      babies: [],
      invitations: [],
    }
    persist()
  }

  function updateFamilyName(name: string) {
    if (!family.value || !hasPermission('manage_family')) return
    family.value.name = name
    persist()
  }

  function inviteMember(role: FamilyRole): Invitation {
    const invitation: Invitation = {
      id: genId(),
      code: genInviteCode(),
      role,
      invitedBy: currentUserId.value,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'pending',
    }
    family.value!.invitations.push(invitation)
    persist()
    return invitation
  }

  function joinFamilyByCode(code: string, userName: string): { success: boolean; message: string } {
    if (!family.value) return { success: false, message: '未找到家庭' }

    const invitation = family.value.invitations.find(
      inv => inv.code === code && inv.status === 'pending'
    )
    if (!invitation) return { success: false, message: '邀请码无效或已过期' }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired'
      persist()
      return { success: false, message: '邀请码已过期' }
    }

    if (family.value.members.some(m => m.id === currentUserId.value)) {
      return { success: false, message: '你已是家庭成员' }
    }

    const newMember: FamilyMember = {
      id: currentUserId.value,
      name: userName,
      role: invitation.role,
      joinedAt: new Date().toISOString(),
    }
    family.value.members.push(newMember)
    invitation.status = 'used'
    invitation.usedBy = currentUserId.value
    invitation.usedAt = new Date().toISOString()
    persist()
    return { success: true, message: '加入家庭成功！' }
  }

  function updateMemberRole(memberId: string, role: FamilyRole) {
    if (!family.value || !hasPermission('manage_members')) return
    if (memberId === family.value.ownerId) return

    const member = family.value.members.find(m => m.id === memberId)
    if (!member) return

    member.role = role
    persist()
  }

  function removeMember(memberId: string) {
    if (!family.value || !hasPermission('manage_members')) return
    if (memberId === family.value.ownerId) return

    family.value.members = family.value.members.filter(m => m.id !== memberId)
    persist()
  }

  function leaveFamily() {
    if (!family.value) return
    if (currentUserId.value === family.value.ownerId) return

    family.value.members = family.value.members.filter(m => m.id !== currentUserId.value)
    persist()

    if (family.value.members.length === 0) {
      family.value = null
      persist()
    }
  }

  function dissolveFamily() {
    if (!family.value || currentUserId.value !== family.value.ownerId) return
    family.value = null
    persist()
  }

  function addBabyToFamily(babyId: string) {
    if (!family.value || !hasPermission('manage_babies')) return
    if (!family.value.babies.includes(babyId)) {
      family.value.babies.push(babyId)
      persist()
    }
  }

  function removeBabyFromFamily(babyId: string) {
    if (!family.value || !hasPermission('manage_babies')) return
    family.value.babies = family.value.babies.filter(id => id !== babyId)
    persist()
  }

  function cleanupExpiredInvitations() {
    if (!family.value) return
    const now = new Date()
    family.value.invitations = family.value.invitations.map(inv => {
      if (inv.status === 'pending' && new Date(inv.expiresAt) < now) {
        return { ...inv, status: 'expired' as const }
      }
      return inv
    })
    persist()
  }

  watch(family, () => {
    cleanupExpiredInvitations()
  }, { deep: true })

  return {
    family,
    currentUserId,
    currentMember,
    currentRole,
    isOwner,
    isAdmin,
    hasPermission,
    createFamily,
    updateFamilyName,
    inviteMember,
    joinFamilyByCode,
    updateMemberRole,
    removeMember,
    leaveFamily,
    dissolveFamily,
    addBabyToFamily,
    removeBabyFromFamily,
    cleanupExpiredInvitations,
  }
}
