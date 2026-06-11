<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Droplets, Check, Eye, User, ChevronDown, Save, Trash2, Star } from 'lucide-vue-next'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { DiaperTemplateData } from '@/types'

const router = useRouter()
const { addDiaper, canAddRecord, needsJoin, getMemberName, settings, getTemplatesByCategory, createDiaperTemplate, deleteTemplate, setDefaultTemplate } = useBabyCare()
const { family, currentUserId } = useFamily()

const diaperType = ref<'wet' | 'dirty' | 'mixed'>('wet')
const note = ref('')
const saved = ref(false)
const caregiverId = ref(settings.value.defaultCaregiverId || currentUserId.value)
const showCaregiverPicker = ref(false)

const showTemplatePanel = ref(false)
const showSaveTemplateDialog = ref(false)
const newTemplateName = ref('')
const newTemplateIcon = ref('💩')

const diaperTemplates = computed(() => getTemplatesByCategory('diaper'))

const diaperIconOptions = ['💩', '💧', '🔄', '👶', '🧴', '🩹', '⭐', '📝']

function applyTemplate(templateId: string) {
  const template = diaperTemplates.value.find(t => t.id === templateId)
  if (!template) return
  const data = template.data as DiaperTemplateData
  diaperType.value = data.diaperType
  note.value = data.note
  showTemplatePanel.value = false
}

function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) return
  const data: DiaperTemplateData = {
    diaperType: diaperType.value,
    note: note.value,
  }
  createDiaperTemplate(newTemplateName.value.trim(), newTemplateIcon.value, data)
  newTemplateName.value = ''
  showSaveTemplateDialog.value = false
}

function handleDeleteTemplate(id: string) {
  if (confirm('确定要删除这个模板吗？')) {
    deleteTemplate(id)
  }
}

function handleSetDefault(id: string) {
  setDefaultTemplate(id)
}

const familyMembers = computed(() => {
  if (!family.value) return []
  return family.value.members
})

const caregiverName = computed(() => getMemberName(caregiverId.value))

function nowISO() {
  return new Date().toISOString().slice(0, 16)
}

const timestamp = ref(nowISO())

function handleSubmit() {
  addDiaper({
    timestamp: new Date(timestamp.value).toISOString(),
    diaperType: diaperType.value,
    note: note.value,
    caregiverId: caregiverId.value,
  })
  saved.value = true
  setTimeout(() => {
    router.push('/')
  }, 800)
}

function selectCaregiver(id: string) {
  caregiverId.value = id
  showCaregiverPicker.value = false
}

