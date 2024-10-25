<template>
  <div
    :class="
      (isTop ? '' : 'border-b border-[--c-border]') +
      ' sticky top-0 z-50 text-[#374151]/60 dark:text-[#e5e7eb]/60'
    "
  >
    <div
      :class="
        (isTop ? 'sm:px-12 sm:py-8' : 'backdrop-blur backdrop-saturate-50') +
        ' flex items-center px-8 py-4 transition-all duration-500 ease-in-out'
      "
    >
      <div
        :class="
          (isTop ? 'sm:w-7' : '') +
          ' w-6 transition-all duration-500 ease-in-out'
        "
      >
        <img style="filter: drop-shadow(0 0 4px #fff)" src="/favicon.ico" />
      </div>
      <div class="mx-auto flex items-center justify-center">
        <div
          class="nav-item duration-300 hover:text-[#374151]/100 dark:hover:text-[#e5e7eb]/100"
          v-for="(item, index) in navObj"
          :key="index"
        >
          <router-link :to="item.toPath">
            {{ item.name }}
          </router-link>
        </div>
      </div>
      <div
        class="mx-2 flex w-4 cursor-pointer duration-300 hover:text-[#374151]/100 dark:hover:text-[#e5e7eb]/100"
        @click="clickSwitchDark"
      >
        <Moon v-if="isDarkFlag" />
        <Sunny v-else />
      </div>
    </div>
    <button
      :class="
        (scroll > 300 ? 'opacity-30' : 'pointer-events-none opacity-0') +
        ' fixed bottom-3 right-3 z-50 flex h-10 w-10 items-center justify-center rounded-full transition duration-300 hover:bg-[#8883] hover:opacity-100 print:hidden'
      "
      @click="toTop()"
    >
      <Top class="h-5 w-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDark, useToggle, useWindowScroll } from '@vueuse/core'
import { Sunny, Moon, Top } from '@element-plus/icons-vue'
import navObj from '@/router/navObj'

const isDark = useDark({
  storageKey: 'useDarkKEY',
  valueDark: 'dark',
  valueLight: 'light'
})
const toggleDark = useToggle(isDark)
const isDarkFlag = ref(localStorage.getItem('useDarkKEY') === 'dark')

const clickSwitchDark = (e: MouseEvent) => {
  const x = e?.clientX ?? innerWidth / 2
  const y = e?.clientY ?? innerHeight / 2
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  )
  const updateDrakFlag = () => {
    isDarkFlag.value = !isDarkFlag.value
    toggleDark()
  }

  if (!document.startViewTransition) {
    updateDrakFlag()
    return
  }

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
}

function toTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const { y: scroll } = useWindowScroll()
const isTop = computed(() => scroll.value === 0)
</script>

<style scoped>
.nav-item {
  margin-left: 1rem;
  margin-right: 1rem;
}
@media (min-width: 450px) {
  .nav-item {
    margin-left: 1.5rem;
    margin-right: 1.5rem;
  }
}
</style>
