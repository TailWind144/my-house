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
import type { Post, yearListObj } from '@/type'
const blogList = ref<Array<yearListObj>>([])
const router = useRouter()
const route = useRoute()

const getBlogList = () => {
  const yearIndexMap = new Map()
  const listType = route.name
  const routes = router.getRoutes()

  for (const item of routes) {
    const { frontmatter }: { frontmatter: Post } = item.meta
    if (frontmatter && frontmatter.type === listType) {
      const year = frontmatter.date.substring(0, 4)
      const date = frontmatter.date.substring(5)
      let index = yearIndexMap.get(year)

      if (index === undefined) {
        blogList.value.push({ year, list: [] })
        index = blogList.value.length - 1
        yearIndexMap.set(year, index)
      }

      blogList.value[index].list.push({
        path: item.path,
        ...frontmatter,
        date
      })
    }
  }

  if (Object.keys(blogList.value).length === 0)
    blogList.value.push({ year: '暂无', list: [] })

  blogList.value.sort((a, b) => Number(b.year) - Number(a.year))

  for (const yearListObj of blogList.value) {
    yearListObj.list.sort(
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