const typeOptions = [
  { value: 'wet' as const, emoji: '💧', label: '湿' },
  { value: 'dirty' as const, emoji: '💩', label: '便' },
  { value: 'mixed' as const, emoji: '🔄', label: '混合' },
]
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Droplets :size="20" class="text-warm-400" />
        尿布记录
      </h1>
    </header>

    <div v-if="needsJoin" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-peach-400" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">请先加入家庭</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">你尚未成为家庭成员</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-warm-300 text-white text-sm font-bold">前往加入</button>
    </div>

    <div v-else-if="!canAddRecord" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-cream-100 dark:bg-warm-500/20 flex items-center justify-center mb-4">
        <Eye :size="32" class="text-warm-300 dark:text-warm-200" />
      </div>
      <p class="text-lg font-bold text-warm-400 dark:text-cream-100">无操作权限</p>
      <p class="text-sm text-warm-300 dark:text-warm-200 mt-1">当前角色仅可查看记录</p>
      <button @click="router.push('/family')" class="mt-4 px-5 py-2 rounded-xl bg-warm-300 text-white text-sm font-bold">前往家庭管理</button>
    </div>

    <div v-else-if="saved" class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mb-4 animate-bounce">
        <Check :size="32" class="text-mint-500" />
      </div>
      <p class="text-lg font-bold text-warm-500 dark:text-cream-100">记录成功！</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div v-if="diaperTemplates.length > 0" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-bold text-warm-400 dark:text-warm-100">常用模板</p>
          <button
            type="button"
            @click="showTemplatePanel = !showTemplatePanel"
            class="text-xs text-warm-400 hover:text-warm-500 font-semibold flex items-center gap-1"
          >
            <ChevronDown :size="12" :class="{ 'rotate-180': showTemplatePanel }" />
            {{ showTemplatePanel ? '收起' : '展开' }}
          </button>
        </div>
        <div v-if="showTemplatePanel" class="space-y-2">
          <div
            v-for="template in diaperTemplates"
            :key="template.id"
            class="flex items-center gap-3 p-2 rounded-xl bg-cream-50 dark:bg-warm-500/10 hover:bg-cream-100 dark:hover:bg-warm-500/20 transition-colors group"
          >
            <button
              type="button"
              @click="applyTemplate(template.id)"
              class="flex-1 flex items-center gap-2 text-left"
            >
              <span class="text-xl">{{ template.icon || '📋' }}</span>
              <div class="flex-1">
                <p class="text-sm font-bold text-warm-500 dark:text-cream-100 flex items-center gap-1">
                  {{ template.name }}
                  <Star v-if="template.isDefault" :size="12" class="text-amber-400 fill-amber-400" />
                </p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">
                  {{ (template.data as DiaperTemplateData).diaperType === 'wet' ? '湿' : (template.data as DiaperTemplateData).diaperType === 'dirty' ? '便' : '混合' }}
                  <template v-if="(template.data as DiaperTemplateData).note">
                    · {{ (template.data as DiaperTemplateData).note.slice(0, 15) }}{{ (template.data as DiaperTemplateData).note.length > 15 ? '...' : '' }}
                  </template>
                </p>
              </div>
            </button>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                @click.stop="handleSetDefault(template.id)"
                class="p-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-500/30"
                :title="template.isDefault ? '取消默认' : '设为默认'"
              >
                <Star :size="14" :class="template.isDefault ? 'text-amber-400 fill-amber-400' : 'text-warm-300'" />
              </button>
              <button
                type="button"
                @click.stop="handleDeleteTemplate(template.id)"
                class="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20"
                title="删除模板"
              >
                <Trash2 :size="14" class="text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">尿布类型</label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            @click="diaperType = opt.value"
            class="rounded-2xl py-4 text-center font-bold text-sm transition-all border-2"
            :class="diaperType === opt.value
              ? 'bg-cream-100 dark:bg-cream-300/10 border-warm-300 text-warm-500 dark:text-cream-300 shadow-sm'
              : 'bg-white dark:bg-[#2a1f1a] border-transparent text-warm-300 dark:text-warm-200'"
          >
            <span class="text-2xl block mb-1">{{ opt.emoji }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">时间</label>
        <input
          v-model="timestamp"
          type="datetime-local"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-warm-200"
        />
      </div>

      <div v-if="familyMembers.length > 0" class="relative">
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">照护人</label>
        <button
          type="button"
          @click="showCaregiverPicker = !showCaregiverPicker"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-warm-200"
        >
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-cream-300/10 flex items-center justify-center">
              <User :size="14" class="text-warm-400" />
            </div>
            <span class="text-sm text-warm-500 dark:text-cream-100">{{ caregiverName }}</span>
          </div>
          <ChevronDown :size="16" class="text-warm-300 dark:text-warm-200 transition-transform" :class="{ 'rotate-180': showCaregiverPicker }" />
        </button>
        <div
          v-if="showCaregiverPicker"
          class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto"
        >
          <button
            v-for="member in familyMembers"
            :key="member.id"
            type="button"
            @click="selectCaregiver(member.id)"
            class="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 dark:hover:bg-warm-500/10 transition-colors"
            :class="caregiverId === member.id ? 'bg-cream-100 dark:bg-cream-300/10 text-warm-500' : 'text-warm-500 dark:text-cream-100'"
          >
            <div class="w-7 h-7 rounded-full bg-cream-100 dark:bg-warm-500/10 flex items-center justify-center">
              <User :size="14" class="text-warm-400" />
            </div>
            <span>{{ member.name }}</span>
            <Check v-if="caregiverId === member.id" :size="14" class="ml-auto text-warm-400" />
          </button>
        </div>
      </div>

      <div>
        <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">备注</label>
        <textarea
          v-model="note"
          rows="2"
          class="w-full bg-white dark:bg-[#2a1f1a] border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-warm-200 resize-none"
          placeholder="可选备注..."
        ></textarea>
      </div>

      <button
        type="button"
        @click="showSaveTemplateDialog = true"
        class="w-full bg-white dark:bg-[#2a1f1a] border-2 border-dashed border-cream-200 dark:border-warm-500/30 text-warm-400 dark:text-warm-200 rounded-2xl py-2.5 font-bold text-sm transition-all hover:border-warm-300 hover:text-warm-500 dark:hover:border-warm-500/50 flex items-center justify-center gap-2"
      >
        <Save :size="16" />
        保存为常用模板
      </button>

      <button
        type="submit"
        class="w-full bg-warm-300 hover:bg-warm-400 text-white rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-warm-100 dark:shadow-warm-500/20"
      >
        保存记录
      </button>
    </form>

    <div v-if="showSaveTemplateDialog" class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" @click.self="showSaveTemplateDialog = false">
      <div class="bg-white dark:bg-[#2a1f1a] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-5 space-y-4 animate-slide-up">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-warm-500 dark:text-cream-100">保存为模板</h3>
          <button @click="showSaveTemplateDialog = false" class="text-warm-300 hover:text-warm-400">
            <ChevronDown :size="24" class="rotate-90" />
          </button>
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">模板名称</label>
          <input
            v-model="newTemplateName"
            type="text"
            placeholder="例如：早起尿布"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-4 py-3 text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-warm-200"
          />
        </div>

        <div>
          <label class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-2 block">选择图标</label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="icon in diaperIconOptions"
              :key="icon"
              type="button"
              @click="newTemplateIcon = icon"
              class="aspect-square rounded-xl text-xl flex items-center justify-center transition-all border-2"
              :class="newTemplateIcon === icon
                ? 'bg-cream-100 dark:bg-cream-300/10 border-warm-300'
                : 'bg-cream-50 dark:bg-warm-500/10 border-transparent hover:border-cream-200'"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="bg-cream-50 dark:bg-warm-500/10 rounded-xl p-3">
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1">将保存以下内容：</p>
          <ul class="text-[11px] text-warm-300 dark:text-warm-200 space-y-0.5">
            <li>• 尿布类型: {{ diaperType === 'wet' ? '湿' : diaperType === 'dirty' ? '便' : '混合' }}</li>
            <li v-if="note">• 备注: {{ note.slice(0, 20) }}{{ note.length > 20 ? '...' : '' }}</li>
          </ul>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="showSaveTemplateDialog = false"
            class="flex-1 py-3 rounded-xl font-bold text-sm bg-cream-100 dark:bg-warm-500/20 text-warm-400 dark:text-warm-200"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSaveTemplate"
            :disabled="!newTemplateName.trim()"
            class="flex-1 py-3 rounded-xl font-bold text-sm bg-warm-300 text-white disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
