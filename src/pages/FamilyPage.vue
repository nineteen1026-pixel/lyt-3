<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Users, UserPlus, Crown, Shield, User, Eye,
  Copy, Check, Trash2, Plus, Baby, LogOut, AlertTriangle, X, RefreshCw
} from 'lucide-vue-next'
import { useFamily } from '@/composables/useFamily'
import { useBabyCare } from '@/composables/useBabyCare'
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/types'
import type { FamilyRole } from '@/types'

const router = useRouter()
const {
  family, currentUserId, currentUserName, currentMember, currentRole,
  isOwner, isAdmin, isFamilyMember, needsJoin, hasPermission,
  createFamily, updateFamilyName, inviteMember, joinFamilyByCode,
  updateMemberRole, removeMember, leaveFamily, dissolveFamily,
  switchToMember, resetAsNewUser,
} = useFamily()
const { babies, addBaby } = useBabyCare()

const showInvite = ref(false)
const showAddBaby = ref(false)
const showRolePicker = ref<string | null>(null)
const showConfirmDissolve = ref(false)
const showConfirmLeave = ref(false)
const showSwitchUser = ref(false)

const newFamilyName = ref('')
const newUserName = ref(currentUserName.value || '')
const joinCode = ref('')
const joinUserName = ref('')
const inviteRole = ref<FamilyRole>('member')
const copiedCode = ref('')
const newBabyName = ref('')
const newBabyBirthDate = ref('')
const newBabyGender = ref<'male' | 'female'>('male')
const editFamilyName = ref(family.value?.name || '')
const savedFamilyName = ref(false)
const joinResult = ref<{ success: boolean; message: string } | null>(null)
const switchUserName = ref('')

const roleOptions: { value: FamilyRole; label: string; icon: typeof Crown; desc: string }[] = [
  { value: 'admin', label: '管理员', icon: Shield, desc: '可管理成员、宝宝，添加/编辑/删除记录' },
  { value: 'member', label: '成员', icon: User, desc: '可添加记录、编辑自己的记录' },
  { value: 'viewer', label: '观察者', icon: Eye, desc: '只能查看记录，不能添加' },
]

const memberRoleOptions: { value: FamilyRole; label: string; icon: typeof Crown }[] = [
  { value: 'admin', label: '管理员', icon: Shield },
  { value: 'member', label: '成员', icon: User },
  { value: 'viewer', label: '观察者', icon: Eye },
]

const otherMembers = computed(() => {
  if (!family.value) return []
  return family.value.members.filter(m => m.id !== currentUserId.value)
})

function getRoleIcon(role: FamilyRole) {
  if (role === 'owner') return Crown
  if (role === 'admin') return Shield
  if (role === 'member') return User
  return Eye
}

function getRoleColor(role: FamilyRole) {
  if (role === 'owner') return 'bg-peach-100 text-peach-500 dark:bg-peach-500/20 dark:text-peach-400'
  if (role === 'admin') return 'bg-mint-100 text-mint-500 dark:bg-mint-500/20 dark:text-mint-400'
  if (role === 'member') return 'bg-cream-200 text-warm-400 dark:bg-cream-300/20 dark:text-cream-300'
  return 'bg-cream-100 text-warm-300 dark:bg-warm-500/20 dark:text-warm-200'
}

function handleCreateFamily() {
  if (!newFamilyName.value.trim() || !newUserName.value.trim()) return
  createFamily(newFamilyName.value.trim(), newUserName.value.trim())
  editFamilyName.value = newFamilyName.value.trim()
}

function handleJoinFamily() {
  if (!joinCode.value.trim() || !joinUserName.value.trim()) return
  joinResult.value = joinFamilyByCode(joinCode.value.trim().toUpperCase(), joinUserName.value.trim())
  if (joinResult.value.success) {
    setTimeout(() => {
      joinResult.value = null
      joinCode.value = ''
      joinUserName.value = ''
    }, 1500)
  }
}

