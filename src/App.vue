<template>
  <div
    class="h-screen overflow-auto bg-white selection:bg-[#8884] dark:bg-[#050505]"
  >
    <div class="p-8 text-[#374151]/60 dark:text-[#e5e7eb]/60">
      <TopNavView />
    </div>
    <div class="prose m-auto px-7 py-10">
      <RouterView class="slide-enter-content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import TopNavView from './views/TopNav/TopNavView.vue'
</script>

<style></style>
