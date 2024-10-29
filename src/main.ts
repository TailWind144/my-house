import './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'nprogress/nprogress.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

import WrapperBlog from './views/Blog/WrapperBlog.vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)

// let script: HTMLScriptElement | null = document.createElement('script')
// script.setAttribute('src', '/my-house/tex-mml-chtml.js')
// document.head.appendChild(script)
// script = null

app.component('WrapperBlog', WrapperBlog)

app.mount('#app')
