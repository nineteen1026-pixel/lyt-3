import { computed } from 'vue'
import type { PhotoDiaryEntry, Milestone, FamilyComment, TimelineDay, MilestoneCategory } from '@/types'
import {
  photoDiaryEntries, milestones, familyComments, currentBabyId,
  currentUserId, persistData, genId, hasPermission,
  canAddRecord, canDeleteRecord, canEditRecord, getMemberName,
  feedings, sleeps, diapers,
} from './useSharedStore'

export function usePhotoDiary() {
  const currentPhotos = computed(() =>
    photoDiaryEntries.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const currentMilestones = computed(() =>
    milestones.value
      .filter(r => r.babyId === currentBabyId.value)
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime())
  )

  const currentComments = computed(() => familyComments.value)

  function addPhotoEntry(record: Omit<PhotoDiaryEntry, 'id' | 'type' | 'babyId' | 'createdBy' | 'comments'> & { caregiverId?: string }) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    photoDiaryEntries.value.unshift({
      ...record,
      id: genId(),
      type: 'photo',
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      caregiverId: record.caregiverId || currentUserId.value,
      comments: [],
    })
    persistData()
    return true
  }

  function deletePhotoEntry(id: string) {
    if (!canDeleteRecord.value) return false
    photoDiaryEntries.value = photoDiaryEntries.value.filter(r => r.id !== id)
    familyComments.value = familyComments.value.filter(c => !(c.targetId === id && c.targetType === 'photo'))
    persistData()
    return true
  }

  function updatePhotoEntry(id: string, data: Partial<PhotoDiaryEntry>) {
    if (!canEditRecord.value) return false
    const idx = photoDiaryEntries.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    photoDiaryEntries.value[idx] = { ...photoDiaryEntries.value[idx], ...data }
    persistData()
    return true
  }

  function addMilestone(record: Omit<Milestone, 'id' | 'babyId' | 'createdBy' | 'createdAt'>) {
    if (!canAddRecord.value) return false
    if (!currentBabyId.value) return false
    const now = new Date().toISOString()
    milestones.value.unshift({
      ...record,
      id: genId(),
      babyId: currentBabyId.value,
      createdBy: currentUserId.value,
      createdAt: now,
    })
    persistData()
    return true
  }

  function deleteMilestone(id: string) {
    if (!canDeleteRecord.value) return false
    milestones.value = milestones.value.filter(r => r.id !== id)
    familyComments.value = familyComments.value.filter(c => !(c.targetId === id && c.targetType === 'milestone'))
    persistData()
    return true
  }

  function updateMilestone(id: string, data: Partial<Milestone>) {
    if (!canEditRecord.value) return false
    const idx = milestones.value.findIndex(r => r.id === id)
    if (idx < 0) return false
    milestones.value[idx] = { ...milestones.value[idx], ...data }
    persistData()
    return true
  }

  function addComment(targetId: string, targetType: 'photo' | 'milestone', content: string) {
    if (!hasPermission('add_record') && !familyComments.value) return false
    familyComments.value.push({
      id: genId(),
      targetId,
      targetType,
      authorId: currentUserId.value,
      content,
      createdAt: new Date().toISOString(),
    })

    if (targetType === 'photo') {
      const photo = photoDiaryEntries.value.find(p => p.id === targetId)
      if (photo) {
        photo.comments = [...(photo.comments || []), familyComments.value[familyComments.value.length - 1]]
      }
    }

    persistData()
    return true
  }

  function deleteComment(commentId: string) {
    const comment = familyComments.value.find(c => c.id === commentId)
    if (!comment) return false
    if (comment.authorId !== currentUserId.value && !canDeleteRecord.value) return false
    familyComments.value = familyComments.value.filter(c => c.id !== commentId)

    if (comment.targetType === 'photo') {
      const photo = photoDiaryEntries.value.find(p => p.id === comment.targetId)
      if (photo) {
        photo.comments = photo.comments.filter(c => c.id !== commentId)
      }
    }

    persistData()
    return true
  }

  function getCommentsForTarget(targetId: string, targetType: 'photo' | 'milestone'): FamilyComment[] {
    return familyComments.value.filter(c => c.targetId === targetId && c.targetType === targetType)
  }

  const timelineDays = computed<TimelineDay[]>(() => {
    const dayMap = new Map<string, TimelineDay>()

    for (const photo of currentPhotos.value) {
      const dateKey = new Date(photo.timestamp).toISOString().slice(0, 10)
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { date: dateKey, photos: [], milestones: [], dayNotes: [] })
      }
      dayMap.get(dateKey)!.photos.push(photo)
    }

    for (const ms of currentMilestones.value) {
      const dateKey = new Date(ms.achievedDate).toISOString().slice(0, 10)
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { date: dateKey, photos: [], milestones: [], dayNotes: [] })
      }
      dayMap.get(dateKey)!.milestones.push(ms)
    }

    const babyId = currentBabyId.value
    const allRecords = [
      ...feedings.value.filter(r => r.babyId === babyId),
      ...sleeps.value.filter(r => r.babyId === babyId),
      ...diapers.value.filter(r => r.babyId === babyId),
    ]

    const recordDays = new Set<string>()
    for (const r of allRecords) {
      const ts = r.type === 'sleep' ? (r as { startTime: string }).startTime : (r as { timestamp: string }).timestamp
      const dateKey = new Date(ts).toISOString().slice(0, 10)
      recordDays.add(dateKey)
    }

    for (const dateKey of recordDays) {
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { date: dateKey, photos: [], milestones: [], dayNotes: [] })
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  })

  function getMilestonesByCategory(category: MilestoneCategory) {
    return currentMilestones.value.filter(m => m.category === category)
  }

  const milestoneStats = computed(() => {
    const cats: Record<MilestoneCategory, number> = { first: 0, physical: 0, social: 0, language: 0, cognitive: 0 }
    for (const m of currentMilestones.value) {
      cats[m.category]++
    }
    return cats
  })

  return {
    photoDiaryEntries: currentPhotos,
    allPhotos: photoDiaryEntries,
    currentMilestones,
    familyComments: currentComments,
    timelineDays,
    milestoneStats,
    canAddRecord,
    canDeleteRecord,
    canEditRecord,
    getMemberName,
    addPhotoEntry,
    deletePhotoEntry,
    updatePhotoEntry,
    addMilestone,
    deleteMilestone,
    updateMilestone,
    addComment,
    deleteComment,
    getCommentsForTarget,
    getMilestonesByCategory,
  }
}
