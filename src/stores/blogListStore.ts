import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { Post, AllBlogs, YearListObj } from '@/type'

export const useBlogListStore = defineStore('blogList', () => {
  const allBlogs = ref<AllBlogs<Array<YearListObj>>>({
    frontend: [],
    deep_learning: []
  })
  const router = useRouter()
  const isInit = ref(false)

  function getBlogList() {
    const typeToMap: AllBlogs<Map<string, number>> = {
      frontend: new Map<string, number>(),
      deep_learning: new Map<string, number>()
    }

    if (router) {
      const routes = router.getRoutes()
      for (const item of routes) {
        const frontmatter: Post = item.meta.frontmatter as Post
        if (frontmatter) {
          const blogList = allBlogs.value[frontmatter.type]
          const yearIndexMap = typeToMap[frontmatter.type]
          const year = frontmatter.date.substring(0, 4)
          const date = frontmatter.date.substring(5)
          let index = yearIndexMap.get(year)

          if (index === undefined) {
            blogList.push({ year, list: [] })
            index = blogList.length - 1
            yearIndexMap.set(year, index)
          }

          blogList[index].list.push({
            path: item.path,
            ...frontmatter,
            date
          })
        }
      }

      for (const blogList of Object.values(allBlogs.value)) {
        if (Object.keys(blogList).length === 0)
          blogList.push({ year: '暂无', list: [] })

        blogList.sort((a, b) => Number(b.year) - Number(a.year))

        for (const yearListObj of blogList) {
          yearListObj.list.sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      }
    }
  }

  function setInitTrue() {
    isInit.value = true
  }

  return { allBlogs, isInit, getBlogList, setInitTrue }
})
