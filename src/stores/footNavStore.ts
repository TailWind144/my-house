import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Post, YearListObj } from '@/type'

export const useFootNavStore = defineStore('footNav', () => {
  const footNav = ref<Array<Post>>([])
  const index = ref<number>(0)
  const showNav = computed(() => {
    const res = [
      footNav.value[index.value - 1] || { path: '' },
      footNav.value[index.value + 1] || { path: '' }
    ]
    return res
  })

  function getFootNav(blogList: Array<YearListObj>) {
    footNav.value.length = 0
    for (const { list } of blogList) footNav.value.push(...list)
  }

  function getIndex(title: string) {
    for (let i = 0; i < footNav.value.length; i++)
      if (title === footNav.value[i].title) index.value = i
  }

  return { showNav, getFootNav, getIndex }
})
