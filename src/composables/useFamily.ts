import { computed } from 'vue'
import type { FamilyRole, Invitation, FamilyMember } from '@/types'
import { ROLE_LABELS } from '@/types'
import {
  family, currentUserId, currentUserName, currentMember, currentRole,
  isOwner, isAdmin, hasPermission, persist, genId,
  switchToMember, resetAsNewUser, babies,
} from './useSharedStore'

function genInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function useFamily() {
  function createFamily(name: string, userName: string) {
    currentUserName.value = userName
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
      babies: babies.value.map(b => b.id),
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

    currentUserName.value = userName

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
    family.value.babies = family.value.babies
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
    if (!family.value) return
    if (!hasPermission('manage_babies') && !hasPermission('add_record')) return
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

  return {
    family,
    currentUserId,
    currentUserName,
    currentMember,
    currentRole,
    isOwner,
    isAdmin,
    hasPermission,
    ROLE_LABELS,
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
    switchToMember,
    resetAsNewUser,
  }
}
