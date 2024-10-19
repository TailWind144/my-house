<template>
  <article ref="content">
    <h1>{{ frontmatter!.title }}</h1>
    <p class="!-mt-6 !opacity-50">{{ frontmatter!.date }}</p>
    <slot></slot>
  </article>
  <FootNav />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFootNavStore } from '@/stores/footNavStore'
import renderMathJax from '@/util/renderMathJax.js'
import { useBlogListStore } from '@/stores/blogListStore'
import FootNav from './components/FootNav.vue'
import mediumZoom from 'medium-zoom'

const { frontmatter } = defineProps({ frontmatter: Object })

const { getFootNav, getIndex } = useFootNavStore()
const { allBlogs } = useBlogListStore()
getFootNav(allBlogs[frontmatter!.type])
getIndex(frontmatter!.title)

onMounted(() => {
  renderMathJax()
  mediumZoom('.prose img', {
    background: '#141414'
  })
})
</script>

<style scoped></style>