function handleInvite() {
  inviteMember(inviteRole.value)
  showInvite.value = false
}

function handleCopyCode(code: string) {
  navigator.clipboard.writeText(code).catch(() => {})
  copiedCode.value = code
  setTimeout(() => { copiedCode.value = '' }, 2000)
}

function handleUpdateMemberRole(memberId: string, role: FamilyRole) {
  updateMemberRole(memberId, role)
  showRolePicker.value = null
}

function handleSaveFamilyName() {
  if (!editFamilyName.value.trim()) return
  updateFamilyName(editFamilyName.value.trim())
  savedFamilyName.value = true
  setTimeout(() => { savedFamilyName.value = false }, 1500)
}

function handleAddBaby() {
  if (!newBabyName.value.trim() || !newBabyBirthDate.value) return
  addBaby({
    name: newBabyName.value.trim(),
    birthDate: newBabyBirthDate.value,
    gender: newBabyGender.value,
  })
  newBabyName.value = ''
  newBabyBirthDate.value = ''
  newBabyGender.value = 'male'
  showAddBaby.value = false
}

function handleLeave() {
  leaveFamily()
  showConfirmLeave.value = false
}

function handleDissolve() {
  dissolveFamily()
  showConfirmDissolve.value = false
}

function handleSwitchExisting(memberId: string) {
  switchToMember(memberId)
  showSwitchUser.value = false
}

