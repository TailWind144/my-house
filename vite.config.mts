import { fileURLToPath, URL } from 'node:url'
import { basename, dirname, resolve } from 'node:path'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Markdown from 'vite-plugin-vue-markdown'
import Pages from 'vite-plugin-pages'
import matter from 'gray-matter'
import fs from 'fs-extra'
import vue from '@vitejs/plugin-vue'
import anchor from 'markdown-it-anchor'
import { bundledLanguages, getHighlighter } from 'shikiji'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/my-house/',
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/]
    }),
    Components({ dirs: ['src/pages/game', 'src/pages/tech'] }),
    Markdown({
      wrapperClasses: 'prose',
      async markdownItSetup(md) {
        const shiki = await getHighlighter({
          themes: ['vitesse-dark', 'vitesse-light'],
          langs: Object.keys(bundledLanguages) as any
        })

        md.use((markdown) => {
          markdown.options.highlight = (code, lang) => {
            return shiki.codeToHtml(code, {
              lang,
              themes: {
                light: 'vitesse-light',
                dark: 'vitesse-dark'
              },
              cssVariablePrefix: '--s-'
            })
          }
        })
        // md.use(anchor, {
        //   slugify,
        //   permalink: anchor.permalink.linkInsideHeader({
        //     symbol: '#',
        //     renderAttrs: () => ({ 'aria-hidden': 'true' })
        //   })
        // })
      }
    }),
    Pages({
      dirs: [
        { dir: 'src/pages/tech', baseRoute: '/page' },
        { dir: 'src/pages/game', baseRoute: '/page' }
      ],
      extensions: ['vue', 'md'],
      extendRoute(route) {
        const path = resolve(__dirname, route.component.slice(1))
        if (!path.includes('projects.md') && path.endsWith('.md')) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data } = matter(md, { eval: true })
          route.meta = Object.assign(route.meta || {}, {
            frontmatter: data
          })
        }
        route.path = encodeURI(route.path)
        return route
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
