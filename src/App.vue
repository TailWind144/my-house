<template>
  <div class="min-h-screen bg-[--c-bg] selection:bg-[#8884]">
    <TopNavView />
    <div class="prose m-auto px-7 py-10">
      <RouterView />
    </div>
  </div>
  <ArtPlum />
</template>

<script setup lang="ts">
import TopNavView from './views/TopNav/TopNavView.vue'
import ArtPlum from '@/components/ArtPlum.vue'
</script>

<style scoped></style>
