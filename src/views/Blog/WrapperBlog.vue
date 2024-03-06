<template>
  <article ref="content">
    <h1>{{ frontmatter.title }}</h1>
    <p class="!-mt-6 !opacity-50">{{ frontmatter.date }}</p>
    <slot></slot>
  </article>
</template>

<script setup lang="ts">
const { frontmatter } = defineProps({ frontmatter: Object })
</script>

<style scoped></style>
