<template>
  <div class="slide-enter-content">
    <div class="title">
      <h1>朋友们</h1>
    </div>
    <div class="content grid-cols-normal grid gap-4">
      <div
        class="box rounded-lg border border-[--c-border] p-4 transition-all duration-500 hover:scale-105 hover:cursor-pointer hover:shadow-lg"
        v-for="(item, index) in friendLinkObj"
        :key="index"
      >
        <a :href="item.path" target="_blank">
          <div class="flex flex-col items-center justify-center">
            <div class="mb-1 h-16 w-16">
              <img class="rounded-full" :src="item.imgPath" />
            </div>
            <div class="text-center text-black dark:text-white">
              {{ item.siteName }}
            </div>
            <div class="text-center text-sm text-neutral-500">
              {{ item.name }}
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import friendLinkObj from './util/friendLinkObj'
</script>

<style scoped></style>
