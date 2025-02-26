<template>
  <div class="blog-nav flex gap-4 text-3xl">
    <router-link
      v-for="(item, index) in blogNavObj"
      :key="index"
      :class="isActive(item.path)"
      :to="`/my-house/Blog/${item.path}`"
    >
      {{ item.text }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import blogNavObj from '@/util/blogNavObj'

const route = useRoute()
const isActive = (name: string) => (name === route.name ? 'active' : '')
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
