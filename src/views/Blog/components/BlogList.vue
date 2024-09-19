<template>
  <div class="slide-enter-content">
    <div v-for="(yearListObj, index) in blogList" :key="index">
      <div class="relative h-20 select-none">
        <span
          class="year absolute -left-8 top-3 text-9xl font-bold text-transparent opacity-20 dark:opacity-10"
        >
          {{ yearListObj.year }}
        </span>
      </div>
      <router-link
        v-for="(item, blogIndex) in yearListObj.list"
        :key="blogIndex"
        class="item mb-4 mt-2 flex items-center gap-2"
        :to="item.path"
      >
        <div class="text-lg">
          {{ item.title }}
        </div>
        <div class="list-date opacity-60">
          {{ item.date }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBlogListStore } from '@/stores/blogListStore'
const { allBlogs } = useBlogListStore()
const blogList = ref()
const route = useRoute()

const getBlogList = () => {
  const listType = route.name
  blogList.value = allBlogs[listType as string]
}
getBlogList()
</script>

<style scoped>
.list-date {
  color: var(--fg);
}
.year {
  font-family: '';
  -webkit-text-stroke-width: 2px;
  --un-text-stroke-opacity: 1;
  -webkit-text-stroke-color: rgba(
    170,
    170,
    170,
    var(--un-text-stroke-opacity)
  );
}
</style>
