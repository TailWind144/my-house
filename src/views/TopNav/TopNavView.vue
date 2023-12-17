<template>
  <div class="flex justify-end">
    <div
      class="mx-2 duration-300 hover:text-[#374151]/100 dark:hover:text-[#e5e7eb]/100"
      v-for="(item, index) in nav"
      :key="index"
    >
      <router-link :to="item.toPath">
        {{ item.name }}
      </router-link>
    </div>
    <div
      class="mx-2 flex w-4 cursor-pointer duration-300 hover:text-[#374151]/100 dark:hover:text-[#e5e7eb]/100"
      @click="clickSwitchDark"
    >
      <Moon v-if="isDarkFlag" />
      <Sunny v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { Sunny } from '@element-plus/icons-vue'
import { Moon } from '@element-plus/icons-vue'
const nav = ref([
  {
    name: '首页',
    toPath: '/'
  },
  {
    name: '博客',
    toPath: '/Blog/tech'
  }
])

const isDark = useDark({
  storageKey: 'useDarkKEY',
  valueDark: 'dark',
  valueLight: 'light'
})
const toggleDark = useToggle(isDark)
const isDarkFlag = ref(localStorage.getItem('useDarkKEY') === 'dark')

const clickSwitchDark = (e) => {
  const x = e?.clientX ?? innerWidth / 2
  const y = e?.clientY ?? innerHeight / 2
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  )

  const transition = document.startViewTransition(() => {
    updateDrakFlag()
  })

  transition.ready.then(() => {
    const direction = isDark.value ? 'reverse' : 'normal'
    const str = isDark.value ? 'old' : 'new'
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0 at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        direction,
        duration: 400,
        easing: 'ease-in',
        pseudoElement: `::view-transition-${str}(root)`
      }
    )
  })

  const updateDrakFlag = () => {
    isDarkFlag.value = !isDarkFlag.value
    toggleDark()
  }
}
</script>

<style scoped></style>
