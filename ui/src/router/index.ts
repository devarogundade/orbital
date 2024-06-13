import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import BorrowView from '@/views/BorrowView.vue';
import FlashLoanView from '@/views/FlashLoanView.vue';
import FaucetView from '@/views/FaucetView.vue';
import PointsView from '@/views/PointsView.vue';

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
      component: FlashLoanView
    },
    {
      path: '/faucet',
      name: 'faucet',
      component: FaucetView
    },
    {
      path: '/points',
      name: 'points',
      component: PointsView
    }
  ]
});

export default router;
