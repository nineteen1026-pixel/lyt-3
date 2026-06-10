<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Camera, Sparkles, MessageCircle, Plus, X, Send,
  ChevronDown, ChevronRight, Image as ImageIcon, Footprints,
  Smile, Brain, Trash2, Calendar, Clock, User,
} from 'lucide-vue-next'
import { usePhotoDiary } from '@/composables/usePhotoDiary'
import { useBabyCare } from '@/composables/useBabyCare'
import { useFamily } from '@/composables/useFamily'
import type { MilestoneCategory, PhotoDiaryEntry, Milestone, FamilyComment } from '@/types'
import { MILESTONE_CATEGORY_LABELS } from '@/types'

const router = useRouter()
const {
  photoDiaryEntries, currentMilestones, timelineDays, milestoneStats,
  canAddRecord, canDeleteRecord, getMemberName,
  addPhotoEntry, deletePhotoEntry,
  addMilestone, deleteMilestone,
  addComment, deleteComment, getCommentsForTarget,
} = usePhotoDiary()
const { baby } = useBabyCare()
const { family, currentUserId } = useFamily()

type TabKey = 'timeline' | 'photos' | 'milestones'
const activeTab = ref<TabKey>('timeline')

const tabs: { key: TabKey; label: string; icon: typeof Camera }[] = [
  { key: 'timeline', label: '时光线', icon: Clock },
  { key: 'photos', label: '照片日记', icon: Camera },
  { key: 'milestones', label: '里程碑', icon: Sparkles },
]

const showAddPhoto = ref(false)
const showAddMilestone = ref(false)
const newPhoto = ref({ caption: '', note: '', photoUrl: '' })
const newPhotoDate = ref(new Date().toISOString().slice(0, 10))
const newMilestone = ref({
  title: '',
  description: '',
  category: 'first' as MilestoneCategory,
  achievedDate: new Date().toISOString().slice(0, 10),
  note: '',
})
const expandedDay = ref<string | null>(null)
const expandedComments = ref<Set<string>>(new Set())
const commentText = ref<Record<string, string>>({})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getAgeAtDate(dateStr: string) {
  if (!baby.value?.birthDate) return ''
  const birth = new Date(baby.value.birthDate)
  const target = new Date(dateStr)
  const diffMs = target.getTime() - birth.getTime()
  if (diffMs < 0) return ''
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays < 31) return `${diffDays}天`
  const months = Math.floor(diffDays / 30.44)
  const remainDays = Math.round(diffDays - months * 30.44)
  if (months < 12) return `${months}个月${remainDays > 0 ? remainDays + '天' : ''}`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return `${years}岁${remainMonths > 0 ? remainMonths + '个月' : ''}`
}

