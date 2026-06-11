<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Shield, Lock, Unlock, EyeOff, Eye, Share2, Trash2,
  ChevronRight, Check, X, AlertTriangle, KeyRound,
  Clock, User, CalendarDays, FileText, Plus
} from 'lucide-vue-next'
import { usePrivacy } from '@/composables/usePrivacy'
import { useFamily } from '@/composables/useFamily'
import { useBabyCare } from '@/composables/useBabyCare'
import {
  SENSITIVE_FIELD_LABELS, SENSITIVE_FIELD_ICONS,
  CLEAR_CATEGORY_LABELS, type SensitiveFieldType, type ClearRecordLog
} from '@/types'

const router = useRouter()
const {
  isPasswordEnabled, isUnlocked, hiddenFields, activeAuthorizations, clearLogs,
  setPassword, unlock, lock, disablePassword,
  toggleFieldHidden, maskValue,
  grantAuthorization, revokeAuthorization,
  clearRecords, clearPrivacyLogs,
} = usePrivacy()
const { family } = useFamily()
const { baby } = useBabyCare()

const activeTab = ref<'password' | 'fields' | 'share' | 'clear'>('password')

const tabs = [
  { key: 'password' as const, label: '密码锁', icon: Lock },
  { key: 'fields' as const, label: '字段隐藏', icon: EyeOff },
  { key: 'share' as const, label: '授权分享', icon: Share2 },
  { key: 'clear' as const, label: '清除记录', icon: Trash2 },
]

const passwordInput = ref('')
const confirmPassword = ref('')
const currentPasswordInput = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const showPasswordInput = ref(false)
const showChangePassword = ref(false)

const isSettingPassword = computed(() => !isPasswordEnabled.value)

async function handleSetPassword() {
  passwordError.value = ''
  if (passwordInput.value.length < 4) {
    passwordError.value = '密码至少4位'
    return
  }
  if (isSettingPassword.value && passwordInput.value !== confirmPassword.value) {
    passwordError.value = '两次密码不一致'
    return
  }
  await setPassword(passwordInput.value)
  passwordInput.value = ''
  confirmPassword.value = ''
  passwordSuccess.value = '密码设置成功'
  showPasswordInput.value = false
  setTimeout(() => { passwordSuccess.value = '' }, 2000)
}

async function handleUnlock() {
  passwordError.value = ''
  const valid = await unlock(currentPasswordInput.value)
  if (!valid) {
    passwordError.value = '密码错误'
  } else {
    currentPasswordInput.value = ''
  }
}

function handleLock() {
  lock()
}

function handleDisablePassword() {
  disablePassword()
  passwordSuccess.value = '密码已关闭'
  setTimeout(() => { passwordSuccess.value = '' }, 2000)
}

async function handleChangePassword() {
  passwordError.value = ''
  if (passwordInput.value.length < 4) {
    passwordError.value = '密码至少4位'
    return
  }
  if (passwordInput.value !== confirmPassword.value) {
    passwordError.value = '两次密码不一致'
    return
  }
  await setPassword(passwordInput.value)
  passwordInput.value = ''
  confirmPassword.value = ''
  showChangePassword.value = false
  passwordSuccess.value = '密码修改成功'
  setTimeout(() => { passwordSuccess.value = '' }, 2000)
}

const sensitiveFields = Object.keys(SENSITIVE_FIELD_LABELS) as SensitiveFieldType[]

const showShareModal = ref(false)
const shareTargetId = ref('')
const shareTargetName = ref('')
const shareFields = ref<SensitiveFieldType[]>([])
const shareExpiry = ref<string | null>(null)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members.filter(m => m.id !== family.value!.ownerId || m.role !== 'owner' || true)
})

function openShareModal() {
  shareTargetId.value = ''
  shareTargetName.value = ''
  shareFields.value = []
  shareExpiry.value = null
  showShareModal.value = true
}

function selectShareTarget(memberId: string, memberName: string) {
  shareTargetId.value = memberId
  shareTargetName.value = memberName
}

function toggleShareField(field: SensitiveFieldType) {
  const idx = shareFields.value.indexOf(field)
  if (idx >= 0) shareFields.value.splice(idx, 1)
  else shareFields.value.push(field)
}

function handleGrantShare() {
  if (!shareTargetId.value || shareFields.value.length === 0) return
  grantAuthorization(shareTargetId.value, shareTargetName.value, shareFields.value, shareExpiry.value)
  showShareModal.value = false
}

