<template>
  <nav class="mt-8 grid grid-cols-2 gap-8">
    <div v-for="(item, index) in showNav" :key="index">
      <router-link
        :to="item.path"
        :class="index ? 'next' : 'prev'"
        v-if="item.path"
      >
        <div class="label mb-1 text-sm">
          {{ index ? '下一篇' : '上一篇' }}
        </div>
        <div
          class="overflow-hidden text-ellipsis whitespace-nowrap text-[--fg-deeper]"
        >
          {{ item.title }}
        </div>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useFootNavStore } from '@/stores/footNavStore'

const { showNav } = useFootNavStore()
</script>

<style scoped>
.prose nav a {
  display: block;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--c-border);
  color: inherit;
}
.prose nav a:hover {
  border-color: var(--c-border-hover);
}
.prev .label::before {
  content: '« ';
}
.next .label::after {
  content: ' »';
}
.prev div {
  text-align: left;
}
.next div {
  text-align: right;
}
</style>
