<template>
  <article ref="content">
    <h1>{{ frontmatter.title }}</h1>
    <p class="!-mt-6 !opacity-50">{{ frontmatter.date }}</p>
    <slot></slot>
  </article>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { renderMathJax } from '@/util/renderMathJax.js'
const { frontmatter } = defineProps({ frontmatter: Object })

onMounted(() => {
  renderMathJax()
})
</script>

<style scoped></style>