function handleRevokeShare(authId: string) {
  revokeAuthorization(authId)
}

const clearCategory = ref<ClearRecordLog['category']>('feeding')
const clearDateFrom = ref('')
const clearDateTo = ref('')
const confirmClearId = ref<string | null>(null)
const showClearConfirm = ref(false)
const lastClearCount = ref<number | null>(null)

const clearCategories = (Object.keys(CLEAR_CATEGORY_LABELS) as ClearRecordLog['category'][]).filter(c => c !== 'all')

function handleClearRequest() {
  const cat = clearCategory.value
  const key = cat + (clearDateFrom.value ? clearDateFrom.value : '') + (clearDateTo.value ? clearDateTo.value : '')
  if (confirmClearId.value === key) {
    const dateRange = clearDateFrom.value && clearDateTo.value
      ? { from: clearDateFrom.value, to: clearDateTo.value }
      : undefined
    const count = clearRecords(cat, dateRange)
    lastClearCount.value = count
    confirmClearId.value = null
    showClearConfirm.value = false
    setTimeout(() => { lastClearCount.value = null }, 3000)
  } else {
    confirmClearId.value = key
    showClearConfirm.value = true
    setTimeout(() => {
      confirmClearId.value = null
      showClearConfirm.value = false
    }, 5000)
  }
}

