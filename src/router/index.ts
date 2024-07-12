import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'
import HomeView from '../views/Home/HomeView.vue'
import NProgress from 'nprogress'
const BlogList = () => import('../views/Blog/components/BlogList.vue')

NProgress.configure({
  easing: 'ease',
  speed: 500,
  showSpinner: false
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { transition: 'slide-right', title: '首页' }
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
          meta: { transition: 'slide-right', title: '博客' }
        },
        {
          path: 'game',
          name: 'game',
          component: BlogList,
          meta: { transition: 'slide-left', title: '博客' }
        }
      ]
    },
    {
      path: '/FriendLink',
      name: 'FriendLink',
      component: () =>
        import('../views/FriendLink/FriendLinkView.vue'),
      meta: { transition: 'slide-right', title: '友链' }
    },
    ...routes
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { el: encodeURI(to.hash), behavior: 'smooth' }
    } else {
      return savedPosition || { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  if (to.name !== from.name) NProgress.start()
  if ('frontmatter' in to.meta)
    document.title = `${
      (to.meta as { frontmatter: { title: string } }).frontmatter
        .title
    } | TailWind`
  else document.title = `${to.meta.title} | TailWind`
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
