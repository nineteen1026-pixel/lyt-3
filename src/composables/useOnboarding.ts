import { ref, computed, onMounted } from 'vue'
import type { Baby, AppSettings } from '@/types'
import {
  babies, feedings, sleeps, diapers, growths, vaccines, checkups,
  settings, reminders, medicines, medicineUsages, stockChanges,
  currentBabyId, persistData, genId, currentUserId, family,
} from './useSharedStore'
import { useFamily } from './useFamily'
import { getPresetByAge, generateSampleData, DEFAULT_REMINDER_TEMPLATES, generateSmartReminders } from '@/data/onboardingPresets'

const LS_ONBOARDING = 'baby-care:onboarding-done'

function hasExistingBabyData(): boolean {
  try {
    const raw = localStorage.getItem('baby-care:babies')
    if (raw) {
      const data = JSON.parse(raw)
      return Array.isArray(data) && data.length > 0
    }
    return false
  } catch {
    return false
  }
}

function hasExistingRecords(): boolean {
  const keys = ['baby-care:feedings', 'baby-care:sleeps', 'baby-care:diapers', 'baby-care:growths']
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data) && data.length > 0) return true
      }
    } catch {
      // ignore
    }
  }
  return false
}

export function checkOnboardingStatus(): boolean {
  const done = localStorage.getItem(LS_ONBOARDING) === 'true'
  if (done) return true
  if (hasExistingBabyData() || hasExistingRecords()) {
    localStorage.setItem(LS_ONBOARDING, 'true')
    return true
  }
  return false
}

export function useOnboarding() {
  const { createFamily } = useFamily()
  const isOnboarded = ref(checkOnboardingStatus())

  const step = ref(0)
  const totalSteps = 5

  const babyName = ref('')
  const babyGender = ref<'male' | 'female'>('female')
  const babyBirthDate = ref('')

  const familyName = ref('我们的小家')
  const userName = ref('妈妈')

  const enableNotifications = ref(settings.value.notifications ?? true)
  const enableDarkMode = ref(settings.value.darkMode ?? false)
  const loadSampleData = ref(true)

  const hasExistingData = computed(() => {
    return babies.value.length > 0 || feedings.value.length > 0 || sleeps.value.length > 0 || diapers.value.length > 0
  })

  const keepExistingData = ref(true)

  const reminderEnabled = ref<Record<string, boolean>>({
    feeding: true,
    diaper: true,
    sleep: true,
    medicine_vitamin: true,
    tummy_time: true,
    bath: true,
    sunlight: true,
    vaccine: true,
    checkup: true,
  })

  const ageMonths = computed(() => {
    if (!babyBirthDate.value) return 0
    const birth = new Date(babyBirthDate.value)
    const now = new Date()
    return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  })

  const currentPreset = computed(() => getPresetByAge(ageMonths.value))

  const reminderSummary = computed(() => {
    const enabled = Object.entries(reminderEnabled.value).filter(([, v]) => v).length
    const total = Object.keys(reminderEnabled.value).length
    return { enabled, total }
  })

  function prefillFromExistingData() {
    if (babies.value.length > 0 && currentBabyId.value) {
      const baby = babies.value.find(b => b.id === currentBabyId.value) || babies.value[0]
      if (baby) {
        babyName.value = baby.name
        babyGender.value = baby.gender
        babyBirthDate.value = baby.birthDate
      }
    }
    if (family.value) {
      familyName.value = family.value.name
    }
    enableNotifications.value = settings.value.notifications ?? true
    enableDarkMode.value = settings.value.darkMode ?? false
  }

  function completeOnboarding() {
    if (hasExistingData.value && keepExistingData.value) {
      localStorage.setItem(LS_ONBOARDING, 'true')
      isOnboarded.value = true
      persistData()
      return
    }

    const newBabyId = genId()
    const newBaby: Baby = {
      id: newBabyId,
      name: babyName.value || '宝宝',
      birthDate: babyBirthDate.value || new Date().toISOString().slice(0, 10),
      gender: babyGender.value,
    }

    babies.value = [newBaby]
    currentBabyId.value = newBabyId

    createFamily(familyName.value || '我们的小家', userName.value || '妈妈')

    const newSettings: AppSettings = {
      darkMode: enableDarkMode.value,
      notifications: enableNotifications.value,
    }
    settings.value = newSettings

    if (loadSampleData.value) {
      const sample = generateSampleData(newBabyId, currentUserId.value, newBaby.birthDate, 3, reminderEnabled.value)
      feedings.value = sample.feedings
      sleeps.value = sample.sleeps
      diapers.value = sample.diapers
      growths.value = sample.growths
      vaccines.value = sample.vaccines
      checkups.value = sample.checkups
      medicines.value = sample.medicines
      medicineUsages.value = sample.medicineUsages
      stockChanges.value = sample.stockChanges
      reminders.value = sample.reminders
    } else {
      feedings.value = []
      sleeps.value = []
      diapers.value = []
      growths.value = []
      vaccines.value = []
      checkups.value = []
      medicines.value = []
      medicineUsages.value = []
      stockChanges.value = []
      reminders.value = generateSmartReminders(newBabyId, newBaby.birthDate, reminderEnabled.value)
    }

    localStorage.setItem(LS_ONBOARDING, 'true')
    isOnboarded.value = true
    persistData()
  }

  function resetOnboarding() {
    localStorage.removeItem(LS_ONBOARDING)
    isOnboarded.value = false
    step.value = 0
  }

  onMounted(() => {
    if (hasExistingData.value) {
      prefillFromExistingData()
    }
  })

  return {
    isOnboarded,
    step,
    totalSteps,
    babyName,
    babyGender,
    babyBirthDate,
    familyName,
    userName,
    enableNotifications,
    enableDarkMode,
    loadSampleData,
    reminderEnabled,
    hasExistingData,
    keepExistingData,
    ageMonths,
    currentPreset,
    reminderSummary,
    DEFAULT_REMINDER_TEMPLATES,
    completeOnboarding,
    resetOnboarding,
    prefillFromExistingData,
  }
}