function handleClearAll() {
  if (confirmClearId.value === 'all') {
    clearRecords('all')
    lastClearCount.value = -1
    confirmClearId.value = null
    setTimeout(() => { lastClearCount.value = null }, 3000)
  } else {
    confirmClearId.value = 'all'
    showClearConfirm.value = true
    setTimeout(() => {
      confirmClearId.value = null
      showClearConfirm.value = false
    }, 5000)
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getExpiryLabel(expiresAt: string | null) {
  if (!expiresAt) return '永久'
  const d = new Date(expiresAt)
  if (d < new Date()) return '已过期'
  return `${d.getMonth() + 1}/${d.getDate()} 到期`
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-24">
    <header class="mb-5">
      <div class="flex items-center gap-2 mb-1">
        <button @click="router.back()" class="w-8 h-8 rounded-xl flex items-center justify-center bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200">
          <ChevronRight :size="18" class="rotate-180" />
        </button>
        <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
          <Shield :size="20" class="text-peach-400" />
          数据隐私中心
        </h1>
      </div>
      <p class="text-xs text-warm-300 dark:text-warm-200 ml-10">保护宝宝照护数据的安全与隐私</p>
    </header>

    <div class="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0"
        :class="activeTab === tab.key
          ? 'bg-peach-400 text-white shadow-sm'
          : 'bg-white dark:bg-[#2a1f1a] text-warm-400 dark:text-warm-200'"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 密码锁 -->
    <section v-if="activeTab === 'password'" class="space-y-4">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="isPasswordEnabled ? 'bg-peach-100 dark:bg-peach-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
              <Lock v-if="isPasswordEnabled" :size="20" class="text-peach-400" />
              <Unlock v-else :size="20" class="text-warm-300" />
            </div>
            <div>
              <p class="text-sm font-bold text-warm-500 dark:text-cream-100">应用密码锁</p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">
                {{ isPasswordEnabled ? '已启用 · 点击锁定应用' : '未启用 · 设置密码保护隐私数据' }}
              </p>
            </div>
          </div>
          <div v-if="isPasswordEnabled" class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-mint-400 animate-pulse"></div>
            <span class="text-[11px] text-mint-500 font-semibold">已启用</span>
          </div>
        </div>

        <div v-if="passwordSuccess" class="mb-4 px-3 py-2 bg-mint-50 dark:bg-mint-500/10 rounded-xl flex items-center gap-2">
          <Check :size="14" class="text-mint-400" />
          <span class="text-xs text-mint-500 font-semibold">{{ passwordSuccess }}</span>
        </div>

        <div v-if="passwordError" class="mb-4 px-3 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center gap-2">
          <AlertTriangle :size="14" class="text-red-400" />
          <span class="text-xs text-red-500 font-semibold">{{ passwordError }}</span>
        </div>

        <!-- 未启用密码时：设置密码 -->
        <div v-if="!isPasswordEnabled && !showPasswordInput" class="text-center">
          <button @click="showPasswordInput = true"
            class="bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-3 px-6 font-bold text-sm transition-all active:scale-[0.98] flex items-center gap-2 mx-auto">
            <KeyRound :size="16" />
            设置密码
          </button>
        </div>

        <div v-if="!isPasswordEnabled && showPasswordInput" class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">输入密码</label>
            <input
              v-model="passwordInput"
              type="password"
              placeholder="至少4位密码"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
            />
          </div>
          <div class="flex gap-2">
            <button @click="showPasswordInput = false"
              class="flex-1 bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 rounded-xl py-2.5 font-bold text-sm transition-all">
              取消
            </button>
            <button @click="handleSetPassword"
              class="flex-1 bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
              确认设置
            </button>
          </div>
        </div>

        <!-- 已启用密码时 -->
        <div v-if="isPasswordEnabled" class="space-y-3">
          <!-- 已解锁状态 -->
          <div v-if="isUnlocked" class="space-y-3">
            <div class="px-3 py-2.5 bg-mint-50 dark:bg-mint-500/10 rounded-xl flex items-center gap-2">
              <Unlock :size="14" class="text-mint-400" />
              <span class="text-xs text-mint-500 font-semibold">当前已解锁</span>
            </div>
            <div class="flex gap-2">
              <button @click="handleLock"
                class="flex-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-1.5">
                <Lock :size="14" />
                立即锁定
              </button>
              <button v-if="!showChangePassword" @click="showChangePassword = true"
                class="flex-1 bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 rounded-xl py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-1.5">
                <KeyRound :size="14" />
                修改密码
              </button>
            </div>

            <div v-if="showChangePassword" class="space-y-3 pt-2 border-t border-cream-100 dark:border-warm-500/10">
              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">新密码</label>
                <input
                  v-model="passwordInput"
                  type="password"
                  placeholder="至少4位密码"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">确认新密码</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
                />
              </div>
              <div class="flex gap-2">
                <button @click="showChangePassword = false; passwordInput = ''; confirmPassword = ''"
                  class="flex-1 bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200 rounded-xl py-2.5 font-bold text-sm transition-all">
                  取消
                </button>
                <button @click="handleChangePassword"
                  class="flex-1 bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98]">
                  确认修改
                </button>
              </div>
            </div>

            <button @click="handleDisablePassword"
              class="w-full text-xs text-red-400 hover:text-red-500 font-semibold py-2 transition-colors">
              关闭密码锁
            </button>
          </div>

          <!-- 已锁定状态 -->
          <div v-else class="space-y-3">
            <div class="px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center gap-2">
              <Lock :size="14" class="text-amber-500" />
              <span class="text-xs text-amber-600 dark:text-amber-400 font-semibold">应用已锁定，请输入密码解锁</span>
            </div>
            <div>
              <input
                v-model="currentPasswordInput"
                type="password"
                placeholder="输入密码解锁"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
                @keyup.enter="handleUnlock"
              />
            </div>
            <button @click="handleUnlock"
              class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
              <Unlock :size="14" />
              解锁
            </button>
          </div>
        </div>
      </div>

      <div class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl p-4">
        <div class="flex items-start gap-2">
          <Shield :size="16" class="text-warm-300 dark:text-warm-200 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold text-warm-400 dark:text-warm-100">密码锁说明</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200 mt-1 leading-relaxed">
              启用密码锁后，每次打开隐私中心需要输入密码。密码使用 SHA-256 加密存储在本地，不会上传至任何服务器。
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 敏感字段隐藏 -->
    <section v-if="activeTab === 'fields'" class="space-y-4">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <EyeOff :size="20" class="text-indigo-400" />
          </div>
          <div>
            <p class="text-sm font-bold text-warm-500 dark:text-cream-100">敏感字段隐藏</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">选择需要隐藏的字段，未解锁时显示为 ***</p>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4 px-1">
          <span class="text-xs text-warm-300 dark:text-warm-200">已选择 {{ hiddenFields.length }} 项</span>
          <div class="flex gap-2">
            <button @click="sensitiveFields.forEach(f => { if (!hiddenFields.includes(f)) toggleFieldHidden(f) })"
              class="text-[11px] text-peach-400 font-semibold hover:text-peach-500 transition-colors">
              全选
            </button>
            <button @click="sensitiveFields.forEach(f => { if (hiddenFields.includes(f)) toggleFieldHidden(f) })"
              class="text-[11px] text-warm-300 dark:text-warm-200 font-semibold hover:text-warm-400 transition-colors">
              清空
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <button
            v-for="field in sensitiveFields"
            :key="field"
            @click="toggleFieldHidden(field)"
            class="w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all"
            :class="hiddenFields.includes(field)
              ? 'bg-indigo-50 dark:bg-indigo-500/10'
              : 'hover:bg-cream-50 dark:hover:bg-warm-500/5'"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="hiddenFields.includes(field) ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
                <component :is="SENSITIVE_FIELD_ICONS[field] === 'Baby' ? $options.components?.Baby : EyeOff" :size="14"
                  :class="hiddenFields.includes(field) ? 'text-indigo-400' : 'text-warm-300 dark:text-warm-200'" />
              </div>
              <span class="text-sm font-medium text-warm-500 dark:text-cream-100">{{ SENSITIVE_FIELD_LABELS[field] }}</span>
            </div>
            <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
              :class="hiddenFields.includes(field)
                ? 'bg-indigo-400 border-indigo-400'
                : 'border-cream-200 dark:border-warm-500/20'">
              <Check v-if="hiddenFields.includes(field)" :size="12" class="text-white" />
            </div>
          </button>
        </div>
      </div>

      <!-- 隐藏效果预览 -->
      <div v-if="hiddenFields.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
          <Eye :size="14" /> 隐藏效果预览
        </p>
        <div class="space-y-2">
          <div v-if="hiddenFields.includes('babyName')" class="flex items-center justify-between px-3 py-2 bg-cream-50 dark:bg-warm-500/10 rounded-lg">
            <span class="text-xs text-warm-300 dark:text-warm-200">宝宝姓名</span>
            <span class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ isUnlocked ? baby.name : maskValue(baby.name, 'babyName') }}</span>
          </div>
          <div v-if="hiddenFields.includes('birthDate')" class="flex items-center justify-between px-3 py-2 bg-cream-50 dark:bg-warm-500/10 rounded-lg">
            <span class="text-xs text-warm-300 dark:text-warm-200">出生日期</span>
            <span class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ isUnlocked ? baby.birthDate : maskValue(baby.birthDate, 'birthDate') }}</span>
          </div>
        </div>
        <p class="text-[11px] text-warm-300 dark:text-warm-200 mt-3">
          {{ isUnlocked ? '🔓 已解锁 · 显示真实数据' : '🔒 已锁定 · 敏感字段已隐藏' }}
        </p>
      </div>
    </section>

    <!-- 授权分享 -->
    <section v-if="activeTab === 'share'" class="space-y-4">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Share2 :size="20" class="text-emerald-400" />
            </div>
            <div>
              <p class="text-sm font-bold text-warm-500 dark:text-cream-100">授权分享</p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">控制家庭成员可查看的敏感字段</p>
            </div>
          </div>
          <button v-if="family && family.members.length > 1"
            @click="openShareModal"
            class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
            <Plus :size="16" />
          </button>
        </div>

        <div v-if="!family || family.members.length <= 1" class="px-3 py-4 bg-cream-50 dark:bg-warm-500/10 rounded-xl text-center">
          <p class="text-xs text-warm-300 dark:text-warm-200">需要至少2位家庭成员才能使用授权分享</p>
          <button @click="router.push('/family')"
            class="mt-2 text-xs text-peach-400 font-semibold hover:text-peach-500 transition-colors">
            前往家庭管理 →
          </button>
        </div>

        <div v-else-if="activeAuthorizations.length === 0" class="px-3 py-4 bg-cream-50 dark:bg-warm-500/10 rounded-xl text-center">
          <Share2 :size="24" class="text-warm-200 dark:text-warm-300 mx-auto mb-2" />
          <p class="text-xs text-warm-300 dark:text-warm-200">暂无授权记录</p>
          <p class="text-[11px] text-warm-200 dark:text-warm-300 mt-1">点击 + 按钮授权成员查看敏感数据</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="auth in activeAuthorizations"
            :key="auth.id"
            class="px-3 py-3 bg-cream-50 dark:bg-warm-500/10 rounded-xl"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <User :size="12" class="text-emerald-400" />
                </div>
                <span class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ auth.targetMemberName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  :class="auth.expiresAt && new Date(auth.expiresAt) < new Date() ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-500' : 'bg-mint-100 dark:bg-mint-500/10 text-mint-500'">
                  {{ getExpiryLabel(auth.expiresAt) }}
                </span>
                <button @click="handleRevokeShare(auth.id)"
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-warm-200 dark:text-warm-300 hover:text-red-400 transition-colors">
                  <X :size="14" />
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="field in auth.fields"
                :key="field"
                class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400"
              >
                {{ SENSITIVE_FIELD_LABELS[field] }}
              </span>
            </div>
            <p class="text-[10px] text-warm-200 dark:text-warm-300 mt-2">
              授权于 {{ formatTime(auth.grantedAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 分享授权弹窗 -->
      <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="showShareModal = false">
        <div class="w-full max-w-lg bg-white dark:bg-[#2a1f1a] rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-base font-bold text-warm-500 dark:text-cream-100">新增授权</h3>
            <button @click="showShareModal = false"
              class="w-8 h-8 rounded-xl bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center text-warm-300 dark:text-warm-200">
              <X :size="16" />
            </button>
          </div>

          <!-- 选择成员 -->
          <div class="mb-5">
            <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">选择成员</p>
            <div class="space-y-1.5">
              <button
                v-for="member in familyMembers"
                :key="member.id"
                @click="selectShareTarget(member.id, member.name)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                :class="shareTargetId === member.id
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-2 ring-emerald-300 dark:ring-emerald-500/30'
                  : 'bg-cream-50 dark:bg-warm-500/10'"
              >
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="shareTargetId === member.id ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
                  <User :size="14" :class="shareTargetId === member.id ? 'text-emerald-400' : 'text-warm-300 dark:text-warm-200'" />
                </div>
                <span class="text-sm font-medium text-warm-500 dark:text-cream-100">{{ member.name }}</span>
                <Check v-if="shareTargetId === member.id" :size="16" class="ml-auto text-emerald-400" />
              </button>
            </div>
          </div>

          <!-- 选择字段 -->
          <div class="mb-5">
            <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">授权查看的字段</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="field in sensitiveFields"
                :key="field"
                @click="toggleShareField(field)"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                :class="shareFields.includes(field)
                  ? 'bg-indigo-400 text-white'
                  : 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
              >
                {{ SENSITIVE_FIELD_LABELS[field] }}
              </button>
            </div>
          </div>

          <!-- 有效期 -->
          <div class="mb-5">
            <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">有效期</p>
            <div class="flex gap-2">
              <button
                @click="shareExpiry = null"
                class="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                :class="shareExpiry === null
                  ? 'bg-peach-400 text-white'
                  : 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
              >
                永久
              </button>
              <button
                @click="shareExpiry = new Date(Date.now() + 7 * 86400000).toISOString()"
                class="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                :class="shareExpiry && new Date(shareExpiry).getTime() - Date.now() < 8 * 86400000 && new Date(shareExpiry).getTime() - Date.now() > 6 * 86400000
                  ? 'bg-peach-400 text-white'
                  : 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
              >
                7天
              </button>
              <button
                @click="shareExpiry = new Date(Date.now() + 30 * 86400000).toISOString()"
                class="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                :class="shareExpiry && new Date(shareExpiry).getTime() - Date.now() > 29 * 86400000 && new Date(shareExpiry).getTime() - Date.now() < 31 * 86400000
                  ? 'bg-peach-400 text-white'
                  : 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
              >
                30天
              </button>
              <button
                @click="shareExpiry = new Date(Date.now() + 90 * 86400000).toISOString()"
                class="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                :class="shareExpiry && new Date(shareExpiry).getTime() - Date.now() > 89 * 86400000 && new Date(shareExpiry).getTime() - Date.now() < 91 * 86400000
                  ? 'bg-peach-400 text-white'
                  : 'bg-cream-100 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
              >
                90天
              </button>
            </div>
          </div>

          <button @click="handleGrantShare"
            :disabled="!shareTargetId || shareFields.length === 0"
            class="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            :class="shareTargetId && shareFields.length > 0
              ? 'bg-peach-400 hover:bg-peach-500 text-white'
              : 'bg-cream-200 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200 cursor-not-allowed'">
            <Share2 :size="14" />
            确认授权
          </button>
        </div>
      </div>
    </section>

    <!-- 清除记录 -->
    <section v-if="activeTab === 'clear'" class="space-y-4">
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
            <Trash2 :size="20" class="text-rose-400" />
          </div>
          <div>
            <p class="text-sm font-bold text-warm-500 dark:text-cream-100">清除记录</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">选择分类和日期范围清除数据</p>
          </div>
        </div>

        <div v-if="lastClearCount !== null" class="mb-4 px-3 py-2 bg-mint-50 dark:bg-mint-500/10 rounded-xl flex items-center gap-2">
          <Check :size="14" class="text-mint-400" />
          <span class="text-xs text-mint-500 font-semibold">
            {{ lastClearCount === -1 ? '所有记录已清除' : `已清除 ${lastClearCount} 条记录` }}
          </span>
        </div>

        <!-- 分类选择 -->
        <div class="mb-4">
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">选择分类</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="cat in clearCategories"
              :key="cat"
              @click="clearCategory = cat"
              class="px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left"
              :class="clearCategory === cat
                ? 'bg-rose-50 dark:bg-rose-500/10 ring-2 ring-rose-300 dark:ring-rose-500/30 text-rose-500'
                : 'bg-cream-50 dark:bg-warm-500/10 text-warm-400 dark:text-warm-200'"
            >
              {{ CLEAR_CATEGORY_LABELS[cat] }}
            </button>
          </div>
        </div>

        <!-- 日期范围（可选） -->
        <div class="mb-4">
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">日期范围 <span class="text-warm-200 dark:text-warm-300 font-normal">（可选，不选则清除全部）</span></p>
          <div class="flex gap-2">
            <div class="flex-1">
              <input
                v-model="clearDateFrom"
                type="date"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-warm-500 dark:text-cream-100 text-xs focus:outline-none focus:ring-2 focus:ring-peach-300"
              />
            </div>
            <span class="text-warm-300 dark:text-warm-200 self-center text-xs">至</span>
            <div class="flex-1">
              <input
                v-model="clearDateTo"
                type="date"
                class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-warm-500 dark:text-cream-100 text-xs focus:outline-none focus:ring-2 focus:ring-peach-300"
              />
            </div>
          </div>
        </div>

        <!-- 清除按钮 -->
        <button @click="handleClearRequest"
          class="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          :class="confirmClearId && showClearConfirm
            ? 'bg-red-500 text-white'
            : 'bg-rose-100 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'">
          <Trash2 :size="14" />
          <template v-if="confirmClearId && showClearConfirm">确认清除 {{ CLEAR_CATEGORY_LABELS[clearCategory] }}</template>
          <template v-else>清除 {{ CLEAR_CATEGORY_LABELS[clearCategory] }}</template>
        </button>

        <div class="mt-3 pt-3 border-t border-cream-100 dark:border-warm-500/10">
          <button @click="handleClearAll"
            class="w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            :class="confirmClearId === 'all' && showClearConfirm
              ? 'bg-red-500 text-white'
              : 'text-red-400 hover:text-red-500'">
            <AlertTriangle :size="12" />
            <template v-if="confirmClearId === 'all' && showClearConfirm">确认清除所有记录（不可恢复）</template>
            <template v-else>清除所有记录</template>
          </button>
        </div>
      </div>

      <!-- 清除历史 -->
      <div v-if="clearLogs.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1.5">
            <FileText :size="14" /> 清除历史
          </p>
          <button @click="clearPrivacyLogs" class="text-[11px] text-warm-300 dark:text-warm-200 hover:text-warm-400 transition-colors">
            清空日志
          </button>
        </div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="log in clearLogs.slice(0, 20)"
            :key="log.id"
            class="flex items-center justify-between px-3 py-2 bg-cream-50 dark:bg-warm-500/10 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <Trash2 :size="12" class="text-warm-300 dark:text-warm-200" />
              <span class="text-xs font-medium text-warm-500 dark:text-cream-100">{{ CLEAR_CATEGORY_LABELS[log.category] }}</span>
              <span class="text-[10px] text-warm-300 dark:text-warm-200">×{{ log.recordCount }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Clock :size="10" class="text-warm-200 dark:text-warm-300" />
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ formatTime(log.clearedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4">
        <div class="flex items-start gap-2">
          <AlertTriangle :size="16" class="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">数据清除不可恢复</p>
            <p class="text-[11px] text-amber-500/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              清除操作将永久删除对应记录，无法通过数据恢复中心找回。建议在清除前先导出备份。
            </p>
            <button @click="router.push('/data-recovery')"
              class="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1">
              前往数据恢复中心 <ChevronRight :size="12" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
