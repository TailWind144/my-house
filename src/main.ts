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
const script = document.createElement('script')
script.setAttribute('src', '/tex-mml-chtml.js')
script.setAttribute('defer', 'true')
document.getElementsByTagName('body')[0].appendChild(script)

app.component('WrapperBlog', WrapperBlog)

app.mount('#app')
