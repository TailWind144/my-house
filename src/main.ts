import './style.css'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue'
import { ViteSSG } from 'vite-ssg'
import 'nprogress/nprogress.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import routes from '~pages'
import App from './App.vue'

import HomeView from '@/views/Home/HomeView.vue'
import blogNavObj from '@/util/blogNavObj'
import NProgress from 'nprogress'
import { useBlogListStore } from '@/stores/blogListStore'

NProgress.configure({
  easing: 'ease',
  speed: 500,
  showSpinner: false
})

export const createApp = ViteSSG(
  App,
  {
    base: '/my-house/',
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
        component: () => import('@/views/Blog/BlogView.vue'),
        children: blogNavObj
      },
      {
        path: '/FriendLink',
        name: 'FriendLink',
        component: () => import('@/views/FriendLink/FriendLinkView.vue'),
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
  },
  ({ app, router, isClient }) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }

    app.use(createHead())
    app.use(createPinia())

    if (isClient) {
      let script: HTMLScriptElement | null = document.createElement('script')
      script.setAttribute('src', '/my-house/tex-mml-chtml.js')
      document.head.appendChild(script)
      script = null

      router.beforeEach((to, from, next) => {
        const { isInit, getBlogList, setInitTrue } = useBlogListStore()
        if (!isInit) {
          getBlogList()
          setInitTrue()
        }
        if (to.name !== from.name) NProgress.start()
        if (!('frontmatter' in to.meta))
          document.title = `${to.meta.title} | TailWind`
        next()
      })

      router.afterEach(() => {
        NProgress.done()
      })
    }
  }
)

// app.mount('#app')