function handleSwitchNew() {
  if (!switchUserName.value.trim()) return
  resetAsNewUser(switchUserName.value.trim())
  showSwitchUser.value = false
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Users :size="20" class="text-peach-400" />
        家庭管理
      </h1>
    </header>

    <!-- 场景1：无家庭 → 创建或加入 -->
    <div v-if="!family" class="space-y-6">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 shadow-sm">
        <h2 class="text-base font-bold text-warm-500 dark:text-cream-100 mb-4">创建家庭</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">家庭名称</label>
            <input v-model="newFamilyName" type="text" placeholder="例如：星星的家"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">你的昵称</label>
            <input v-model="newUserName" type="text" placeholder="例如：妈妈"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <button @click="handleCreateFamily"
            :disabled="!newFamilyName.trim() || !newUserName.trim()"
            class="w-full bg-peach-400 hover:bg-peach-500 disabled:opacity-40 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
            创建家庭
          </button>
        </div>
      </div>

      <div class="text-center text-warm-300 dark:text-warm-200 text-sm">或</div>

      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 shadow-sm">
        <h2 class="text-base font-bold text-warm-500 dark:text-cream-100 mb-4">加入已有家庭</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">邀请码</label>
            <input v-model="joinCode" type="text" placeholder="输入6位邀请码" maxlength="6"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 tracking-widest text-center text-lg font-bold uppercase" />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">你的昵称</label>
            <input v-model="joinUserName" type="text" placeholder="例如：爸爸"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div v-if="joinResult" class="rounded-xl py-2.5 px-4 text-center text-sm font-semibold"
            :class="joinResult.success ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500' : 'bg-red-100 dark:bg-red-500/20 text-red-500'">
            {{ joinResult.message }}
          </div>
          <button @click="handleJoinFamily"
            :disabled="!joinCode.trim() || !joinUserName.trim()"
            class="w-full bg-mint-400 hover:bg-mint-500 disabled:opacity-40 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
            加入家庭
          </button>
        </div>
      </div>
    </div>

    <!-- 场景2：有家庭但不是成员 → 只能加入 -->
    <div v-else-if="needsJoin" class="space-y-6">
      <div class="bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
          <Users :size="20" class="text-peach-400" />
        </div>
        <div>
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100">你尚未加入「{{ family.name }}」</p>
          <p class="text-[11px] text-warm-300 dark:text-warm-200">请使用邀请码加入家庭后操作</p>
        </div>
      </div>

      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 shadow-sm">
        <h2 class="text-base font-bold text-warm-500 dark:text-cream-100 mb-4">加入家庭</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">邀请码</label>
            <input v-model="joinCode" type="text" placeholder="输入6位邀请码" maxlength="6"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 tracking-widest text-center text-lg font-bold uppercase" />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">你的昵称</label>
            <input v-model="joinUserName" type="text" placeholder="例如：爸爸"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div v-if="joinResult" class="rounded-xl py-2.5 px-4 text-center text-sm font-semibold"
            :class="joinResult.success ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500' : 'bg-red-100 dark:bg-red-500/20 text-red-500'">
            {{ joinResult.message }}
          </div>
          <button @click="handleJoinFamily"
            :disabled="!joinCode.trim() || !joinUserName.trim()"
            class="w-full bg-peach-400 hover:bg-peach-500 disabled:opacity-40 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
            加入家庭
          </button>
        </div>
      </div>
    </div>

    <!-- 场景3：是家庭成员 → 完整管理 -->
    <div v-else class="space-y-5">
      <div class="mb-4 bg-peach-50 dark:bg-peach-500/10 rounded-2xl p-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center"
          :class="getRoleColor(currentRole || 'member')">
          <component :is="getRoleIcon(currentRole || 'member')" :size="16" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-warm-500 dark:text-cream-100 truncate">
            {{ currentUserName || '未设置昵称' }}
            <span class="text-[11px] font-normal text-warm-300 dark:text-warm-200 ml-1">
              ({{ ROLE_LABELS[currentRole || 'member'] }})
            </span>
          </p>
        </div>
        <button @click="showSwitchUser = true"
          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-[#2a1f1a] text-peach-400 shadow-sm flex items-center gap-1">
          <RefreshCw :size="12" /> 切换身份
        </button>
      </div>

      <section class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
            <Users :size="20" class="text-peach-400" />
          </div>
          <div class="flex-1">
            <div v-if="isOwner" class="flex items-center gap-2">
              <input v-model="editFamilyName" type="text"
                class="bg-transparent text-lg font-extrabold text-warm-500 dark:text-cream-100 focus:outline-none border-b border-transparent focus:border-peach-300 flex-1" />
              <button @click="handleSaveFamilyName"
                class="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                :class="savedFamilyName ? 'bg-mint-100 dark:bg-mint-500/20 text-mint-500' : 'bg-peach-50 dark:bg-peach-500/10 text-peach-500'">
                {{ savedFamilyName ? '已保存' : '保存' }}
              </button>
            </div>
            <h2 v-else class="text-lg font-extrabold text-warm-500 dark:text-cream-100">{{ family.name }}</h2>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">创建于 {{ formatDate(family.createdAt) }} · {{ family.members.length }} 位成员</p>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <Users :size="14" /> 家庭成员
          </h2>
          <button v-if="hasPermission('invite_member')" @click="showInvite = true"
            class="text-xs font-bold text-peach-400 flex items-center gap-1 hover:text-peach-500">
            <UserPlus :size="14" /> 邀请
          </button>
        </div>
        <div class="space-y-2">
          <div v-for="member in family.members" :key="member.id"
            class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm relative"
            :class="member.id === currentUserId ? 'ring-2 ring-peach-300 dark:ring-peach-500/40' : ''">
            <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" :class="getRoleColor(member.role)">
              <component :is="getRoleIcon(member.role)" :size="16" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">
                {{ member.name }}
                <span v-if="member.id === currentUserId" class="text-[10px] text-peach-400 ml-1">（我）</span>
                <span v-if="member.id === family.ownerId" class="text-[10px] text-peach-400 ml-1">创建者</span>
              </p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ ROLE_LABELS[member.role] }} · 加入于 {{ formatDate(member.joinedAt) }}</p>
            </div>
            <template v-if="isAdmin && member.id !== family.ownerId && member.id !== currentUserId">
              <button @click="showRolePicker = showRolePicker === member.id ? null : member.id"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                :class="getRoleColor(member.role)">
                {{ ROLE_LABELS[member.role] }}
              </button>
              <button @click="removeMember(member.id)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-warm-200 dark:text-warm-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <Trash2 :size="14" />
              </button>
            </template>

            <div v-if="showRolePicker === member.id"
              class="absolute right-3 top-12 bg-white dark:bg-[#2a1f1a] rounded-xl shadow-lg border border-cream-200 dark:border-warm-500/20 z-10 py-1 min-w-[140px]">
              <button v-for="opt in memberRoleOptions" :key="opt.value"
                @click="handleUpdateMemberRole(member.id, opt.value)"
                class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
                :class="member.role === opt.value ? 'bg-peach-50 dark:bg-peach-500/10' : ''">
                <component :is="opt.icon" :size="14" :class="getRoleColor(opt.value)" />
                <span class="text-xs font-semibold text-warm-500 dark:text-cream-100">{{ opt.label }}</span>
                <Check v-if="member.role === opt.value" :size="14" class="text-peach-400 ml-auto" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="isAdmin && family.invitations.filter(i => i.status === 'pending').length > 0">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <UserPlus :size="14" /> 待使用邀请
        </h2>
        <div class="space-y-2">
          <div v-for="inv in family.invitations.filter(i => i.status === 'pending')" :key="inv.id"
            class="bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-lg font-mono font-bold tracking-widest text-warm-500 dark:text-cream-100">{{ inv.code }}</span>
                <button @click="handleCopyCode(inv.code)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center bg-cream-50 dark:bg-warm-500/10 hover:bg-cream-100 dark:hover:bg-warm-500/20 transition-colors">
                  <component :is="copiedCode === inv.code ? Check : Copy" :size="14" :class="copiedCode === inv.code ? 'text-mint-500' : 'text-warm-300 dark:text-warm-200'" />
                </button>
              </div>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ ROLE_LABELS[inv.role] }} · 有效期至 {{ formatDate(inv.expiresAt) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <Baby :size="14" /> 宝宝列表
          </h2>
          <button v-if="hasPermission('manage_babies') || hasPermission('add_record')" @click="showAddBaby = true"
            class="text-xs font-bold text-peach-400 flex items-center gap-1 hover:text-peach-500">
            <Plus :size="14" /> 添加
          </button>
        </div>
        <div class="space-y-2">
          <div v-for="b in babies" :key="b.id"
            class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm">
            <div class="w-9 h-9 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
              <Baby :size="16" class="text-peach-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ b.name }}</p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ b.gender === 'male' ? '👦 男孩' : '👧 女孩' }} · {{ b.birthDate }}</p>
            </div>
          </div>
          <div v-if="babies.length === 0" class="text-center py-6 text-warm-300 dark:text-warm-200 text-sm">
            暂无宝宝，点击上方添加
          </div>
        </div>
      </section>

      <section v-if="currentRole">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3">权限说明</h2>
        <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <component :is="getRoleIcon(currentRole)" :size="16" :class="getRoleColor(currentRole)" />
            <span class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ ROLE_LABELS[currentRole] }} 权限</span>
          </div>
          <div class="space-y-1">
            <div v-for="perm in ROLE_PERMISSIONS[currentRole]" :key="perm"
              class="flex items-center gap-2 text-xs text-warm-400 dark:text-warm-100">
              <div class="w-1.5 h-1.5 rounded-full bg-mint-400"></div>
              <span v-if="perm === 'manage_family'">管理家庭信息</span>
              <span v-else-if="perm === 'manage_members'">管理成员与邀请</span>
              <span v-else-if="perm === 'manage_babies'">管理宝宝信息</span>
              <span v-else-if="perm === 'add_record'">添加照护记录</span>
              <span v-else-if="perm === 'edit_record'">编辑所有记录</span>
              <span v-else-if="perm === 'edit_own'">编辑自己的记录</span>
              <span v-else-if="perm === 'delete_record'">删除记录</span>
              <span v-else-if="perm === 'view_record'">查看记录</span>
              <span v-else-if="perm === 'invite_member'">邀请成员</span>
              <span v-else-if="perm === 'export_data'">导出数据</span>
              <span v-else>{{ perm }}</span>
            </div>
          </div>
          <div v-if="!hasPermission('add_record')" class="mt-3 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
            <p class="text-xs text-red-500 font-semibold">当前角色无法添加照护记录</p>
          </div>
        </div>
      </section>

      <section class="space-y-2">
        <button v-if="!isOwner" @click="showConfirmLeave = true"
          class="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
          <div class="flex items-center gap-2">
            <LogOut :size="16" class="text-warm-300 dark:text-warm-200" />
            <span class="text-sm font-semibold text-warm-500 dark:text-cream-100">退出家庭</span>
          </div>
          <span class="text-[11px] text-warm-300 dark:text-warm-200">将不再看到家庭数据</span>
        </button>
        <button v-if="isOwner" @click="showConfirmDissolve = true"
          class="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
          <div class="flex items-center gap-2">
            <AlertTriangle :size="16" class="text-red-400" />
            <span class="text-sm font-semibold text-red-500">解散家庭</span>
          </div>
          <span class="text-[11px] text-red-400">不可恢复</span>
        </button>
      </section>
    </div>

    <!-- 切换身份弹窗 -->
    <div v-if="showSwitchUser" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="showSwitchUser = false">
      <div class="w-full max-w-lg bg-white dark:bg-[#2a1f1a] rounded-t-3xl p-5 pb-8 animate-slide-up">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-warm-500 dark:text-cream-100">切换身份</h3>
          <button @click="showSwitchUser = false" class="w-8 h-8 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <X :size="16" class="text-warm-300 dark:text-warm-200" />
          </button>
        </div>
        <p class="text-xs text-warm-300 dark:text-warm-200 mb-4">切换后将以该成员身份操作系统（会话级，关闭标签页后重置）</p>

        <div v-if="otherMembers.length > 0" class="mb-4">
          <h4 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">切换到已有成员</h4>
          <div class="space-y-2">
            <button v-for="m in otherMembers" :key="m.id" @click="handleSwitchExisting(m.id)"
              class="w-full flex items-center gap-3 rounded-xl px-3 py-3 bg-cream-50 dark:bg-warm-500/10 hover:bg-cream-100 dark:hover:bg-warm-500/20 transition-colors">
              <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="getRoleColor(m.role)">
                <component :is="getRoleIcon(m.role)" :size="14" />
              </div>
              <div class="text-left flex-1">
                <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ m.name }}</p>
                <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ ROLE_LABELS[m.role] }}</p>
              </div>
              <RefreshCw :size="14" class="text-warm-300 dark:text-warm-200" />
            </button>
          </div>
        </div>

        <div class="border-t border-cream-200 dark:border-warm-500/20 pt-4">
          <h4 class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">模拟新用户</h4>
          <div class="flex gap-2">
            <input v-model="switchUserName" type="text" placeholder="输入新用户昵称"
              class="flex-1 bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 text-sm" />
            <button @click="handleSwitchNew" :disabled="!switchUserName.trim()"
              class="px-4 py-2.5 rounded-xl font-bold text-sm bg-peach-400 hover:bg-peach-500 disabled:opacity-40 text-white transition-all">
              切换
            </button>
          </div>
          <p class="text-[10px] text-warm-300 dark:text-warm-200 mt-1.5">新用户不在家庭中，需通过邀请码加入</p>
        </div>
      </div>
    </div>

    <!-- 邀请弹窗 -->
    <div v-if="showInvite" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="showInvite = false">
      <div class="w-full max-w-lg bg-white dark:bg-[#2a1f1a] rounded-t-3xl p-5 pb-8 animate-slide-up">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-warm-500 dark:text-cream-100">邀请成员</h3>
          <button @click="showInvite = false" class="w-8 h-8 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <X :size="16" class="text-warm-300 dark:text-warm-200" />
          </button>
        </div>
        <p class="text-xs text-warm-300 dark:text-warm-200 mb-4">选择邀请角色后生成邀请码，将邀请码分享给家人即可</p>
        <div class="space-y-2 mb-5">
          <button v-for="opt in roleOptions" :key="opt.value"
            @click="inviteRole = opt.value"
            class="w-full flex items-center gap-3 rounded-2xl p-3 border-2 transition-all"
            :class="inviteRole === opt.value
              ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent'">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="getRoleColor(opt.value)">
              <component :is="opt.icon" :size="16" />
            </div>
            <div class="text-left">
              <p class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ opt.label }}</p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ opt.desc }}</p>
            </div>
          </button>
        </div>
        <button @click="handleInvite"
          class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
          生成邀请码
        </button>
      </div>
    </div>

    <!-- 添加宝宝弹窗 -->
    <div v-if="showAddBaby" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="showAddBaby = false">
      <div class="w-full max-w-lg bg-white dark:bg-[#2a1f1a] rounded-t-3xl p-5 pb-8 animate-slide-up">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-warm-500 dark:text-cream-100">添加宝宝</h3>
          <button @click="showAddBaby = false" class="w-8 h-8 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
            <X :size="16" class="text-warm-300 dark:text-warm-200" />
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">姓名</label>
            <input v-model="newBabyName" type="text" placeholder="宝宝的名字"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">出生日期</label>
            <input v-model="newBabyBirthDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">性别</label>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" @click="newBabyGender = 'male'"
                class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
                :class="newBabyGender === 'male'
                  ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                  : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'">
                👦 男孩
              </button>
              <button type="button" @click="newBabyGender = 'female'"
                class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
                :class="newBabyGender === 'female'
                  ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                  : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'">
                👧 女孩
              </button>
            </div>
          </div>
          <button @click="handleAddBaby" :disabled="!newBabyName.trim() || !newBabyBirthDate"
            class="w-full bg-peach-400 hover:bg-peach-500 disabled:opacity-40 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
            添加宝宝
          </button>
        </div>
      </div>
    </div>

    <!-- 退出确认 -->
    <div v-if="showConfirmLeave" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showConfirmLeave = false">
      <div class="w-[90%] max-w-sm bg-white dark:bg-[#2a1f1a] rounded-2xl p-5">
        <h3 class="text-base font-bold text-warm-500 dark:text-cream-100 mb-2">确认退出家庭？</h3>
        <p class="text-sm text-warm-300 dark:text-warm-200 mb-4">退出后将无法查看家庭照护记录，此操作不可撤销。</p>
        <div class="flex gap-3">
          <button @click="showConfirmLeave = false"
            class="flex-1 py-2.5 rounded-xl font-bold text-sm bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-cream-200">取消</button>
          <button @click="handleLeave"
            class="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white">确认退出</button>
        </div>
      </div>
    </div>

    <!-- 解散确认 -->
    <div v-if="showConfirmDissolve" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showConfirmDissolve = false">
      <div class="w-[90%] max-w-sm bg-white dark:bg-[#2a1f1a] rounded-2xl p-5">
        <h3 class="text-base font-bold text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle :size="18" /> 确认解散家庭？
        </h3>
        <p class="text-sm text-warm-300 dark:text-warm-200 mb-4">解散后所有成员将被移出，家庭数据将清除，此操作不可恢复。</p>
        <div class="flex gap-3">
          <button @click="showConfirmDissolve = false"
            class="flex-1 py-2.5 rounded-xl font-bold text-sm bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-cream-200">取消</button>
          <button @click="handleDissolve"
            class="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white">确认解散</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
