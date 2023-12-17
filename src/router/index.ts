import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'
import HomeView from '../views/Home/HomeView.vue'
const BlogList = () => import('../views/Blog/components/BlogList.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { transition: 'slide-right' }
    },
    {
      path: '/Blog',
      name: 'Blog',
      component: () => import('../views/Blog/BlogView.vue'),
      meta: { transition: 'slide-left' },
      children: [
        {
          path: 'tech',
          name: 'tech',
          component: BlogList,
          meta: { transition: 'slide-right' }
        },
        {
          path: 'game',
          name: 'game',
          component: BlogList,
          meta: { transition: 'slide-left' }
        }
      ]
    },
    ...routes
  ]
})

export default router
