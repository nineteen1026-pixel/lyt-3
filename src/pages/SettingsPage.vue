<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Baby, Moon, Bell, Download, Check, Users, ChevronRight, Trash2, Lock, User, ChevronDown } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import { useTheme } from '@/composables/useTheme'
import { ROLE_LABELS } from '@/types'

const router = useRouter()
const { baby, babies, settings, updateCurrentBaby, updateSettings, feedings, sleeps, diapers, deleteBaby, canManageBabies, canExportData, needsJoin } = useBabyCare()
const { family, currentUserName, currentRole, needsJoin: familyNeedsJoin } = useFamily()
const { theme, toggleTheme, isDark } = useTheme()

const editName = ref(baby.value.name)
const editBirthDate = ref(baby.value.birthDate)
const editGender = ref(baby.value.gender)
const saved = ref(false)

function handleSaveBaby() {
  if (!canManageBabies.value) return
  updateCurrentBaby({
    name: editName.value,
    birthDate: editBirthDate.value,
    gender: editGender.value,
  })
  saved.value = true
  setTimeout(() => { saved.value = false }, 1500)
}

function handleToggleDark() {
  toggleTheme()
  updateSettings({ darkMode: !settings.value.darkMode })
}

function handleToggleNotif() {
  updateSettings({ notifications: !settings.value.notifications })
}

