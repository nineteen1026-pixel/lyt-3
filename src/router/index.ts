import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import FeedingPage from '@/pages/FeedingPage.vue'
import SleepPage from '@/pages/SleepPage.vue'
import SchedulePage from '@/pages/SchedulePage.vue'
import DiaperPage from '@/pages/DiaperPage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'
import WeeklyPage from '@/pages/WeeklyPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import FamilyPage from '@/pages/FamilyPage.vue'
import HealthPage from '@/pages/HealthPage.vue'
import ReminderCenterPage from '@/pages/ReminderCenterPage.vue'
import MonthlyReportPage from '@/pages/MonthlyReportPage.vue'
import KnowledgePage from '@/pages/KnowledgePage.vue'
import MedicinePage from '@/pages/MedicinePage.vue'
import DataRecoveryPage from '@/pages/DataRecoveryPage.vue'
import OnboardingPage from '@/pages/OnboardingPage.vue'
import TimelinePage from '@/pages/TimelinePage.vue'
import CareCalendarPage from '@/pages/CareCalendarPage.vue'
import { checkOnboardingStatus } from '@/composables/useOnboarding'

const routes = [
  { path: '/', name: 'dashboard', component: DashboardPage },
  { path: '/feeding', name: 'feeding', component: FeedingPage },
  { path: '/sleep', name: 'sleep', component: SleepPage },
  { path: '/schedule', name: 'schedule', component: SchedulePage },
  { path: '/diaper', name: 'diaper', component: DiaperPage },
  { path: '/history', name: 'history', component: HistoryPage },
  { path: '/weekly', name: 'weekly', component: WeeklyPage },
  { path: '/monthly-report', name: 'monthly-report', component: MonthlyReportPage },
  { path: '/health', name: 'health', component: HealthPage },
  { path: '/knowledge', name: 'knowledge', component: KnowledgePage },
  { path: '/medicine', name: 'medicine', component: MedicinePage },
  { path: '/timeline', name: 'timeline', component: TimelinePage },
  { path: '/care-calendar', name: 'care-calendar', component: CareCalendarPage },
  { path: '/reminders', name: 'reminders', component: ReminderCenterPage },
  { path: '/settings', name: 'settings', component: SettingsPage },
  { path: '/data-recovery', name: 'data-recovery', component: DataRecoveryPage },
  { path: '/family', name: 'family', component: FamilyPage },
  { path: '/onboarding', name: 'onboarding', component: OnboardingPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const ONBOARDING_KEY = 'baby-care:onboarding-done'

router.beforeEach((to) => {
  if (to.path === '/onboarding') return true
  const done = checkOnboardingStatus()
  if (!done) return { path: '/onboarding' }
  return true
})

export default router
