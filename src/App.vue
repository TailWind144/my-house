<template>
  <div class="min-h-screen bg-[--c-bg] selection:bg-[#8884]">
    <TopNav />
    <div class="prose m-auto px-7 py-10">
      <RouterView />
    </div>
  </div>
  <ArtPlum />
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
import ArtPlum from '@/components/ArtPlum.vue'
</script>

<style scoped></style>
