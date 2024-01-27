<template>
  <div class="slide-enter-content">
    <div v-for="(value, key) in blogList" :key="key">
      <div class="relative h-20 select-none">
        <span
          class="year absolute -left-8 top-3 text-9xl font-bold text-transparent opacity-20 dark:opacity-10"
        >
          {{ key }}
        </span>
      </div>
      <router-link
        v-for="(item, i) in value"
        :key="i"
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

<script lang="ts">
export default {
  beforeRouteEnter(_to, _from, next) {
    next((vm: any) => {
      vm.getBlogList()
    })
  }
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Post } from '@/type'
const blogList = ref<any>({})

const router = useRouter()
const route = useRoute()

const getBlogList = () => {
  const listType = route.name
  const routes = router.getRoutes()
  for (const item of routes) {
    const { frontmatter }: { frontmatter: Post } = item.meta
    if (frontmatter) {
      const year = frontmatter.date.substring(0, 4)
      const date = frontmatter.date.substring(5)
      if (frontmatter.type === listType) {
        if (!blogList.value[year]) blogList.value[year] = []
        blogList.value[year].push({
          path: item.path,
          ...frontmatter,
          date
        })
      }
    }
  }

  if (Object.keys(blogList.value).length === 0)
    blogList.value['暂无'] = []

  for (const year of Object.keys(blogList.value)) {
    blogList.value[year].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )
  }
}

defineExpose({ getBlogList })
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
