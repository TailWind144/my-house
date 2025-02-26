<template>
  <div class="min-h-screen bg-[--c-bg] selection:bg-[#8884]">
    <TopNav />
    <div class="prose m-auto px-7 py-10">
      <RouterView />
    </div>
  </div>
  <ArtPlum />
</template>

<script setup lang="ts"></script>

<style scoped></style>
