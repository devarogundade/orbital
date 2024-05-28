<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import SnackbarPop from './components/SnackbarPop.vue';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDixnfsjPqg7xuzVGviGwnlhwjGP5b1TKo",
  authDomain: "crossart-aea81.firebaseapp.com",
  projectId: "crossart-aea81",
  storageBucket: "crossart-aea81.appspot.com",
  messagingSenderId: "284400004575",
  appId: "1:284400004575:web:1cdbbc7edca95b96db286a",
  measurementId: "G-V3Q83M7ECC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

getAnalytics(app);
</script>

<template>
  <main>
    <AppHeader />
    <RouterView class="view"></RouterView>
    <SnackbarPop />
    <AppFooter v-if="$route.name == 'home'" />
  </main>
</template>

<style scoped>
.view {
  min-height: 55vh;
}
</style>
