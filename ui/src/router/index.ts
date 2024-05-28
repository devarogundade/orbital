import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import BorrowView from '@/views/BorrowView.vue';
import AmplifyView from '@/views/AmplifyView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/borrow',
      name: 'borrow',
      component: BorrowView
    },
    {
      path: '/flash-loan',
      name: 'flash-loan',
      component: AmplifyView
    }
  ]
});

export default router;