function generatePlaceholderUrl() {
  const prompts = [
    'cute baby smiling, soft pastel colors, warm lighting, portrait photo',
    'baby playing with toys, colorful nursery, natural light photography',
    'happy baby laughing, cozy home setting, warm tones',
    'baby first steps, soft background, joyful moment photography',
    'baby sleeping peacefully, gentle morning light, serene atmosphere',
  ]
  const prompt = prompts[Math.floor(Math.random() * prompts.length)]
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`
}

function handleAddPhoto() {
  const photoUrl = newPhoto.value.photoUrl || generatePlaceholderUrl()
  addPhotoEntry({
    timestamp: new Date(newPhotoDate.value).toISOString(),
    photoUrl,
    caption: newPhoto.value.caption,
    note: newPhoto.value.note,
    caregiverId: currentUserId.value,
  })
  showAddPhoto.value = false
  newPhoto.value = { caption: '', note: '', photoUrl: '' }
}

function handleAddMilestone() {
  addMilestone({
    title: newMilestone.value.title,
    description: newMilestone.value.description,
    category: newMilestone.value.category,
    achievedDate: new Date(newMilestone.value.achievedDate).toISOString(),
    note: newMilestone.value.note,
  })
  showAddMilestone.value = false
  newMilestone.value = {
    title: '',
    description: '',
    category: 'first',
    achievedDate: new Date().toISOString().slice(0, 10),
    note: '',
  }
}

function handleDeletePhoto(id: string) {
  if (confirm('确定要删除这张照片吗？')) {
    deletePhotoEntry(id)
  }
}

function handleDeleteMilestone(id: string) {
  if (confirm('确定要删除这个里程碑吗？')) {
    deleteMilestone(id)
  }
}

function handleAddComment(targetId: string, targetType: 'photo' | 'milestone') {
  const text = commentText.value[targetId]?.trim()
  if (!text) return
  addComment(targetId, targetType, text)
  commentText.value[targetId] = ''
}

function toggleComments(targetId: string) {
  const s = new Set(expandedComments.value)
  if (s.has(targetId)) s.delete(targetId)
  else s.add(targetId)
  expandedComments.value = s
}

function toggleDay(date: string) {
  expandedDay.value = expandedDay.value === date ? null : date
}

const categoryIconMap: Record<MilestoneCategory, typeof Sparkles> = {
  first: Sparkles,
  physical: Footprints,
  social: Smile,
  language: MessageCircle,
  cognitive: Brain,
}

const categoryColorMap: Record<MilestoneCategory, { bg: string; text: string; border: string }> = {
  first: { bg: 'bg-peach-100 dark:bg-peach-500/20', text: 'text-peach-500', border: 'border-peach-300' },
  physical: { bg: 'bg-mint-100 dark:bg-mint-500/20', text: 'text-mint-500', border: 'border-mint-300' },
  social: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-300' },
  language: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-300' },
  cognitive: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-300' },
}

const milestoneCategoryFilter = ref<MilestoneCategory | 'all'>('all')
const filteredMilestones = computed(() => {
  if (milestoneCategoryFilter.value === 'all') return currentMilestones.value
  return currentMilestones.value.filter(m => m.category === milestoneCategoryFilter.value)
})
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Camera :size="20" class="text-peach-400" />
        成长时光
      </h1>
    </header>

    <div class="flex gap-1 mb-4 bg-cream-100 dark:bg-warm-500/10 rounded-xl p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all"
        :class="activeTab === tab.key
          ? 'bg-white dark:bg-[#2a1f1a] text-peach-500 shadow-sm'
          : 'text-warm-300 dark:text-warm-200'"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Timeline Tab -->
    <section v-if="activeTab === 'timeline'">
      <div v-if="timelineDays.length === 0" class="text-center py-10">
        <Clock :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无时光记录</p>
        <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">添加照片日记或里程碑开始记录</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="day in timelineDays"
          :key="day.date"
          class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm overflow-hidden border border-cream-200 dark:border-warm-500/20"
        >
          <button
            @click="toggleDay(day.date)"
            class="w-full flex items-center justify-between px-4 py-3 hover:bg-cream-50 dark:hover:bg-warm-500/5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-peach-100 to-mint-100 dark:from-peach-500/20 dark:to-mint-500/20 flex items-center justify-center">
                <Calendar :size="18" class="text-peach-400" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold text-warm-500 dark:text-cream-100">{{ formatDate(day.date) }}</p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">
                  {{ getAgeAtDate(day.date) }}
                  <span v-if="day.photos.length" class="ml-1">📷 {{ day.photos.length }}</span>
                  <span v-if="day.milestones.length" class="ml-1">⭐ {{ day.milestones.length }}</span>
                </p>
              </div>
            </div>
            <component
              :is="expandedDay === day.date ? ChevronDown : ChevronRight"
              :size="16"
              class="text-warm-300 dark:text-warm-200"
            />
          </button>

          <div v-if="expandedDay === day.date" class="px-4 pb-4 space-y-3">
            <div v-if="day.milestones.length" class="space-y-2">
              <p class="text-xs font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1">
                <Sparkles :size="12" class="text-peach-400" /> 里程碑
              </p>
              <div
                v-for="ms in day.milestones"
                :key="ms.id"
                class="rounded-xl p-3 border-l-3"
                :class="[categoryColorMap[ms.category].bg, `border-l-${ms.category === 'first' ? 'peach' : ms.category === 'physical' ? 'mint' : ms.category === 'social' ? 'yellow' : ms.category === 'language' ? 'blue' : 'purple'}-400`]"
                style="border-left-width: 3px;"
                :style="{ borderLeftColor: ms.category === 'first' ? '#ff8a80' : ms.category === 'physical' ? '#66bb6a' : ms.category === 'social' ? '#fdd835' : ms.category === 'language' ? '#42a5f5' : '#ab47bc' }"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ ms.title }}</p>
                    <p v-if="ms.description" class="text-xs text-warm-400 dark:text-warm-100 mt-0.5">{{ ms.description }}</p>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block" :class="[categoryColorMap[ms.category].bg, categoryColorMap[ms.category].text]">
                      {{ MILESTONE_CATEGORY_LABELS[ms.category] }}
                    </span>
                  </div>
                  <button
                    v-if="canDeleteRecord"
                    @click="handleDeleteMilestone(ms.id)"
                    class="text-warm-300 dark:text-warm-200 hover:text-red-400 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
                <p v-if="ms.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">{{ ms.note }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-[10px] text-warm-300 dark:text-warm-200">记录: {{ getMemberName(ms.createdBy) }}</span>
                  <button @click="toggleComments(ms.id)" class="text-[10px] text-peach-400 hover:text-peach-500 flex items-center gap-0.5">
                    <MessageCircle :size="10" />
                    {{ getCommentsForTarget(ms.id, 'milestone').length }} 评论
                  </button>
                </div>
                <div v-if="expandedComments.has(ms.id)" class="mt-2 space-y-1.5">
                  <div
                    v-for="c in getCommentsForTarget(ms.id, 'milestone')"
                    :key="c.id"
                    class="flex items-start gap-2 bg-white/60 dark:bg-warm-500/10 rounded-lg p-2"
                  >
                    <div class="w-5 h-5 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User :size="10" class="text-peach-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-semibold text-warm-500 dark:text-cream-100">{{ getMemberName(c.authorId) }}</p>
                      <p class="text-xs text-warm-400 dark:text-warm-100">{{ c.content }}</p>
                    </div>
                    <button
                      v-if="c.authorId === currentUserId || canDeleteRecord"
                      @click="deleteComment(c.id)"
                      class="text-warm-300 hover:text-red-400 shrink-0"
                    >
                      <X :size="12" />
                    </button>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <input
                      v-model="commentText[ms.id]"
                      @keyup.enter="handleAddComment(ms.id, 'milestone')"
                      type="text"
                      placeholder="写评论..."
                      class="flex-1 bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-lg px-2 py-1.5 text-xs text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-1 focus:ring-peach-300"
                    />
                    <button
                      @click="handleAddComment(ms.id, 'milestone')"
                      class="w-7 h-7 rounded-lg bg-peach-400 hover:bg-peach-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Send :size="12" class="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="day.photos.length" class="space-y-2">
              <p class="text-xs font-bold text-warm-400 dark:text-warm-100 flex items-center gap-1">
                <Camera :size="12" class="text-mint-500" /> 照片日记
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="photo in day.photos"
                  :key="photo.id"
                  class="rounded-xl overflow-hidden border border-cream-200 dark:border-warm-500/20 bg-cream-50 dark:bg-warm-500/10"
                >
                  <div class="aspect-square overflow-hidden relative group">
                    <img :src="photo.photoUrl" :alt="photo.caption" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                      <button
                        v-if="canDeleteRecord"
                        @click="handleDeletePhoto(photo.id)"
                        class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 :size="10" class="text-white" />
                      </button>
                    </div>
                  </div>
                  <div class="p-2">
                    <p v-if="photo.caption" class="text-xs font-semibold text-warm-500 dark:text-cream-100 truncate">{{ photo.caption }}</p>
                    <p v-if="photo.note" class="text-[10px] text-warm-300 dark:text-warm-200 truncate mt-0.5">{{ photo.note }}</p>
                    <div class="flex items-center justify-between mt-1.5">
                      <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ getMemberName(photo.caregiverId) }}</span>
                      <button @click="toggleComments(photo.id)" class="text-[10px] text-peach-400 flex items-center gap-0.5">
                        <MessageCircle :size="9" />
                        {{ getCommentsForTarget(photo.id, 'photo').length }}
                      </button>
                    </div>
                    <div v-if="expandedComments.has(photo.id)" class="mt-2 space-y-1">
                      <div
                        v-for="c in getCommentsForTarget(photo.id, 'photo')"
                        :key="c.id"
                        class="flex items-start gap-1.5 bg-white/60 dark:bg-warm-500/10 rounded-lg p-1.5"
                      >
                        <div class="w-4 h-4 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
                          <User :size="8" class="text-peach-400" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-[9px] font-semibold text-warm-500 dark:text-cream-100">{{ getMemberName(c.authorId) }}</p>
                          <p class="text-[10px] text-warm-400 dark:text-warm-100">{{ c.content }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <input
                          v-model="commentText[photo.id]"
                          @keyup.enter="handleAddComment(photo.id, 'photo')"
                          type="text"
                          placeholder="评论..."
                          class="flex-1 bg-white dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-md px-1.5 py-1 text-[10px] text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-1 focus:ring-peach-300"
                        />
                        <button
                          @click="handleAddComment(photo.id, 'photo')"
                          class="w-5 h-5 rounded-md bg-peach-400 flex items-center justify-center shrink-0"
                        >
                          <Send :size="8" class="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Photos Tab -->
    <section v-if="activeTab === 'photos'">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">照片日记</h2>
        <button
          v-if="canAddRecord"
          @click="showAddPhoto = !showAddPhoto"
          class="flex items-center gap-1 text-xs font-bold text-peach-400 hover:text-peach-500"
        >
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-if="showAddPhoto" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">标题</label>
          <input v-model="newPhoto.caption" type="text" placeholder="给这张照片起个标题"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">图片地址 (留空自动生成)</label>
          <input v-model="newPhoto.photoUrl" type="text" placeholder="https://..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">日期</label>
            <input v-model="newPhotoDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <textarea v-model="newPhoto.note" rows="2" placeholder="记录这一刻..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"></textarea>
        </div>
        <div class="flex gap-2">
          <button @click="showAddPhoto = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddPhoto" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div v-if="photoDiaryEntries.length === 0" class="text-center py-10">
        <Camera :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无照片</p>
        <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">点击添加记录宝宝的精彩瞬间</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <div
          v-for="photo in photoDiaryEntries"
          :key="photo.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-2xl overflow-hidden shadow-sm border border-cream-200 dark:border-warm-500/20"
        >
          <div class="aspect-square overflow-hidden">
            <img :src="photo.photoUrl" :alt="photo.caption" class="w-full h-full object-cover" />
          </div>
          <div class="p-2.5">
            <p v-if="photo.caption" class="text-xs font-semibold text-warm-500 dark:text-cream-100 truncate">{{ photo.caption }}</p>
            <p v-if="photo.note" class="text-[10px] text-warm-300 dark:text-warm-200 truncate mt-0.5">{{ photo.note }}</p>
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ formatDateShort(photo.timestamp) }}</span>
              <div class="flex items-center gap-2">
                <button @click="toggleComments(photo.id)" class="text-[10px] text-peach-400 flex items-center gap-0.5">
                  <MessageCircle :size="9" />
                  {{ getCommentsForTarget(photo.id, 'photo').length }}
                </button>
                <button
                  v-if="canDeleteRecord"
                  @click="handleDeletePhoto(photo.id)"
                  class="text-warm-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
            <div v-if="expandedComments.has(photo.id)" class="mt-2 space-y-1.5">
              <div
                v-for="c in getCommentsForTarget(photo.id, 'photo')"
                :key="c.id"
                class="flex items-start gap-1.5 bg-cream-50 dark:bg-warm-500/10 rounded-lg p-1.5"
              >
                <div class="w-4 h-4 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
                  <User :size="8" class="text-peach-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[9px] font-semibold text-warm-500 dark:text-cream-100">{{ getMemberName(c.authorId) }}</p>
                  <p class="text-[10px] text-warm-400 dark:text-warm-100">{{ c.content }}</p>
                </div>
                <button
                  v-if="c.authorId === currentUserId || canDeleteRecord"
                  @click="deleteComment(c.id)"
                  class="text-warm-300 hover:text-red-400 shrink-0"
                >
                  <X :size="10" />
                </button>
              </div>
              <div class="flex items-center gap-1">
                <input
                  v-model="commentText[photo.id]"
                  @keyup.enter="handleAddComment(photo.id, 'photo')"
                  type="text"
                  placeholder="写评论..."
                  class="flex-1 bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-md px-2 py-1 text-[10px] text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-1 focus:ring-peach-300"
                />
                <button
                  @click="handleAddComment(photo.id, 'photo')"
                  class="w-6 h-6 rounded-md bg-peach-400 flex items-center justify-center shrink-0"
                >
                  <Send :size="10" class="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Milestones Tab -->
    <section v-if="activeTab === 'milestones'">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100">发育里程碑</h2>
        <button
          v-if="canAddRecord"
          @click="showAddMilestone = !showAddMilestone"
          class="flex items-center gap-1 text-xs font-bold text-peach-400 hover:text-peach-500"
        >
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-if="showAddMilestone" class="bg-white dark:bg-[#2a1f1a] rounded-2xl p-4 mb-3 shadow-sm border border-cream-200 dark:border-warm-500/20">
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">里程碑名称</label>
          <input v-model="newMilestone.title" type="text" placeholder="如：第一次翻身"
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">描述</label>
          <textarea v-model="newMilestone.description" rows="2" placeholder="详细描述..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300 resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">类别</label>
            <select v-model="newMilestone.category"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300">
              <option v-for="(label, key) in MILESTONE_CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">达成日期</label>
            <input v-model="newMilestone.achievedDate" type="date"
              class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1 block">备注</label>
          <input v-model="newMilestone.note" type="text" placeholder="可选备注..."
            class="w-full bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-xl px-3 py-2 text-sm text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-peach-300" />
        </div>
        <div class="flex gap-2">
          <button @click="showAddMilestone = false" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10">取消</button>
          <button @click="handleAddMilestone" class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20">保存</button>
        </div>
      </div>

      <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        <button
          @click="milestoneCategoryFilter = 'all'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
          :class="milestoneCategoryFilter === 'all'
            ? 'bg-peach-100 dark:bg-peach-500/20 text-peach-500'
            : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
        >
          全部 {{ currentMilestones.length }}
        </button>
        <button
          v-for="(label, key) in MILESTONE_CATEGORY_LABELS"
          :key="key"
          @click="milestoneCategoryFilter = key"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1"
          :class="milestoneCategoryFilter === key
            ? [categoryColorMap[key].bg, categoryColorMap[key].text]
            : 'bg-cream-100 dark:bg-warm-500/10 text-warm-300 dark:text-warm-200'"
        >
          <component :is="categoryIconMap[key]" :size="12" />
          {{ label }} {{ milestoneStats[key as MilestoneCategory] }}
        </button>
      </div>

      <div v-if="filteredMilestones.length === 0" class="text-center py-10">
        <Sparkles :size="32" class="mx-auto text-warm-300 dark:text-warm-200 mb-2" />
        <p class="text-sm text-warm-300 dark:text-warm-200">暂无里程碑</p>
        <p class="text-xs text-warm-300 dark:text-warm-200 mt-1">记录宝宝成长的每一个重要时刻</p>
      </div>

      <div class="space-y-2">
        <div
          v-for="ms in filteredMilestones"
          :key="ms.id"
          class="bg-white dark:bg-[#2a1f1a] rounded-xl px-4 py-3 shadow-sm"
          style="border-left: 3px solid;"
          :style="{ borderLeftColor: ms.category === 'first' ? '#ff8a80' : ms.category === 'physical' ? '#66bb6a' : ms.category === 'social' ? '#fdd835' : ms.category === 'language' ? '#42a5f5' : '#ab47bc' }"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="categoryColorMap[ms.category].bg">
              <component :is="categoryIconMap[ms.category]" :size="18" :class="categoryColorMap[ms.category].text" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-warm-500 dark:text-cream-100">{{ ms.title }}</p>
              <p v-if="ms.description" class="text-xs text-warm-400 dark:text-warm-100 mt-0.5">{{ ms.description }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md" :class="[categoryColorMap[ms.category].bg, categoryColorMap[ms.category].text]">
                  {{ MILESTONE_CATEGORY_LABELS[ms.category] }}
                </span>
                <span class="text-[10px] text-warm-300 dark:text-warm-200 flex items-center gap-0.5">
                  <Calendar :size="9" /> {{ formatDate(ms.achievedDate) }}
                </span>
                <span class="text-[10px] text-warm-300 dark:text-warm-200">{{ getAgeAtDate(ms.achievedDate) }}</span>
              </div>
              <p v-if="ms.note" class="text-[10px] text-warm-300 dark:text-warm-200 mt-1">{{ ms.note }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-[10px] text-warm-300 dark:text-warm-200">记录: {{ getMemberName(ms.createdBy) }}</span>
                <div class="flex items-center gap-2">
                  <button @click="toggleComments(ms.id)" class="text-[10px] text-peach-400 flex items-center gap-0.5">
                    <MessageCircle :size="10" />
                    {{ getCommentsForTarget(ms.id, 'milestone').length }} 评论
                  </button>
                  <button
                    v-if="canDeleteRecord"
                    @click="handleDeleteMilestone(ms.id)"
                    class="text-warm-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 :size="12" />
                  </button>
                </div>
              </div>
              <div v-if="expandedComments.has(ms.id)" class="mt-2 space-y-1.5">
                <div
                  v-for="c in getCommentsForTarget(ms.id, 'milestone')"
                  :key="c.id"
                  class="flex items-start gap-2 bg-cream-50 dark:bg-warm-500/10 rounded-lg p-2"
                >
                  <div class="w-5 h-5 rounded-full bg-peach-100 dark:bg-peach-500/20 flex items-center justify-center shrink-0">
                    <User :size="10" class="text-peach-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-semibold text-warm-500 dark:text-cream-100">{{ getMemberName(c.authorId) }}</p>
                    <p class="text-xs text-warm-400 dark:text-warm-100">{{ c.content }}</p>
                  </div>
                  <button
                    v-if="c.authorId === currentUserId || canDeleteRecord"
                    @click="deleteComment(c.id)"
                    class="text-warm-300 hover:text-red-400 shrink-0"
                  >
                    <X :size="12" />
                  </button>
                </div>
                <div class="flex items-center gap-1.5">
                  <input
                    v-model="commentText[ms.id]"
                    @keyup.enter="handleAddComment(ms.id, 'milestone')"
                    type="text"
                    placeholder="写评论..."
                    class="flex-1 bg-cream-50 dark:bg-warm-500/10 border border-cream-200 dark:border-warm-500/20 rounded-lg px-2 py-1.5 text-xs text-warm-500 dark:text-cream-100 focus:outline-none focus:ring-1 focus:ring-peach-300"
                  />
                  <button
                    @click="handleAddComment(ms.id, 'milestone')"
                    class="w-7 h-7 rounded-lg bg-peach-400 hover:bg-peach-500 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send :size="12" class="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