function handleExport() {
  if (!canExportData.value) return
  const data = {
    baby: baby.value,
    babies: babies.value,
    feedings: feedings.value,
    sleeps: sleeps.value,
    diapers: diapers.value,
    family: family.value,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `baby-care-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const showCaregiverPicker = ref(false)

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const defaultCaregiverName = computed(() => {
  if (!settings.value.defaultCaregiverId) return '当前用户'
  const member = family.value?.members.find(m => m.id === settings.value.defaultCaregiverId)
  return member?.name || '当前用户'
})

function handleSetDefaultCaregiver(id: string | undefined) {
  updateSettings({ defaultCaregiverId: id })
  showCaregiverPicker.value = false
}

const confirmDeleteBabyId = ref<string | null>(null)

function handleDeleteBaby(babyId: string) {
  if (!canManageBabies.value) return
  if (babies.value.length <= 1) return
  if (confirmDeleteBabyId.value === babyId) {
    deleteBaby(babyId)
    confirmDeleteBabyId.value = null
    if (babyId === baby.value.id) {
      editName.value = babies.value[0]?.name || ''
      editBirthDate.value = babies.value[0]?.birthDate || ''
      editGender.value = babies.value[0]?.gender || 'female'
    }
  } else {
    confirmDeleteBabyId.value = babyId
    setTimeout(() => { confirmDeleteBabyId.value = null }, 3000)
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-6">
    <header class="mb-6">
      <h1 class="text-xl font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Settings :size="20" class="text-warm-300" />
        设置中心
      </h1>
    </header>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Users :size="14" /> 家庭账号
      </h2>
      <button @click="router.push('/family')"
        class="w-full bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
        <div class="flex items-center justify-between px-4 py-3.5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="family && !familyNeedsJoin ? 'bg-peach-100 dark:bg-peach-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
              <Users :size="18" :class="family && !familyNeedsJoin ? 'text-peach-400' : 'text-warm-300 dark:text-warm-200'" />
            </div>
            <div class="text-left">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">
                <template v-if="familyNeedsJoin">加入家庭</template>
                <template v-else-if="family">{{ family.name }}</template>
                <template v-else>创建家庭</template>
              </p>
              <p class="text-[11px] text-warm-300 dark:text-warm-200">
                <template v-if="familyNeedsJoin">你尚未加入，请使用邀请码</template>
                <template v-else-if="family">
                  {{ currentUserName || '未设置昵称' }} · {{ ROLE_LABELS[currentRole || 'member'] }} · {{ family.members.length }} 位成员
                </template>
                <template v-else>邀请家人共同照护</template>
              </p>
            </div>
          </div>
          <ChevronRight :size="16" class="text-warm-300 dark:text-warm-200" />
        </div>
      </button>
    </section>

    <section v-if="!needsJoin" class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Baby :size="14" /> 宝宝管理
      </h2>
      <div class="space-y-2 mb-3">
        <div v-for="b in babies" :key="b.id"
          class="flex items-center gap-3 bg-white dark:bg-[#2a1f1a] rounded-xl px-3 py-3 shadow-sm">
          <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            :class="b.id === baby.id ? 'bg-peach-100 dark:bg-peach-500/20' : 'bg-cream-100 dark:bg-warm-500/10'">
            <Baby :size="16" :class="b.id === baby.id ? 'text-peach-400' : 'text-warm-300 dark:text-warm-200'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">
              {{ b.name }}
              <span v-if="b.id === baby.id" class="text-[10px] text-peach-400 ml-1">当前</span>
            </p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">{{ b.gender === 'male' ? '👦' : '👧' }} {{ b.birthDate }}</p>
          </div>
          <button v-if="babies.length > 1 && canManageBabies" @click="handleDeleteBaby(b.id)"
            class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            :class="confirmDeleteBabyId === b.id
              ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
              : 'text-warm-200 dark:text-warm-300 hover:text-red-400'">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
      <div v-if="canManageBabies" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">当前宝宝姓名</label>
          <input
            v-model="editName"
            type="text"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">出生日期</label>
          <input
            v-model="editBirthDate"
            type="date"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-2.5 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-warm-300 dark:text-warm-200 mb-1 block">性别</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="editGender = 'male'"
              class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
              :class="editGender === 'male'
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
            >
              👦 男孩
            </button>
            <button
              type="button"
              @click="editGender = 'female'"
              class="rounded-xl py-2.5 text-center font-bold text-sm transition-all border-2"
              :class="editGender === 'female'
                ? 'bg-peach-50 dark:bg-peach-500/10 border-peach-400 text-peach-500 dark:text-peach-400'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent text-warm-300 dark:text-warm-200'"
            >
              👧 女孩
            </button>
          </div>
        </div>
        <button
          @click="handleSaveBaby"
          class="w-full bg-peach-400 hover:bg-peach-500 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Check v-if="saved" :size="16" />
          {{ saved ? '已保存' : '保存信息' }}
        </button>
      </div>
      <div v-else class="bg-cream-100 dark:bg-warm-500/10 rounded-2xl py-3 px-4 text-center">
        <p class="text-xs text-warm-300 dark:text-warm-200">当前角色无宝宝管理权限</p>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Moon :size="14" /> 偏好设置
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm divide-y divide-cream-100 dark:divide-warm-500/10">
        <div class="flex items-center justify-between px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">深色模式</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">切换深色/浅色主题</p>
          </div>
          <button
            @click="handleToggleDark"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="isDark ? 'bg-peach-400' : 'bg-cream-200'"
          >
            <div
              class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              :class="isDark ? 'left-[22px]' : 'left-0.5'"
            ></div>
          </button>
        </div>
        <div class="flex items-center justify-between px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">提醒通知</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">喂奶/换尿布提醒</p>
          </div>
          <button
            @click="handleToggleNotif"
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="settings.notifications ? 'bg-mint-400' : 'bg-cream-200'"
          >
            <div
              class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              :class="settings.notifications ? 'left-[22px]' : 'left-0.5'"
            ></div>
          </button>
        </div>
        <div v-if="family && !familyNeedsJoin" class="relative">
          <button
            @click="showCaregiverPicker = !showCaregiverPicker"
            class="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <div class="flex items-center gap-3">
              <div>
                <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">默认照护人</p>
                <p class="text-[11px] text-warm-300 dark:text-warm-200">记录时默认选中的照护人</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <div class="w-6 h-6 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center">
                  <User :size="12" class="text-peach-400" />
                </div>
                <span class="text-sm font-medium text-peach-400">{{ defaultCaregiverName }}</span>
              </div>
              <ChevronDown :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
            </div>
          </button>
          <div
            v-if="showCaregiverPicker"
            class="absolute top-full right-4 left-4 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto"
          >
            <button
              @click="handleSetDefaultCaregiver(undefined)"
              class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="!settings.defaultCaregiverId ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
                <User :size="12" class="text-warm-400" />
              </div>
              <span>当前用户</span>
              <Check v-if="!settings.defaultCaregiverId" :size="14" class="ml-auto text-peach-400" />
            </button>
            <button
              v-for="member in familyMembers"
              :key="member.id"
              @click="handleSetDefaultCaregiver(member.id)"
              class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
              :class="settings.defaultCaregiverId === member.id ? 'bg-peach-50 dark:bg-peach-500/10 text-peach-500' : 'text-warm-500 dark:text-cream-100'"
            >
              <div class="w-6 h-6 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
              <User :size="12" class="text-warm-400" />
              </div>
              <span>{{ member.name }}</span>
              <Check v-if="settings.defaultCaregiverId === member.id" :size="14" class="ml-auto text-peach-400" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="!needsJoin" class="mb-6">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Download :size="14" /> 数据管理
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm">
        <button
          v-if="canExportData"
          @click="handleExport"
          class="w-full flex items-center justify-between px-4 py-3.5 text-left"
        >
          <div>
            <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">导出数据</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">导出为 JSON 文件</p>
          </div>
          <Download :size="16" class="text-warm-300 dark:text-warm-200" />
        </button>
        <div v-else class="flex items-center justify-between px-4 py-3.5">
          <div>
            <p class="text-sm font-semibold text-warm-400 dark:text-warm-200">导出数据</p>
            <p class="text-[11px] text-warm-300 dark:text-warm-200">当前角色无导出权限</p>
          </div>
          <Lock :size="16" class="text-warm-200 dark:text-warm-300" />
        </div>
      </div>
    </section>

    <section class="text-center py-4">
      <p class="text-[11px] text-warm-200 dark:text-warm-300">宝宝照护记录 v2.0</p>
      <p class="text-[10px] text-warm-200 dark:text-warm-300 mt-0.5">用爱记录每一天 ❤️</p>
    </section>
  </div>
</template>
