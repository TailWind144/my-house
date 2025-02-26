<template>
  <div>
    <div class="my-6 mb-10"><BlogNav></BlogNav></div>
    <div>
      <router-view v-slot="{ Component, route }">
        <transition mode="out-in" :name="route.meta.transition">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
