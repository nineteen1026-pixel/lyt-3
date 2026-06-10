<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.path !== '/onboarding')
</script>

<template>
  <div class="min-h-[100dvh]" :class="showNav ? 'pb-20' : ''">
    <router-view />
  </div>
  <BottomNav v-if="showNav" />
</template>
