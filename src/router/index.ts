import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'
import HomeView from '../views/Home/HomeView.vue'
import NProgress from 'nprogress'
import { useBlogListStore } from '@/stores/blogListStore'
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
      meta: { title: '首页' }
    },
    {
      path: '/Blog',
      name: 'Blog',
      component: () => import('../views/Blog/BlogView.vue'),
      children: [
        {
          path: 'frontend',
          name: 'frontend',
          component: BlogList,
          meta: { transition: 'slide-right', title: '博客' }
        },
        {
          path: 'deep_learning',
          name: 'deep_learning',
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
      meta: { title: '友链' }
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
  const { isInit, getBlogList, setInitTrue } = useBlogListStore()
  if (!isInit) {
    getBlogList()
    setInitTrue()
  }
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
