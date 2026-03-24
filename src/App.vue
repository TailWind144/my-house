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
import { useHead } from '@unhead/vue';

useHead({
  meta: [
    {
      name: 'description',
      content: "TailWind's personal website showcasing frontend development and deep learning.",
    },
    {
      name: 'keywords',
      content: 'TailWind,TailWind144,personal website,blog,frontend development,deep learning,前端开发,深度学习,技术博客',
    },
    {
      name: 'author',
      content: 'TailWind144',
    }
  ],
});
</script>

<style scoped></style>
