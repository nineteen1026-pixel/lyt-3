<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
</script>

<template>
  <div class="min-h-[100dvh] pb-20">
    <router-view />
  </div>
  <BottomNav />
</template>
