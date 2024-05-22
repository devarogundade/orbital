<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
</script>

<template>
  <main>
    <AppHeader />
    <RouterView class="view"></RouterView>
    <AppFooter />
  </main>
</template>

<style scoped>
.view {
  min-height: 55vh;
}
</style>
