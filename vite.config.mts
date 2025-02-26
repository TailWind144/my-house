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
import TOC from 'markdown-it-table-of-contents'
import LinkAttributes from 'markdown-it-link-attributes'
import Shiki from '@shikijs/markdown-it'
import {
  transformerNotationDiff,
  transformerNotationHighlight
} from '@shikijs/transformers'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/my-house/',
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/]
    }),
    Components({
      include: [/\.vue$/, /\.vue\?vue/, /\.vue\.[tj]sx?\?vue/, /\.md$/]
    }),
    Markdown({
      headEnabled: true,
      wrapperComponent: 'WrapperBlog',
      wrapperClasses: 'prose slide-enter-content',
      async markdownItSetup(md) {
        md.use(
          await Shiki({
            themes: {
              light: 'one-light',
              dark: 'one-dark-pro'
            },
            colorReplacements: {
              '#fafafa': '#f9f9f9'
            },
            transformers: [
              transformerNotationDiff(),
              transformerNotationHighlight()
            ]
          })
        )
        md.use(anchor, {
          permalinkBefore: true,
          permalink: anchor.permalink.linkInsideHeader({
            symbol: '#',
            renderAttrs: () => ({ 'aria-hidden': 'true' })
          })
        })
        md.use(LinkAttributes, {
          matcher: (link: string) => /^https?:\/\//.test(link),
          attrs: {
            target: '_blank',
            rel: 'noopener'
          }
        })
        md.use(TOC, {
          includeLevel: [1, 2, 3, 4],
          containerHeaderHtml:
            '<div class="table-of-contents-anchor"><Menu /></div>'
        })
      }
    }),
    Pages({
      dirs: [
        { dir: 'src/pages/frontend', baseRoute: '/page' },
        { dir: 'src/pages/deep_learning', baseRoute: '/page' }
      ],
      extensions: ['vue', 'md'],
      extendRoute(route) {
        const path = resolve(__dirname, route.component.slice(1))
        if (path.endsWith('.md')) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data } = matter(md, { eval: true })
          route.meta = Object.assign(route.meta || {}, {
            frontmatter: data
          })
        }
        return route
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  ssgOptions: {
    formatting: 'minify'
  }
})
