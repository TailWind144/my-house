<template>
  <div class="blog-nav flex gap-4 text-3xl">
    <router-link
      v-for="(item, index) in nav"
      :key="index"
      :class="isActive(item.path)"
      :to="`/Blog/${item.path}`"
    >
      {{ item.text }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const nav = [
  {
    path: 'tech',
    text: '技术'
  },
  {
    path: 'game',
    text: '游戏'
  }
]
const route = useRoute()
const isActive = (name) => (name === route.name ? 'active' : '')
</script>

<style scoped>
.blog-nav a {
  opacity: 0.4;
  border-style: none;
  transition: 300ms;
}
.blog-nav a:hover {
  opacity: 1;
}
.active {
  color: var(--fg-deeper);
  opacity: 1 !important;
}
</style>
